navigame.EdgeControls = (function () {

    /**
     * EdgeControls constructor. Registers to the canvas manager's 'clearCanvas' event,
     *  and references the "edit" button.
     * @constructor
     * @global
     * @class
     * @classdesc EdgeControls handle the modification of the data of edges.
     *  They use navigame.MarkerControl's html element.
     * @param {type} canvasManager - description
     */
    function EdgeControls (canvasManager) {
        Log.log("verbose", "Initializing Edge controls", this);

        let that = this;
        this._canvasManager = canvasManager;
        $(this._canvasManager).on('clearCanvas', function(e) {
            that._edgesOnDisplay = [];
        });

        let $edgeManipulationArea = $("#marker_fill_rest");
        this._$edgeEditButton = $edgeManipulationArea.find(".marker-edit-button");

        // these will be set dynamically!
        this._edgeClicked = false;
        this._clickedEdge = null;

        this._edgesOnDisplay = [];
        this._highlightedEdge = null;

        this._edgeWidth = 4;
        this._highlightedEdgeWidth = 7;

        Log.log("verbose", "Finished Initializing Edge Controls", this);
    }

    /**
     * createEdgeBetweenMarkers creates an edge at the map positions of the markers
     *  with the specified timestamps.
     * @param  {number} markerTime1 - timestamp of the 'from' marker
     * @param  {number} markerTime2 - timestamp of the 'to' marker
     * @param  {object} data        - additional data for the edge.
     * @memberof EdgeControls
     */
    EdgeControls.prototype.createEdgeBetweenMarkers = function (markerTime1, markerTime2, data) {
        Log.log("verbose", "Creating Edge at markers ", JSON.stringify(markerTime1),
            JSON.stringify(markerTime2), this);

        let newEdge = this._setupNewEdge(markerTime1, markerTime2);

        newEdge.additionalData = data;
        this._canvasManager.addToVisualLayer(newEdge);
        this._canvasManager.fixEdgeRotation(newEdge);

        this._edgesOnDisplay.push(newEdge);
    };

    /**
     * updateEdgePositions creates a new edge with the additionalData of the existing edge
     *  at edgeIndex and replaces that old edge with the new one.
     * @param  {type} edgeIndex   - description
     * @param  {number} markerTime1 - timestamp of the 'from' marker
     * @param  {number} markerTime2 - timestamp of the 'to' marker
     * @memberof EdgeControls
     */
    EdgeControls.prototype.updateEdgePositions = function (edgeIndex, markerTime1, markerTime2) {
        let edge = this._edgesOnDisplay[edgeIndex];
        let newEdge = this._setupNewEdge(markerTime1, markerTime2);

        newEdge.additionalData = edge.additionalData;

        this._canvasManager.removeFromVisualLayer(edge);
        this._canvasManager.addToVisualLayer(newEdge);
        this._canvasManager.fixEdgeRotation(newEdge);

        this._edgesOnDisplay[edgeIndex] = newEdge;
    };

    /**
     * deleteEdge removes an edge from the visual layer. Only to be called after markers were deleted,
     *  edges can't "just" be deleted!
     * @param  {number} edgeIndex - index of the edge on the current map.
     * @memberof EdgeControls
     */
    EdgeControls.prototype.deleteEdge = function (edgeIndex) {
        let deleted = this._edgesOnDisplay.splice(edgeIndex, 1);
        this._canvasManager.removeFromVisualLayer(deleted[0]);

        if (this._highlightedEdge == deleted) {
            this._highlightedEdge = null;
        }
    };

    /**
     * clearEdges deletes all edges on the canvas.
     * obviously, use with caution!
     * @memberof EdgeControls
     */
    EdgeControls.prototype.clearEdges = function () {
        for (let edgeIndex = this._edgesOnDisplay.length - 1; edgeIndex >= 0; edgeIndex--) {
            this.deleteEdge(edgeIndex);
        }

        this._edgesOnDisplay = [];
        this._canvasManager.deleteAllEdges();

        this._highlightedEdge = null;
    };

    /**
     * _startEditingEdge shows the "edit edge"-dialog and registers callbacks to it.
     * @param  {fabric.Object} marker - which edge is affected by the dialog.
     * @memberof EdgeControls
     */
    EdgeControls.prototype._startEditingEdge = function (edge) {
        let dataDialog = new navigame.AdditionalDataDialog();
        dataDialog.show("Edge", edge);
        let that = this;
        $(dataDialog).on('okSelected', function(e, edgeTime, edgeIndex, edgeData) {
            that._setEdgeData(edge, edgeTime, edgeIndex, edgeData);
            dataDialog.closeDialog();
        });
    };

    /**
     * _setEdgeData sets the edge's additionalData to edgeData,
     *  with edgeTime and edgeIndex being set separately, so these are ensured to be there.
     *  Will trigger 'edgeDataChanged'.
     * @param {fabric.Object} edge      - visual representation of the edge whose data changed.
     * @param {number} edgeTime  - timestamp of the edge
     * @param {number} edgeIndex - edge index, so the logical representations knows which one was edited.
     * @param {object} edgeData  - the "additional data", other than timeCreated and edgeIndex
     * @memberof EdgeControls
     */
    EdgeControls.prototype._setEdgeData = function (edge, edgeTime, edgeIndex, edgeData) {
        edge.additionalData = edgeData;
        edge.additionalData["timeCreated"] = edgeTime;
        edge.additionalData["edgeIndex"] = edgeIndex;

        $(this).trigger('edgeDataChanged', [this._edgesOnDisplay.indexOf(edge),
            edge.additionalData]);
    };  

    /**
     * onEdgeMouseOver highlights the edge (by making it somewhat bigger).
     * @param  {fabric.Object} edge - which edge to highlight
     * @memberof EdgeControls
     */
    EdgeControls.prototype.onEdgeMouseOver = function (edge) {
        if (this._highlightedEdge != null && this._highlightedEdge != edge) {
            this.onOtherMouseOver();
        }

        this._highlightedEdge = edge;

        this._highlightedEdge.set({
            strokeWidth: this._highlightedEdgeWidth
        });

        this._canvasManager.updateEdge(this._highlightedEdge);
    };

    /**
     * onEdgeClicked sets the click callbacks for the "edge manipulation buttons" so
     *  they will affect this edge.
     * @param  {fabric.Object} edge   - which edge was clicked
     * @param  {object} position - position of the click. necessary bugfix to enable dragging on
     *                              mobile / touch-based systems.
     *                              @memberof EdgeControls
     */
    EdgeControls.prototype.onEdgeClicked = function (edge) {
        let that = this;

        this._$edgeEditButton.unbind('click');

        this._$edgeEditButton.on('click', function(e) {that._startEditingEdge(edge)});
        this._$edgeEditButton.removeClass('disabled');

        this._edgeClicked = true;
        this._clickedEdge = edge;
    };

    /**
     * onOtherMouseOver must be called when the mouse cursor hits nothing or hits
     *  a marker. Removes the highlight of the highlighted edge, if there was any.
     *  @memberof EdgeControls
     */
    EdgeControls.prototype.onOtherMouseOver = function () {
        if (this._highlightedEdge != null) {
            this._highlightedEdge.set({
                strokeWidth: 4,
            });

            this._canvasManager.updateEdge(this._highlightedEdge);

            this._highlightedEdge = null;
        }
    };

    /**
     * onOtherClicked should be called if there was a click event that did not hit an edge.
     *  removes the click listeners on the manipulation buttons if "what" is null.
     * @param  {fabric.Object} what - null, if nothing was clicked; the clicked object, otherwise.
     * @memberof EdgeControls
     */
    EdgeControls.prototype.onOtherClicked = function (what) {
        let that = this;
        this._edgeClicked = false;

        if (!what) { // <- this means "what" is not set, i.e. the click went nowhere!
            this._$edgeEditButton.unbind('click');
            this._$edgeEditButton.addClass('disabled');
        }
    };

    /**
     * onMouseUp should be called when the user stops pressing a mouse key.
     * @memberof EdgeControls
     */
    EdgeControls.prototype.onMouseUp = function () {
        this._edgeClicked = false;
    };

    /**
     * addEdgeData adds data to the edge, overriding data that has the same keys.
     * @param {number} creationTime - creation time of the edge, so the view representation can be identified.
     * @param {object} toAdd        - keys in this object will be created and their values will be
     *                                 stored under the same keys in the edge's additional data;
     *                                 if the keys already exist, the old values will be overridden.
     *                                 @memberof EdgeControls
     */
    EdgeControls.prototype.addEdgeData = function (creationTime, toAdd) {
        let edge = this._canvasManager.getEdgeByCreationTime(creationTime);

        if (edge != null) {
            for (let key in toAdd) {
                edge.additionalData[key] = toAdd[key];
            }
        }
    };

    /**
     * _setupNewEdge instantiates an edge at the map positions of the markers
     *  with the specified timestamps. That will not be visible, though, until it is added
     *  to a fabric canvas or the visual layer of the navigame.CanvasManager.
     * @param  {number} markerTime1 - timestamp of the 'from' marker
     * @param  {number} markerTime2 - timestamp of the 'to' marker
     * @return {fabric.Line} the line representing the edge, which is tagged 'route'.
     * @memberof EdgeControls
     */
    EdgeControls.prototype._setupNewEdge = function (markerTime1, markerTime2) {
        let markerStart = this._canvasManager.getMarkerByCreationTime(markerTime1);
        let markerEnd = this._canvasManager.getMarkerByCreationTime(markerTime2);

        let points = [markerStart.left, markerStart.top, markerEnd.left, markerEnd.top];

        let newEdge = new fabric.Line(points, {
            strokeWidth: this._edgeWidth,
            fill: 'red',
            stroke: 'red',
            originX: "center",
            originY: "center"
        });
        newEdge.tag = "route";

        return newEdge;
    };

    return EdgeControls;
}());

