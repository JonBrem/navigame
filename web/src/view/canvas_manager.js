/**
 * [The Canvas manager is a central "view" class in this game.
 *  It greatly limits the accessability to the underlying
 *  fabric.js-canvas, but (in doing so) ensures that certain position values,
 *  scaling and rotating the canvas work smoothly.
 *  
 *  It handles clicks by using a circle that gets moved to the mouse's position.
 *  The circle's position can be updated via methods of this class, and there are callbacks
 *  for if it hits anything.]
 */
navigame.CanvasManager = (function () {

    /**
     * [CanvasManager constructor. Creates a fabric canvas around the specified jQuery handle.]
     * @param {[jQuery]} $contentArea [a fabric canvas will be created and appended to the specified element.]
     */
    function CanvasManager ($contentArea) {
        Log.log("verbose", "Initializing Canvas Manager", this);

        $contentArea.append(compiledTemplates["map_canvas"]());
        this._canvas = $('#my_canvas').eq(0)[0];
        this._fabricCanvas = new fabric.Canvas('my_canvas'); // this is the fancy canvas library in use here :)

        this._fabricCanvas.skipOffscreen = true;
        this._fabricCanvas.perPixelTargetFind = true;
        this._visualsGroup = null;
        this._selectionCircle = null;

        this._initialZoom = null;
        this._initVisualLayer();

        Log.log("verbose", "Finished Initializing Canvas Manager", this);
    }

    /**
     * [setMapImage sets the background image to the specified object;
     *  also, performs a complete reset of the objects on display.]
     * @param {[fabric.Image]} fabricObj [Image that contains the map]
     */
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

    /**
     * [getViewportScale is NOT the scale of the image, but the ratio of
     *  the canvas' "internal" width and the DOM element's width.]
     * @return {[number]} [the fraction of the canvas' width ]
     */
    CanvasManager.prototype.getViewportScale = function () {
        return this._fabricCanvas.width / $(this._fabricCanvas.upperCanvasEl).width();
    };

    /**
     * [addToVisualLayer adds an object to the visual layer (not straight to the canvas).
     *  this object will receive the scale, rotation and position updates of the underlying map.]
     * @param {[fabric.Object]} fabricObj [any fabric object]
     */
    CanvasManager.prototype.addToVisualLayer = function (fabricObj) {
        fabricObj.angle = -this._visualsGroup.angle;
        

        this._visualsGroup.add(fabricObj);
        this._fabricCanvas.renderAll();
    };

    /**
     * [removeFromVisualLayer removes an object from the visual layer of the canvas,
     *  which will hide it entirely (but not "destroy" the object.)]
     * @param  {[fabric.Object]} fabricObj [some object that is on the canvas.]
     */
    CanvasManager.prototype.removeFromVisualLayer = function (fabricObj) {
        this._visualsGroup.remove(fabricObj);
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
     * @return {Number} the canvas's (DOM element) width.
     */
    CanvasManager.prototype.elementWidth = function () {
        return $(this._fabricCanvas.upperCanvasEl).width();
    };

    /**
     * @return {Number} the canvas's (DOM element) height.
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
     * Given a position on the canvas, returns the position on the map.
     * @param  {object with keys x, y} canvasPos 
     * @return {[fabric.Point]} point in transformed coordinates.
     */
    CanvasManager.prototype.calculatePositionOnMap = function (canvasPos) {
        let originalPositionFractionX = canvasPos.x / $(this._fabricCanvas.upperCanvasEl).width();
        let originalPositionFractionY = canvasPos.y / $(this._fabricCanvas.upperCanvasEl).height();

        let boundaries = this._fabricCanvas.calcViewportBoundaries();

        let newPosX = boundaries.tl.x + originalPositionFractionX * (boundaries.tr.x - boundaries.tl.x);
        let newPosY = boundaries.tl.y + originalPositionFractionY * (boundaries.bl.y - boundaries.tl.y);

        return this._visualsGroup.toLocalPoint(new fabric.Point(newPosX, newPosY), "left", "top");
    };

    /**
     * @return {[number]} [(horizontal) zoom level of the map.]
     */
    CanvasManager.prototype.getCurrentZoom = function () {
        // @todo if the canvas is not square, this methods may need a parameter to determine
        // which zoom should be returned (or separate methods for x and y)!
        return this._visualsGroup.zoomX;
    };

    /**
     * [moveCursor moves the selection circle around, and calls the callback methods to report
     *     if it hits a marker, an edge or nothing]
     * @param  {[object]} elementCoordinates [position on the canvas element; must contain "x" and "y" keys.]
     * @param  {[object]} collisionCallback  [object containing three methods: "markerHit", "routeHit" and "nothingHit".
     *                                        depending on whether or not the selection circle collides with a marker,
     *                                        is near an edge or hits nothing, one of these methods will be called.
     *                                        marker hits have precedence over edge hits.]
     */
    CanvasManager.prototype.moveCursor = function (elementCoordinates, collisionCallback) {
        this._setCursorPosition(elementCoordinates);
        this._checkCursorCollisions(collisionCallback);
        //this._fabricCanvas.renderAll(); // <- enable if the selection circle's position should be shown at all times
    };

    /**
     * [cursorDown moves the selection circle around, and calls the callback methods to report
     *     if it hits a marker, an edge or nothing]
     * @param  {[object]} elementCoordinates [position on the canvas element; must contain "x" and "y" keys.]
     * @param  {[object]} collisionCallback  [object containing three methods: "markerHit", "routeHit" and "nothingHit".
     *                                        depending on whether or not the selection circle collides with a marker,
     *                                        is near an edge or hits nothing, one of these methods will be called.
     *                                        marker hits have precedence over edge hits.]
     */
    CanvasManager.prototype.cursorDown = function (elementCoordinates, collisionCallback) {
        this._setCursorPosition(elementCoordinates);
        this._checkCursorCollisions(collisionCallback);
    };

    /**
     * [_setCursorPosition moves the selection circle around]
     * @param  {[object]} elementCoordinates [position on the canvas element; must contain "x" and "y" keys.]
     */
    CanvasManager.prototype._setCursorPosition = function (elementCoordinates) {
        let mapPos = this.calculatePositionOnMap(elementCoordinates);

        this._selectionCircle.setLeft(mapPos.x - this._selectionCircle.width / 2 - this._visualsGroup.width / 2);
        this._selectionCircle.setTop(mapPos.y - this._selectionCircle.height / 2 - this._visualsGroup.height / 2);

        this._updatePartOfGroup(this._selectionCircle);
        this._selectionCircle.setCoords();
    };

    /**
     * [_checkCursorCollisions calls the callback methods to report
     *     if the cursor / selection circle hits a marker, an edge or nothing]
     * @param  {[object]} callback  [object containing three methods: "markerHit", "routeHit" and "nothingHit".
     *                                        depending on whether or not the selection circle collides with a marker,
     *                                        is near an edge or hits nothing, one of these methods will be called.
     *                                        marker hits have precedence over edge hits.]     */
    CanvasManager.prototype._checkCursorCollisions = function (callback) {
        // check marker collisions
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

        // check edge collisions (this is in a separate loop to give markers precedence)
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
     * Moves the map (or object on the map, if specified) to the specified position (position of top left corner)
     * @param  {[object with keys x, y]} pos Coordinates to move to
     * @param  {[fabric.Object]} moveWhat if specified, moves this instead of the whole map.
     */
    CanvasManager.prototype.moveTo = function (pos, moveWhat) {
        if (moveWhat == null)
            moveWhat = this._visualsGroup;

        moveWhat.setLeft(pos.x);
        moveWhat.setTop(pos.y);

        if (moveWhat != this._visualsGroup) {
            this._updatePartOfGroup(moveWhat);
        }

        this._fabricCanvas.renderAll();
    };

    /**
     * Moves the map (or object on the map, if specified) by the specified values (position of top left corner)
     * @param  {[object with keys x, y]} moveBy values to move by; will be mutated.
     * @param  {[fabric.Object]} moveWhat if specified, moves this instead of the whole map.
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
     * @param  {[Number]} zoomLevel new zoom level
     * @param  {[object with keys x, y]} center center of the zoom.
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
     * @param  {[Number]} zoomDelta change in zoom level.
     * @param  {[object with keys x, y]} center center of the zoom.
     */
    CanvasManager.prototype.zoomBy = function (zoomDelta, center) {
        //this._visualsGroup.setLeft(-center.x);
        //this._visualsGroup.setTop(-center.y);

        let zoomBefore = this._fabricCanvas.getZoom();
        
        let newZoom = Math.min(zoomDelta + zoomBefore, 4);
        newZoom = Math.max(0.25, newZoom);

        if (!center) { // <- if no center is specified: use the center of the canvas.
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
     * @param {[Number]}  rotation    new rotation
     * @param {[object with keys x, y]}   center  center of the rotation
     */
    CanvasManager.prototype.setRotation = function (rotation, center) {
        let prevRotation = this._visualsGroup.getAngle();

        if (!center) { // <- if no center is specified: use the center of the canvas
            center = {
                x: this._fabricCanvas.width / 2,
                y: this._fabricCanvas.height / 2
            }
        }

        this.rotateBy(-prevRotation, center, false);
        this.rotateBy(rotation, center, true);
    };


    /**
     * Set relative rotation of the map.
     * @param {[Number]}  rotation    change in rotation
     * @param {[object with keys x, y]}   center  center of the rotation
     * @param {[updateRender]} updateRender  whether or not to re-render after this function (default is true)
     */
    CanvasManager.prototype.rotateBy = function (rotation, center, updateRender) {
        if (!updateRender)
            updateRender = true;

        if (!center) {
            center = {
                x: this._fabricCanvas.width / 2,
                y: this._fabricCanvas.height / 2
            }
        }

        /*
            This is kind of long, but what this does is very simple:
            1) remove rotation the object already has (but store it for later!)
            2) calculate existing rotation between the center param and the _visualsGroup's center
            3) calculate new rotation between the center param and the visualsGroup's center
            4) move (using a polar-coordinates approach)
            5) restore rotation + add the new one
        */

        // 1)
        let prevRotation = this._visualsGroup.getAngle();
        this._visualsGroup.setAngle(0);

        // 2)
        let oldCenter = {
            x: this._visualsGroup.left + this._visualsGroup.width / 2.0,
            y: this._visualsGroup.top + this._visualsGroup.height / 2.0
        };

        let originalHorizontalAngle = Math.atan2((oldCenter.y - center.y), (oldCenter.x - center.x));
        let distance = Math.sqrt(Math.pow(oldCenter.y - center.y, 2) + Math.pow(oldCenter.x - center.x, 2));

        // 3)
        let newHorizontalAngle = originalHorizontalAngle + rotation * Math.PI / 180.0;

        // 4)
        let newCenter = {
            x: Math.cos(newHorizontalAngle) * distance + center.x,
            y: Math.sin(newHorizontalAngle) * distance + center.y
        };

        this._visualsGroup.setLeft(newCenter.x - this._visualsGroup.width / 2.0);
        this._visualsGroup.setTop(newCenter.y - this._visualsGroup.height / 2.0);

        // 5)
        this._visualsGroup.setAngle(prevRotation + rotation);

        $(this).trigger('rotationChange', [prevRotation + rotation]);

        if (updateRender)
            this._fabricCanvas.renderAll();
    };

    /**
     * [getMarkerByCreationTime searches through all the markers that are on the canvas for the one
     *  that has the specified timestamp, and returns it if it exists.]
     * @param  {[number]} timeCreated [timestamp of the marker (in .additionalData.timeCreated)]
     * @return {[fabric.Object]}      [Marker, if there is one with the specified time; null, otherwise]
     */
    CanvasManager.prototype.getMarkerByCreationTime = function (timeCreated) {
        return this._getObjectByCreationTime('marker', timeCreated);
    };

    /**
     * [getEdgeByCreationTime searches through all the routes/edges that are on the canvas for the one
     *  that has the specified timestamp, and returns it if it exists.]
     * @param  {[number]} timeCreated [timestamp of the edge (in .additionalData.timeCreated)]
     * @return {[fabric.Object]}      [Edge, if there is one with the specified time; null, otherwise]
     */
    CanvasManager.prototype.getEdgeByCreationTime = function (timeCreated) {
        return this._getObjectByCreationTime('route', timeCreated);
    };

    /**
     * [_getObjectByCreationTime searches through all the objects that are on the canvas and have the specified tag
     *  for the one that has the specified timestamp, and returns it if it exists.]
     * @param  {[number]} timeCreated [timestamp of the object (in .additionalData.timeCreated)]
     * @return {[fabric.Object]}      [the Object if there is one with the specified time; null, otherwise]
     */
    CanvasManager.prototype._getObjectByCreationTime = function (tag, timeCreated) {
        let objects = this._visualsGroup.getObjects();
        for(let i = 0; i < objects.length; i++) {
            if ("tag" in objects[i] && objects[i].tag == tag) {
                if (objects[i].additionalData.timeCreated == timeCreated) {
                    return objects[i];
                }
            }
        }

        return null;
    };

    /**
     * [fixEdgeRotation ensures the edges on the canvas are rotated correctly and point straight
     *  from their start to their end nodes.]
     * @param  {[fabric.Object]} edge [which edge/route]
     */
    CanvasManager.prototype.fixEdgeRotation = function (edge) {
        edge.setAngle(0);
        this._updatePartOfGroup(edge);
        this._fabricCanvas.renderAll();
    };

    /**
     * [updateMarker re-renders the marker.]
     * @param  {[fabric.Object]} marker [which marker to update]
     */
    CanvasManager.prototype.updateMarker = function (marker) {
        this._updatePartOfGroup(marker);
        this._fabricCanvas.renderAll();
    };

    /**
     * [updateEdge re-renders the edge.]
     * @param  {[fabric.Object]} edge [which edge to update]
     */
    CanvasManager.prototype.updateEdge = function (edge) {
        this._updatePartOfGroup(edge);
        this._fabricCanvas.renderAll();
    };

    /**
     * [deleteAllEdges removes all edges from the visual layer. Their logical representation
     *  is not affected by this.
     *  Obviously, use with caution.]
     */
    CanvasManager.prototype.deleteAllEdges = function () {        
        let objects = this._visualsGroup.getObjects();
        for(let i = objects.length - 1; i >= 0; i--) {
            if ("tag" in objects[i] && objects[i].tag == "route") {
                this._visualsGroup.remove(objects[i]);
            }
        }

        this._fabricCanvas.renderAll();
    };

    /**
     * [toImageFraction transforms "absolute" canvas map coordinates 
     *  (which is NOT the coordinate system the "native" image uses!! the height and width
     *   is always the same on the canvas!) to fractions of the total width & height.]
     * @param  {[number]}  coordVal [e.g. 0 for the centre of the image.]
     * @param  {Boolean} isX      [true if this is the x coordinate.]
     * @return {[number]}           [transformed coordinate.]
     */
    CanvasManager.prototype.toImageFraction = function (coordVal, isX) {
        if (isX) {
            return coordVal / this._visualsGroup.getObjects()[1].width;
        } else {
            return coordVal / this._visualsGroup.getObjects()[1].height;
        }
    };

    /**
     * [toImageCoord transforms fractions of the canvas map's coordinates 
     *  (which is NOT the coordinate system the "native" image uses!! the height and width
     *   is always the same on the canvas!) to "absolute" canvas map coordinates.]
     * @param  {[number]}  coordVal [e.g. 0 for the centre of the image.]
     * @param  {Boolean} isX      [true if this is the x coordinate.]
     * @return {[number]}           [transformed coordinate.]
     */
    CanvasManager.prototype.toImageCoord = function (fractionVal, isX) {
        if (isX) {
            return fractionVal * this._visualsGroup.getObjects()[1].width;
        } else {
            return fractionVal * this._visualsGroup.getObjects()[1].height;
        }
    };


    /**
     * [_unScaleMarkersAndEdges makes markers always appear in the same size,
     *  regardless of how far in/out the user zooms.]
     * @param  {[number]} zoomLevel [the zoom level of the map.]
     */
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

    /**
     * [_updatePartOfGroup in order to see the change in an object that is part of a
     *  fabric.Group, it needs to be removed from the group and added again.
     *  This method is a shorthand for those steps.]
     * @param  {[fabric.Object]} fabricObj [object that is part of _visualsGroup]
     */
    CanvasManager.prototype._updatePartOfGroup = function (fabricObj) {
        this._visualsGroup.remove(fabricObj);
        this._visualsGroup.add(fabricObj);
    };

    /**
     * [_initVisualLayer adds a fabric.Group to the canvas that all other objects will be added to.
     *  this is helpful because all objects on it get rotated, scaled, and translated when these operations
     *  are applied to the group itself. Coordinates are always respective to the map and independent
     *  of where it currently is on the screen.
     *  
     *  Using this was a design choice that made some things easier and other things harder, and it is
     *  a part that could only be removed with massive changes to the rest.]
     */
    CanvasManager.prototype._initVisualLayer = function () {
        // this is a long method, but that is only because fabric objects require some setup.
         
        // this is the "visual layer": a group containing a background, objects
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

        // circle that is used to select things (proxy for click events)
        this._selectionCircle = new fabric.Circle({
            left: 0,
            top: 0,
            radius: 5 / this._visualsGroup.zoomX, 
            fill: "rgba(255, 0, 0, 1)"
        });
        this._visualsGroup.add(this._selectionCircle);

        // fabric lets you manipulate objects unless you tell it not to;
        // since there is an additional layer in this application between the fabric canvas
        // and the UI, this behaviour must be suppressed:
        this._visualsGroup.hasBorders = false;
        this._visualsGroup.hasControls = false;
        this._visualsGroup.hasRotatingPoint = false;

        this._fabricCanvas.add(this._visualsGroup);
    };

    // helpers for calculating distance of point to a line, http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    // (lines are small targets, so "hits" on them are based on their distance to the selection circle.)

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

