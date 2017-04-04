navigame.GameTitleBar = (function () {

    /**
     * GameTitleBar constructor.
     * @constructor
     * @global
     * @class
     * @classdesc The visuals for the title bar, which contains the
     *  title, "new game" and "save game"-buttons and the
     *  displays for the path's start and destination points.
     * @param {jQuery} $titleArea - jQuery handle for the title container
     */
    function GameTitleBar ($titleArea) {
        this._$titleArea = $titleArea;
        this._$titleArea.html(compiledTemplates['title_bar']());

        let that = this;

        this._$newGameButton = $("#new_game_button");
        this._$newGameButton.on("click", function (e) {
            that._showNewGameDialog();
        });

        this._$saveButton = $("#save_button");
        this._$saveButton.on("click", function (e) {
            $(that).trigger('requestSaveGame', []);
        });
    };

    /**
     * setStartGoal displays the start and the goal in the title bar.
     * @param {object} start - {roomid: x, area: y}-type objects
     * @param {object} goal  - {roomid: x, area: y}-type objects
     * @memberof GameTitleBar
     */
    GameTitleBar.prototype.setStartGoal = function (start, goal) {
        $("#from_node").text("Start: " + start.roomid + " (" + start.area + ")");
        $("#to_node").text("Ziel: " + goal.roomid + " (" + goal.area + ")");
    };

    /**
     * displays the session id in the title bar.
     * @param {string} sessionId - the session id
     * @memberof GameTitleBar
     */
    GameTitleBar.prototype.setSession = function (sessionId) {
        $("#session_id_container").html(sessionId);
    };

    /**
     * _showNewGameDialog triggers the 'requestNewGameDialog'-event.
     * @memberof GameTitleBar
     */
    GameTitleBar.prototype._showNewGameDialog = function (e) {
        $(this).trigger("requestNewGameDialog", []);
    };


    return GameTitleBar;
})();
