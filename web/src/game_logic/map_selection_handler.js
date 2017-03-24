navigame.MapSelectionHandler = (function () {

    function MapSelectionHandler() {
        this.mapSelectionDialog = null;
        this.currentArea = null;

        this.mapVisuals = null;
        this.pathManager = null;
    }

    MapSelectionHandler.prototype.init = function(mapVisuals, pathManager) {
        this.mapVisuals = mapVisuals;
        this.pathManager = pathManager;
    };

    MapSelectionHandler.prototype.setDialog = function(dialog) {
        this.mapSelectionDialog = dialog;
        let that = this;

        $(this.mapSelectionDialog).on('onAreaSelected', function(e, selectedArea) {
            that.loadLevels(selectedArea);
        });

        $(this.mapSelectionDialog).on('storeySelectd', function(e, selectedStorey, imgSrc) {
            that.onMapChosen(that.currentArea, selectedStorey, imgSrc);
        });
    };

    MapSelectionHandler.prototype.loadAreas = function() {
        let that = this;

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: "areas"
            },
            success: function(e) {
                that._onAreasLoaded(e);
            },
            error: function(e) {
                console.log(e);
            }
        });        
    };

    MapSelectionHandler.prototype.loadLevels = function(selectedArea) {
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
            success: function(e) {
                that._onLevelsLoaded(e, selectedArea);
            },
            error: function(e) {
                console.log(e);
            }
        });
    };

    MapSelectionHandler.prototype.onMapChosen = function(area, storey, imgSrc) {
        this.mapSelectionDialog.closeDialog();
        this.mapVisuals.loadNewMap(imgSrc);
        this.pathManager.addMap(storey, imgSrc);
    };

    MapSelectionHandler.prototype._onAreasLoaded = function(serverResponse) {
        this.mapSelectionDialog.setAreas(serverResponse);
    };

    MapSelectionHandler.prototype._onLevelsLoaded = function (serverResponse, selectedArea) {
        this.mapSelectionDialog.setAreaLevels(serverResponse);
    };

    return MapSelectionHandler;
}());
