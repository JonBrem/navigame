navigame.PathManager = (function () {

    /**
     * PathManager constructor. References the parameters and initializes event listeners.
     * @constructor
     * @global
     * @class
     * @classdesc The PathManager is the central "logic" component of the game. It updates the model
     *  when the view reports changes and vice versa.
     * @param {navigame.MarkerControls} markerControls
     * @param {navigame.EdgeControls} edgeControls
     * @param {navigame.MapList} mapListVisuals
     * @param {navigame.CanvasManager} canvasManager
     */
    function PathManager(markerControls, edgeControls, mapListVisuals, canvasManager) {
        Log.log("verbose", "Initializing Path Manager", this);

        this.markerControls = markerControls;
        this.edgeControls = edgeControls;
        this.mapListVisuals = mapListVisuals;
        this.canvasManager = canvasManager;

        this.path = null;

        this.currentMapIndex = -1;

        this._registerListeners();

        Log.log("verbose", "Finished Initializing Path Manager", this);
    }

    /**
     * newPath creates a new path, which deletes all the existing data in the path!
     *  the View components are not informed about this and need to be re-set separately.
     * @memberof PathManager
     */
    PathManager.prototype.newPath = function () {
        this.path = new navigame.Path();
    };

    /**
     * setPathId sets the path id (which is synonymous to the session id)
     * @memberof PathManager
     */
    PathManager.prototype.setPathId = function (pathId) {
        this.path.pathId = pathId;
    };

    /**
     * setStartGoal sets the start and goal of the path.
     * @param {object} start - object containing a roomid, area, and level
     * @param {object} goal  - object containing a roomid, area, and level
     * @memberof PathManager
     */
    PathManager.prototype.setStartGoal = function (start, goal) {
        this.path.startPoint = start;
        this.path.endPoint = goal;
    };

    /**
     * loadPathFromJson loads the path from the json that is provided.
     *  Updates the view components accordingly.
     * @param  {object} pathJson - json that was created via a navigame.Path's toJson method
     *                              (or that has the same structure.)
     * @memberof PathManager
     */
    PathManager.prototype.loadPathFromJson = function (pathJson) {
        Log.log('verbose', "loading path from JSON", this);

        this.path = new navigame.Path();
        this.path.fromJson(pathJson);
        this.currentMapIndex = this.path.mapPaths.length - 1;

        // array that will only contain the img sources (because that, and their order, is all that matters to the view)
        let maps = [];
        for (let i = 0; i < this.path.mapPaths.length; i++) {
            maps.push(this._loadMapFromJson(this.path.mapPaths[i]));
        }

        $(this).trigger('triggerLoadMaps', [maps]);
    };

    /**
     * addMap adds a new map to the logical representation of the path.
     *  sets the current map index to that of this new map (which is the last index, new maps are always
     *  appended to the end of the list).
     * @param {string} areaName - name of the area, such as "PT"
     * @param {any} storeyId - id of the storey / level (of the area/building that this map belongs to)
     * @memberof PathManager
     */
    PathManager.prototype.addMap = function (areaName, storeyId) {
        Log.log('verbose', "adding map", areaName, storeyId, this);

        this.path.addMap(areaName, storeyId);
        this.currentMapIndex = this.path.mapPaths.length - 1;

        this._registerListenersForMap(this.path.mapPaths[this.currentMapIndex]);
    };

    /**
     * deleteMap deletes the map at the specified index in the list of maps on the path.
     *     will inform the view that this map should be deleted there, too.
     * @param  {number} mapIndex - index of the map on the current path
     * @memberof PathManager
     */
    PathManager.prototype.deleteMap = function (mapIndex) {
        if (this.path.mapPaths.length <= 1) // @todo: disable button or show some message
            return;

        mapIndex = mapIndex? mapIndex : this.currentMapIndex; // <- default value: whichever map is shown on the view
        Log.log("verbose", "deleting map at index: " + mapIndex, this);

        this.path.mapPaths.splice(mapIndex, 1);

        let newMapIndex = (mapIndex == this.path.mapPaths.length)? mapIndex - 1 : mapIndex;
        this.currentMapIndex = newMapIndex;
        this.mapListVisuals.deleteMap(mapIndex, newMapIndex);
    };

    /**
     * setCurrentMapIndex sets the index of the currently selected map
     *  (that new nodes & edges will be added to).
     * @param {number} index - index of the map in the list of maps on the current path
     * @memberof PathManager
     */
    PathManager.prototype.setCurrentMapIndex = function (index) {
        this.currentMapIndex = index;
    };

    /**
     * loadDataIntoView loads the markers and edges of the current path into the view.
     * @memberof PathManager
     */
    PathManager.prototype.loadDataIntoView = function () {
        // load markers
        let markers = this.path.mapPaths[this.currentMapIndex].pathNodes;
        for (let i = 0; i < markers.length; i++) {
            this.markerControls.loadMarker(markers[i]);
        }

        // load edges
        let edges = this.path.mapPaths[this.currentMapIndex].pathEdges;
        for (let i = 0; i < edges.length; i++) {
            this.edgeControls.createEdgeBetweenMarkers(
                markers[i].nodeData.timeCreated,
                markers[i + 1].nodeData.timeCreated,
                edges[i].edgeData
            );
        }
    };

    /**
     * addNode adds a node to the list of nodes on the current map path. Will lead to an edge
     *  being added, unless this is the very first node. Nodes are appended by default, but can be
     *  inserted if the edge on which to insert the node is specified.
     * @param {type} x      - x position (in canvas coordinates: distance from centre of map image)
     * @param {type} y      - y position (in canvas coordinates: distance from centre of map image)
     * @param {type} data   - additionalData of the node, such as its timestamp
     * @param {type} onEdge - if left empty: Node is appended to the list (at the end);
     *                         if an edge is provided: node is inserted in the node list
     *                         between that edge's "to" and "from" nodes, and an edge is inserted instead of appended.
     * @memberof PathManager
     */
    PathManager.prototype.addNode = function (x, y, data, onEdge) {
        if (onEdge == null) { 
            this._appendNode(x, y, data);
        } else {
            this._insertNodeOnEdge(x, y, data, onEdge);   
        }
    };

    /**
     * onEdgeCreated is called when the MapPath created an edge and informs the view about this change.
     * @param  {navigame.MapPath} whichMapPath - mapPath that triggered this / created the edge
     * @param  {number} fromNode     - index of the "from" node of the new edge
     * @param  {number} toNode       - index of the "to" node of the new edge
     * @param  {object} data         - additionalData of the new edge (its timestamp)
     * @memberof PathManager
     */
    PathManager.prototype.onEdgeCreated = function (whichMapPath, fromNode, toNode, data) {
        Log.log('verbose', 'on edge created, from node', fromNode, 'to node', toNode, this);

        let that = this;

        // this will be called after the DOM and the fabric canvas have been updated.
        // (tiny timeout to make sure that these other processes have precedence.)
        setTimeout(
            function() {
                // create edge spanning from "fromNode" to "toNode"
                that.edgeControls.createEdgeBetweenMarkers(
                    whichMapPath.pathNodes[fromNode].nodeData.timeCreated,
                    whichMapPath.pathNodes[toNode].nodeData.timeCreated,
                    data);

                // add the edgeIndex to the edge's additional data
                that.edgeControls.addEdgeData(data.timeCreated, 
                    { "edgeIndex": that.path.mapPaths[that.currentMapIndex].pathEdges.length - 1} );
            },
        5);
    };

    /**
     * onEdgesUpdated clears the edges currently on display on the map and creates representations for the new ones that
     *  are given to this function.
     * @param  {navigame.MapPath} whichMapPath - the map path that triggered this / whose edges were updated
     * @param  {array} newEdges     - array of navigame.PathEdge, visuals representations for the members
     *                                 of which will be created
     * @memberof PathManager
     */
    PathManager.prototype.onEdgesUpdated = function (whichMapPath, newEdges) {
        Log.log('verbose', 'edges updated; passing that event to view', this);

        let that = this;
        that.edgeControls.clearEdges();

        // called after a (tiny) timeout to ensure that the DOM and fabric canvas
        // have time to update before this happens.
        setTimeout(
            function() {
                for (let i = 0; i < newEdges.length; i++) {
                    that.edgeControls.createEdgeBetweenMarkers(
                        whichMapPath.pathNodes[i].nodeData.timeCreated,
                        whichMapPath.pathNodes[i + 1].nodeData.timeCreated,
                        newEdges[i].edgeData 
                    );

                    that.edgeControls.addEdgeData(newEdges[i].edgeData.timeCreated, {
                        "edgeIndex": i
                    });
                }
            },
        10);
    };

    /**
     * onMarkerMoved updates the position values that are stored for this marker,
     *     and triggers the edges that are attached to this marker to be updated as well.
     * @param  {fabric.Object} marker      - description
     * @param  {number} markerIndex - index of the marker in the list of markers of 
     * @memberof PathManager
     */
    PathManager.prototype.onMarkerMoved = function (marker, markerIndex) {
        let markerModel = this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex];
        markerModel.xPos = this.canvasManager.toImageFraction(marker.left, true);
        markerModel.yPos = this.canvasManager.toImageFraction(marker.top, false);

       this._updateEdgeVisuals(marker.additionalData.timeCreated, markerIndex);
    };

    /**
     * onMarkerDataChanged updates the logical representation's data for the specified marker on the current map
     * @param  {number} markerIndex - index of the marker on the current map
     * @param  {object} markerData  - new additionalData of the marker
     * @memberof PathManager
     */
    PathManager.prototype.onMarkerDataChanged = function (markerIndex, markerData) {
       this.path.mapPaths[this.currentMapIndex].pathNodes[markerIndex].nodeData = markerData;
    };

    /**
     * onEdgeDataChanged updates the logical representation's data for the specified edge on the current map
     * @param  {number} edgeIndex - index of the edge on the current map
     * @param  {object} edgeData  - new additionalData of the edge
     * @memberof PathManager
     */
    PathManager.prototype.onEdgeDataChanged = function (edgeIndex, edgeData) {
        this.path.mapPaths[this.currentMapIndex].pathEdges[edgeIndex].edgeData = edgeData;
    };

    /**
     * onMarkerDeleted deletes the marker from the logical representation of the path,
     *      updates the (view) markers' indices,
     *      and deletes / updates edges affected by this.
     * @param  {number} markerIndex - index of the marker that was deleted
     * @memberof PathManager
     */
    PathManager.prototype.onMarkerDeleted = function (markerIndex) {
        let edgeUpdates = this.path.mapPaths[this.currentMapIndex].deleteNodeAt(markerIndex);

        let nodes = this.path.mapPaths[this.currentMapIndex].pathNodes;
        for (let i = 0; i < nodes.length; i++) {
            this.markerControls.addMarkerData(nodes[i].nodeData.timeCreated, {
                "markerIndex": i
            });
        }

        this.onEdgesUpdated(this.path.mapPaths[this.currentMapIndex],
            this.path.mapPaths[this.currentMapIndex].pathEdges);
    };

    /**
     * resortMaps changes the order of the maps in the logical representation.
     * @param  {array} newIndices - array of numbers that contain the previous indices.
     *                              e.g.: the previous order is always 0, 1, 2, 3, ...
     *                                    the array is 1, 0, 2, 3, ...
     *                                    that means the map that was at index 1 is now the first map
     *                                        and the map that was at index 0 is now the second map.
     * @memberof PathManager
     */
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

    /**
     * submitPath Tells the server to calculate the score for the current path.
     *     will trigger 'onScoreCalculated', if successful.
     * @memberof PathManager
     */
    PathManager.prototype.submitPath = function () {
        let that = this;

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: 'submit_path',
                path_data: JSON.stringify(that.path.toJson())
            },
            success: function (e) {
                $(that).trigger('onScoreCalculated', [e]);
            },
            error: function (e) {
            }
        });
    };

    /**
     * _registerListeners registers listeners on events by marker controls, edge controls, and map list visuals.
     * @memberof PathManager
     */
    PathManager.prototype._registerListeners = function () {
        let that = this;

        $(this.markerControls).on("markerCreated", function(event, marker, onEdge) {
            that.addNode(marker.left, marker.top, marker.additionalData, onEdge);
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

        $(this.mapListVisuals).on('requestDeleteMap', function (e, mapIndex) {
            that.deleteMap(mapIndex);
        });

        $(this.mapListVisuals).on('requestSubmitPath', function (e) {
            that.submitPath();
        });
    };

    /**
     * _loadMapFromJson loads an individual map, registers listeners on the logical representation,
     *     and returns an object containing the background image of the map.
     * @param  {navigame.MapPath} map - MapPath that was loaded from a JSON path
     * @return {object}     object with only an 'imgSrc' key.
     * @memberof PathManager
     */
    PathManager.prototype._loadMapFromJson = function (map) {
        maps.push({
            imgSrc: this.path.mapPaths[i].storeyId
        });

        this._registerListenersForMap(map);

        return {
            imgSrc: map.storeyId
        };
    };

    /**
     * _registerListenersForMap registers listeners (for edgeCreated, edgesUpdated) for the MapPath.
     * @param  {navigame.MapPath} map - MapPath that is part of the current path.
     * @memberof PathManager
     */
    PathManager.prototype._registerListenersForMap = function (map) {
        let that = this;

        $(map).on('edgeCreated', function(e, whichMapPath, edge) {
            that.onEdgeCreated(whichMapPath, edge.fromNodeIndex, edge.toNodeIndex, edge.edgeData);
        });

        $(map).on('edgesUpdated', function(e, whichMapPath, edges) {
            that.onEdgesUpdated(whichMapPath, edges);
        });
    };

    /**
     * _appendNode appends a node to the list of nodes on the current map path. Will lead to an edge
     *  being added, unless this is the very first node.
     * @param {type} x      - x position (in canvas coordinates: distance from centre of map image)
     * @param {type} y      - y position (in canvas coordinates: distance from centre of map image)
     * @param {type} data   - additionalData of the node, such as its timestamp
     * @param {type} onEdge - if left empty: Node is appended to the list (at the end);
     *                         if an edge is provided: node is inserted in the node list
     *                         between that edge's "to" and "from" nodes, and an edge is inserted instead of appended.
     * @memberof PathManager
     */
    PathManager.prototype._appendNode = function (x, y, data) {
        this.path.mapPaths[this.currentMapIndex].addNode(
            this.canvasManager.toImageFraction(x, true), 
            this.canvasManager.toImageFraction(y, false), 
            data);
        this.markerControls.addMarkerData(data.timeCreated, {
            "markerIndex": this.path.mapPaths[this.currentMapIndex].pathNodes.length - 1
        });
    }

    /**
     * _insertNodeOnEdge inserts a node into the list of nodes on the current map path. Will lead to an edge
     *  being added.
     * @param {type} x      - x position (in canvas coordinates: distance from centre of map image)
     * @param {type} y      - y position (in canvas coordinates: distance from centre of map image)
     * @param {type} data   - additionalData of the node, such as its timestamp
     * @param {type} onEdge - node is inserted in the node list between that edge's "to" and "from" nodes,
     *                         and an edge is inserted instead of appended.
     * @memberof PathManager
     */
    PathManager.prototype._insertNodeOnEdge = function (x, y, data, onEdge) {
        let newMarkerIndex = onEdge.additionalData.edgeIndex + 1;
        this.path.mapPaths[this.currentMapIndex].addNodeAtIndex(
            this.canvasManager.toImageFraction(x, true), 
            this.canvasManager.toImageFraction(y, false), 
            data, newMarkerIndex);

        let that = this;
        setTimeout(function() {
            for (let i = 0; i < that.path.mapPaths[that.currentMapIndex].pathNodes.length; i++) {
                that.markerControls.addMarkerData(
                    that.path.mapPaths[that.currentMapIndex].pathNodes[i].nodeData.timeCreated,
                    {
                        "markerIndex": i
                    });
            }
        }, 5);
    }

    /**
     * _updateEdgeVisuals updates an edges position on the map after either its "to" or "from"
     *     node were moved.
     * @param  {number} markerTime  - timestamp of the marker that was moved.
     * @param  {number} markerIndex - index of marker on current map path that was moved.
     * @memberof PathManager
     */
    PathManager.prototype._updateEdgeVisuals = function (markerTime, markerIndex) {
        let nodes = this.path.mapPaths[this.currentMapIndex].pathNodes;

        if (nodes.length == 1)
            return;

        if (markerIndex == 0) { // <- first marker was moved
            let nextMarkerTime = nodes[markerIndex + 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(0, markerTime, nextMarkerTime);
        } else if (markerIndex == nodes.length - 1) { // last marker was moved
            let prevMarkerTime = nodes[markerIndex - 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(markerIndex - 1, prevMarkerTime, markerTime);
        } else { // any other marker was moved
            let prevMarkerTime = nodes[markerIndex - 1].nodeData.timeCreated;
            let nextMarkerTime = nodes[markerIndex + 1].nodeData.timeCreated;
            this.edgeControls.updateEdgePositions(markerIndex - 1, prevMarkerTime, markerTime);
            this.edgeControls.updateEdgePositions(markerIndex, markerTime, nextMarkerTime);
        }
    }

    return PathManager;
}());
