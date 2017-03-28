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

        this._rotationAngle = 0;
    }

    MapControls.prototype.init = function (canvasManager, markerControls, edgeControls) {
        Log.log("verbose", "initializing map controls", this);
        this._canvasManager = canvasManager;

        this._markerControls = markerControls;
        this._edgeControls = edgeControls;

        this._createInvisibleControlsDiv();

        Log.log("verbose", "finished initializing map controls", this);
    };

    MapControls.prototype._createInvisibleControlsDiv = function () {
        this._$controlsDiv = $('<div id="map_controls_inv_layer">&nbsp;</div>');

        let that = this;

        this._$controlsDiv.css({
            position: 'absolute',
        });

        let $body = $("body");
        $body.append(this._$controlsDiv);

        this._$controlsDiv.on("mousedown", function(e) {that._onMouseDown(e);});
        this._$controlsDiv.on("wheel", function(e) {that._onScroll(e);});
        $body.on("mousemove", function(e) {that._onMouseMove(e);});
        $body.on("mouseup", function(e) {that._onMouseUp(e);});

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
            isCtrl = !!ev.ctrlKey;
        }
        
        if (isCtrl) {
            this._rotating = true;
            this._rotationAngle = 0;
            this._manipulationStart = {x: e.pageX, y: e.pageY};
        } else {
            let controlsOffset = this._$controlsDiv.offset();
            let that = this;

            this._canvasManager.moveCursor({
                x: e.pageX - controlsOffset.left, 
                y: e.pageY - controlsOffset.top
            }, {
                markerHit: function(marker) {that._onMarkerHitClick(marker);},
                routeHit: function(route) {that._onRouteHitClick(route);},
                nothingHit: function() {that._onNothingHitClick(e);}
            });
        }
    
        e.preventDefault();
        e.stopPropagation();
    };

    MapControls.prototype.onSelectionCollision = function () {

    };

    MapControls.prototype.onMarkerMouseDown = function (e) {
    };

    MapControls.prototype.onRouteMouseDown = function () {

    };

    MapControls.prototype._onMarkerHitMove = function (marker) {
        console.log(marker);
    };

    MapControls.prototype._onRouteHitMove = function (route) {
        console.log(route);
    };

    MapControls.prototype._onNothingHitMove = function () {
    };

    MapControls.prototype._onMarkerHitClick = function (marker) {
        this._edgeControls.onOtherClicked(marker);
        this._markerControls.onMarkerClicked(marker);
    };

    MapControls.prototype._onRouteHitClick = function (route) {
        this._markerControls.onOtherClicked(route);
        this._edgeControls.onEdgeClicked(route);
    };

    MapControls.prototype._onNothingHitClick = function (e) {
        this._translating = true;
        this._manipulationStart = {x: e.offsetX, y: e.offsetY};

        this._markerControls.onOtherClicked(null);
        this._edgeControls.onOtherClicked(null);
    };

    MapControls.prototype._onMouseMove = function (e) {
        if (this._translating) {
            this._canvasManager.moveBy(
             {
                x: e.offsetX - this._manipulationStart.x,
                y: e.offsetY - this._manipulationStart.y
             });

            this._manipulationStart = {x: e.offsetX, y: e.offsetY};
        } else if (this._rotating) {
            this._rotationAngle = (this._manipulationStart.x - e.pageX) / 2;
            this._canvasManager.rotateBy(this._rotationAngle, this._canvasCenter());

            this._manipulationStart = {x: e.pageX, y: e.pageY};
        } else {
            let controlsOffset = this._$controlsDiv.offset();

            if (e.pageX >= controlsOffset.left && e.pageX <= controlsOffset.left + this._$controlsDiv.width() &&
                    e.pageY >= controlsOffset.top && e.pageY <= controlsOffset.top + this._$controlsDiv.height()) {
                let that = this;

                this._markerControls.onCanvasMouseMove({x: e.pageX, y: e.pageY});

                /*this._canvasManager.moveCursor({
                    x: e.pageX - controlsOffset.left, 
                    y: e.pageY - controlsOffset.top
                }, {
                    markerHit: function(marker) {that._onMarkerHitMove(marker);},
                    routeHit: function(route) {that._onRouteHitMove(route);},
                    nothingHit: function() {that._onNothingHitMove();}
                }); */
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

    MapControls.prototype._canvasCenter = function () {
        return {x: this._canvasManager.canvasWidth() / 2.0, y: this._canvasManager.canvasHeight() / 2.0};
    };

    MapControls.prototype._onMouseUp = function (e) {
        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._markerControls.onMouseUp();
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