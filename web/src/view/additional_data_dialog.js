navigame.AdditionalDataDialog = (function () {

    /**
     * AdditionalDataDialog constructor.
     * @constructor
     * @global
     * @class
     * @classdesc The additional data dialog dynamically creates input fields
     *  to add key-value data to markers and edges.
     */
    function AdditionalDataDialog () {
        let _$dialogElement = null;
        let currentDataTimeCreated = null;
        let currentIndex = null;
    }

    /**
     * show shows the dialog. This will also create the dialog.
     * @param  {string} whichType - "marker" or "edge"
     * @param  {fabric.Object} item      - item whose additionalData will be displayed & modified
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype.show = function(whichType, item) {
        let dataItems = this._getData(item);

        currentDataTimeCreated = item.additionalData.timeCreated;
        currentIndex = ('markerIndex' in item.additionalData? item.additionalData.markerIndex : item.additionalData.edgeIndex);

        let dialogElement = compiledTemplates['additional_data_dialog'](
            { data: { whichType: whichType, items: dataItems } });

        $("body").append(dialogElement);

        this._$dialogElement = $("#additional_data_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement);

        this._$dialogElement.foundation('open');

        this._registerListeners();
    };

    /**
     * _onOkClicked is called when the OK button is clicked &
     *  triggers the 'okSelected' callback on this dialog with the data that was input.
     * @param  {event} e - jQuery event
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype._onOkClicked = function (e) {
        let inputData = {};
        let $inputAreas = $(".additional_data_input_area");

        for (let i = 0; i < $inputAreas.length; i++) {
            let key = $inputAreas.eq(i).find('.additional_data_input_key').val().trim();
            let val = $inputAreas.eq(i).find('.additional_data_input_value').val();

            if (key != null && key.length > 0 && key != "timeCreated") {
                inputData[key] = val;
            }
        }   

        $(this).trigger('okSelected', [currentDataTimeCreated, currentIndex, inputData]);
    }

    /**
     * _onAddEntryButtonClicked creates a new empty key-value-field combo.
     * @param  {event} e - jQuery event for the button click
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype._onAddEntryButtonClicked = function (e) {
        $("#data_dialog_items_area").append(compiledTemplates["additional_data_item"]({data: {}}));
    };

    /**
     * closeDialog closes the dialog, and will also remove the HTML elements.
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype.closeDialog = function () {
        if (this._$dialogElement) {
            try {
                this._$dialogElement.parent().remove();
                this._$dialogElement.remove();
            } catch (e) {
                this._$dialogElement.foundation('close');
            }
        }
    };

    /**
     * _onDialogClose is called when the dialog is closed (by pressing Esc, clicking the 'x'
     *  or clicking outside the dialog) and will remove the HTML element.
     * @param  {event} e - dialog close event
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    /**
     * _getData builds an array of {key: x, value: y}-type objects that contain the additionalData
     *  in a more parseable format.
     * @param  {fabric.Object} item - item (marker or edge) that is being editet
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype._getData = function (item) {
        let dataItems = [];

        for(key in item.additionalData) {
            if (key != "timeCreated" && key != "markerIndex" && key != "edgeIndex") {
                dataItems.push({
                    "key": key, 
                    "value": item.additionalData[key]
                });
            }
        }

        return dataItems;
    };

    /**
     * _registerListeners registers event listeners (for button clicks and dialog close events).
     * @memberof AdditionalDataDialog
     */
    AdditionalDataDialog.prototype._registerListeners = function () {
        let that = this;
        this._$dialogElement.on("closed.zf.reveal", function (e) {that._onDialogClose(e);});

        $("#data_dialog_plus_button").on('click', function(e) {that._onAddEntryButtonClicked(e);});
        $("#data_dialog_ok_button").on("click", function (e) {that._onOkClicked(e);});
    };

    return AdditionalDataDialog;
})();
