var GameApp = (function () {

    function GameApp(mainAreaName) {
        this.canvasManager = null;
        this.mapVisuals = null;
        this.mapControls = null;
        this.markerControls = null;

        this.mainHTMLObject = $("#" + mainAreaName);
    }

    GameApp.prototype.startGame = function () {
        Log.log("verbose", "starting game", this);
        this._setup();
    }; 

    GameApp.prototype._setup = function () {
        Log.log("verbose", "setup: ", this);

        this._compileTemplates();

        this.canvasManager = new CanvasManager();
        this.canvasManager.init(this.mainHTMLObject);

        this.mapVisuals = new MapVisuals();
        this.mapVisuals.init(this.canvasManager);

        this.mapControls = new MapControls();
        this.mapControls.init(this.canvasManager);

        this.markerControls = new MarkerControls();
        this.markerControls.init(this.mainHTMLObject, this.canvasManager);

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
