navigame.PathManager = (function () {

    function PathManager() {
        this.markerControls = null;
        this.edgeControls = null;
        this.path = null;

        this.currentMapIndex = -1;
    }

    PathManager.prototype.init = function(markerControls, edgeControls) {
        this.markerControls = markerControls;
        this.edgeControls = edgeControls;

        let that = this;

        $(this.markerControls).on("markerCreated", function(event, marker) {
            that.addNode(marker.left, marker.top, marker.additionalData);
        });
    };

    PathManager.prototype.newPath = function () {
        this.path = new navigame.Path();
    };

    PathManager.prototype.setPathId = function (pathId) {
        this.path.pathId = pathId;
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

    return PathManager;
}());
