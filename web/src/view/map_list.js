navigame.MapList = (function () {

    function MapList () {
        this._$contentArea = null;

        this._$mapListElement = null;
        this._$addMappButton = null;

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
    };

    MapList.prototype.showAddMapDialog = function (closeable) {
        if (!closeable && closeable !== false)
            closeable = true;

        let addMapDialog = new navigame.MapSelectionDialog();
        addMapDialog.show(closeable);

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
            that._onMapClicked($(this)); // <-- this is not that in this case :) #JavaScript
        });
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
