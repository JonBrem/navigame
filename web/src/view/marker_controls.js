/**
 * [MarkerControls handle adding, moving, deleting, and modifying the data of markers.
 *  They have their own area in the GUI (that edge controls also use).]
 */
navigame.MarkerControls = (function () {

    /**
     * [MarkerControls constructor. Creates the controls area &
     *  references buttons etc.]
     */
    function MarkerControls ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Marker controls", this);

        this._canvasManager = canvasManager;
        $contentArea.append(compiledTemplates["marker_controls"]());

        this._$controlsWrapper = $("#controls-section");

        this._$markerManipulationArea = $("#marker_fill_rest");

        this._$markerEditButton = this._$markerManipulationArea.find(".marker-edit-button");
        this._$markerDeleteButton = this._$markerManipulationArea.find(".marker-delete-button");

        // these will be set on the fly or in "_setupControls":
        this._$newMarkerDroppable = null;

        this._markerClicked = false;
        this._markerMoving = false;
        this._clickedMarker = null;
        this._manipulationStart = null;

        this._highlightedMarker = null;
        this._hightlightedRoute = null;

        this._markerSize = 12;
        this._highlightedMarkerSize = 15;

        this._setupDragDropControls();

        Log.log("verbose", "Finished Initializing Marker Controls", this);
    }

    /**
     * [_createMarkerAtCanvasPosition creates a new marker at the position, which is given
     *  in canvas coordinates.]
     * @param  {[object]} position [object with x, y keys. will be transformed to map coordinates
     *                              (but the object will not be mutated.)]
     */
    MarkerControls.prototype._createMarkerAtCanvasPosition = function (position) {
        Log.log("verbose", "Creating marker at canvas position ", JSON.stringify(position), this);

        let adjustedPosition = this._canvasManager.calculatePositionOnMap(position);

        // @todo check if adjustedPosition is within boundaries!!

        let posOnMap = {
            x: adjustedPosition.x - this._canvasManager.canvasWidth() / 2,
            y: adjustedPosition.y - this._canvasManager.canvasHeight() / 2
        };

        let newMarker = this._setupNewMarker(posOnMap);

        newMarker.additionalData = {
            timeCreated: + new Date() // shorthand for: new Date().getTime()
        };

        $(this).trigger("markerCreated", [newMarker, this._hightlightedRoute]);
        this._canvasManager.addToVisualLayer(newMarker);
    };

    /**
     * [loadMarker loads a marker from a logical representation of a marker/node.]
     * @param  {[object]} savedMarker [navigame.PathNode or JSON with same fields.]
     */
    MarkerControls.prototype.loadMarker = function (savedMarker) {
        Log.log("verbose", "loading marker ", JSON.stringify(savedMarker), this);

        let position = {
            x: this._canvasManager.toImageCoord(savedMarker.xPos, true),
            y: this._canvasManager.toImageCoord(savedMarker.yPos, false)
        };

        let newMarker = this._setupNewMarker(position);

        newMarker.additionalData = savedMarker.nodeData;
        this._canvasManager.addToVisualLayer(newMarker);
    };

    /**
     * [addMarkerData adds data to the marker, overriding data that has the same keys.]
     * @param {[number]} creationTime [creation time of the marker, so the view representation can be identified.]
     * @param {[object]} toAdd        [keys in this object will be created and their values will be
     *                                 stored under the same keys in the marker's additional data;
     *                                 if the keys already exist, the old values will be overridden.]
     */
    MarkerControls.prototype.addMarkerData = function (creationTime, toAdd) {
        let marker = this._canvasManager.getMarkerByCreationTime(creationTime);

        if (marker != null) {
            for (let key in toAdd) {
                marker.additionalData[key] = toAdd[key];
            }
        }
    };

    /**
     * [onMarkerMouseOver highlights the marker (by making it somewhat bigger).]
     * @param  {[fabric.Object]} marker [which marker to highlight]
     */
    MarkerControls.prototype.onMarkerMouseOver = function (marker) {
        if (this._highlightedMarker != null && this._highlightedMarker != marker) {
            this.onOtherMouseOver();
        }

        this._highlightedMarker = marker;

        this._highlightedMarker.set({
            width: this._highlightedMarkerSize,
            height: this._highlightedMarkerSize
        });

        this._canvasManager.updateMarker(this._highlightedMarker);

        this._hightlightedRoute = null;
    };

    /**
     * [onMarkerClicked sets the click callbacks for the "marker manipulation buttons" so
     *  they will affect this marker.]
     * @param  {[fabric.Object]} marker   [which marker was clicked]
     * @param  {[object]} position [position of the click. necessary bugfix to enable dragging on
     *                              mobile / touch-based systems.]
     */
    MarkerControls.prototype.onMarkerClicked = function (marker, position) {
        let that = this;

        this._$markerEditButton.unbind('click');
        this._$markerDeleteButton.unbind('click');
        
        this._$markerEditButton.on('click', function(e) {that._startEditingMarker(marker)});
        this._$markerEditButton.removeClass('disabled');
        this._$markerDeleteButton.on('click', function(e) {that._deleteMarker(marker)});
        this._$markerDeleteButton.removeClass('disabled');


        this._markerClicked = true;
        this._clickedMarker = marker;
        this._markerMoving = false;

        this._manipulationStart = {x: position.x, y: position.y};
    };

    /**
     * [onOtherMouseOver must be called when the mouse cursor hits nothing or hits
     *  an edge. if a marker was highlighted, that is re-set.]
     * @param  {[fabric.Object]} what [null, if the other is not on an edge; that edge, if it is.]
     */
    MarkerControls.prototype.onOtherMouseOver = function (what) {
        if (this._highlightedMarker != null) {
            this._highlightedMarker.set({
                width: this._markerSize,
                height: this._markerSize
            });

            this._canvasManager.updateMarker(this._highlightedMarker);

            this._highlightedMarker = null;
        }

        if (what != null && 'tag' in what && what.tag == 'route') {
            this._hightlightedRoute = what;
        } else {
            this._hightlightedRoute = null;
        }
    };

    /**
     * [onOtherClicked should be called if there was a click event that did not hit a marker.
     *  removes the click listeners on the manipulation buttons if "what" is null.]
     * @param  {[fabric.Object]} what [null, if nothing was clicked; the clicked object, otherwise.]
     */
    MarkerControls.prototype.onOtherClicked = function (what) {
        let that = this;
        this._markerClicked = false;
        this._markerMoving = false;

        if (!what) { // <- this means "what" is not set, i.e. the click went nowhere!
            this._$markerEditButton.unbind('click');
            this._$markerDeleteButton.unbind('click');
            this._$markerEditButton.addClass('disabled');
        }

        this._$markerDeleteButton.addClass('disabled');
    };

    /**
     * [onMouseUp should be called when the user stops pressing a mouse key, so dragging
     *  markers around stops (if it was active).]
     */
    MarkerControls.prototype.onMouseUp = function () {
        this._markerClicked = false;
        this._markerMoving = false;
    };

    /**
     * [onCanvasMouseMove moves a marker, if one is currently being dragged.
     *  the position does not have to be absolute, but the changes have to be relative to the
     *  previous position. Will trigger the 'markerMoved' event, if it did actually change
     *  a marker's position, which in turn _should_ move the attached edges.]
     * @param  {[object]} position [object with keys 'x' and 'y']
     */
    MarkerControls.prototype.onCanvasMouseMove = function (position) {
        if (this._markerClicked && !(this._manipulationStart.x == position.x &&
                this._manipulationStart.y == position.y)) {
            this._markerMoving = true;
            let scale = this._canvasManager.getViewportScale();
            this._canvasManager.moveBy(
             {
                x: (position.x - this._manipulationStart.x) * scale,
                y: (position.y - this._manipulationStart.y) * scale
             }, this._clickedMarker);

            $(this).trigger('markerMoved', [this._clickedMarker, this._clickedMarker.additionalData.markerIndex]);

        } else {
            this._markerMoving = false;
        }

        this._manipulationStart = {x: position.x, y: position.y};
    };

    /**
     * [_startEditingMarker shows the "edit marker"-dialog and registers callbacks to it.]
     * @param  {[fabric.Object]} marker [which marker is affected by the dialog.]
     */
    MarkerControls.prototype._startEditingMarker = function (marker) {
        let dataDialog = new navigame.AdditionalDataDialog();
        dataDialog.show("Marker", marker);
        let that = this;
        $(dataDialog).on('okSelected', function(e, markerTime, markerIndex, markerData) {
            that._setMarkerData(marker, markerTime, markerIndex, markerData);
            dataDialog.closeDialog();
        });
    };

    /**
     * [_setMarkerData sets the marker's additionalData to markerData,
     *  with markerTime and markerIndex being set separately, so these are ensured to be there.
     *  Will trigger 'markerDataChanged'.]
     * @param {[fabric.Object]} marker      [visual representation of the marker whose data changed.]
     * @param {[number]} markerTime  [timestamp of the marker]
     * @param {[number]} markerIndex [marker index, so the logical representations knows which one was edited.]
     * @param {[object]} markerData  [the "additional data", other than timeCreated and markerIndex]
     */
    MarkerControls.prototype._setMarkerData = function (marker, markerTime, markerIndex, markerData) {
        marker.additionalData = markerData;
        marker.additionalData["timeCreated"] = markerTime;
        marker.additionalData["markerIndex"] = markerIndex;

        $(this).trigger('markerDataChanged', [marker.additionalData.markerIndex, marker.additionalData]);
    };

    /**
     * [_deleteMarker removes the marker from the view, and triggers the 'markerDeleted' event to inform
     *  other components that should know about that.]
     * @param  {[fabric.Object]} marker [which marker should be removed.]
     */
    MarkerControls.prototype._deleteMarker = function (marker) {
        this._$markerEditButton.unbind('click');
        this._$markerEditButton.addClass('disabled');
        this._$markerDeleteButton.unbind('click');
        this._$markerDeleteButton.addClass('disabled');

        $(this).trigger('markerDeleted', [marker.additionalData.markerIndex]);
        
        this._canvasManager.removeFromVisualLayer(marker);
    };

    /**
     * [_setupDragDropControls adds the drag & drop functionality to the "create marker"-GUI element,
     *  using jQuery UI]
     */
    MarkerControls.prototype._setupDragDropControls = function () {
        this._$newMarkerDroppable = this._$controlsWrapper.find('.new_marker_droppable');
        this._$newMarkerDroppable.draggable({
            appendTo: "body", // <- draggable everywhere (not only in container)
            helper: "clone", // <- don't drag the original element
            cursorAt: { // <- so the "preview" of the marker's position when dragging the object on the canvas is correct
                left: this._$newMarkerDroppable.width() / 15, // <- trial&error
                top: this._$newMarkerDroppable.height() * 1.1
            }
        });

        let that = this;
        this._$newMarkerDroppable.on("dragstop", function(event, ui) {that._onNewMarkerDragStop(event, ui);});
    };

    /**
     * [_onNewMarkerDragStop called when the "new marker"-draggable is dropped.
     *  if the marker was dropped on the canvas, this will lead to the creation of a new marker.]
     * @param  {[event]} event [event containing the location, etc., of this event.]
     * @param  {[jQuery UI handle]} ui    [jQuery UI handle]
     */
    MarkerControls.prototype._onNewMarkerDragStop = function (event, ui) {
        Log.log("verbose", "on new marker drag stop", this);

        let coords = {x: event.pageX, y: event.pageY};
        let $canvas = $(this._canvasManager.canvasElement());

        let relX = coords.x - $canvas.offset().left;
        let relY = coords.y - $canvas.offset().top;

        if (relX >= 0 && relX <= $canvas.width() &&
            relY >= 0 && relY <= $canvas.height()) {
            this._createMarkerAtCanvasPosition({x: relX, y: relY});
        }
    };

    /**
     * [_setupNewMarker instantiates a new fabric.Image, which will represent the marker
     *  if added to the visual layer of a navigame.CanvasManager]
     * @param  {[object]} posOnMap [object with x and y keys]
     * @return {[fabric.Image]}          [the new marker object (not visible until it is added to a fabric canvas!)]
     */
    MarkerControls.prototype._setupNewMarker = function (posOnMap) {
        let newMarker = new fabric.Image(document.getElementById('marker_droppable_img'), {
            left: posOnMap.x,
            top: posOnMap.y,
            originX: "center",
            originY: "center",
            width: this._markerSize,
            height: this._markerSize
        });

        newMarker.tag = "marker";

        return newMarker;
    }

    return MarkerControls;
}());

