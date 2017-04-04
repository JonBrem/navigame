navigame.PathNode = (function () {

    /**
     * PathNode constructor.
     * @constructor
     * @global
     * @class
     * @classdesc Simple data container for nodes.
     */
    function PathNode() {
        this.xPos = null; // <- fraction of image width, calculated from the center outwards.
        this.yPos = null; // <- fraction of image height, calculated from the center outwards.
        this.nodeName = null;

        this.nodeData = {};
    }

    /**
     * getPosition creates an object containing "x" and "y" keys that holds
     *  the position values of this object.
     * @return {object} {x: ..., y: ...}-type object.
     * @memberof PathNode
     */
    PathNode.prototype.getPosition = function() {
        return {
            x: this.xPos,
            y: this.yPos
        };
    };

    /**
     * toJson creates a JSON representation of this node.
     * @return {object} a JSON representation of this node.
     * @memberof PathNode
     */
    PathNode.prototype.toJson = function () {
        let asJson = {
            xPos: this.xPos,
            yPos: this.yPos,
            nodeName: this.nodenName,
            nodeData: this.nodeData
        };

        return asJson;
    };

    /**
     * fromJson loads the data from an object into this instance.
     * @param  {object} obj - JSON representation of this node.
     * @memberof PathNode
     */
    PathNode.prototype.fromJson = function (obj) {
        this.xPos = obj.xPos;
        this.yPos = obj.yPos;
        this.nodeName = obj.nodeName;
        this.nodeData = obj.nodeData;
    };

    return PathNode;
}());


