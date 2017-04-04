navigame.Path = (function () {

    /**
     * Path constructor.
     * @constructor
     * @global
     * @class
     * @classdesc Simple data container for paths. Consists of mapPaths, which in turn
     *  contain nodes and edges of a route.
     */
    function Path() {
        this.mapPaths = [];

        this.pathId = null;
        this.startPoint = null;
        this.endPoint = null;
    }

    /**
     * addMap creates a new navigame.MapPath and adds it to the list of maps
     *  on this path.
     * @param {string} areaName - name of the area (e.g. "PT")
     * @param {string} storeyId - id of the storey within the area
     * @memberof Path
     */
    Path.prototype.addMap = function(areaName, storeyId) {
        let newMap = new navigame.MapPath();
        newMap.areaName = areaName;
        newMap.storeyId = storeyId;

        this.mapPaths.push(newMap);
    };

    /**
     * toJson creates a JSON representation of this path,
     *  which includes JSON representations of all map paths.
     * @return {object} a JSON representation of this path.
     * @memberof Path
     */
    Path.prototype.toJson = function () {
        let asJson = {
            startPoint: this.startPoint,
            endPoint: this.endPoint,
            pathId: this.pathId,
            mapPaths: []
        };

        for(let i = 0; i < this.mapPaths.length; i++) {
            asJson.mapPaths[i] = this.mapPaths[i].toJson();
        }

        return asJson;
    };

    /**
     * fromJson loads the values of this path from the object.
     * @param  {object} obj - JSON representation of a path.
     * @memberof Path
     */
    Path.prototype.fromJson = function (obj) {
        this.startPoint = obj.startPoint;
        this.endPoint = obj.endPoint;
        this.pathId = obj.pathId;

        this.mapPaths = [];
        for(let i = 0; i < obj.mapPaths.length; i++) {
            this.mapPaths[i] = new navigame.MapPath();
            this.mapPaths[i].fromJson(obj.mapPaths[i]);
        }
    };

    return Path;
}());
