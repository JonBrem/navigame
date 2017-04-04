navigame.MapSelectionDialog = (function () {
    
    /**
     * MapSelectionDialog constructor.
     * @constructor
     * @global
     * @class
     * @classdesc The map selection dialog shows a list of possible areas and then
     *  levels on these areas, from which the user can choose one to create a new
     *  sub-path (navigame.MapPath) on the overall path from the start to the destination.
     */
    function MapSelectionDialog () {
        let _$dialogElement = null;
        let _$areaSelectElement = null;
    }

    /**
     * show shows the dialog. This will also create the dialog.
     * @param  {boolean} closeable - whether it is possible to close this dialog. Default: true.
     * @param  {boolean} showPathPoints - whether the start and goal points of the path should be shown
     * @param  {object} start - object in a {roomid: x, area: y}-type format
     * @param  {object} goal  - object in a {roomid: x, area: y}-type format
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype.show = function(closeable, showPathPoints, start, goal) {
        let data = this._getData(closeable, showPathPoints, start, goal);

        let dialogElement = compiledTemplates['map_selection_dialog']({data: data});
        $("body").append(dialogElement);

        this._$dialogElement = $("#map_selection_modal");
        let revealElement = new Foundation.Reveal(this._$dialogElement, {
            "closeOnClick": closeable,
            "closeOnEsc": closeable
        });

        this._$dialogElement.foundation('open');

        // listeners
        let that = this;        
        this._$dialogElement.on("closed.zf.reveal", function (e) {that._onDialogClose(e);});
        $("#map_selection_confirm").on("click", function (e) {that._onMapSelected(e);});
    };

    /**
     * setAreas shows a dropdown of a list of possible map areas in the dialog.
     * @param {array} areas - array of {name: x, filename: y}-type objects
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype.setAreas = function (areas) {
        // sort areas alphabetically
        areas.sort(function(a, b) { return a.name >= b.name; });

        $("#map_selection_area_selection").html(compiledTemplates['map_selection_dialog_select_area']({
            data: { options: areas } }));

        this._$areaSelectElement = $("#map_selection_area_input");

        let that = this;
        this._$areaSelectElement.on('change', function(e) { that._onAreaSelected(e); });
    };

    /**
     * setAreaLevels shows a list of levels / storeys on the dialog, with previews of the
     *  respective maps for these levels.
     * @param {array} areaLevels - array of {level_id: x, image_path: y, storey: z}-type objects
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype.setAreaLevels = function (areaLevels) {
        areaLevels.sort(function(a, b) { return a.storey >= b.storey; });

        $("#map_selection_level_selection").html(compiledTemplates['map_selection_dialog_select_level']({
            data: { options: areaLevels } }));

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

    /**
     * closeDialog closes the dialog.
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype.closeDialog = function () {
        this._$dialogElement.foundation('close');
    };

    /**
     * _onAreaSelected is called when the selected option in the dropdown changes.
     *  It triggers the 'onAreaSelected'-event.
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype._onAreaSelected = function (e) {
        let option = this._$areaSelectElement.find('option:selected');
        if (option != null) {
            if(option.val() != "default") {
                $(this).trigger("onAreaSelected", [option.val()]);
            }
        }
    };

    /**
     * _onMapSelected is called when a specific map has been selected and should be added
     *  to the path.
     *  It triggers the 'storeySelected'-event.
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype._onMapSelected = function (e) {
        try {
            let $activeTabLink = $("#map_selection_levels_vert_tabs").find(".is-active").find('a');
            $(this).trigger('storeySelected', [$activeTabLink.attr("data-level-id"), $activeTabLink.attr('data-img-src')]);
        } catch (e) {
            console.log(e);
        }
    };

    /**
     * _onDialogClose is called when the dialog is closed (by pressing Esc, clicking the 'x'
     *  or clicking outside the dialog) and will remove the HTML element.
     * @param  {event} e - dialog close event
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype._onDialogClose = function (e) {
        if (this._$dialogElement != null) {
            this._$dialogElement.remove();
            this._$dialogElement = null;
        }
    };

    /**
     * _getData builds the object from which the lodash template will read the data.
     * @param  {boolean} closeable - whether the dialog can be cloased
     * @param  {boolean} showPathPoints - whether the start and goal points of the path should be shown
     * @param  {object} start - object in a {roomid: x, area: y}-type format
     * @param  {object} goal  - object in a {roomid: x, area: y}-type format
     * @return {object} object with the params in the right format for the lodash template.
     * @memberof MapSelectionDialog
     */
    MapSelectionDialog.prototype._getData = function (closeable, showPathPoints, start, goal) {
        let data = {};

        if (closeable || (!closeable && closeable !== false))
            data.closeable = true;
        else
            data.closeable = false;

        if (showPathPoints) {
            data.showPathPoints = true;
            data.start = start;
            data.goal = goal;
        }

        return data;
    };

    return MapSelectionDialog;
})();
