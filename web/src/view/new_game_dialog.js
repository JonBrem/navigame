navigame.NewGameDialog = (function () {

    function NewGameDialog () {
        let _$dialogElement = null;
    }

    NewGameDialog.prototype.show = function(closeable) {
        if (!closeable && closeable !== false)
            closeable = true;

        let dialogElement = compiledTemplates['new_game_dialog']({
            data: {
                closeable: closeable
            }
        });
        $("body").append(dialogElement);

        this._$dialogElement = $("#new_game_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement, {
            "closeOnClick": closeable,
            "closeOnEsc": closeable
        });

        let that = this;
        this._$dialogElement.on("closed.zf.reveal", function (e) {that._onDialogClose(e);});
        this._$dialogElement.foundation('open');

        $("#new_game_start_button").on("click", function (e) {that._onStartClicked(e);});
    };

    NewGameDialog.prototype._onStartClicked = function (e) {
        $(this).trigger('newGameStartClicked', [$("#session_input").val()]);
    }

    NewGameDialog.prototype.closeDialog = function () {
        this._$dialogElement.foundation('close');
    };

    NewGameDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return NewGameDialog;
})();
