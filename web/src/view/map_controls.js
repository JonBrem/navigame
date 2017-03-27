navigame.MapControls = (function () {

    function MapControls() {
        this._canvasManager = null; 
        this._$controlsDiv = null;

        this._translating = false;
        this._rotating = false;
        this._scaling = false;

        this._manipulationStart = null;

        this._rotationAngle = 0;
    }

    MapControls.prototype.init = function (canvasManager) {
        Log.log("verbose", "initializing map controls", this);
        this._canvasManager = canvasManager;

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

        let positionOnMap = this._canvasManager.calculatePositionOnMap({x: e.offsetX, y: e.offsetY});
        // console.log(this._canvasManager.calculatePositionOnMap({x: e.offsetX, y: e.offsetY}));

        if (this._canvasManager.isClickOnMap(positionOnMap)) {
            if (isCtrl) {
                this._rotating = true;
                this._rotationAngle = 0;
                this._manipulationStart = {x: e.pageX, y: e.pageY};
            } else {
                this._translating = true;
                this._manipulationStart = {x: e.offsetX, y: e.offsetY};
            }
        }

        e.preventDefault();
        e.stopPropagation();
    };

    MapControls.prototype.onMarkerMouseDown = function() {

    };

    MapControls.prototype.onRouteMouseDown = function() {

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