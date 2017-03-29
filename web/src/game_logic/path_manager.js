navigame.PathManager = (function () {

    function PathManager() {
        this.markerControls = null;
        this.edgeControls = null;
        this.path = null;

        this.currentMapIndex = -1;
    }

    PathManager.prototype.init = function(markerControls, edgeControls) {
        Log.log("verbose", "Initializing Path Manager", this);

        this.markerControls = markerControls;
        this.edgeControls = edgeControls;

        let that = this;

        $(this.markerControls).on("markerCreated", function(event, marker) {
            that.addNode(marker.left, marker.top, marker.additionalData);
        });

        $(this.markerControls).on("markerMoved", function(event, marker, markerIndex) {
            that.onMarkerMoved(marker, markerIndex);
        });

        $(this.markerControls).on("markerDataChanged", function(event, markerIndex, markerData) {
            that.onMarkerDataChanged(markerIndex, markerData);
        });

        $(this.markerControls).on("markerDeleted", function(event, markerIndex) {
            that.onMarkerDeleted(markerIndex);
        });

        $(this.edgeControls).on("edgeDataChanged", function(event, edgeIndex, edgeData) {
            that.onEdgeDataChanged(edgeIndex, edgeData);
        });

        Log.log("verbose", "Finished Initializing Path Manager", this);
    };

    PathManager.prototype.newPath = function () {
        this.path = new navigame.Path();
    };

    PathManager.prototype.setPathId = function (pathId) {
        this.path.pathId = pathId;
    };

    PathManager.prototype.loadPathFromJson = function (pathJson) {
        this.path = new navigame.Path();
        this.path.fromJson(pathJson);

        let maps = [];

        this.currentMapIndex = this.path.mapPaths.length - 1;

        for (let i = 0; i < this.path.mapPaths.length; i++) {
            maps.push({
                imgSrc: this.path.mapPaths[i].storeyId
            });
        }

        $(this).trigger('triggerLoadMaps', [maps]);
    };

    PathManager.prototype.addMap = function (areaName, storeyId) {
        this.path.addMap(areaName, storeyId);
        this.currentMapIndex = this.path.mapPaths.length - 1;

        let that = this;
        $(this.path.mapPaths[this.currentMapIndex]).on('edgeCreated', function(e, whichMapPath, edge) {
            that.onEdgeCreated(whichMapPath, edge.fromNodeIndex, edge.toNodeIndex, edge.edgeData);
        });
    };

    PathManager.prototype.setCurrentMapIndex = function (index) {
        this.currentMapIndex = index;
    };

    PathManager.prototype.loadDataIntoView = function () {
        let markers = this.path.mapPaths[this.currentMapIndex].pathNodes;
        for (let i = 0; i < markers.length; i++) {
            this.markerControls.loadMarker(markers[i]);
        }

        let edges = this.path.mapPaths[this.currentMapIndex].pathEdges;
        for (let i = 0; i < edges.length; i++) {
            this.edgeControls.createEdgeAtMapPosition(
                markers[i].nodeData.timeCreated,
                markers[i + 1].nodeData.timeCreated,

                edges[i].edgeData
            );
        }
    };

    PathManager.prototype.addNode = function (x, y, data) {
        this.path.mapPaths[this.currentMapIndex].addNode(x, y, data);
    };

    PathManager.prototype.onEdgeCreated = function (whichMapPath, fromNode, toNode, data) {
        let that = this;

        setTimeout(
            function() {
                that.edgeControls.createEdgeAtMapPosition(
                    whichMapPath.pathNodes[fromNode].nodeData.timeCreated,
                    whichMapPath.pathNodes[toNode].nodeData.timeCreated,
                    data
                )},
        5);
    };

    PathManager.prototype.onMarkerMoved = function (marker, markerIndex) {
        let markerModel = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex];
        markerModel.xPos = marker.left;
        markerModel.yPos = marker.top;

        let markerTime = marker.additionalData.timeCreated;

        if (this.path.mapPaths[this.currentMapIndex].pathNodes.length == 1)
            return;

        if (markerIndex == 0) {
            let nextMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex + 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(0, markerTime, nextMarkerTime);
        } else if (markerIndex == this.path.mapPaths[this.currentMapIndex].pathNodes.length - 1) {
            let prevMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex - 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(markerIndex - 1, prevMarkerTime, markerTime);
        } else {
            let prevMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex - 1].nodeData.timeCreated;
            let nextMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex + 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(markerIndex - 1, prevMarkerTime, markerTime);
            this.edgeControls.updateEdgePositions(markerIndex, markerTime, nextMarkerTime);
        }
    };

    PathManager.prototype.onMarkerDataChanged = function (markerIndex, markerData) {
        let markerModel = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex].nodeData = markerData;
    };

    PathManager.prototype.onEdgeDataChanged = function (edgeIndex, edgeData) {
        let markerModel = this.path.mapPaths[this.currentMapIndex].pathEdges[edgeIndex].edgeData = edgeData;
    };

    PathManager.prototype.onMarkerDeleted = function (markerIndex) {
        let deletedEdgeIndex = -1;

        if (this.path.mapPaths[this.currentMapIndex].pathNodes.length != 1) {
            // delete edge from visuals

            if (markerIndex == 0) {
                this.edgeControls.deleteEdge(0);
                deletedEdgeIndex = 0;
            } else if (markerIndex == this.path.mapPaths[this.currentMapIndex].pathNodes.length - 1) {
                this.edgeControls.deleteEdge(markerIndex - 1);
                deletedEdgeIndex = markerIndex - 1;
            } else {
                this.edgeControls.deleteEdge(markerIndex);
                deletedEdgeIndex = markerIndex;

                let prevMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex - 1].nodeData.timeCreated;
                let nextMarkerTime = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex + 1].nodeData.timeCreated;
                this.edgeControls.updateEdgePositions(markerIndex - 1, prevMarkerTime, nextMarkerTime);
            }
        }

        if (deletedEdgeIndex != -1) {
            this.path.mapPaths[this.currentMapIndex].pathEdges.splice(deletedEdgeIndex, 1);
        }

        this.path.mapPaths[this.currentMapIndex].pathNodes.splice(markerIndex, 1);

        let edges = this.path.mapPaths[this.currentMapIndex].pathEdges;
        for(let i = 0; i < edges.length; i++) {
            edges[i].fromNodeIndex = i;
            edges[i].toNodeIndex = i + 1;
        }
    };

    PathManager.prototype.resortMaps = function (newIndices) {
        let maps = this.path.mapPaths;
        let newMapPaths = [];

        for (let i = 0; i < newIndices.length; i++) {
            newMapPaths[i] = maps[newIndices[i]];

            if (newIndices[i] == this.currentMapIndex) {
                this.currentMapIndex = i;
            }
        }

        this.path.mapPaths = newMapPaths;
    };

    return PathManager;
}());
