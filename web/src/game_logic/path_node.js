navigame.PathNode = (function () {

    function PathNode() {
        this.xPos = null;
        this.yPos = null;
        this.nodeName = null;

        this.nodeData = {};
    }

    PathNode.prototype.getPosition = function() {
        return {
            x: this.xPos,
            y: this.yPos
        };
    };

    PathNode.prototype.toJson = function () {
        let asJson = {
            xPos: this.xPos,
            yPos: this.yPos,
            nodeName: this.nodenName,
            nodeData: this.nodeData
        };

        return asJson;
    };

    PathNode.prototype.fromJson = function (obj) {
        this.xPos = obj.xPos;
        this.yPos = obj.yPos;
        this.nodeName = obj.nodeName;
        this.nodeData = obj.nodeData;
    };

    return PathNode;
}());


