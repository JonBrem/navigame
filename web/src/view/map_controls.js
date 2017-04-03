navigame.MapControls = (function () {

    function MapControls() {
        this._canvasManager = null; 
        this._$controlsDiv = null;

        this._markerControls = null;
        this._edgeControls = null;

        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._manipulationStart = null;

        this._$compassButton = null;
        this._$centerMapButton = null;
        this._$zoomInButton = null;
        this._$zoomOutButton = null;

        this._rotationAngle = 0;
    }

    MapControls.prototype.init = function (canvasManager, markerControls, edgeControls) {
        Log.log("verbose", "initializing map controls", this);
        this._canvasManager = canvasManager;
        let that = this;
        $(this._canvasManager).on('rotationChange', function (e, rotation) {
            that._onCanvasRotationChanged(rotation);
        });

        this._markerControls = markerControls;
        this._edgeControls = edgeControls;

        this._createControlsDiv();

        Log.log("verbose", "finished initializing map controls", this);
    };

    MapControls.prototype._createControlsDiv = function () {
        this._$controlsDiv = $(compiledTemplates['map_controls']());

        let that = this;

        this._$controlsDiv.css({
            position: 'absolute',
        });

        let $body = $("body");
        $body.append(this._$controlsDiv);

        this._$controlsDiv.on("mousedown touchstart", function(e) {that._onMouseDown(e);});
        this._$controlsDiv.on("wheel", function(e) {that._onScroll(e);});
        $body.on("mousemove touchmove", function(e) {that._onMouseMove(e);});
        $body.on("mouseup touchend touchcancel", function(e) {that._onMouseUp(e);});

        let hammertime = new Hammer(this._$controlsDiv[0]);
        hammertime.get('pinch').set({enable: true, threshold: 10});
        hammertime.get('rotate').set({ enable: true , threshold: 10 });
        hammertime.on('pinch', function(e) { that._onMobilePinch(e); });
        hammertime.on('rotate', function(e) { that._onMobileRotate(e); });
        hammertime.on('rotatestart', function(e) { that._onMobileRotateStart(e); });

        this._$compassButton = $("#map_controls_compass");
        this._$compassButton.on('click', function(e) {that._resetMapRotation();});

        this._$centerMapButton = $("#map_controls_position_reset");
        this._$centerMapButton.on('click', function(e) {that._resetMapPosition();});

        this._$zoomInButton = $("#map_controls_zoom_in");
        this._$zoomInButton.on('click', function(e) {that._zoomInViaButton();});
        this._$zoomOutButton = $("#map_controls_zoom_out");
        this._$zoomOutButton.on('click', function(e) {that._zoomOutViaButton();});

        setInterval(function() {that._scaleControlsDiv();}, 20);
    };

    MapControls.prototype._scaleControlsDiv = function () {
        this._$controlsDiv.width(this._canvasManager.elementWidth());
        this._$controlsDiv.height(this._canvasManager.elementHeight());
        let pos = $(this._canvasManager.canvasElement()).offset();

        this._$controlsDiv.css({
            top: pos.top,
            left: pos.left
        });
    };

    MapControls.prototype._onMouseDown = function (e) {
        let isCtrl;
        if (window.event) {
            isCtrl = !!window.event.ctrlKey; // typecast to boolean
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

            let hitPosX, hitPosY;
            if (e.type == 'mousedown') {
                hitPosX = e.pageX;
                hitPosY = e.pageY;
            } else if (e.type == 'touchstart') {
                hitPosX = e.originalEvent.touches[0].pageX;
                hitPosY = e.originalEvent.touches[0].pageY;

                if (e.originalEvent.touches.length > 1) return;
            } 

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

    MapControls.prototype._onMarkerHitMove = function (marker) {
        this._edgeControls.onOtherMouseOver(marker);
        this._markerControls.onMarkerMouseOver(marker);
    };

    MapControls.prototype._onRouteHitMove = function (route) {
        this._markerControls.onOtherMouseOver(route);
        this._edgeControls.onEdgeMouseOver(route);
    };

    MapControls.prototype._onNothingHitMove = function () {
        this._markerControls.onOtherMouseOver();
        this._edgeControls.onOtherMouseOver();
    };

    MapControls.prototype._onMarkerHitClick = function (marker, e) {

        let hitPosX, hitPosY;
        if (e.type == 'mousedown') {
            hitPosX = e.pageX;
            hitPosY = e.pageY;
        } else if (e.type == 'touchstart') {
            hitPosX = e.originalEvent.touches[e.originalEvent.touches.length - 1].pageX;
            hitPosY = e.originalEvent.touches[e.originalEvent.touches.length - 1].pageY;
        } 
        let controlsOffset = this._$controlsDiv.offset();

        this._edgeControls.onOtherClicked(marker);
        this._markerControls.onMarkerClicked(marker, {x: hitPosX - controlsOffset.left, y: hitPosY - controlsOffset.top});
    };

    MapControls.prototype._onRouteHitClick = function (route) {
        this._markerControls.onOtherClicked(route);
        this._edgeControls.onEdgeClicked(route);
    };

    MapControls.prototype._onNothingHitClick = function (e) {
        this._translating = true;


        let hitPosX, hitPosY;
        if (e.type == 'mousedown') {
            hitPosX = e.pageX;
            hitPosY = e.pageY;
        } else if (e.type == 'touchstart') {
            hitPosX = e.originalEvent.touches[0].pageX;
            hitPosY = e.originalEvent.touches[0].pageY;
        } 

        this._manipulationStart = {x: hitPosX, y: hitPosY};

        this._markerControls.onOtherClicked(null);
        this._edgeControls.onOtherClicked(null);
    };

    MapControls.prototype._onMouseMove = function (e) {
        let hitPosX, hitPosY;
        if (e.type == 'mousemove') {
            hitPosX = e.pageX;
            hitPosY = e.pageY;
        } else if (e.type == 'touchmove') {
            if (e.originalEvent.touches.length > 1) return;

            hitPosX = e.originalEvent.touches[0].pageX;
            hitPosY = e.originalEvent.touches[0].pageY;
        } 

        if (this._translating) {
            let scale = this._canvasManager.getViewportScale();


            this._canvasManager.moveBy(
             {
                x: (hitPosX - this._manipulationStart.x) * scale,
                y: (hitPosY - this._manipulationStart.y) * scale
             });

            this._manipulationStart = {x: hitPosX, y: hitPosY};
        } else if (this._rotating) {
            this._rotationAngle = (this._manipulationStart.x - e.pageX) / 2;
            this._canvasManager.rotateBy(this._rotationAngle, this._canvasCenter());

            this._manipulationStart = {x: e.pageX, y: e.pageY};
        } else {
            let controlsOffset = this._$controlsDiv.offset();

            if (hitPosX >= controlsOffset.left && hitPosX <= controlsOffset.left + this._$controlsDiv.width() &&
                    hitPosY >= controlsOffset.top && hitPosY <= controlsOffset.top + this._$controlsDiv.height()) {
                let that = this;

                this._markerControls.onCanvasMouseMove({x: hitPosX - controlsOffset.left, y: hitPosY - controlsOffset.top});

                this._canvasManager.moveCursor({
                    x: hitPosX - controlsOffset.left, 
                    y: hitPosY - controlsOffset.top
                }, {
                    markerHit: function(marker) {that._onMarkerHitMove(marker);},
                    routeHit: function(route) {that._onRouteHitMove(route);},
                    nothingHit: function() {that._onNothingHitMove();}
                });
            }
        }
    };

    MapControls.prototype._onScroll = function (e) {
        this._canvasManager.zoomBy(e.originalEvent.wheelDelta / Math.abs(e.originalEvent.wheelDelta) * 0.3,
         {
            x: e.originalEvent.offsetX,
            y: e.originalEvent.offsetY
         });

        e.preventDefault();
    };

    MapControls.prototype._onMobilePinch = function (e) {
        let controlsOffset = this._$controlsDiv.offset();
        let scale = this._canvasManager.getViewportScale();

        let centerOnCanvas = {
            x: (e.center.x - controlsOffset.left) * scale,
            y: (e.center.y - controlsOffset.top) * scale
        };

        this._canvasManager.zoomBy(-e.velocity, centerOnCanvas);

        // console.log("pinch", e.velocity, e.velocityX, e.velocityY, e.center);
    };

    MapControls.prototype._onMobileRotateStart = function (e) {
        this.lastRotation = e.rotation;
    };

    MapControls.prototype._onMobileRotate = function (e) {
        let controlsOffset = this._$controlsDiv.offset();
        let scale = this._canvasManager.getViewportScale();

        let centerOnCanvas = {
            x: (e.center.x - controlsOffset.left) * scale,
            y: (e.center.y - controlsOffset.top) * scale
        };

        this._canvasManager.rotateBy(e.rotation - this.lastRotation);//, centerOnCanvas);
        this.lastRotation = e.rotation;

        // console.log("pinch", e.velocity, e.velocityX, e.velocityY, e.center);
    };

    MapControls.prototype._canvasCenter = function () {
        return {x: this._canvasManager.canvasWidth() / 2.0, y: this._canvasManager.canvasHeight() / 2.0};
    };

    MapControls.prototype._onMouseUp = function (e) {
        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._markerControls.onMouseUp();
    };

    MapControls.prototype._resetMapRotation = function (e) {
        this._canvasManager.setRotation(0);
    };

    MapControls.prototype._onCanvasRotationChanged = function (rotation) {
        this._$compassButton.children(0).children(0).css('transform', 'rotate(' + rotation + 'deg)');
    };

    MapControls.prototype._resetMapPosition = function (e) {
        this._canvasManager.centerImage();

    };

    MapControls.prototype._zoomInViaButton = function (e) {
        this._canvasManager.zoomBy(0.3);
    };

    MapControls.prototype._zoomOutViaButton = function (e) {
        this._canvasManager.zoomBy(-0.3);
    };

    return MapControls;
}());


       /* let hammertime = new Hammer($("body")[0], {});
        hammertime.get('pinch').set({enable: true});
        hammertime.get('rotate').set({ enable: true });
*/
        //hammertime.on('pinch', function(e) {console.log("pinch", e.velocity, e.velocityX, e.velocityY, e.center);});
        // e.center an e.center lassen, e.velocity gibt an, wie viel man skalieren soll // @todo: initial event??
        //hammertime.on('rotate', function(e) {console.log("rotate", e.angle, e.rotation, e.center);});
        // e.center um e.rotation rotieren! // @todo: initial event??