navigame.MapVisuals = (function () {

    let that = null;

    function MapVisuals () {
        this._canvasManager = null;

        that = this;
    }

    MapVisuals.prototype.init = function (canvasManager) {
        Log.log("verbose", "Initializing Map visuals", this);

        this._canvasManager = canvasManager;

        let that = this;
        /*let src = "mathematik-erdgeschoss.jpg.svg";
        ImageLoader.loadImage(src, {success: that._imageLoaded,
                                 error: function() {Log.log("error", "image could not be loaded: " + src);} });*/

        Log.log("verbose", "Finished Initializing Map visuals", this);
    };

    MapVisuals.prototype.loadNewMap = function(imgSrc, callback) {
        let that = this;
        ImageLoader.loadImage(WEBROOT + '/' + imgSrc, 
            {
                success: function (image) {
                    that._imageLoaded(image);
                    if (callback) {
                        callback();
                    }
                },
                error: function() {Log.log("error", "image could not be loaded: " + imgSrc);} 
            }
        );
    };

    MapVisuals.prototype._imageLoaded = function (image) {
        let naturalWidth = image.naturalWidth;
        let naturalHeight = image.naturalHeight;

        let widthScaleFactor = naturalWidth > naturalHeight? 1 : naturalWidth / naturalHeight;
        let heightScaleFactor = naturalHeight > naturalWidth? 1 : naturalHeight / naturalWidth;

        let fabricWidth = that._canvasManager.canvasWidth() * widthScaleFactor;
        let fabricHeight = that._canvasManager.canvasHeight() * heightScaleFactor;

        let imgInstance = new fabric.Image(image, {
            left: -fabricWidth / 2,
            top: -fabricHeight / 2,
            angle: 0,
            width: fabricWidth,
            height: fabricHeight,
            originX: 'left',
            originY: 'top'
        });

        imgInstance.hasBorders = false;
        imgInstance.hasControls = false;
        imgInstance.hasRotatingPoint = false;

        that._canvasManager.setA

        that._canvasManager.setMapImage(imgInstance);
    };

    return MapVisuals;
}());

