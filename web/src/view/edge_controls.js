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

        this._edgesOnDisplay = [];

        that = this;
    }

    EdgeControls.prototype.init = function ($contentArea, canvasManager) {
        Log.log("verbose", "Initializing Edge controls", this);

        let that = this;
        this._canvasManager = canvasManager;
        $(this._canvasManager).on('clearCanvas', function(e) {
            that._edgesOnDisplay = [];
        });

        this._$controlsWrapper = $("#controls-section");
        this._$mapControlsDiv = $("#map_controls_inv_layer");

        this._$edgeManipulationArea = $("#marker_fill_rest");
        this._$edgeEditButton = this._$edgeManipulationArea.find(".marker-edit-button");

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
            strokeWidth: 4,
            fill: 'red',
            stroke: 'red',
            originX: "center",
            originY: "center"
        });

        newEdge.tag = "route";

        newEdge.additionalData = data;
        this._canvasManager.addToVisualLayer(newEdge);
        this._canvasManager.fixEdgeRotation(newEdge);

        that._edgesOnDisplay.push(newEdge);
    };

    EdgeControls.prototype.updateEdgePositions = function (edgeIndex, markerTime1, markerTime2) {
        let edge = this._edgesOnDisplay[edgeIndex];

        let markerStart = this._canvasManager.getMarkerByCreationTime(markerTime1);
        let markerEnd = this._canvasManager.getMarkerByCreationTime(markerTime2);

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
            strokeWidth: 4,
            fill: 'red',
            stroke: 'red',
            originX: "center",
            originY: "center"
        });
        newEdge.tag = "route";
        newEdge.additionalData = edge.additionalData;

        this._canvasManager.removeFromVisualLayer(edge);
        this._canvasManager.addToVisualLayer(newEdge);
        this._canvasManager.fixEdgeRotation(newEdge);

        this._edgesOnDisplay[edgeIndex] = newEdge;
    };

    // only to be called after a marker was deleted! 
    EdgeControls.prototype.deleteEdge = function (edgeIndex) {
        let deleted = this._edgesOnDisplay.splice(edgeIndex, 1);
        this._canvasManager.removeFromVisualLayer(deleted[0]);
    };

    EdgeControls.prototype._onEdgeSelected = function (edge) {
        let that = this;

        this._$edgeEditButton.unbind('click');
        this._$edgeEditButton.on('click', function(e) {that._startEditingEdge(edge)});
        this._$edgeEditButton.removeClass('disabled');
    };

    EdgeControls.prototype._startEditingEdge = function (edge) {
        let dataDialog = new navigame.AdditionalDataDialog();
        dataDialog.show("Edge", edge);
        let that = this;
        $(dataDialog).on('okSelected', function(e, edgeTime, edgeData) {
            that._setEdgeData(edge, edgeTime, edgeData);
            dataDialog.closeDialog();
        });
    };

    EdgeControls.prototype._setEdgeData = function (edge, edgeTime, edgeData) {
        edge.additionalData = edgeData;
        edge.additionalData["timeCreated"] = edgeTime;

        $(this).trigger('edgeDataChanged', [this._edgesOnDisplay.indexOf(edge), edge.additionalData]);
    };

    EdgeControls.prototype._onMapMouseDown = function (e) {
        let positionOnMap = this._canvasManager.calculatePositionOnMap({x: e.offsetX, y: e.offsetY});

        if (this._canvasManager.isClickOnRoute(positionOnMap) && !this._canvasManager.isClickOnMarker(positionOnMap)) {
            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        
            this._edgeClicked = true;
            this._clickedEdge = this._canvasManager.getClickedRoute(positionOnMap);
            this._edgeMoving = false;

            $(".marker-delete.button").addClass('disabled');        
        } else {
            this._edgeClicked = false;
            this._edgeMoving = false;

            if (!this._canvasManager.isClickOnMarker(positionOnMap)) {
                this._$edgeEditButton.unbind('click');
                this._$edgeEditButton.addClass('disabled');
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

