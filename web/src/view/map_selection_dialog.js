navigame.MapSelectionDialog = (function () {

    function MapSelectionDialog () {
        let _$dialogElement = null;
        let _$areaSelectElement = null;
    }

    MapSelectionDialog.prototype.show = function() {
        let dialogElement = compiledTemplates['map_selection_dialog']();
        $("body").append(dialogElement);

        this._$dialogElement = $("#map_selection_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement, {});

        let that = this;
        this._$dialogElement.on("closed.zf.reveal", function(e) {that._onDialogClose(e);});
        this._$dialogElement.foundation('open');

        $("#map_selection_confirm").on("click", function(e) {that._onMapSelected(e);});
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

        this._$areaSelectElement = $("#map_selection_area_input");

        let that = this;
        this._$areaSelectElement.on('change', function(e) {
            that._onAreaSelected(e);
        });
    };

    MapSelectionDialog.prototype.setAreaLevels = function(areaLevels) {
        areaLevels.sort(function(a, b) {
            return a.storey >= b.storey;
        });

        $("#map_selection_level_selection").html(compiledTemplates['map_selection_dialog_select_level']({
            data: {
                options: areaLevels
            }
        }));

        // bugfix for foundation; something is broken when this is initialized after page load
        new Foundation.Tabs($("#map_selection_level_selection"), {});
        $("#map_selection_level_selection").on("change.zf.tabs", function(e) {
            try {
                let $activeTab = $("#map_selection_levels_vert_tabs").find(".is-active");
                let $contentArea = $($activeTab.find('a').attr('href'));
                setTimeout(function() {
                    $contentArea.attr("aria-hidden", false);
                }, 1);
            } catch (e) {
                console.log(e);
            }
        });

        $("#map_selection_confirm").parent().css("display", "block");
    };

    MapSelectionDialog.prototype.closeDialog = function() {
        this._$dialogElement.foundation('close');
    };

    MapSelectionDialog.prototype._onAreaSelected = function(e) {
        let option = this._$areaSelectElement.find('option:selected');
        if (option != null) {
            if(option.val() != "default") {
                $(this).trigger("onAreaSelected", [option.val()]);
            }
        }
    };

    MapSelectionDialog.prototype._onMapSelected = function(e) {
        try {
            let $activeTabLink = $("#map_selection_levels_vert_tabs").find(".is-active").find('a');
            $(this).trigger('storeySelectd', [$activeTabLink.attr("data-level-id"), $activeTabLink.attr('data-img-src')]);
        } catch (e) {
            console.log(e);
        }
    };

    MapSelectionDialog.prototype._onDialogClose = function(e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    return MapSelectionDialog;
})();
