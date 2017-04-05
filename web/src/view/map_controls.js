navigame.MapControls = (function () {

    /**
     * MapControls constructor.
     * @constructor
     * @global
     * @class
     * @classdesc MapControls handle the input on the map.
     *  The CanvasManager also plays a role in this, but the MapControls
     *  handle the actual click (or touch) events.
     */
    function MapControls(canvasManager, markerControls, edgeControls) {       
        Log.log("verbose", "initializing map controls", this);

        this._canvasManager = canvasManager;
        let that = this;
        $(this._canvasManager).on('rotationChange', function (e, rotation) {
            that._onCanvasRotationChanged(rotation);
        });

        this._markerControls = markerControls;
        this._edgeControls = edgeControls;

        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._manipulationStart = null;

        // all of these are set in _createControlsDiv:
        this._$controlsDiv = null;
        this._$compassButton = null;
        this._$centerMapButton = null;
        this._$zoomInButton = null;
        this._$zoomOutButton = null;
        this._createControlsDiv();

        this._rotationAngle = 0;

        this._buttonZoomLevel = 0.3;

        Log.log("verbose", "finished initializing map controls", this);
    }

    /**
     * _createControlsDiv creates an overlay that spans the canvas (it is always
     *  rescaled to be the same size as the canvas)
     *  @memberof MapControls
     */
    MapControls.prototype._createControlsDiv = function () {
        this._$controlsDiv = $(compiledTemplates['map_controls']());

        let that = this;

        this._$controlsDiv.css({ position: 'absolute' });

        let $body = $("body");
        $body.append(this._$controlsDiv);

        this._setupMouseInteraction($body);
        this._setupTouchGestures();
        this._setupControlsButtons();

        for (let i = 0; i < 1000; i += 100)
            setTimeout(function() { that._scaleControlsDiv(); }, i);
    
        let debouncedFunc = _.debounce(function() {
            that._scaleControlsDiv(); 
            setTimeout(function() { that._scaleControlsDiv(); }, 100);
        }, 100)

        $(window).resize(debouncedFunc);
        // rescale after the last time the window was resized is .1 seconds ago
        // (so it isn't called continuously during resizing, which could be slow)
    };

    /**
     * _setupMouseInteraction enables clicking on, dragging, and scrolling on the canvas element.
     * @param  {jQuery} $body - jQuery handle for the body element
     * @memberof MapControls
     */
    MapControls.prototype._setupMouseInteraction = function($body) {
        let that = this;

        this._$controlsDiv.on("mousedown touchstart", function(e) {that._onMouseDown(e);});
        this._$controlsDiv.on("wheel", function(e) {that._onScroll(e);});
        $body.on("mousemove touchmove", function(e) {that._onMouseMove(e);});
        $body.on("mouseup touchend touchcancel", function(e) {that._onMouseUp(e);});
    };

    /**
     * _setupTouchGestures enables certain HAMMER.JS functions
     *  for the canvas (http://hammerjs.github.io/).
     *  @memberof MapControls
     */
    MapControls.prototype._setupTouchGestures = function () {
        let that = this;

        let hammertime = new Hammer(this._$controlsDiv[0]);
        hammertime.get('pinch').set({enable: true, threshold: .25});
        hammertime.get('rotate').set({ enable: true , threshold: 10 });
        hammertime.on('pinch', function(e) { that._onMobilePinch(e); });
        hammertime.on('rotate', function(e) { that._onMobileRotate(e); });
        hammertime.on('rotatestart', function(e) { that._onMobileRotateStart(e); });
    };

    /**
     * _setupControlsButtons references the compass, "center map" and zoom buttons
     *  and adds click listeners to them.
     *  @memberof MapControls
     */
    MapControls.prototype._setupControlsButtons = function () {
        let that = this;

        this._$compassButton = $("#map_controls_compass");
        this._$compassButton.on('click touchstart', function(e) {that._resetMapRotation();});

        this._$centerMapButton = $("#map_controls_position_reset");
        this._$centerMapButton.on('click touchstart', function(e) {that._resetMapPosition();});

        this._$zoomInButton = $("#map_controls_zoom_in");
        this._$zoomInButton.on('click touchstart', function(e) {that._zoomInViaButton();});
        this._$zoomOutButton = $("#map_controls_zoom_out");
        this._$zoomOutButton.on('click touchstart', function(e) {that._zoomOutViaButton();});
    }

    /**
     * _scaleControlsDiv makes the controls overlay the exact same size as the canvas.
     * @memberof MapControls
     */
    MapControls.prototype._scaleControlsDiv = function () {
        this._$controlsDiv.width(this._canvasManager.elementWidth());
        this._$controlsDiv.height(this._canvasManager.elementHeight());
        let pos = $(this._canvasManager.canvasElement()).offset();

        this._$controlsDiv.css({
            top: pos.top,
            left: pos.left
        });
    };

    /**
     * _onMouseDown has two cases:
     *  if the ctrl key was pressed, this initiates scrolling.
     *  if it wasn't, it creates a click on the canvas manager,
     *   which will trigger callbacks based on what was hit
     *   (a marker, an edge or nothing)
     * @param  {event} e - a click or touch event.
     * @memberof MapControls
     */
    MapControls.prototype._onMouseDown = function (e) {
        let isCtrl;
        if (window.event) {
            isCtrl = !!window.event.ctrlKey; // !! -> typecast to boolean
        } else {
            isCtrl = !!e.ctrlKey;
        }

        if (isCtrl) {
            this._rotating = true;
            this._rotationAngle = 0;
            this._manipulationStart = {x: e.pageX, y: e.pageY};
        } else {
            let controlsOffset = this._$controlsDiv.offset();
            let that = this;

            let hits = this._getHitPositions(e, 'mousedown', 'touchstart');
            if (!hits) return;

            let hitPosX = hits.x, hitPosY = hits.y;

            this._canvasManager.moveCursor({
                x: hitPosX - controlsOffset.left, 
                y: hitPosY - controlsOffset.top
            }, {
                markerHit: function(marker) {that._onMarkerHitClick(marker, e);},
                routeHit: function(route) {that._onRouteHitClick(route);},
                nothingHit: function() {that._onNothingHitClick(e);}
            });
        }
    
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * _onMouseMove is called whenever the cursor moves on the canvas.
     *  it can translate the map, rotate it, move an object on it, or do nothing.
     * @param  {event} e - click or touch event.
     * @memberof MapControls
     */
    MapControls.prototype._onMouseMove = function (e) {
        let hits = this._getHitPositions(e, 'mousemove', 'touchmove');
        if (!hits) return;

        let hitPosX = hits.x, hitPosY = hits.y;

        if (this._translating) {
            this._handleMapTranslation(hitPosX, hitPosY);
        } else if (this._rotating) {
            this._handleMapRotation(hitPosX, hitPosY);
        } else {
            this._handleObjectMovement(hitPosX, hitPosY);
        }
    };

    /**
     * _handleMapTranslation is part of "_onMouseMove": if the map is currently being translated,
     *  this method will actually move it around.
     * @param  {number} hitPosX - coordinate on the controls div
     * @param  {number} hitPosY - coordinate on the controls div
     * @memberof MapControls
     */
    MapControls.prototype._handleMapTranslation = function (hitPosX, hitPosY) {    
        let scale = this._canvasManager.getViewportScale();

        this._canvasManager.moveBy(
         {
            x: (hitPosX - this._manipulationStart.x) * scale,
            y: (hitPosY - this._manipulationStart.y) * scale
         });

        this._manipulationStart = {x: hitPosX, y: hitPosY};
    };

    /**
     * _handleMapRotation is part of "_onMouseMove": if the map is currently being rotated,
     *  this method will turn it.
     * @param  {number} hitPosX - coordinate on the controls div
     * @param  {number} hitPosY - coordinate on the controls div
     * @memberof MapControls
     */
    MapControls.prototype._handleMapRotation = function (hitPosX, hitPosY) {
        this._rotationAngle = (this._manipulationStart.x - hitPosX) / 2;
        this._canvasManager.rotateBy(this._rotationAngle, this._canvasCenter());

        this._manipulationStart = {x: hitPosX, y: hitPosY};
    };

    /**
     * _handleObjectMovement is part of "_onMouseMove": if the map is not currently being
     *  dragged around or rotated, this method will inform the MarkerControls and the CanvasManager
     *  about the movement.
     * @param  {number} hitPosX - coordinate on the controls div
     * @param  {number} hitPosY - coordinate on the controls div
     * @memberof MapControls
     */
    MapControls.prototype._handleObjectMovement = function (hitPosX, hitPosY) {
        let controlsOffset = this._$controlsDiv.offset();

        if (hitPosX >= controlsOffset.left &&
                hitPosX <= controlsOffset.left + this._$controlsDiv.width() &&
                hitPosY >= controlsOffset.top &&
                hitPosY <= controlsOffset.top + this._$controlsDiv.height()) {

            let that = this;        

            this._markerControls.onCanvasMouseMove({x: hitPosX - controlsOffset.left,
                y: hitPosY - controlsOffset.top});

            this._canvasManager.moveCursor({
                x: hitPosX - controlsOffset.left, 
                y: hitPosY - controlsOffset.top
            }, {
                markerHit: function(marker) {that._onMarkerHitMove(marker);},
                routeHit: function(route) {that._onRouteHitMove(route);},
                nothingHit: function() {that._onNothingHitMove();}
            });
        }
    };

    /**
     * _onMarkerHitMove is called when a marker is hit with a mouseover-type event.
     *  It informs the marker controls and edge controls.
     * @param  {fabric.Object} marker - marker that the mouse hit
     * @memberof MapControls
     */
    MapControls.prototype._onMarkerHitMove = function (marker) {
        this._edgeControls.onOtherMouseOver(marker);
        this._markerControls.onMarkerMouseOver(marker);
    };

    /**
     * _onRouteHitMove is called when an edge / a route is hit with a mouseover-type event.
     *  It informs the marker controls and edge controls.
     * @param  {fabric.Object} route - edge / route that the mouse hit
     * @memberof MapControls
     */
    MapControls.prototype._onRouteHitMove = function (route) {
        this._markerControls.onOtherMouseOver(route);
        this._edgeControls.onEdgeMouseOver(route);
    };

    /**
     * _onNothingHitMove is called when neither any marker nor any edge is hit with a
     *  mouseover-type event. It informs the marker controls and edge controls.
     *  @memberof MapControls
     */
    MapControls.prototype._onNothingHitMove = function () {
        this._markerControls.onOtherMouseOver();
        this._edgeControls.onOtherMouseOver();
    };

    /**
     * _onMarkerHitClick is called when a marker is hit with a mousedown-type event.
     *  It informs the marker controls and edge controls.
     * @param  {fabric.Object} marker - marker that the mouse hit
     * @param  {event} e - mousedown or touchstart event
     * @memberof MapControls
     */
    MapControls.prototype._onMarkerHitClick = function (marker, e) {
        let hits = this._getHitPositions(e, 'mousedown', 'touchstart');
        if (!hits) return;

        let hitPosX = hits.x, hitPosY = hits.y;
        let controlsOffset = this._$controlsDiv.offset();
        this._edgeControls.onOtherClicked(marker);
        this._markerControls.onMarkerClicked(marker, {x: hitPosX - controlsOffset.left, y: hitPosY - controlsOffset.top});
    };

    /**
     * _onRouteHitClick is called when an edge / a route is hit with a mousedown-type event.
     *  It informs the marker controls and edge controls.
     * @param  {fabric.Object} route - route that the mouse hit
     * @memberof MapControls
     */
    MapControls.prototype._onRouteHitClick = function (route) {
        this._markerControls.onOtherClicked(route);
        this._edgeControls.onEdgeClicked(route);
    };

    /**
     * _onNothingHitClick is called when neither any marker nor any edge is hit with a
     *  It informs the marker controls and edge controls, and stores the position as a potential
     *  _manipulationStart-point for dragging the canvas.
     * @param  {event} e - mousedown or touchstart event
     * @memberof MapControls
     */
    MapControls.prototype._onNothingHitClick = function (e) {
        this._translating = true;

        let hits = this._getHitPositions(e, 'mousedown', 'touchstart');
        if (!hits) return;

        this._manipulationStart = {x: hits.x, y: hits.y};

        this._markerControls.onOtherClicked(null);
        this._edgeControls.onOtherClicked(null);
    };

    /**
     * _onScroll orders the canvas manager to zoom in or out, depending on the scroll
     *  direction.
     * @param  {event} e - scroll event
     * @memberof MapControls
     */
    MapControls.prototype._onScroll = function (e) {
        this._canvasManager.zoomBy(e.originalEvent.wheelDelta / Math.abs(e.originalEvent.wheelDelta) * 0.3,
         {
            x: e.originalEvent.offsetX,
            y: e.originalEvent.offsetY
         });

        e.preventDefault();
    };

    /**
     * _onMobilePinch is called when the hammer-API reports that a pinch occurred on the map and
     *  orders the canvas manager to zoom in or out.
     * @param  {event} e - hammer.js pinch event
     * @memberof MapControls
     */
    MapControls.prototype._onMobilePinch = function (e) {
        let controlsOffset = this._$controlsDiv.offset();
        let scale = this._canvasManager.getViewportScale();

        let centerOnCanvas = {
            x: (e.center.x - controlsOffset.left) * scale,
            y: (e.center.y - controlsOffset.top) * scale
        };

        this._canvasManager.zoomBy(-e.velocity / scale, centerOnCanvas);
    };

    /**
     * _onMobileRotateStart is called when at he hammer-API reports that a rotation gesture
     *  is starting. Stores the initial value, does nothing else.
     * @param  {event} e - hammer.js rotation event
     * @memberof MapControls
     */
    MapControls.prototype._onMobileRotateStart = function (e) {
        this.lastRotation = e.rotation;
    };

    /**
     * _onMobileRotate is called when at he hammer-API reports that a rotation gesture
     *  is occurring and tells the canvas manager to rotate the map accordingly.
     * @param  {event} e - hammer.js rotation event
     * @memberof MapControls
     */
    MapControls.prototype._onMobileRotate = function (e) {
        let controlsOffset = this._$controlsDiv.offset();
        let scale = this._canvasManager.getViewportScale();

        let centerOnCanvas = {
            x: (e.center.x - controlsOffset.left) * scale,
            y: (e.center.y - controlsOffset.top) * scale
        };

        this._canvasManager.rotateBy(e.rotation - this.lastRotation);//, centerOnCanvas);
        this.lastRotation = e.rotation;
    };

    /**
     * _canvasCenter calculates the center of the canvas.
     * @return {object} {x: ..., y: ...}-type object.
     * @memberof MapControls
     */
    MapControls.prototype._canvasCenter = function () {
        return {x: this._canvasManager.canvasWidth() / 2.0, y: this._canvasManager.canvasHeight() / 2.0};
    };

    /**
     * _onMouseUp is called when a mouse button is released, which stops any translation / rotation
     *  / scaling process.
     * @param  {event} e - mouse up event
     * @memberof MapControls
     */
    MapControls.prototype._onMouseUp = function (e) {
        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._markerControls.onMouseUp();
    };

    /**
     * _resetMapRotation resets the map's rotation to zero.
     * @memberof MapControls
     */
    MapControls.prototype._resetMapRotation = function (e) {
        this._canvasManager.setRotation(0);
    };

    /**
     * _onCanvasRotationChanged is called when the map was rotated and
     *  rotates the compass icon.
     * @param  {number} rotation - new rotation in degrees
     * @memberof MapControls
     */
    MapControls.prototype._onCanvasRotationChanged = function (rotation) {
        this._$compassButton.children(0).children(0).css('transform', 'rotate(' + rotation + 'deg)');
    };

    /**
     * _resetMapPosition positions the map in the centre of the canvas.
     * @memberof MapControls
     */
    MapControls.prototype._resetMapPosition = function (e) {
        this._canvasManager.centerImage();

    };

    /**
     * _zoomInViaButton zooms in on the map by a specified amount.
     * @memberof MapControls
     */
    MapControls.prototype._zoomInViaButton = function (e) {
        this._canvasManager.zoomBy(this._buttonZoomLevel);
    };

    /**
     * _zoomOutViaButton zooms out of the map by a specified amount.
     * @memberof MapControls
     */
    MapControls.prototype._zoomOutViaButton = function (e) {
        this._canvasManager.zoomBy(- this._buttonZoomLevel);
    };

    /**
     * _getHitPositions retrieves the position of a hit event on the page.
     * Since both clicks and touches are supported, some amount of code is necessary, and
     * as many methods need this, this happens in a separate method.
     * @param  {event} e               - mouse or touch event
     * @param  {string} mouseEventType - mouse event name (e.g. mousedown)
     * @param  {string} touchEventType - touch event name (e.g. touchstart)
     * @return {object}                {x: ..., y: ...}-type object
     * @memberof MapControls
     */
    MapControls.prototype._getHitPositions = function (e, mouseEventType, touchEventType) {
        let hitPosX, hitPosY;
        if (e.type == mouseEventType) {
            hitPosX = e.pageX;
            hitPosY = e.pageY;
        } else if (e.type == touchEventType) {
            hitPosX = e.originalEvent.touches[0].pageX;
            hitPosY = e.originalEvent.touches[0].pageY;

            if (e.originalEvent.touches.length > 1) return false;
        }

        return {x: hitPosX, y: hitPosY};
    };

    return MapControls;
}());
