navigame.GameTitleBar = (function () {

    function GameTitleBar () {
        this._$titleArea = null;
        this._$newGameButton = null;
        this._$saveButton = null;
    }

    GameTitleBar.prototype.init = function ($titleArea) {
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

    GameTitleBar.prototype.setStartGoal = function (start, goal) {
        $("#from_node").text("Start: " + start);
        $("#to_node").text("Ziel: " + goal);
    };

    GameTitleBar.prototype.setSession = function (sessionId) {
        $("#session_id_container").html(sessionId);
    };

    GameTitleBar.prototype._showNewGameDialog = function (e) {
        $(this).trigger("requestNewGameDialog", []);
    };


    return GameTitleBar;
})();
