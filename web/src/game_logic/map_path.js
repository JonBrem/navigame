navigame.MapPath = (function () {

    function MapPath() {
        this.pathNodes = [];
        this.pathEdges = [];

        this.areaName = null;
        this.storeyId = null;
    }

    MapPath.prototype.addNode = function (x, y, additionalData) {
        let newNode = new navigame.PathNode();
        newNode.xPos = x;
        newNode.yPos = y;
        newNode.nodeData = additionalData;
        newNode.nodeData.markerIndex = this.pathNodes.length;

        this.pathNodes.push(newNode);

        if (this.pathNodes.length > 1) {
            let newEdge = new navigame.PathEdge();
            newEdge.fromNodeIndex = this.pathNodes.length - 2;
            newEdge.toNodeIndex = this.pathNodes.length - 1;
            newEdge.edgeData = {
                timeCreated: + new Date()
            };

            this.pathEdges.push(newEdge);

            $(this).trigger('edgeCreated', [this, newEdge]);
        }
    };

    MapPath.prototype.addNodeAtIndex = function (x, y, additionalData, index) {
        let newNode = new navigame.PathNode();
        newNode.xPos = x;
        newNode.yPos = y;
        newNode.nodeData = additionalData;

        this.pathNodes.splice(index, 0, newNode);

        for (let i = 0; i < this.pathNodes.length; i++) {
            this.pathNodes[i].nodeData.markerIndex = i;
        }

        if (this.pathNodes.length > 1) {
            let newEdge = new navigame.PathEdge();
            newEdge.fromNodeIndex = index - 1;
            newEdge.toNodeIndex = index;
            newEdge.edgeData = {
                timeCreated: + new Date()
            };

            this.pathEdges.splice(index - 1, 0, newEdge);

            for (let i = 0; i < this.pathEdges.length; i++) {
                this.pathEdges[i].fromNodeIndex = i;
                this.pathEdges[i].toNodeIndex = i + 1;
                this.pathEdges[i].edgeData.edgeIndex = i;

            }

            $(this).trigger('edgesUpdated', [this, this.pathEdges]);
        }
    };

    MapPath.prototype.getNodeByTime = function (time) {
        for (let i = 0; i < this.pathNodes.length; i++) {
            if (this.pathNodes[i].nodeData.timeCreated == time) {
                return this.pathNodes[i];
            }
        }

        return null;
    };

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

    return MapPath;
}());
