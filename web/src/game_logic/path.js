navigame.Path = (function () {

    function Path() {
        this.mapPaths = [];

        this.startPoint = null;
        this.endPoint = null;
    }

    Path.prototype.toJson = function () {
        let asJson = {
            startPoint: this.startPoint,
            endPoint: this.endPoint,
            mapPaths: []
        };

        for(let i = 0; i < this.mapPaths.length; i++) {
            asJson.mapPaths[i] = this.mapPaths[i].toJson();
        }

        return asJson;
    };

    Path.prototype.fromJson = function (obj) {
        this.startPoint = obj.startPoint;
        this.endPoint = obj.endPoint;

        this.mapPaths = [];
        for(let i = 0; i < obj.mapPaths.length; i++) {
            this.mapPaths[i] = new navigame.MapPath();
            this.mapPaths[i].fromJson(obj.mapPaths[i]);
        }
    };

    return Path;
}());
