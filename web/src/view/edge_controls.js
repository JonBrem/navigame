navigame.EdgeControls = (function () {

    let that = null;

    function EdgeControls () {
        this._canvasManager = null;
        this._htmlElement = null;

        this._$mapControlsDiv = null;
        this._$controlsWrapper = null;
        this._$newEdgeDroppable = null;

        this._$edgeManipulationArea = null;

        this._$edgeEditButton = null;

        this._edgeClicked = false;
        this._edgeMoving = false;
        this._clickedEdge = null;
        this._manipulationStart = null;

        that = this;
    }

    EdgeControls.prototype.init = function ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Edge controls", this);

        this._canvasManager = canvasManager;

        this._$controlsWrapper = $("#controls-section");
        this._$mapControlsDiv = $("#map_controls_inv_layer");

        this._$edgeManipulationArea = $("#marker_fill_rest");

        let that = this;

        this._setupMapEdgeControls();

        Log.log("verbose", "Finished Initializing Edge Controls", this);
    };

    EdgeControls.prototype._setupMapEdgeControls = function () {
        let that = this;

        this._$mapControlsDiv.on("mousedown", function(e) {that._onMapMouseDown(e);});
        $("body").on("mousemove", function(e) {that._onMapMouseMove(e);});
        $("body").on("mouseup", function(e) {that._onMapMouseUp(e);});
    };

    EdgeControls.prototype.createEdgeAtMapPosition = function (markerTime1, markerTime2, data) {
        Log.log("verbose", "Creating Edge at markers ", JSON.stringify(markerTime1), JSON.stringify(markerTime2), this);

        let markerStart = this._canvasManager.getMarkerByCreationTime(markerTime1);
        let markerEnd = this._canvasManager.getMarkerByCreationTime(markerTime2);

        console.log(markerStart, markerEnd);

        // @todo check if adjustedPosition is within boundaries!!

        let posOnMapStart = {
            x: markerStart.left + 0,
            y: markerStart.top + 0
        };
        let posOnMapEnd = {
            x: markerEnd.left + 0,
            y: markerEnd.top + 0
        };

        let points = [posOnMapStart.x, posOnMapStart.y, posOnMapEnd.x, posOnMapEnd.y];

        let newEdge = new fabric.Line(points, {
            strokeWidth: 10,
            fill: 'red',
            stroke: 'red',
            originX: "center",
            originY: "center"
        });

        newEdge.tag = "edge";

        newEdge.additionalData = data;
        this._canvasManager.addToVisualLayer(newEdge);
        this._canvasManager.fixEdgeRotation(newEdge);
    };

    EdgeControls.prototype._onEdgeSelected = function (edge) {
        /*this._$edgeManipulationArea.html(compiledTemplates["edge_selected_detail"]());

        this._$edgeEditButton = this._$edgeManipulationArea.find(".edge-edit-button");
        this._$edgeDeleteButton = this._$edgeManipulationArea.find(".edge-delete-button");

        let that = this;
        this._$edgeEditButton.on('click', function(e) {that._startEditingedge(edge)}); */
    };

    EdgeControls.prototype._startEditingEdge = function (edge) {
    };

    EdgeControls.prototype._onMapMouseDown = function (e) {
        let positionOnMap = this._canvasManager.calculatePositionOnMap({x: e.offsetX, y: e.offsetY});

        if (this._canvasManager.isClickOnRoute(positionOnMap)) {
            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        
            this._edgeClicked = true;
          //  this._clickedEdge = this._canvasManager.getClickedMarker(positionOnMap);
            this._edgeMoving = false;
        
        } else {
            this._edgeClicked = false;
            this._edgeMoving = false;

            if (!this._canvasManager.isClickOnMarker(positionOnMap)) {
                this._$edgeManipulationArea.html('');
            }
        }
    };

    EdgeControls.prototype._onMapMouseMove = function (e) {
        if (this._edgeClicked && !(this._manipulationStart.x == e.offsetX &&
            this._manipulationStart.y == e.offsetY)) {
            this._edgeMoving = true;
            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        } else {
            this._edgeMoving = false;
        }
    };

    EdgeControls.prototype._onMapMouseUp = function (e) {
        if (this._edgeMoving) {
            // re-positioned
        } else if (this._edgeClicked) {
            // manipulate edge
            this._onEdgeSelected(this._clickedEdge);
        }

        this._edgeClicked = false;
        this._edgeMoving = false;
    };

    return EdgeControls;
}());

