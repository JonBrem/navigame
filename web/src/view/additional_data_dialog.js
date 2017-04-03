navigame.AdditionalDataDialog = (function () {

    function AdditionalDataDialog () {
        let _$dialogElement = null;
        let currentDataTimeCreated = null;
        let currentIndex = null;
    }

    AdditionalDataDialog.prototype.show = function(whichType, item) {
        let dataItems = [];
        for(key in item.additionalData) {
            if (key != "timeCreated" && key != "markerIndex" && key != "edgeIndex") {
                dataItems.push({
                    "key": key, 
                    "value": item.additionalData[key]
                });
            }
        }

        currentDataTimeCreated = item.additionalData.timeCreated;
        currentIndex = 'markerIndex' in item.additionalData? item.additionalData.markerIndex : item.additionalData.edgeIndex;

        let dialogElement = compiledTemplates['additional_data_dialog']({
            data: {
                whichType: whichType,
                items: dataItems
            }
        });
        $("body").append(dialogElement);

        this._$dialogElement = $("#additional_data_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement);

        let that = this;
        this._$dialogElement.on("closed.zf.reveal", function (e) {that._onDialogClose(e);});
        this._$dialogElement.foundation('open');

        $("#data_dialog_plus_button").on('click', function(e) {that._onAddEntryButtonClicked(e);});
        $("#data_dialog_ok_button").on("click", function (e) {that._onOkClicked(e);});
    };

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

    AdditionalDataDialog.prototype._onAddEntryButtonClicked = function (e) {
        $("#data_dialog_items_area").append(compiledTemplates["additional_data_item"]({data: {}}));
    };

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

    AdditionalDataDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return AdditionalDataDialog;
})();
