var navigame = {};
window.navigame = navigame;

navigame.GameApp = (function () {

    function GameApp(mainAreaName) {
        this.canvasManager = null;
        this.mapVisuals = null;
        this.mapControls = null;
        this.markerControls = null;

        this.pathManager = null;
        this.mapSelectionHandler = null;

        this.mainHTMLObject = $("#" + mainAreaName);
    }

    GameApp.prototype.startGame = function () {
        Log.log("verbose", "starting game", this);
        this._setup();
    }; 

    GameApp.prototype._setup = function () {
        Log.log("verbose", "setup: ", this);

        this._compileTemplates();

        this.canvasManager = new navigame.CanvasManager();
        this.canvasManager.init(this.mainHTMLObject);

        this.mapVisuals = new navigame.MapVisuals();
        this.mapVisuals.init(this.canvasManager);

        this.mapControls = new navigame.MapControls();
        this.mapControls.init(this.canvasManager);

        this.markerControls = new navigame.MarkerControls();
        this.markerControls.init(this.mainHTMLObject, this.canvasManager);

        this.pathManager = new navigame.PathManager();
        this.pathManager.init(this.markerControls);

        this.mapSelectionHandler = new navigame.MapSelectionHandler();

        Log.log("verbose", "setup finished: ", this);
    };

    GameApp.prototype._compileTemplates = function() {
        var keys = Object.getOwnPropertyNames(templates);
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i];
            compiledTemplates[key] = this._compileTemplate(templates[key]);
        }
    };

    GameApp.prototype._compileTemplate = function (str) {
        return _.template(str);
    };

    return GameApp;
}());
