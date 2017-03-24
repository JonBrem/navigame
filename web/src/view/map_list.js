navigame.MapList = (function () {

    function MapList () {
        this._$contentArea = null;

        this._$mapListElement = null;
        this._$addMappButton = null;

        this.mapSelectionHandler = null;
    }

    MapList.prototype.init = function ($contentArea, mapSelectionHandler) {
        this._$contentArea = $contentArea;
        this._$contentArea.append(compiledTemplates['map_list']());

        this._$mapListElement = $("#map_list");
        this._$addMapButton = $("#add_map_button");

        let that = this;
        this._$addMapButton.on("click", function(e) {
            that._onAddMapButtonClicked(e);
        });

        this.mapSelectionHandler = mapSelectionHandler;
    };

    MapList.prototype._onAddMapButtonClicked = function (e) {
        let addMapDialog = new navigame.MapSelectionDialog();
        this.mapSelectionHandler.setDialog(addMapDialog);

        addMapDialog.show();
        this.mapSelectionHandler.loadAreas();
    };

    return MapList;
})();
