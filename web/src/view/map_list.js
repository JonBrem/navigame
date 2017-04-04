navigame.MapList = (function () {

    /**
     * MapList constructor.
     * @constructor
     * @global
     * @class
     * @classdesc Simple data container for paths. Consists of mapPaths, which in turn
     *  contain nodes and edges of a route.
     */
    function MapList ($contentArea) {
        this._$contentArea = $contentArea;
        this._$contentArea.append(compiledTemplates['map_list']());

        this._$mapListElement = $("#map_list");
        this._$addMapButton = $("#add_map_button");
        this._$removeMapButton = $("#remove_map_button");
        this._$submitPathButton = $("#submit_path_button");

        this._setupSortableList();
        this._setupButtons();
    };

    /**
     * showAddMapDialog will create and show an AddMapDialog, then trigger the
     *  'dialogCreated'-event.
     * @param  {boolean} closeable - whether it is possible to close the dialog.
     * @param  {object} start - object in a {roomid: x, area: y}-type format
     * @param  {object} goal  - object in a {roomid: x, area: y}-type format
     * @memberof MapList
     */
    MapList.prototype.showAddMapDialog = function (closeable, start, goal) {
        if (!closeable && closeable !== false)
            closeable = true; // <- default is true, unless "false" is explicitly set.

        let addMapDialog = new navigame.MapSelectionDialog();

        if (start || goal) {
            addMapDialog.show(closeable, true, start, goal);
        } else {
            addMapDialog.show(closeable, false);
        }

        $(this).trigger('dialogCreated', [addMapDialog]);
    };

    /**
     * addMap adds a map to the list.
     * @param {string} id - index of the map
     * @param {string} imgSrc - src of the map image
     * @memberof MapList
     */
    MapList.prototype.addMap = function (id, imgSrc) {
        let newMapItem = $(compiledTemplates['map_list_item']({
            data: {
                map_index: id,
                map_src: imgSrc
            }
        }));

        this._$mapListElement.append(newMapItem);
        
        let that = this;
        newMapItem.on('click', function (e) {
            that._onMapClicked($(this)); // <-- "this" is not "that" in this case!
        });
    };

    /**
     * deleteMapButtonClicked will request that the map be deleted.
     *  This does not directly delete the map, because the view shouldn't make that
     *  decision. Triggers the 'requestDeleteMap'-event.
     *  @memberof MapList
     */
    MapList.prototype.deleteMapButtonClicked = function () {
        $(this).trigger('requestDeleteMap'); // <- because the view can't just delete things!
    };

    /**
     * submitPathClicked triggers the 'requestSubmitPath'-event.
     * @memberof MapList
     */
    MapList.prototype.submitPathClicked = function () {
        $(this).trigger("requestSubmitPath");
    };

    /**
     * deleteMap deletes a map from the view. This has no effect on the model,
     *  and should be called from / via a model, to ensure that the view does not just
     *  decide that "on its own".
     * 
     * @param  {number} index            - index of the map that should be deleted
     * @param  {number} newSelectedIndex - index of the map that is selected after the other one was deleted
     * @memberof MapList
     */
    MapList.prototype.deleteMap = function (index, newSelectedIndex) {
        Log.log("verbose", "deleting map at index: " + index, this);

        let $mapItem = $('.map_item').eq(index);
        $mapItem.remove();

        let that = this;

        setTimeout(function() { // <- insure this happens after DOM is updated
            let $remainingItems = $(".map_item");

            for (let i = 0; i < $remainingItems.length; i++) {
                $remainingItems.eq(i).attr("data-map-index", i);
            }

            that.setSelectedMapIndex(newSelectedIndex);
        }, 1);
    };

    /**
     * setSelectedMapIndex triggers 'onMapSelected', to inform other components
     *  that a map was clicked and should be loaded into the view.
     * @param {number} newSelectedIndex - the map that will be selected
     * @memberof MapList
     */
    MapList.prototype.setSelectedMapIndex = function (newSelectedIndex) {
        let $mapItem = $('.map_item').eq(newSelectedIndex);

        $(this).trigger('onMapSelected', [{
            mapIndex: $mapItem.attr('data-map-index'),
            imgSrc: $mapItem.find('img').attr('src')
        }]);
    };

    /**
     * clear removes all maps from the view.
     * @memberof MapList
     */
    MapList.prototype.clear = function () {
        let $mapItems = $('.map_item');
        $mapItems.remove();
    };

    /**
     * _onMapClicked triggers 'onMapSelected', to inform other components
     *  that a map was clicked and should be loaded into the view.
     * @param  {jQuery} $mapItem - jQuery handle of the map that was clicked.
     * @memberof MapList
     */
    MapList.prototype._onMapClicked = function ($mapItem) {
        $(this).trigger('onMapSelected', [{
            mapIndex: $mapItem.attr('data-map-index'),
            imgSrc: $mapItem.find('img').attr('src')
        }]);
    };

    /**
     * _onMapListResorted is called when the jQuery UI-sortable-callback was used to
     *  change the order of the maps on the path.
     *  Changes the "data-map-index"-attributes of the map elements, and
     *  triggers the 'onMapsResorted'-event, passing along the new positions of the old indices.
     *  @memberof MapList
     */
    MapList.prototype._onMapListResorted = function () {
        let indices = [];
        let $sortedItems = $(".map_item");

        for (let i = 0; i < $sortedItems.length; i++) {
            indices.push(Number($sortedItems.eq(i).attr("data-map-index")));
            $sortedItems.eq(i).attr("data-map-index", i);
        }

        $(this).trigger('onMapsResorted', [indices]);
    };

    /**
     * _setupSortableList makes the map list drag/drop-sortable, using the jQuery UI-sortable
     *  method.
     *  @memberof MapList
     */
    MapList.prototype._setupSortableList = function () {
        let that = this;

        this._$mapListElement.sortable({
            axis: "x",
            delay: 50,
            distance: 10,
            update: function (e, ui) {
                that._onMapListResorted();
            }
        });
        this._$mapListElement.disableSelection();
    };

    /**
     * _setupButtons references the "add map", "remove map" and "submit path"-buttons and
     * sets up their respective click listeners.
     * @memberof MapList
     */
    MapList.prototype._setupButtons = function () {
        let that = this;
        this._$addMapButton.on("click", function(e) {
            that.showAddMapDialog(true);
        });

        this._$removeMapButton.on("click", function(e) {
            that.deleteMapButtonClicked();
        });

        this._$submitPathButton.on("click", function(e) {
            that.submitPathClicked();
        });
    };

    return MapList;
})();
