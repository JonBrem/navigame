var MapVisuals = (function () {

    let that = null;

    function MapVisuals () {
        this._canvasManager = null;

        that = this;
    }

    MapVisuals.prototype.init = function (canvasManager) {
        Log.log("verbose", "Initializing Map visuals", this);

        this._canvasManager = canvasManager;

        let that = this;
        let src = "res/mathe_level1.svg";
        ImageLoader.loadImage(src, {success: that._imageLoaded,
                                 error: function() {Log.log("error", "image could not be loaded: " + src);} })

        Log.log("verbose", "Finished Initializing Map visuals", this);
    };

    MapVisuals.prototype._imageLoaded = function (image) {
        let imgInstance = new fabric.Image(image, {
            left: -that._canvasManager.canvasWidth() / 2,
            top: -that._canvasManager.canvasHeight() / 2,
            angle: 0,
            width: that._canvasManager.canvasWidth(),
            height: that._canvasManager.canvasHeight(),
            originX: 'left',
            originY: 'top'
        });

        imgInstance.hasBorders = false;
        imgInstance.hasControls = false;
        imgInstance.hasRotatingPoint = false;

        that._canvasManager.addToVisualLayer(imgInstance);
    };

    return MapVisuals;
}());

