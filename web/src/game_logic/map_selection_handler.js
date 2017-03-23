navigame.MapSelectionHandler = (function () {

    function MapSelectionHandler() {
        this.mapSelectionDialog = null;
    }

    MapSelectionHandler.prototype.setDialog = function(dialog) {
        this.mapSelectionDialog = dialog;
        let that = this;
        $(this.mapSelectionDialog).on('onAreaSelected', function(e, selectedArea) {
            that.loadLevels(selectedArea);
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

    MapSelectionHandler.prototype._onAreasLoaded = function(serverResponse) {
        dialog.setAreas(serverResponse);
    };

    MapSelectionHandler.prototype.loadLevels = function(selectedArea) {
        let that = this;

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

    return MapSelectionHandler;
}());
