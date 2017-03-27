navigame.MarkerControls = (function () {

    let that = null;

    function MarkerControls () {
        this._canvasManager = null;
        this._htmlElement = null;

        this._$mapControlsDiv = null;
        this._$controlsWrapper = null;
        this._$newMarkerDroppable = null;

        this._$markerManipulationArea = null;

        this._$markerEditButton = null;
        this._$markerDeleteButton = null;

        this._markerClicked = false;
        this._markerMoving = false;
        this._clickedMarker = null;
        this._manipulationStart = null;

        that = this;
    }

    MarkerControls.prototype.init = function ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Marker controls", this);

        this._canvasManager = canvasManager;
        this._htmlElement = compiledTemplates["marker_controls"]();

        $contentArea.append(this._htmlElement);

        this._$controlsWrapper = $("#controls-section");
        this._$mapControlsDiv = $("#map_controls_inv_layer");

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
                left: this._$newMarkerDroppable.width() / 10, // <- trial&error
                top: this._$newMarkerDroppable.height() * 1.1
            }
        });

        let that = this;
        this._$newMarkerDroppable.on("dragstart", function(event, ui) {that._onNewMarkerDragStart(event, ui);});
        this._$newMarkerDroppable.on("dragstop", function(event, ui) {that._onNewMarkerDragStop(event, ui);});
    };

    MarkerControls.prototype._setupMapMarkerControls = function () {
        let that = this;

        this._$mapControlsDiv.on("mousedown", function(e) {that._onMapMouseDown(e);});
        this._$mapControlsDiv.on("mousemove", function(e) {that._onMapMouseMove(e);});
        $("body").on("mouseup", function(e) {that._onMapMouseUp(e);});
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

        $(this).trigger("markerCreated", [newMarker]);
        this._canvasManager.addToVisualLayer(newMarker);
    };

    MarkerControls.prototype._onMarkerSelected = function (marker) {
        let that = this;
        this._$markerEditButton.on('click', function(e) {that._startEditingMarker(marker)});
        this._$markerEditButton.removeClass('disabled');
        this._$markerDeleteButton.on('click', function(e) {that._deleteMarker(marker)});
        this._$markerDeleteButton.removeClass('disabled');
    };

    MarkerControls.prototype._startEditingMarker = function (marker) {

    };

    MarkerControls.prototype._deleteMarker = function (marker) {
        this._$markerEditButton.unbind('click');
        this._$markerEditButton.addClass('disabled');
        this._$markerDeleteButton.unbind('click');
        this._$markerDeleteButton.addClass('disabled');

        $(this).trigger('markerDeleted', [this._canvasManager.getMarkerIndex(this._clickedMarker)]);
        
        this._canvasManager.removeFromVisualLayer(marker);
    };

    MarkerControls.prototype._onMapMouseDown = function (e) {
        let positionOnMap = this._canvasManager.calculatePositionOnMap({x: e.offsetX, y: e.offsetY});

        if (this._canvasManager.isClickOnMarker(positionOnMap)) {
            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        
            this._markerClicked = true;
            this._clickedMarker = this._canvasManager.getClickedMarker(positionOnMap);
            this._markerMoving = false;
        
        } else {
            this._markerClicked = false;
            this._markerMoving = false;

            if (!this._canvasManager.isClickOnRoute(positionOnMap, e)) {
                this._$markerEditButton.unbind('click');
                this._$markerEditButton.addClass('disabled');
                this._$markerDeleteButton.unbind('click');
                this._$markerDeleteButton.addClass('disabled');
            }
        }
    };

    MarkerControls.prototype._onMapMouseMove = function (e) {
        if (this._markerClicked && !(this._manipulationStart.x == e.offsetX &&
            this._manipulationStart.y == e.offsetY)) {
            this._markerMoving = true;

            let scale = this._canvasManager.getViewportScale();

            this._canvasManager.moveBy(
             {
                x: (e.offsetX - this._manipulationStart.x) * scale,
                y: (e.offsetY - this._manipulationStart.y) * scale
             }, this._clickedMarker);

            $(this).trigger('markerMoved', [this._clickedMarker, this._canvasManager.getMarkerIndex(this._clickedMarker)]);

            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        } else {
            this._markerMoving = false;
        }
    };

    MarkerControls.prototype._onMapMouseUp = function (e) {
        if (this._markerMoving) {
            // re-positioned
        } else if (this._markerClicked) {
            // manipulate marker
            this._onMarkerSelected(this._clickedMarker);
        }

        this._markerClicked = false;
        this._markerMoving = false;
    };

    return MarkerControls;
}());

