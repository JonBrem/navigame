navigame.MapPath = (function () {

    /**
     * MapPath constructor. Instantiates the Map Path, does nothing else.
     * @constructor
     * @global
     * @class
     * @classdesc MapPath is the part of a path that covers a map:
     *   A Path consists of several map paths, and on these map paths, there are nodes and egdes.
     *   MapPaths contain the name of an aea, the storey, and the path nodes and edges.
     */
    function MapPath() {
        this.pathNodes = [];
        this.pathEdges = [];

        this.areaName = null;
        this.storeyId = null;
    }

    /**
     * addNode adds a new node to the end of the list of nodes on this current map.
     *     If this is not the first node, this will also add an edge from the current last node
     *     to the one that is added and trigger 'edgeCreated' on the MapPath instance.
     * @param {number} x              - x coordinate (fraction, not absolute) of the node
     * @param {number} y              - y coordinate (fraction, not absolute) of the node
     * @param {object} additionalData - data object, contains the timestamp, index and all other data
     * @memberof MapPath
     */
    MapPath.prototype.addNode = function (x, y, additionalData) {
        // create node
        let newNode = this._setupNode(x, y, additionalData);
        newNode.nodeData.markerIndex = this.pathNodes.length;
        this.pathNodes.push(newNode);

        // add edge, unless this was the first node on the map
        if (this.pathNodes.length > 1) {
            let newEdge = this._setupEdge(this.pathNodes.length - 2, this.pathNodes.length -1);
            this.pathEdges.push(newEdge);

            $(this).trigger('edgeCreated', [this, newEdge]);
        }
    };

    /**
     * addNodeAtIndex adds a node to the list of nodes on the current map at the specified index.
     *     Should only be called if there are already two or more nodes on the map!
     *     Cannot be called to replace the first node (at index 0) either.
     * @param {number} x              - description
     * @param {number} y              - description
     * @param {object} additionalData - data object, contains the timestamp, index and all other data
     * @param {number} index          - the index in the list of nodes where the node will be inserted.
     *                                   Must not be 0.]
     * @memberof MapPath
     */
    MapPath.prototype.addNodeAtIndex = function (x, y, additionalData, index) {
        // create node, insert at index "index"
        let newNode = this._setupNode(x, y, additionalData);
        this.pathNodes.splice(index, 0, newNode);

        // update markerIndex in additional data of the individual nodes
        for (let i = 0; i < this.pathNodes.length; i++) {
            this.pathNodes[i].nodeData.markerIndex = i;
        }

        if (this.pathNodes.length > 1) {
            // create edge and insert at the correct position
            let newEdge = this._setupEdge(index - 1, index);
            this.pathEdges.splice(index - 1, 0, newEdge);

            // update all other edges. could be handled with more regard to performance, but this is probably done rarely anyway.
            this._updateEdgeIndices();
            $(this).trigger('edgesUpdated', [this, this.pathEdges]);
        }
    };

    /**
     * deleteNodeAt deletes the node at the specified index, and returns info about edges that
     *  were affected.
     * @param  {number} index - index of the node to delete
     * @return {object} object with "deleted" and {updated} ("index", "toTime", "fromTime"). Values are -1
     *                     if nothing was deleted or updated, respectively, but the structure is always the same.
     * @memberof MapPath
     */
    MapPath.prototype.deleteNodeAt = function (index) {
        let edgeUpdates = this._updateEdgesOnNodeRemoved(index);

        this.pathNodes.splice(index, 1);

        let edges = this.pathEdges;
        for (let i = 0; i < edges.length; i++) {
            edges[i].fromNodeIndex = i;
            edges[i].toNodeIndex = i + 1;
        }

        for (let i = 0; i < this.pathNodes.length; i++) {
            this.pathNodes[i].nodeData.markerIndex = i;
        }

        return edgeUpdates;
    };

    /**
     * getNodeByTime returns a node with the given timestamp, or null if it can't be found.
     * @param  {number} time - timestamp of the node
     * @return {navigame.PathNode} node with the timestamp, or null
     * @memberof MapPath
     */
    MapPath.prototype.getNodeByTime = function (time) {
        for (let i = 0; i < this.pathNodes.length; i++) {
            if (this.pathNodes[i].nodeData.timeCreated == time) {
                return this.pathNodes[i];
            }
        }

        return null;
    };

    /**
     * toJson puts this in a JSON object, with all nodes and edges as child arrays that are also in JSON format.
     * @return {object} this object in its current representation, as a pure JS object.
     * @memberof MapPath
     */
    MapPath.prototype.toJson = function () {
        let asJson = {
            areaName: this.areaName,
            storeyId: this.storeyId,
            pathNodes: [],
            pathEdges: []
        };

        for(let i = 0; i < this.pathNodes.length; i++) {
            asJson.pathNodes[i] = this.pathNodes[i].toJson();
        }

        for(let i = 0; i < this.pathEdges.length; i++) {
            asJson.pathEdges[i] = this.pathEdges[i].toJson();
        }

        return asJson;
    };

    /**
     * fromJson fills the values of this object with the values in the JSON object.
     * @param  {object} obj - an object containing the values for this object, including arrays
     *                         for the nodes and edges
     * @memberof MapPath
     */
    MapPath.prototype.fromJson = function (obj) {
        this.areaName = obj.areaName;
        this.storeyId = obj.storeyId;

        this.pathNodes = [];
        for(let i = 0; i < obj.pathNodes.length; i++) {
            this.pathNodes[i] = new navigame.PathNode();
            this.pathNodes[i].fromJson(obj.pathNodes[i]);
        }

        this.pathEdges = [];
        for(let i = 0; i < obj.pathEdges.length; i++) {
            this.pathEdges[i] = new navigame.PathEdge();
            this.pathEdges[i].fromJson(obj.pathEdges[i]);
        }
    };

    /**
     * _setupNode instantiates a new node with the given params.
     * @param {number} x              - x coordinate (fraction, not absolute) of the node
     * @param {number} y              - y coordinate (fraction, not absolute) of the node
     * @param {object} additionalData - data object, contains the timestamp, index and all other data
     * @return {navigame.PathNode} Instantiated PathNode
     * @memberof MapPath
     */
    MapPath.prototype._setupNode = function (x, y, additionalData) {
        let newNode = new navigame.PathNode();
        newNode.xPos = x;
        newNode.yPos = y;
        newNode.nodeData = additionalData;

        return newNode;
    };

    /**
     * _setupEdge instantiates a new edge with the given params.
     * @param  {number} fromIndex - index of "from node" in pathNodes array
     * @param  {number} toIndex   - index of "to node" in pathNodes array
     * @return {navigame.PathEdge} Instantiated PathEdge
     * @memberof MapPath
     */
    MapPath.prototype._setupEdge = function (fromIndex, toIndex) {
        let newEdge = new navigame.PathEdge();
        newEdge.fromNodeIndex = fromIndex;
        newEdge.toNodeIndex = toIndex;
        newEdge.edgeData = {
            timeCreated: + new Date()
        };

        return newEdge;
    };

    /**
     * _updateEdgeIndices updates the edges' "fromNodeIndex", "toNodeIndex" and "edgeIndex" in their additional data.
     *     All of that is based on their index in the pathEdges array, so this must always be in the right order!
     * @memberof MapPath
     */
    MapPath.prototype._updateEdgeIndices = function () {
        // edges always _must_ be in the right positions in the array!
        for (let i = 0; i < this.pathEdges.length; i++) {
            this.pathEdges[i].fromNodeIndex = i;
            this.pathEdges[i].toNodeIndex = i + 1;
            this.pathEdges[i].edgeData.edgeIndex = i;
        }
    };

    /**
     * _updateEdgesOnNodeRemoved updates the edges when the node at the specified index was removed.
     * @param  {number} index - index of the node that is being / has been deleted
     * @return {object} object with "deleted" and {updated} ("index", "toTime", "fromTime"). Values are -1
     *                     if nothing was deleted or updated, respectively, but the structure is always the same.
     * @memberof MapPath
     */
    MapPath.prototype._updateEdgesOnNodeRemoved = function (index) {
        let deletedEdgeIndex = -1;
        let updatedToNodeTime = -1;
        let updatedFromNodeTime = -1;
        let updatedIndex = -1;

        if (this.pathNodes.length != 1) {
            if (index == 0) {
                deletedEdgeIndex = 0;
            } else if (index == this.pathNodes.length - 1) {
                deletedEdgeIndex = index - 1;
            } else {
                deletedEdgeIndex = index;

                updatedFromNodeTime = this.pathNodes[index - 1].nodeData.timeCreated;
                updatedToNodeTime = this.pathNodes[index + 1].nodeData.timeCreated;
                updatedIndex = index - 1;
            }
        }

        if (deletedEdgeIndex != -1) {
            this.pathEdges.splice(deletedEdgeIndex, 1);
        }

        return {
            'deleted': deletedEdgeIndex,
            'updated': {
                'toTime': updatedToNodeTime,
                'fromTime': updatedFromNodeTime,
                'index': updatedIndex
            }
        };
    };

    return MapPath;
}());
