navigame.ScoreDialog = (function () {

    function ScoreDialog () {
        let _$dialogElement = null;
    }

    ScoreDialog.prototype.show = function(scoreObj) {
        let dialogElement = compiledTemplates['score_dialog']({
            data: {
                score: scoreObj.score
            }
        });
        $("body").append(dialogElement);

        this._$dialogElement = $("#score_dialog_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement);

        let that = this;
        this._$dialogElement.on("closed.zf.reveal", function (e) {that._onDialogClose(e);});
        this._$dialogElement.foundation('open');

        $("#start_new_round_button").on("click", function (e) {that._onStartNewGameClicked(e);});
    };

    ScoreDialog.prototype._onStartNewGameClicked = function (e) {
        $(this).trigger('newGameStartClicked');
    }

    ScoreDialog.prototype.closeDialog = function () {
        this._$dialogElement.foundation('close');
    };

    ScoreDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return ScoreDialog;
})();
