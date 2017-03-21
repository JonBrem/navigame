var MarkerControls = (function () {

    let that = null;

    function MarkerControls () {
        this._canvasManager = null;
        this._htmlElement = null;

        this._$controlsWrapper = null;
        this._$newMarkerDroppable = null;

        that = this;
    }

    MarkerControls.prototype.init = function ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Marker controls", this);

        this._canvasManager = canvasManager;
        this._htmlElement = compiledTemplates["marker_controls"]();

        $contentArea.append(this._htmlElement);

        this._$controlsWrapper = $("#controls-section");

        let that = this;

        this._setupControls();

        Log.log("verbose", "Finished Initializing Marker Controls", this);
    };

    MarkerControls.prototype._setupControls = function () {
        this._$newMarkerDroppable = this._$controlsWrapper.find('.new_marker_droppable');
        this._$newMarkerDroppable.draggable({
            appendTo: "body", // <- draggable everywhere (not only in container)
            helper: "clone", // <- don't drag the original element
            cursorAt: { // <- so the "preview" of the marker's position when dragging the object on the canvas is correct
                left: this._$newMarkerDroppable.width() / 2.0,
                top: this._$newMarkerDroppable.height() / 2.0
            }
        });

        let that = this;
        this._$newMarkerDroppable.on("dragstart", function(event, ui) {that._onNewMarkerDragStart(event, ui);});
        this._$newMarkerDroppable.on("dragstop", function(event, ui) {that._onNewMarkerDragStop(event, ui);});
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

    MarkerControls.prototype._createMarkerAtMapPosition = function (position) {
        Log.log("verbose", "Creating marker at canvas position ", JSON.stringify(position), this);

        let adjustedPosition = this._canvasManager.calculatePositionOnMap(position);

        // @todo check if adjustedPosition is within boundaries!!

        let posOnMap = {
            x: adjustedPosition.x - this._canvasManager.canvasWidth() / 2,
            y: adjustedPosition.y - this._canvasManager.canvasHeight() / 2
        };

        let newMarker = new fabric.Text("Marker", {
            left: posOnMap.x,
            top: posOnMap.y,
            fontSize: 14,
            originX: "center",
            originY: "center"
        });

        newMarker.tag = "marker";

        this._canvasManager.addToVisualLayer(newMarker);
    };

    return MarkerControls;
}());

