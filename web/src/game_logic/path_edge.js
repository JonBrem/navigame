navigame.PathEdge = (function () {

    function PathEdge() {
        this.fromNodeIndex = null;
        this.toNodeIndex = null;

        this.edgeData = {};
    }

    PathEdge.prototype.toJson = function () {
        let asJson = {
            fromNodeIndex: this.fromNodeIndex,
            toNodeIndex: this.toNodeIndex,
            edgeData: this.edgeData
        };

        return asJson;
    };

    PathEdge.prototype.fromJson = function (obj) {
        this.fromNodeIndex = obj.fromNodeIndex;
        this.toNodeIndex = obj.toNodeIndex;
        this.edgeData = obj.edgeData;
    };

    return PathEdge;
}());


