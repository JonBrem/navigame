navigame.CanvasManager = (function () {

    let that = null;

    function CanvasManager () {
        this._htmlElement = null;
        this._canvas = null;
        this._ctx = null;
        this._fabricCanvas = null; // this is the fancy canvas library in use here :)

        this._visualsGroup = null;
        this._selectionCircle = null;

        that = this;
    }

    CanvasManager.prototype.init = function ($contentArea) {
        Log.log("verbose", "Initializing Canvas Manager", this);
        this._htmlElement = compiledTemplates["map_canvas"]();

        $contentArea.append(this._htmlElement);

        this._canvas = $('#my_canvas').eq(0)[0];
        this._ctx = this._canvas.getContext('2d');
        this._fabricCanvas = new fabric.Canvas('my_canvas');
        this._fabricCanvas.skipOffscreen = true;
        this._fabricCanvas.perPixelTargetFind = true;

        this._initVisualLayer();

        Log.log("verbose", "Finished Initializing Canvas Manager", this);
    };

    CanvasManager.prototype.addToInteractionLayer = function () {

    };

    CanvasManager.prototype.setMapImage = function (fabricObj) {
        $(this).trigger('clearCanvas');

        this._fabricCanvas.clear();
        this.zoomTo(1.0, {
            x: this._fabricCanvas.width / 2, 
            y: this._fabricCanvas.height / 2
        });
        this._fabricCanvas.absolutePan(new fabric.Point(0, 0));
        this._initVisualLayer();

        this._visualsGroup.add(fabricObj);
        this.centerImage();
        this._fabricCanvas.renderAll();

        this._updatePartOfGroup(this._selectionCircle);
    };

    CanvasManager.prototype.getViewportScale = function () {
        return this._fabricCanvas.width / $(this._fabricCanvas.upperCanvasEl).width();
    };

    CanvasManager.prototype.addToVisualLayer = function (fabricObj) {
        fabricObj.angle = -this._visualsGroup.angle;
        

        this._visualsGroup.add(fabricObj);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.removeFromVisualLayer = function (fabricObj) {
        this._visualsGroup.remove(fabricObj);
        this._fabricCanvas.renderAll();
    };
    
    CanvasManager.prototype.triggerReRender = function () {
        this._fabricCanvas.renderAll();
    };

    /**
     * @return {Number} the canvas's (coordinate system) width.
     */
    CanvasManager.prototype.canvasWidth = function () {
        return this._fabricCanvas.width;
    };

    /**
     * @return {Number} the canvas's (coordinate system) height.
     */
    CanvasManager.prototype.canvasHeight = function () {
        return this._fabricCanvas.height;
    };

    /**
     * @return {Number} the canvas's (html element) width.
     */
    CanvasManager.prototype.elementWidth = function () {
        return $(this._fabricCanvas.upperCanvasEl).width();
    };

    /**
     * @return {Number} the canvas's (html element) height.
     */
    CanvasManager.prototype.elementHeight = function () {
        return $(this._fabricCanvas.upperCanvasEl).height();
    };

    /**
     * @return {HTMLElement} the canvas's html element.
     */
    CanvasManager.prototype.canvasElement = function () {
        return this._fabricCanvas.upperCanvasEl;
    };

    /**
     * @param  {object with keys x, y} canvasPos 
     * @return {[canvas.Point]} point in transformed coordinates.
     */
    CanvasManager.prototype.calculatePositionOnMap = function (canvasPos) {
        let originalPositionFractionX = canvasPos.x / $(this._fabricCanvas.upperCanvasEl).width();
        let originalPositionFractionY = canvasPos.y / $(this._fabricCanvas.upperCanvasEl).height();

        let boundaries = this._fabricCanvas.calcViewportBoundaries();

        let newPosX = boundaries.tl.x + originalPositionFractionX * (boundaries.tr.x - boundaries.tl.x);
        let newPosY = boundaries.tl.y + originalPositionFractionY * (boundaries.bl.y - boundaries.tl.y);

        return this._visualsGroup.toLocalPoint(new fabric.Point(newPosX, newPosY), "left", "top");
    };

    CanvasManager.prototype.isClickOnMap = function (mapPosition) {
        return !(this.isClickOnRoute(mapPosition) || this.isClickOnMarker(mapPosition));
    };

    CanvasManager.prototype.moveCursor = function (elementCoordinates, collisionCallback) {
        this._setCursorPosition(elementCoordinates);
        this._checkCursorCollisions(collisionCallback);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.cursorDown = function (elementCoordinates, collisionCallback) {
        this._setCursorPosition(elementCoordinates);
        this._checkCursorCollisions(collisionCallback);
    };

    CanvasManager.prototype._setCursorPosition = function (elementCoordinates) {
        let mapPos = this.calculatePositionOnMap(elementCoordinates);

        this._selectionCircle.setLeft(mapPos.x - this._selectionCircle.width / 2 - this._visualsGroup.width / 2);
        this._selectionCircle.setTop(mapPos.y - this._selectionCircle.height / 2 - this._visualsGroup.height / 2);

        this._updatePartOfGroup(this._selectionCircle);
        this._selectionCircle.setCoords();
    };

    CanvasManager.prototype._checkCursorCollisions = function (callback) {
        for (let i = 0; i < this._visualsGroup._objects.length; i++) {
            let obj = this._visualsGroup._objects[i];

            if (obj.hasOwnProperty("tag") && obj.tag == "marker") {
                obj.setCoords();

                if (this._selectionCircle.intersectsWithObject(obj)) {
                    callback.markerHit(obj);
                    return;
                }
            }
        }

        for (let i = 0; i < this._visualsGroup._objects.length; i++) {
            let obj = this._visualsGroup._objects[i];

            if (obj.hasOwnProperty("tag") && obj.tag == "route") {
                obj.setCoords();
                let distance = Math.abs((obj.y2 - obj.y1) * this._selectionCircle.left - (obj.x2 - obj.x1) * this._selectionCircle.top + obj.x2 * obj.y1 - obj.y2 * obj.x1) / 
                Math.sqrt(Math.pow(obj.y2 - obj.y1, 2) + Math.pow(obj.x2 - obj.x1, 2));

                if (distance <= 10) {
                    callback.routeHit(obj);
                    return;
                }
            }
        }

        callback.nothingHit();
    };

    /**
     * Positions the map at the center of the canvas.
     */
    CanvasManager.prototype.centerImage = function () {
        let centerAfterZoomX = this._fabricCanvas.width / 2 - this._visualsGroup.width / 2;
        let centerAfterZoomY = this._fabricCanvas.height / 2 - this._visualsGroup.height / 2;

        this._fabricCanvas.absolutePan(new fabric.Point(
            this._fabricCanvas.width / 2 * this._visualsGroup.zoomX - this._fabricCanvas.width / 2,
            this._fabricCanvas.height / 2 * this._visualsGroup.zoomY - this._fabricCanvas.width / 2
        ));

        this._visualsGroup.setLeft(this._fabricCanvas.width / 2 * this._visualsGroup.zoomX - this._fabricCanvas.width / 2);
        this._visualsGroup.setTop(this._fabricCanvas.height / 2 * this._visualsGroup.zoomY - this._fabricCanvas.width / 2);

        this._fabricCanvas.renderAll();
    };

    /**
     * Moves the map to the specified position (position of top left corner)
     * @param  {object with keys x, y} pos Coordinates to move to
     */
    CanvasManager.prototype.moveTo = function (pos, moveWhat) {
        if (moveWhat == null)
            moveWhat = this._visualsGroup;

        moveWhat.setLeft(pos.x);
        moveWhat.setTop(pos.y);

        if (moveWhat != this._visualsGroup) {
            this._visualsGroup.remove(moveWhat);
            this._visualsGroup.add(moveWhat);
        }

        this._fabricCanvas.renderAll();
    };

    /**
     * Moves the map by the values.
     * @param  {object with keys x, y} moveBy x and y values to move by, will be
     * mutated. 
     */
    CanvasManager.prototype.moveBy = function (moveBy, moveWhat) {
        if (moveWhat == null)
            moveWhat = this._visualsGroup;

        let zoomMultiplier = this._fabricCanvas.getZoom();
        moveBy.x /= zoomMultiplier;
        moveBy.y /= zoomMultiplier;

        if (moveWhat != this._visualsGroup) {
            let newX = Math.cos(-this._visualsGroup.angle * Math.PI / 180) * moveBy.x - Math.sin(-this._visualsGroup.angle * Math.PI / 180) * moveBy.y;
            let newY = Math.sin(-this._visualsGroup.angle * Math.PI / 180) * moveBy.x + Math.cos(-this._visualsGroup.angle * Math.PI / 180) * moveBy.y;
            moveBy.x = newX;
            moveBy.y = newY;
        }

        let prevPos = {x: moveWhat.getLeft(), y: moveWhat.getTop()};

        this.moveTo({x: prevPos.x + moveBy.x, y: prevPos.y + moveBy.y}, moveWhat);
    };

    /**
     * Sets the zoom level and the center position.
     * @param  {Number} zoomLevel new zoom level
     * @param  {object with keys x, y} center center of the zoom.
     */
    CanvasManager.prototype.zoomTo = function (zoomLevel, center) {
        let newZoom = Math.min(zoomLevel, 4);
        newZoom = Math.max(0.25, newZoom);

        this._fabricCanvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
        this._fabricCanvas.renderAll();
        let that = this;
        setTimeout(function() {
            that._unScaleMarkersAndEdges(newZoom);
            that._fabricCanvas.renderAll();
        }, 2);
    };


    /**
     * Zooms by zoomDelta with "center" as the zoom center.
     * @param  {Number} zoomDelta change in zoom level.
     * @param  {object with keys x, y} center center of the zoom.
     */
    CanvasManager.prototype.zoomBy = function (zoomDelta, center) {
        //this._visualsGroup.setLeft(-center.x);
        //this._visualsGroup.setTop(-center.y);

        let zoomBefore = this._fabricCanvas.getZoom();
        
        let newZoom = Math.min(zoomDelta + zoomBefore, 4);
        newZoom = Math.max(0.25, newZoom);

        this._fabricCanvas.zoomToPoint(new fabric.Point(center.x, center.y), newZoom);
        this._fabricCanvas.renderAll();

        let that = this;
        setTimeout(function() {
            that._unScaleMarkersAndEdges(newZoom);
            that._fabricCanvas.renderAll();
        }, 2);
    };

    /**
     * Set absolute rotation of the map.
     * 
     * @param {Number}  rotation    new rotation
     * @param {object with keys x, y}   center  center of the rotation
     */
    CanvasManager.prototype.setRotation = function (rotation, center) {
        let prevRotation = this._visualsGroup.getAngle();
        this.rotateBy(-prevRotation, center, false);
        this.rotateBy(rotation, center, true);
        this._rotateMarkersUpwards();
    };


    /**
     * Set relative rotation of the map.
     * @param {Number}  rotation    change in rotation
     * @param {object with keys x, y}   center  center of the rotation
     * @param {updateRender} updateRender  whether or not to re-render after this function (default is true)
     */
    CanvasManager.prototype.rotateBy = function (rotation, center, updateRender) {
        if (!updateRender)
            updateRender = true;

        /*
            what this does is very simple:
            1) remove rotation the object already has (but store it for later!)
            2) calculate existing rotation between the center param and the _visualsGroup's center
            3) calculate new rotation between the center param and the visualsGroup's center
            4) move (using a polar-coordinates approach)
            5) restore rotation + add the new one
        */

        let prevRotation = this._visualsGroup.getAngle();
        this._visualsGroup.setAngle(0);

        let oldCenter = {
            x: this._visualsGroup.left + this._visualsGroup.width / 2.0,
            y: this._visualsGroup.top + this._visualsGroup.height / 2.0
        };

        let originalHorizontalAngle = Math.atan2((oldCenter.y - center.y), (oldCenter.x - center.x));
        let distance = Math.sqrt(Math.pow(oldCenter.y - center.y, 2) + Math.pow(oldCenter.x - center.x, 2));

        let newHorizontalAngle = originalHorizontalAngle + rotation * Math.PI / 180.0;

        let newCenter = {
            x: Math.cos(newHorizontalAngle) * distance + center.x,
            y: Math.sin(newHorizontalAngle) * distance + center.y
        };

        this._visualsGroup.setLeft(newCenter.x - this._visualsGroup.width / 2.0);
        this._visualsGroup.setTop(newCenter.y - this._visualsGroup.height / 2.0);
        this._visualsGroup.setAngle(prevRotation + rotation);

        this._rotateMarkersUpwards();

        if (updateRender)
            this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.getMarkerByCreationTime = function (timeCreated) {
        let objects = this._visualsGroup.getObjects();
        for(let i = 1; i < objects.length; i++) {
            if ("tag" in objects[i] && objects[i].tag == "marker") {
                if (objects[i].additionalData.timeCreated == timeCreated) {
                    return objects[i];
                }
            }
        }

        return null;
    };

    CanvasManager.prototype.fixEdgeRotation = function (edge) {
        edge.setAngle(0);
        this._updatePartOfGroup(edge);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.getMarkerIndex = function (marker) {
        let objects = this._visualsGroup.getObjects();

        let markers = [];

        for(let i = 1; i < objects.length; i++) {                    
            if ("tag" in objects[i] && objects[i].tag == "marker") {
                markers.push(objects[i]);
            }
        }

        markers.sort(function(a, b) {
            return a.additionalData.timeCreated >= b.additionalData.timeCreated;
        });

        for(let i = 0; i < markers.length; i++) {
            if (markers[i] == marker)
                return i;
        }

        return -1;
    };

    /*
     * Awesome matrix multiplication ^_^
     * (adjusted, original: http://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript)
     *
     */
    CanvasManager.prototype._rotate = function (center, point, angle) {
        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x,
            ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;
        return {x: nx, y: ny};
    };

    CanvasManager.prototype._rotateMarkersUpwards = function () {
        let objects = this._visualsGroup.getObjects();
        for(let i = 1; i < objects.length; i++) {
            if ("tag" in objects[i] && objects[i].tag == "marker") {
                objects[i].setAngle(-this._visualsGroup.angle);
                this._updatePartOfGroup(objects[i]);
            }
        }
    };

    CanvasManager.prototype._unScaleMarkersAndEdges = function (zoomLevel) {
        let objects = this._visualsGroup.getObjects();
        for(let i = 1; i < objects.length; i++) {
            if ("tag" in objects[i] && objects[i].tag == "marker") {
                objects[i].set({
                    scaleX: 1 / zoomLevel,
                    scaleY: 1 / zoomLevel
                });
                this._updatePartOfGroup(objects[i]);
            }
        }
    };


    CanvasManager.prototype._updatePartOfGroup = function (fabricObj) {
        this._visualsGroup.remove(fabricObj);
        this._visualsGroup.add(fabricObj);
    };

    CanvasManager.prototype._initVisualLayer = function () {
        this._visualsGroup = new fabric.Group([], {
            left: 0,
            top: 0,
            angle: 0
        });

        this._visualsGroup.set({
            width: this._fabricCanvas.width,
            height: this._fabricCanvas.height,
            originX: 'left',
            originY: 'top',
            lockMovementX: true,
            lockMovementY: true,
        });

        // only to get a background color:
        this._visualsGroup.add(new fabric.Rect({
            left: this._visualsGroup.width / (-2),
            top: this._visualsGroup.height / (-2),
            width: this._visualsGroup.width, 
            height: this._visualsGroup.height,
            fill: "#ffffff"
        }));


        this._selectionCircle = new fabric.Circle({
            left: 0,
            top: 0,
            radius: 5 / this._visualsGroup.zoomX, 
            fill: "rgba(255, 0, 0, 1)"
        });

        this._visualsGroup.add(this._selectionCircle);

        this._visualsGroup.hasBorders = false;
        this._visualsGroup.hasControls = false;
        this._visualsGroup.hasRotatingPoint = false;
        this._fabricCanvas.add(this._visualsGroup);
    };

    return CanvasManager;
}());

