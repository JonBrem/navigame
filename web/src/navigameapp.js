/** 
 * Namespace for the game. All classes are part of this.
 * @namespace
 */
var navigame = {};
window.navigame = navigame;

navigame.GameApp = (function () {

    /** 
     * GameApp constructor. Only creates member variables and references the
     * elements; <instance>.startGame() actually starts the game.
     * @constructor
     * @global
     * @class
     * @classdesc The GameApp is the central class of the game and initiates all other
     *  components.
     * @param {string} mainAreaId  - id of an html element
     * @param {string} titleAreaId - id of an html element
     */
    function GameApp(mainAreaId, titleAreaId) {
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

    /**
     * startGame launches the game.
     *
     *@memberof GameApp
     */
    GameApp.prototype.startGame = function () {
        Log.log("verbose", "starting game", this);
        this._setup();

        this.showNewGameDialog(false);

        let elementScaler = new navigame.ElementScaler();

        let that = this;
        setInterval(function() {
            that._removeEmptyReveals();
        }, 50);
    }; 

    /**
     * _setup sets up the templates, the view classes and the logic classes.
     * @memberof GameApp
     */
    GameApp.prototype._setup = function () {
        Log.log("verbose", "setup: ", this);
        let that = this;

        this._compileTemplates();

        this._setupView();
        this._setupLogic();

        Log.log("verbose", "setup finished: ", this);
    };

  
    /**
     * startNewGame starts a new iteration of the game.
     *  <instance>.startGame() has to be called the first time;
     *  startNewGame is called "from the inside" (although it could be called from the outside).
     * @param  {event} e - some event (ignored)
     * @param  {string} fromSavedState - null / false / empty string if a new session should be
     *                                   created, or the id of a session that should be loaded.
     *                                   @memberof GameApp
     */
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

  
    /**
     * showNewGameDialog shows the dialog where a new game can be started.
     * @param  {boolean} cancelable - optional (default: true); whether or not the dialog
     *                                can be closed.
     *                                @memberof GameApp
     */
    GameApp.prototype.showNewGameDialog = function (cancelable) {
        if (!cancelable && cancelable !== false)
            cancelable = true;

        let that = this;

        this.newGameDialog = new navigame.NewGameDialog();
        this.newGameDialog.show(cancelable);
        $(this.newGameDialog).on('newGameStartClicked', function(e, fromSavedState) { that.startNewGame(e, fromSavedState); });
    };

  
    /**
     * saveGame requests that the navigame.PathSaveLoad component saves the game.
     * @param  {event} e - some event, ignored.
     * @memberof GameApp
     */
    GameApp.prototype.saveGame = function (e) {
        let that = this;

        navigame.PathSaveLoad.savePath(this.pathManager.path.toJson(), 
            function (e) {
                Log.log("verbose", "Path saved", e);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    /**
     * _setupView initializes all the different view components of the application.
     * Has to be called before _setupLogic, as _setupLogic depends on some view components.
     * @memberof GameApp
     */
    GameApp.prototype._setupView = function () {
        let that = this;

        this.titleBar = new navigame.GameTitleBar(this.$titleArea);
        $(this.titleBar).on('requestNewGameDialog', function (e) { that.showNewGameDialog(e); });
        $(this.titleBar).on('requestSaveGame', function (e) { that.saveGame(e); });

        this.canvasManager = new navigame.CanvasManager(this.$mainHTMLObject);
        this.mapVisuals = new navigame.MapVisuals(this.canvasManager);
        this.markerControls = new navigame.MarkerControls(this.$mainHTMLObject, this.canvasManager);
        this.edgeControls = new navigame.EdgeControls(this.canvasManager);
        this.mapControls = new navigame.MapControls(this.canvasManager, this.markerControls, this.edgeControls);
        this.mapListVisuals = new navigame.MapList(this.$mainHTMLObject);
    };

    /**
     * _setupLogic initializes all the logic components of the application (path manager & 
     *  map selection handler).
     * Has to be called after _setupView, as _setupLogic depends on some view components.
     * @memberof GameApp
     */
    GameApp.prototype._setupLogic = function() {
        let that = this;

        this.pathManager = new navigame.PathManager(this.markerControls, this.edgeControls, this.mapListVisuals, this.canvasManager);
        this.pathManager.newPath();
        $(this.pathManager).on('onScoreCalculated', function (e, data) { that._onScoreCalculated(data); });

        this.mapSelectionHandler = new navigame.MapSelectionHandler(this.mapVisuals, this.mapListVisuals, this.pathManager);
    };

    /**
     * _onSessionCreated is called when a new session (with an id, a start an a destination point)
     *  has been created and it informs the respective components + launches an initial
     *  "add map"-dialog that cannot be cancelled.
     * @param  {JSON} session - objects with keys "session_id", "to_room" and "from_room"
     * @memberof GameApp
     */
    GameApp.prototype._onSessionCreated = function (session) {
        this.newGameDialog.closeDialog();
        this.titleBar.setSession(session.session_id);
        this.titleBar.setStartGoal(session.to_room, session.from_room);

        this.pathManager.setPathId(session.session_id);
        this.pathManager.setStartGoal(session.to_room, session.from_room);
        
        // user _has_ to choose the first map:
        this.mapListVisuals.showAddMapDialog(false, session.to_room, session.from_room);
    };

    /**
     * _onSessionLoaded is called after the server responded to a load-session request.
     *  that may have failed; this method checks if the server returned a session and, if so,
     *  loads that session; if not, it displays an error message in the new game dialog.
     * @param  {JSON} pathData - the server's json response to the load-session request.
     * @memberof GameApp
     */
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

    /**
     * _onScoreCalculated creates a new navigame.ScoreDialog that displays the score.
     * @param  {JSON} scoreData - scoreData that the server calculated. Must contain a 'score'-
     *                            key with a number as its value.
     *                            @memberof GameApp
     */
    GameApp.prototype._onScoreCalculated = function (scoreData) {
        let scoreDialog = new navigame.ScoreDialog();
        let that = this;

        $(scoreDialog).on('newGameStartClicked', function (e) {
            scoreDialog.closeDialog();
            that.showNewGameDialog();
        });

        scoreDialog.show(scoreData);
    };

    /**
     * _compileTemplates compiles all underscore templates registered at the window-level
     *  object 'templates' and puts them in 'compiledTemplates' under the same key.
     *  @memberof GameApp
     */
    GameApp.prototype._compileTemplates = function () {
        var keys = Object.getOwnPropertyNames(templates);
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i];
            compiledTemplates[key] = _.template(templates[key]);
        }
    };

    /**
     * bugfix, because Reveal modals are created dynamically and that causes trouble.
     * Therefore, they will be removed as soon as they are no longer needed.
     * @memberof GameApp
     */
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
