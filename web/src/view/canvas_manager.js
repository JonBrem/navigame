navigame.CanvasManager = (function () {

    let that = null;

    function CanvasManager () {
        this._htmlElement = null;
        this._canvas = null;
        this._ctx = null;
        this._fabricCanvas = null; // this is the fancy canvas library in use here :)

        this._visualsGroup = null;
        this._selectionCircle = null;

        this._initialZoom = null;

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

    CanvasManager.prototype.getCurrentZoom = function () {
        return this._visualsGroup.zoomX;
    };

    CanvasManager.prototype.moveCursor = function (elementCoordinates, collisionCallback) {
        this._setCursorPosition(elementCoordinates);
        this._checkCursorCollisions(collisionCallback);
        //this._fabricCanvas.renderAll();
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

                let distance = this._distToSegment({
                    x: this._selectionCircle.left,
                    y: this._selectionCircle.top
                }, {
                    x: obj.x1,
                    y: obj.y1
                }, {
                    x: obj.x2,
                    y: obj.y2
                });

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
        this._visualsGroup.center();

        // magic number 1.25: I just don't know why, but this is the initial scale and it needs to be accounted for.
        this._fabricCanvas.absolutePan(new fabric.Point(
            -(this._fabricCanvas.width / 2 - this._visualsGroup.width / 2 * Math.pow(this._visualsGroup.zoomX / this.getViewportScale(), 1)), 
            -(this._fabricCanvas.height / 2 - this._visualsGroup.height / 2 * Math.pow(this._visualsGroup.zoomX / this.getViewportScale(), 1))
        ));

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
        let newZoom = Math.min(zoomLevel, 6);
        newZoom = Math.max(1 / 6.0, newZoom);

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

        if (!center) {
            center = {
                x: this._fabricCanvas.width / 2,
                y: this._fabricCanvas.height / 2
            }
        }

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

        if (!center) {
            center = {
                x: this._fabricCanvas.width / 2,
                y: this._fabricCanvas.height / 2
            }
        }

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

        $(this).trigger('rotationChange', [prevRotation + rotation]);

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

    CanvasManager.prototype.getEdgeByCreationTime = function (timeCreated) {
        let objects = this._visualsGroup.getObjects();
        for(let i = 1; i < objects.length; i++) {
            if ("tag" in objects[i] && objects[i].tag == "route") {
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

    CanvasManager.prototype.updateMarker = function (marker) {
        this._updatePartOfGroup(marker);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.updateEdge = function (edge) {
        this._updatePartOfGroup(edge);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.deleteAllEdges = function () {        
        let objects = this._visualsGroup.getObjects();
        for(let i = objects.length - 1; i >= 0; i--) {
            if ("tag" in objects[i] && objects[i].tag == "route") {
                this._visualsGroup.remove(objects[i]);
            }
        }

        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.toImageFraction = function (coordVal, isX) {
        if (isX) {
            return coordVal / this._visualsGroup.getObjects()[1].width;
        } else {
            return coordVal / this._visualsGroup.getObjects()[1].height;
        }
    };

    CanvasManager.prototype.toImageCoord = function (fractionVal, isX) {
        if (isX) {
            return fractionVal * this._visualsGroup.getObjects()[1].width;
        } else {
            return fractionVal * this._visualsGroup.getObjects()[1].height;
        }
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

    // helpers for calculating distance of point to a line, http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    

    CanvasManager.prototype._sqr = function (x) { 
        return x * x 
    };

    CanvasManager.prototype._dist2 = function (v, w) { 
        return this._sqr(v.x - w.x) + this._sqr(v.y - w.y);
    };

    CanvasManager.prototype._distToSegmentSquared = function (p, v, w) {
        var l2 = this._dist2(v, w);
        if (l2 == 0) return this._dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return this._dist2(p, {x: v.x + t * (w.x - v.x),
                         y: v.y + t * (w.y - v.y) });
    };

    CanvasManager.prototype._distToSegment = function (p, v, w) { 
        return Math.sqrt(this._distToSegmentSquared(p, v, w)); 
    };

    return CanvasManager;
}());

