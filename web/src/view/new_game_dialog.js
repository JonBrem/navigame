navigame.NewGameDialog = (function () {
    
    /**
     * NewGameDialog constructor.
     * @constructor
     * @global
     * @class
     * @classdesc The new game dialog is displayed when the game is started
     *  and when a new game is requested in-game.
     */
    function NewGameDialog () {
        let _$dialogElement = null;
    }

    /**
     * show shows the dialog. This will also create the dialog.
     * @param  {boolean} closeable - whether it is possible to close this dialog. Default: true.
     * @memberof NewGameDialog
     */
    NewGameDialog.prototype.show = function(closeable) {
        if (!closeable && closeable !== false)
            closeable = true;

        let dialogElement = compiledTemplates['new_game_dialog']({
            data: { closeable: closeable } });
        $("body").append(dialogElement);

        this._$dialogElement = $("#new_game_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement, {
            "closeOnClick": closeable,
            "closeOnEsc": closeable
        });

        let that = this;
        this._$dialogElement.foundation('open');
    };

    /**
     * showSessionError shows an error message that there was a problem loading the session.
     * @memberof NewGameDialog
     */
    NewGameDialog.prototype.showSessionError = function () {
        $("#load_session_error").text('Session konnte nicht geladen werden!');
    };

    /**
     * _onStartClicked is called when the "Start"-Button is clicked and will trigger the
     *  'newGameStartClicked'-callback.
     * @memberof NewGameDialog
     */
    NewGameDialog.prototype._onStartClicked = function (e) {
        $(this).trigger('newGameStartClicked', [$("#session_input").val()]);
    }

    /**
     * closeDialog Closes the dialog.
     * @memberof NewGameDialog
     */
    NewGameDialog.prototype.closeDialog = function () {
        this._$dialogElement.foundation('close');
    };

    /**
     * _onDialogClose is called when the dialog is closed (by pressing Esc, clicking the 'x'
     *  or clicking outside the dialog) and will remove the HTML element.
     * @param  {event} e - dialog close event
     * @memberof NewGameDialog
     */
    NewGameDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return NewGameDialog;
})();
