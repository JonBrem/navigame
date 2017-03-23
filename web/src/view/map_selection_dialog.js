navigame.MapSelectionDialog = (function () {

    function MapSelectionDialog () {
        let _$dialogElement = null;
        let _$areaSelectElement = null;
    }

    MapSelectionDialog.prototype.show = function() {
        let dialogElement = compiledTemplates['map_selection_dialog']();
        $("body").append(dialogElement);

        _$dialogElement = $("#map_selection_modal");
        let revealElement = new Foundation.Reveal(_$dialogElement, {});

        let that = this;
        _$dialogElement.on("closed.zf.reveal", function(e) {that._onDialogClose(e);});
        _$dialogElement.foundation('open');
    };

    MapSelectionDialog.prototype.setAreas = function(areas) {
        areas.sort(function(a, b) {
            return a.name >= b.name;
        });

        $("#map_selection_area_selection").html(compiledTemplates['map_selection_dialog_select_area']({
            data: {
                options: areas
            }
        }));

        _$areaSelectElement = $("#map_selection_area_input");

        let that = this;
        _$areaSelectElement.on('change', function(e) {
            that._onAreaSelected(e);
        });
    };

    MapSelectionDialog.prototype.setAreaLevels = function(areaLevels) {

    };

    MapSelectionDialog.prototype._onAreaSelected = function(e) {
        let option = _$areaSelectElement.find('option:selected');
        if (option != null) {
            if(option.val() != "default") {
                $(this).trigger("onAreaSelected", [option.val()]);
            }
        }
    };

    MapSelectionDialog.prototype._onDialogClose = function(e) {
        if (_$dialogElement != null) {
            _$dialogElement.remove();
            _$dialogElement = null;
        }
    };

    return MapSelectionDialog;
})();
