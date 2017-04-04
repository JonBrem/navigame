navigame.PathEdge = (function () {

    /**
     * PathEdge constructor.
     * @constructor
     * @global
     * @class
     * @classdesc Simple data container for edges.
     *  Edges don't store their own position; instead, since they always
     *  have a start and an end navigame.PathNode, they store the indices of two of those
     *  on a MapPath.
     */
    function PathEdge() {
        this.fromNodeIndex = null;
        this.toNodeIndex = null;

        this.edgeData = {};
    }

    /**
     * toJson creates a JSON representation of this edge.
     * @return {object} JSON representation of this edge.
     * @memberof PathEdge
     */
    PathEdge.prototype.toJson = function () {
        let asJson = {
            fromNodeIndex: this.fromNodeIndex,
            toNodeIndex: this.toNodeIndex,
            edgeData: this.edgeData
        };

        return asJson;
    };

    /**
     * fromJson sets the values of this PathEdge instance with the values loaded from the object.
     * @param  {object} obj - JSON representation of this PathEdge
     * @memberof PathEdge
     */
    PathEdge.prototype.fromJson = function (obj) {
        this.fromNodeIndex = obj.fromNodeIndex;
        this.toNodeIndex = obj.toNodeIndex;
        this.edgeData = obj.edgeData;
    };

    return PathEdge;
}());


