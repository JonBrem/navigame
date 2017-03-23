navigame.MapPath = (function () {

    function MapPath() {
        this.pathNodes = [];
        this.pathEdges = [];

        this.areaName = null;
        this.storyId = null;
    }

    MapPath.prototype.toJson = function () {
        let asJson = {
            areaName: this.areaName,
            storyId: this.storyId,
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

    MapPath.prototype.fromJson = function (obj) {
        this.areaName = obj.areaName;
        this.storyId = obj.storyId;

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

    return MapPath;
}());
