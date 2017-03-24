navigame.MapSelectionHandler = (function () {

    function MapSelectionHandler() {
        this.mapSelectionDialog = null;
        this.currentArea = null;
        this.mapVisuals = null;
    }

    MapSelectionHandler.prototype.init = function(mapVisuals) {
        this.mapVisuals = mapVisuals;
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
            url: '/navigame?method=areas',
            type: 'GET',
            dataType: 'json',
            data: {},
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
            url: '/navigame?method=area_levels&which_area=' + selectedArea,
            type: 'GET',
            dataType: 'json',
            data: {},
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
    };

    MapSelectionHandler.prototype._onAreasLoaded = function(serverResponse) {
        this.mapSelectionDialog.setAreas(serverResponse);
    };

    MapSelectionHandler.prototype._onLevelsLoaded = function (serverResponse, selectedArea) {
        this.mapSelectionDialog.setAreaLevels(serverResponse);
    };

    return MapSelectionHandler;
}());
