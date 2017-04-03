/**
 * [description]
 */
navigame.MapSelectionHandler = (function () {

    /**
     * [MapSelectionHandler constructor. Contains a list of public members, does nothing else.]
     */
    function MapSelectionHandler() {
        this.mapSelectionDialog = null;
        this.currentArea = null;

        this.mapVisuals = null;
        this.pathManager = null;
        this.mapListVisuals = null;
    }

    /**
     * [init description]
     * @param  {[navigame.MapVisuals]} mapVisuals     [MapVisuals instance; the selection handler
     *                                                has to be notified when a new map selection dialog
     *                                                is created.]
     * @param  {[navigame.MapList]} mapListVisuals [MapList instance: The selection handler
     *                                             is notified when a map is selected or the maps are sorted.]
     * @param  {[navigame.PathManager]} pathManager    [PathManager instance]
     * @return nothing
     */
    MapSelectionHandler.prototype.init = function (mapVisuals, mapListVisuals, pathManager) {
        this.mapVisuals = mapVisuals;
        this.pathManager = pathManager;
        this.mapListVisuals = mapListVisuals;

        let that = this;
        $(this.mapListVisuals).on('dialogCreated', function (e, dialog) {
            that.setDialog(dialog);
            that.loadAreas();
        });

        $(this.mapListVisuals).on('onMapSelected', function (e, data) {
            that.setSelectedMap(data.mapIndex, data.imgSrc);
        });

        $(this.mapListVisuals).on('onMapsResorted', function (e, data) {
            that.pathManager.resortMaps(data);
        });

        $(this.pathManager).on('triggerLoadMaps', function (e, data) {
            that.loadMaps(data);
        });
    };

    MapSelectionHandler.prototype.setDialog = function (dialog) {
        this.mapSelectionDialog = dialog;
        let that = this;

        $(this.mapSelectionDialog).on('onAreaSelected', function (e, selectedArea) {
            that.loadLevels(selectedArea);
        });

        $(this.mapSelectionDialog).on('storeySelectd', function (e, selectedStorey, imgSrc) {
            that.onMapChosen(that.currentArea, selectedStorey, imgSrc);
        });
    };

    MapSelectionHandler.prototype.loadAreas = function () {
        let that = this;

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: "areas"
            },
            success: function (e) {
                that._onAreasLoaded(e);
            },
            error: function (e) {
                console.log(e);
            }
        });        
    };

    MapSelectionHandler.prototype.loadLevels = function (selectedArea) {
        let that = this;
        this.currentArea = selectedArea;

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: "area_levels",
                which_area: selectedArea
            },
            success: function (e) {
                that._onLevelsLoaded(e, selectedArea);
            },
            error: function (e) {
                console.log(e);
            }
        });
    };

    MapSelectionHandler.prototype.onMapChosen = function (area, storey, imgSrc) {
        this.mapSelectionDialog.closeDialog();
        this.mapVisuals.loadNewMap(imgSrc);
        this.pathManager.addMap(storey, imgSrc);

        this.mapListVisuals.addMap(this.pathManager.currentMapIndex, imgSrc);
    };

    MapSelectionHandler.prototype.loadMaps = function (maps, callback) {
        for(let i = 0; i < maps.length; i++) {
            this.mapListVisuals.addMap(i, maps[i].imgSrc);

            if (i == maps.length - 1) {
                this.setSelectedMap(i, maps[i].imgSrc);
            }
        }
    };

    MapSelectionHandler.prototype.setSelectedMap = function (mapIndex, imgSrc) {
        this.pathManager.setCurrentMapIndex(mapIndex);
        
        let that = this;
        this.mapVisuals.loadNewMap(imgSrc, function() {
            that.pathManager.loadDataIntoView();
        });        
    };

    MapSelectionHandler.prototype._onAreasLoaded = function (serverResponse) {
        this.mapSelectionDialog.setAreas(serverResponse);
    };

    MapSelectionHandler.prototype._onLevelsLoaded = function (serverResponse, selectedArea) {
        this.mapSelectionDialog.setAreaLevels(serverResponse);
    };

    return MapSelectionHandler;
}());
