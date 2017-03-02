var MapVisuals = (function () {

    that = null;

    function MapVisuals () {
        this._htmlElement = null;
        this._canvas = null;
        this._ctx = null;
        this._fabricCanvas = null; // this is the fancy canvas library in use here :)

        this._visualsGroup = null;

        that = this;
    }

    MapVisuals.prototype.init = function ($contentArea) {
        Log.log("verbose", "Initializing Map visuals", this);
        this._htmlElement = compiledTemplates["map_canvas"]();

        $contentArea.append(this._htmlElement);

        this._canvas = $('#my_canvas').eq(0)[0];
        this._ctx = this._canvas.getContext('2d');
        this._fabricCanvas = new fabric.Canvas('my_canvas');

        let that = this;
        let src = "res/mathe_level1.svg";
        ImageLoader.loadImage(src, {success: that._imageLoaded,
                                 error: function() {Log.log("error", "image could not be loaded: " + src);} })

        Log.log("verbose", "Finished Initializing Map visuals", this);
    };

    MapVisuals.prototype._imageLoaded = function (image) {
        let imgInstance = new fabric.Image(image, {
            left: 0,
            top: 0,
            angle: 0
        });

        imgInstance.set({
            width: that._fabricCanvas.width, 
            height: that._fabricCanvas.height,
            originX: 'left',
            originY: 'top'
        });

        imgInstance.hasBorders = false;
        imgInstance.hasControls = false;

        that._visualsGroup = new fabric.Group([imgInstance], {
            left: 0,
            top: 0,
            angle: 0
        });

        that._visualsGroup.set({
            width: that._fabricCanvas.width, 
            height: that._fabricCanvas.height,
            originX: 'left',
            originY: 'top'
        });

        that._visualsGroup.hasBorders = false;
        that._visualsGroup.hasControls = false;


        that._fabricCanvas.add(that._visualsGroup);

        let hammertime = new Hammer($("body")[0], {});
        hammertime.get('pinch').set({enable: true});
        hammertime.get('rotate').set({ enable: true });

        //hammertime.on('pinch', function(e) {console.log("pinch", e.velocity, e.velocityX, e.velocityY, e.center);});
        // e.center an e.center lassen, e.velocity gibt an, wie viel man skalieren soll // @todo: initial event??
        //hammertime.on('rotate', function(e) {console.log("rotate", e.angle, e.rotation, e.center);});
        // e.center um e.rotation rotieren! // @todo: initial event??
    };

    MapVisuals.prototype.centerImage = function () {
        that._visualsGroup.setLeft(0);
        that._visualsGroup.setTop(0);
        
        that._fabricCanvas.renderAll();
    };

    MapVisuals.prototype.zoomTo = function (zoomLevel, center) {
        that._visualsGroup.setLeft(-center.x);
        that._visualsGroup.setTop(-center.y);
        
        that._visualsGroup.setScaleX(zoomLevel);
        that._visualsGroup.setScaleY(zoomLevel);        

        that._fabricCanvas.renderAll();
    };

    // set new absolute rotation.
    MapVisuals.prototype.rotateAround = function (rotation, center) {      
        that._visualsGroup.setAngle(0);

        let rotated = this._rotate(center, {
            x: that._visualsGroup.left + that._visualsGroup.width / 2, 
            y: that._visualsGroup.top + that._visualsGroup.height / 2
        }, rotation);

        that._visualsGroup.setLeft(rotated.x - that._visualsGroup.width / 2);
        that._visualsGroup.setTop(rotated.y - that._visualsGroup.height / 2);

        that._visualsGroup.setAngle(rotation);

        that._fabricCanvas.renderAll();
    };

    /*
     * Awesome matrix multiplication ^_^
     * (adjusted, original: http://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript)
     *
     */
    MapVisuals.prototype._rotate = function (center, point, angle) {
        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x,
            ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;
        return {x: nx, y: ny};
    };

    return MapVisuals;
}());

