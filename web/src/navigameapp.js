var GameApp = (function () {

    function GameApp(mainAreaName) {
        this.mapVisuals = null;;
        this.mainHTMLObject = $("#" + mainAreaName)
    }

    GameApp.prototype.startGame = function () {
        Log.log("verbose", "starting game", this);
        this._setup();
    }; 

    GameApp.prototype._setup = function () {
        Log.log("verbose", "setup: ", this);

        this._compileTemplates();

        this.mapVisuals = new MapVisuals();
        this.mapVisuals.init(this.mainHTMLObject);

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
