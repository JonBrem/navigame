navigame.MapList = (function () {

    function MapList () {
        this._$contentArea = null;

        this._$mapListElement = null;
        this._$addMappButton = null;
        this._$removeMapButton = null;
        this._$submitPathButton = null;

        this.mapSelectionHandler = null;
    }

    MapList.prototype.init = function ($contentArea) {
        this._$contentArea = $contentArea;
        this._$contentArea.append(compiledTemplates['map_list']());

        let that = this;

        this._$mapListElement = $("#map_list");
        this._$mapListElement.sortable({
            axis: "x",
            delay: 50,
            distance: 10,
            update: function (e, ui) {
                that._onMapListResorted();
            }
        });
        this._$mapListElement.disableSelection();

        this._$addMapButton = $("#add_map_button");
        this._$addMapButton.on("click", function(e) {
            that.showAddMapDialog(true);
        });

        this._$removeMapButton = $("#remove_map_button");
        this._$removeMapButton.on("click", function(e) {
            that.deleteMapButtonClicked();
        });

        this._$submitPathButton = $("#submit_path_button");
        this._$submitPathButton.on("click", function(e) {
            that.submitPathClicked();
        });
    };

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

    MapList.prototype.deleteMapButtonClicked = function () {
        $(this).trigger('requestDeleteMap'); // <- because the view can't just delete things!
    };

    MapList.prototype.submitPathClicked = function () {
        $(this).trigger("requestSubmitPath");
    };

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

    MapList.prototype.setSelectedMapIndex = function (newSelectedIndex) {
        let $mapItem = $('.map_item').eq(newSelectedIndex);

        $(this).trigger('onMapSelected', [{
            mapIndex: $mapItem.attr('data-map-index'),
            imgSrc: $mapItem.find('img').attr('src')
        }]);
    };

    MapList.prototype.clear = function () {
        let $mapItems = $('.map_item');
        $mapItems.remove();
    };

    MapList.prototype._onMapClicked = function ($mapItem) {
        $(this).trigger('onMapSelected', [{
            mapIndex: $mapItem.attr('data-map-index'),
            imgSrc: $mapItem.find('img').attr('src')
        }]);
    };

    MapList.prototype._onMapListResorted = function () {
        let indices = [];
        let $sortedItems = $(".map_item");

        for (let i = 0; i < $sortedItems.length; i++) {
            indices.push(Number($sortedItems.eq(i).attr("data-map-index")));
            $sortedItems.eq(i).attr("data-map-index", i);
        }

        $(this).trigger('onMapsResorted', [indices]);
    };

    return MapList;
})();
