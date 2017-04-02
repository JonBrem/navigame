navigame.MarkerControls = (function () {

    let that = null;

    function MarkerControls () {
        this._canvasManager = null;
        this._htmlElement = null;

        this._$controlsWrapper = null;
        this._$newMarkerDroppable = null;

        this._$markerManipulationArea = null;

        this._$markerEditButton = null;
        this._$markerDeleteButton = null;

        this._markerClicked = false;
        this._markerMoving = false;
        this._clickedMarker = null;
        this._manipulationStart = null;

        this._highlightedMarker = null;
        this._hightlightedRoute = null;

        that = this;
    }

    MarkerControls.prototype.init = function ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Marker controls", this);

        this._canvasManager = canvasManager;
        this._htmlElement = compiledTemplates["marker_controls"]();

        $contentArea.append(this._htmlElement);

        this._$controlsWrapper = $("#controls-section");

        this._$markerManipulationArea = $("#marker_fill_rest");
        this._$markerEditButton = this._$markerManipulationArea.find(".marker-edit-button");
        this._$markerDeleteButton = this._$markerManipulationArea.find(".marker-delete-button");

        let that = this;

        this._setupControls();
        this._setupMapMarkerControls();

        Log.log("verbose", "Finished Initializing Marker Controls", this);
    };

    MarkerControls.prototype._setupControls = function () {
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
        this._$newMarkerDroppable.on("dragstart", function(event, ui) {that._onNewMarkerDragStart(event, ui);});
        this._$newMarkerDroppable.on("dragstop", function(event, ui) {that._onNewMarkerDragStop(event, ui);});
    };

    MarkerControls.prototype._setupMapMarkerControls = function () {
        let that = this;

        // $("body").on("mouseup", function(e) {that._onMapMouseUp(e);});
    };

    MarkerControls.prototype._onNewMarkerDragStart = function (event, ui) {
        Log.log("verbose", "on new marker drag start", this);
    };

    MarkerControls.prototype._onNewMarkerDragStop = function (event, ui) {
        Log.log("verbose", "on new marker drag stop", this);

        let coords = {x: event.pageX, y: event.pageY};
        let $canvas = $(this._canvasManager.canvasElement());

        let relX = coords.x - $canvas.offset().left;
        let relY = coords.y - $canvas.offset().top;

        if (relX >= 0 && relX <= $canvas.width() &&
            relY >= 0 && relY <= $canvas.height()) {
            this._createMarkerAtMapPosition({x: relX, y: relY});
        }
    };

    MarkerControls.prototype.loadMarker = function (savedMarker) {
        Log.log("verbose", "loading marker ", JSON.stringify(savedMarker), this);

        let position = {
            x: savedMarker.xPos,
            y: savedMarker.yPos
        };

        // let adjustedPosition = this._canvasManager.calculatePositionOnMap(position);

        // // @todo check if adjustedPosition is within boundaries!!

        // let posOnMap = {
        //     x: adjustedPosition.x + this._canvasManager.canvasWidth() / 2,
        //     y: adjustedPosition.y + this._canvasManager.canvasHeight() / 2
        // };

        let newMarker = new fabric.Image(document.getElementById('marker_droppable_img'), {
            left: position.x,
            top: position.y,
            originX: "center",
            originY: "center",
            width: 12,
            height: 12
        });

        newMarker.tag = "marker";

        newMarker.additionalData = savedMarker.nodeData;
        this._canvasManager.addToVisualLayer(newMarker);
    };

    MarkerControls.prototype.onMarkerMouseOver = function (marker) {
        if (this._highlightedMarker != null && this._highlightedMarker != marker) {
            this.onOtherMouseOver();
        }

        this._highlightedMarker = marker;

        this._highlightedMarker.set({
            width: 15,
            height: 15
        });

        this._canvasManager.updateMarker(this._highlightedMarker);

        this._hightlightedRoute = null;
    };

    MarkerControls.prototype.onMarkerClicked = function (marker) {
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
    };

    MarkerControls.prototype.onOtherMouseOver = function (what) {
        if (this._highlightedMarker != null) {
            this._highlightedMarker.set({
                width: 12,
                height: 12
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

    MarkerControls.prototype.onMouseUp = function () {
        this._markerClicked = false;
        this._markerMoving = false;
    };

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

    MarkerControls.prototype.addMarkerData = function (creationTime, toAdd) {
        let marker = this._canvasManager.getMarkerByCreationTime(creationTime);

        if (marker != null) {
            for (let key in toAdd) {
                marker.additionalData[key] = toAdd[key];
            }
        }
    };

    MarkerControls.prototype._createMarkerAtMapPosition = function (position) {
        Log.log("verbose", "Creating marker at canvas position ", JSON.stringify(position), this);

        let adjustedPosition = this._canvasManager.calculatePositionOnMap(position);

        // @todo check if adjustedPosition is within boundaries!!

        let posOnMap = {
            x: adjustedPosition.x - this._canvasManager.canvasWidth() / 2,
            y: adjustedPosition.y - this._canvasManager.canvasHeight() / 2
        };

        let newMarker = new fabric.Image(document.getElementById('marker_droppable_img'), {
            left: posOnMap.x,
            top: posOnMap.y,
            originX: "center",
            originY: "center",
            width: 12,
            height: 12
        });

        newMarker.tag = "marker";

        newMarker.additionalData = {
            timeCreated: + new Date() // shorthand for: new Date().getTime()
        };

        $(this).trigger("markerCreated", [newMarker, this._hightlightedRoute]);
        this._canvasManager.addToVisualLayer(newMarker);
    };

    MarkerControls.prototype._startEditingMarker = function (marker) {
        let dataDialog = new navigame.AdditionalDataDialog();
        dataDialog.show("Marker", marker);
        let that = this;
        $(dataDialog).on('okSelected', function(e, markerTime, markerData) {
            that._setMarkerData(marker, markerTime, markerData);
            dataDialog.closeDialog();
        });
    };

    MarkerControls.prototype._setMarkerData = function (marker, markerTime, markerData) {
        marker.additionalData = markerData;
        marker.additionalData["timeCreated"] = markerTime;

        $(this).trigger('markerDataChanged', [marker.additionalData.markerIndex, marker.additionalData]);
    };

    MarkerControls.prototype._deleteMarker = function (marker) {
        this._$markerEditButton.unbind('click');
        this._$markerEditButton.addClass('disabled');
        this._$markerDeleteButton.unbind('click');
        this._$markerDeleteButton.addClass('disabled');

        $(this).trigger('markerDeleted', [marker.additionalData.markerIndex]);
        
        this._canvasManager.removeFromVisualLayer(marker);
    };

    return MarkerControls;
}());

