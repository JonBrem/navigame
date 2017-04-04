navigame.MapSelectionHandler = (function () {

    /**
     * MapSelectionHandler constructor. Registers listeners to events fired by the params.
     * @constructor
     * @global
     * @class
     * @classdesc The Map Selection Handler comes into play when new maps are being added to the game
     *  and when the currently selected map changes. It is responsible for notifying the correct
     *  components about these changes.
     * @param  {navigame.MapVisuals} mapVisuals     - MapVisuals instance; the selection handler
     *                                                has to make it load map images.]
     * @param  {navigame.MapList} mapListVisuals - MapList instance: The selection handler
     *                                             is notified when a map is selected or the maps are sorted.]
     * @param  {navigame.PathManager} pathManager    - PathManager instance
     */
    function MapSelectionHandler(mapVisuals, mapListVisuals, pathManager) {
        this.mapSelectionDialog = null;
        this.currentArea = null;

        this.mapVisuals = mapVisuals;
        this.pathManager = pathManager;
        this.mapListVisuals = mapListVisuals;

        this._registerListeners();
    }

    /**
     * setDialog sets the mapSelectionDialog of this object to the specified dialog, and
     *  registers to its onAreaSelected and storeySelected events.
     * @param {navigame.MapSelectionDialog} dialog - dialog whose events will be listened to.
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype.setDialog = function (dialog) {
        this.mapSelectionDialog = dialog;
        let that = this;

        $(this.mapSelectionDialog).on('onAreaSelected', function (e, selectedArea) {
            that.loadLevels(selectedArea);
        });

        $(this.mapSelectionDialog).on('storeySelected', function (e, selectedStorey, imgSrc) {
            that.onMapChosen(that.currentArea, selectedStorey, imgSrc);
        });
    };

    /**
     * loadAreas loads a list of areas (such as "PT" or "Campus") from the server.
     * @memberof MapSelectionHandler
     */
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

    /**
     * loadLevels loads a list of levels/storeys for a specified area from the server.
     * @param  {string} selectedArea - a possible map area.
     * @memberof MapSelectionHandler
     */
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

    /**
     * onMapChosen is called when a specific map is selected and added to the path.
     *  It loads that map on the canvas, adds it to the map list and informs the 
     *  pathManager that there is a new map.
     * @param  {string} area   - description
     * @param  {object} storey - level id of the map
     * @param  {string} imgSrc - description
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype.onMapChosen = function (area, storey, imgSrc) {
        this.mapSelectionDialog.closeDialog();
        this.mapVisuals.loadNewMap(imgSrc);
        this.pathManager.addMap(storey, imgSrc);

        this.mapListVisuals.addMap(this.pathManager.currentMapIndex, imgSrc);
    };

    /**
     * [loadMaps loads a list of maps on the map list, the last of which
     *  is set as the map on display on the canvas.]
     * @param  {array}   maps     - array of objects containing 'imgSrc' as a key.
     *                               has to be in the very same order as the map paths in the logical
     *                               representation.]
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype.loadMaps = function (maps) {
        for(let i = 0; i < maps.length; i++) {
            this.mapListVisuals.addMap(i, maps[i].imgSrc);

            if (i == maps.length - 1) {
                this.setSelectedMap(i, maps[i].imgSrc);
            }
        }
    };

    /**
     * setSelectedMap informs the path manager and the map visuals that another map should
     *  be set as the currently selected map
     * @param {number} mapIndex - index of the map among the maps that make up the current path
     * @param {string} imgSrc   - url of the map's image file
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype.setSelectedMap = function (mapIndex, imgSrc) {
        this.pathManager.setCurrentMapIndex(mapIndex);
        
        let that = this;
        this.mapVisuals.loadNewMap(imgSrc, function() {
            that.pathManager.loadDataIntoView();
        });        
    };

    /**
     * _onAreasLoaded is called when the list of areas has been successfully downloaded 
     *  and passes that list on to the map selection dialog, so the user can choose one.]
     * @param  {object} serverResponse - JSON-response (most likely an array) containing a list
     *                                    of possible areas.
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype._onAreasLoaded = function (serverResponse) {
        this.mapSelectionDialog.setAreas(serverResponse);
    };

    /**
     * _onAreasLoaded is called when the list of levels for a given area has been successfully downloaded 
     *  and passes that list on to the map selection dialog, so the user can choose one.
     * @param  {object} serverResponse - JSON-response (most likely an array) containing a list
     *                                    of possible levels.
     * @param  {string} selectedArea   - identifier string of the selected area
     * @memberof MapSelectionHandler
     */
    MapSelectionHandler.prototype._onLevelsLoaded = function (serverResponse, selectedArea) {
        this.mapSelectionDialog.setAreaLevels(serverResponse);
    };

    /**
     * _registerListeners makes the map selection handler listen to events by the
     *  map list and path manager.
     */
    MapSelectionHandler.prototype._registerListeners = function () {
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

    return MapSelectionHandler;
}());
