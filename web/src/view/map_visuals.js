navigame.MapVisuals = (function () {

    /**
     * MapVisuals constructor. only references the canvas manager, does nothing else.
     * @constructor
     * @global
     * @class
     * @classdesc Simple data container for paths. Consists of mapPaths, which in turn
     *  contain nodes and edges of a route.
     * @param {navigame.CanvasManager} canvasManager - the game's canvas maanger
     */
    function MapVisuals (canvasManager) {
        Log.log("verbose", "Initializing Map visuals", this);
        this._canvasManager = canvasManager;
        Log.log("verbose", "Finished Initializing Map visuals", this);
    };

    /**
     * loadNewMap downloads the image; if it was successfully downloaded, the
     *  callback will be invoked after it was set as the new map image.
     * @param  {string}   imgSrc - name, but without the WEBROOT-prefix.
     * @param  {Function} callback - Success callback (no params, not an event callback). Optional.
     * @memberof MapVisuals
     */
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

    /**
     * _imageLoaded is called if the image was successfully downloaded,
     *  and will create a fabric.Image that is set as the new background map on the fabric
     *  canvas.
     * @param  {Image} image - HTML Image element
     * @memberof MapVisuals
     */
    MapVisuals.prototype._imageLoaded = function (image) {
        let naturalWidth = image.naturalWidth;
        let naturalHeight = image.naturalHeight;

        let widthScaleFactor = naturalWidth > naturalHeight? 1 : naturalWidth / naturalHeight;
        let heightScaleFactor = naturalHeight > naturalWidth? 1 : naturalHeight / naturalWidth;

        let fabricWidth = this._canvasManager.canvasWidth() * widthScaleFactor;
        let fabricHeight = this._canvasManager.canvasHeight() * heightScaleFactor;

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

        this._canvasManager.setMapImage(imgInstance);
    };

    return MapVisuals;
}());

