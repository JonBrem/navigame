navigame.ScoreDialog = (function () {
    
    /**
     * ScoreDialog constructor.
     * @constructor
     * @global
     * @class
     * @classdesc The score dialog is displayed when the user wants to finish the game
     *  and has had their score evaluated. This displays the result that was calculated
     *  elsewhere.
     */
    function ScoreDialog () {
        let _$dialogElement = null;
    }

    /**
     * show shows the dialog. This will also create the dialog.
     * @param  {object} scoreObj - object containing at least a "score"-key.
     * @memberof ScoreDialog
     */
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

    /**
     * _onStartNewGameClicked is called when the "new game"-Button is clicked and will trigger the
     *  'newGameStartClicked'-callback. This is not quite the same method as in
     *   navigame.NewGameDialog, but should probably lead to a NewGameDialog being displayed.
     * @memberof ScoreDialog
     */

    ScoreDialog.prototype._onStartNewGameClicked = function (e) {
        $(this).trigger('newGameStartClicked');
    }

    /**
     * closeDialog closes the dialog.
     * @memberof ScoreDialog
     */
    ScoreDialog.prototype.closeDialog = function () {
        this._$dialogElement.foundation('close');
    };

    /**
     * _onDialogClose is called when the dialog is closed (by pressing Esc, clicking the 'x'
     *  or clicking outside the dialog) and will remove the HTML element.
     * @param  {event} e - dialog close event
     * @memberof ScoreDialog
     */
    ScoreDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return ScoreDialog;
})();
