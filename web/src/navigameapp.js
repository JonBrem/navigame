var navigame = {};
window.navigame = navigame;

navigame.GameApp = (function () {

    function GameApp(mainAreaName, titleAreaName) {
        this.canvasManager = null;
        this.mapVisuals = null;
        this.mapControls = null;
        this.markerControls = null;
        this.edgeControls = null;
        this.mapListVisuals = null;
        this.titleBar = null;

        this.pathManager = null;
        this.mapSelectionHandler = null;

        this.newGameDialog = null;

        this.$mainHTMLObject = $("#" + mainAreaName);
        this.$titleArea = $("#" + titleAreaName);
    }

    GameApp.prototype.startGame = function () {
        Log.log("verbose", "starting game", this);
        this._setup();

        let that = this;
        setInterval(function() {
            that._removeEmptyReveals();
        }, 50);
    }; 

    GameApp.prototype._setup = function () {
        Log.log("verbose", "setup: ", this);
        let that = this;

        this._compileTemplates();

        this.titleBar = new navigame.GameTitleBar();
        this.titleBar.init(this.$titleArea);
        $(this.titleBar).on('requestNewGameDialog', function(e) { that.showNewGameDialog(e); });
        $(this.titleBar).on('requestSaveGame', function(e) { that.saveGame(e); });

        this.canvasManager = new navigame.CanvasManager();
        this.canvasManager.init(this.$mainHTMLObject);

        this.mapVisuals = new navigame.MapVisuals();
        this.mapVisuals.init(this.canvasManager);

        this.markerControls = new navigame.MarkerControls();
        this.markerControls.init(this.$mainHTMLObject, this.canvasManager);

        this.edgeControls = new navigame.EdgeControls();
        this.edgeControls.init(this.$mainHTMLObject, this.canvasManager);

        this.mapControls = new navigame.MapControls();
        this.mapControls.init(this.canvasManager, this.markerControls, this.edgeControls);

        this.mapListVisuals = new navigame.MapList();
        this.mapListVisuals.init(this.$mainHTMLObject);

        this.pathManager = new navigame.PathManager(this.markerControls, this.edgeControls, this.mapListVisuals, this.canvasManager);
        this.pathManager.newPath();
        $(this.pathManager).on('onScoreCalculated', function(e, data) { that._onScoreCalculated(data); });

        this.mapSelectionHandler = new navigame.MapSelectionHandler();
        this.mapSelectionHandler.init(this.mapVisuals, this.mapListVisuals, this.pathManager);

        this.newGameDialog = new navigame.NewGameDialog();
        this.newGameDialog.show(false);
        $(this.newGameDialog).on('newGameStartClicked', function(e, fromSavedState) { that.startNewGame(e, fromSavedState); });


        let elementScaler = new navigame.ElementScaler();

        Log.log("verbose", "setup finished: ", this);
    };

    GameApp.prototype.startNewGame = function (e, fromSavedState) {
        this.pathManager.newPath();
        this.mapListVisuals.clear();
        
        let that = this;

        if (!fromSavedState || fromSavedState == null || fromSavedState == "") {
            navigame.PathSaveLoad.requestId(
                function (sessionId) {
                    that._onSessionCreated(sessionId);
                }, 
                function (error) {
                    console.log(error);
                });
        } else {
            navigame.PathSaveLoad.loadPath(fromSavedState,
                function (pathData) {
                    that._onSessionLoaded(pathData);
                },
                function (error) {
                    console.log(error);
                }
            );
        }
    };

    GameApp.prototype.showNewGameDialog = function (e) {
        let that = this;

        this.newGameDialog = new navigame.NewGameDialog();
        this.newGameDialog.show(true);
        $(this.newGameDialog).on('newGameStartClicked', function(e, fromSavedState) { that.startNewGame(e, fromSavedState); });
    };

    GameApp.prototype.saveGame = function (e) {
        let that = this;

        navigame.PathSaveLoad.savePath(this.pathManager.path.toJson(), 
            function (e) {
                Log.log("verbose", "Path saved", e);
            },
            function (error) {

            }
        );
    };

    GameApp.prototype._onSessionCreated = function (session) {
        this.newGameDialog.closeDialog();
        this.titleBar.setSession(session.session_id);
        this.titleBar.setStartGoal(session.to_room, session.from_room);

        this.pathManager.setPathId(session.session_id);
        this.pathManager.setStartGoal(session.to_room, session.from_room);
        
        // user _has_ to choose the first map:
        this.mapListVisuals.showAddMapDialog(false, session.to_room, session.from_room);
    };

    GameApp.prototype._onSessionLoaded = function (pathData) {
        if ("status" in pathData && pathData.status == 'session_404') {
            this.newGameDialog.showSessionError();
        } else {
            this.newGameDialog.closeDialog();
            this.titleBar.setSession(pathData.pathId);
            this.titleBar.setStartGoal(pathData.startPoint, pathData.endPoint);

            this.pathManager.setPathId(pathData.pathId);

            this.pathManager.loadPathFromJson(pathData);
        }
    };

    GameApp.prototype._onScoreCalculated = function (scoreData) {
        let scoreDialog = new navigame.ScoreDialog();
        let that = this;

        $(scoreDialog).on('newGameStartClicked', function (e) {
            scoreDialog.closeDialog();
            that.showNewGameDialog();
        });

        scoreDialog.show(scoreData);
    };

    GameApp.prototype._compileTemplates = function () {
        var keys = Object.getOwnPropertyNames(templates);
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i];
            compiledTemplates[key] = this._compileTemplate(templates[key]);
        }
    };

    GameApp.prototype._compileTemplate = function (str) {
        return _.template(str);
    };

    // bugfix, because Reveal modals are created dynamically and that causes trouble
    GameApp.prototype._removeEmptyReveals = function () {
        $overlays = $(".reveal-overlay");
        for (let i = 0; i < $overlays.length; i++) {
            if ($overlays.eq(i).css("display") == "none") {
                $overlays.eq(i).remove();
            }
        }
    };

    return GameApp;
}());
