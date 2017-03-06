var CanvasManager = (function () {

    let that = null;

    function CanvasManager () {
        this._htmlElement = null;
        this._canvas = null;
        this._ctx = null;
        this._fabricCanvas = null; // this is the fancy canvas library in use here :)

        this._visualsGroup = null;

        that = this;
    }

    CanvasManager.prototype.init = function ($contentArea) {
        Log.log("verbose", "Initializing Canvas Manager", this);
        this._htmlElement = compiledTemplates["map_canvas"]();

        $contentArea.append(this._htmlElement);

        this._canvas = $('#my_canvas').eq(0)[0];
        this._ctx = this._canvas.getContext('2d');
        this._fabricCanvas = new fabric.Canvas('my_canvas');

        this._initVisualLayer();

        Log.log("verbose", "Finished Initializing Canvas Manager", this);
    };

    CanvasManager.prototype.addToInteractionLayer = function () {

    };

    CanvasManager.prototype.addToVisualLayer = function (fabricObj) {
        this._visualsGroup.add(fabricObj);
        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.canvasWidth = function () {
        return this._fabricCanvas.width;
    };

    CanvasManager.prototype.canvasHeight = function () {
        return this._fabricCanvas.height;
    };

    CanvasManager.prototype.elementWidth = function () {
        return $(this._fabricCanvas.upperCanvasEl).width();
    };

    CanvasManager.prototype.elementHeight = function () {
        return $(this._fabricCanvas.upperCanvasEl).height();
    };

    CanvasManager.prototype.canvasElement = function () {
        return this._fabricCanvas.upperCanvasEl;
    };

    CanvasManager.prototype.centerImage = function () {
        this._visualsGroup.setLeft(0);
        this._visualsGroup.setTop(0);

        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.moveTo = function (pos) {
        this._visualsGroup.setLeft(pos.x);
        this._visualsGroup.setTop(pos.y);

        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.moveBy = function (pos) {
        let zoomMultiplier = this._fabricCanvas.getZoom();
        pos.x /= zoomMultiplier;
        pos.y /= zoomMultiplier;

        let prevPos = {x: this._visualsGroup.getLeft(), y: this._visualsGroup.getTop()};

        this.moveTo({x: prevPos.x + pos.x, y: prevPos.y + pos.y});
    };

    CanvasManager.prototype.zoomTo = function (zoomLevel, center) {
        this._visualsGroup.setLeft(-center.x);
        this._visualsGroup.setTop(-center.y);

        this._visualsGroup.setScaleX(zoomLevel);
        this._visualsGroup.setScaleY(zoomLevel);

        this._fabricCanvas.renderAll();
    };

    CanvasManager.prototype.zoomBy = function (zoomDelta, center) {
        //this._visualsGroup.setLeft(-center.x);
        //this._visualsGroup.setTop(-center.y);

        let zoomBefore = this._fabricCanvas.getZoom();

        this._fabricCanvas.zoomToPoint(new fabric.Point(center.x, center.y), zoomDelta + zoomBefore);

        this._fabricCanvas.renderAll();
    };

    // set new absolute rotation
    CanvasManager.prototype.setRotation = function (rotation, center) {
        let prevRotation = this._visualsGroup.getAngle();
        this.rotateBy(-prevRotation, center, false);
        this.rotateBy(rotation, center, true);
    };

    // relative rotation
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

        if (updateRender)
            this._fabricCanvas.renderAll();
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
            lockMovementY: true
        });

        this._visualsGroup.hasBorders = false;
        this._visualsGroup.hasControls = false;
        this._visualsGroup.hasRotatingPoint = false;
        this._fabricCanvas.add(this._visualsGroup);
    };

    return CanvasManager;
}());

