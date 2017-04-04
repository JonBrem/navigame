navigame.ElementScaler = (function() {

    /**
     * ElementScaler constructor. References elements, and 
     *  sets a timer that rescales the elements after the window's size changed.
     *  That scaling also happens once initially.
     * @constructor
     * @global
     * @class
     * @classdesc the ElementScaler is meant to ensure that the application
     *  always fits within the browser window vertically. 
     *  Most of the scaling happens in media queries in the style sheet!!!
     */
    function ElementScaler () {
        let that = this;
        $(window).resize(_.debounce(function(){ // <- rescale after the last time the window was resized is .1 seconds ago
                                                // (so it isn't called continously, which could be slow)
            that.rescale();
        }, 100));

        this._$title = null;
        this._$titleElements = {};

        this._$lowerCanvas = null;
        this._$upperCanvas = null;
        this._$canvasContainer = null;

        this._$controlsDiv = null;
        
        this._$mapControlsDiv = null;

        setTimeout(function() {
            that.referenceElements();
            that.rescale();
        }, 50);
    }

    /** 
     * referenceElements references HTML elements.
     *
     * @memberof ElementScaler
     */
    ElementScaler.prototype.referenceElements = function () {
        this._$title = $("#title_bar_area");
        this._$titleElements = {
            titleHeader: this._$title.find('h1'),
            titleBar: this._$title.find('.title-bar')
        };
        
        this._$canvasContainer = $(".canvas-container");
        this._$lowerCanvas = this._$canvasContainer.children().eq(0);
        this._$upperCanvas = this._$canvasContainer.children().eq(1);

        this._$controlsDiv = $("#controls-section");
        this._$mapControlsDiv = $("#map_list_area");
    };

    /**
     * rescale sets (predomininantly) the height of the main elements on display.
     * @memberof ElementScaler
     */
    ElementScaler.prototype.rescale = function () {
        let windowWidth = Math.max($(window.top).width(), 300);
        let windowHeight = Math.max($(window.top).height(), 500);

        // max. 3 / 16 of height
        this._rescaleTitle(windowWidth, windowHeight);
        
        // 8 / 16 of height (but has a max. width)
        this._rescaleCanvas(windowWidth, windowHeight);
 
        // 2 / 16 of height
        this._rescaleMarkerControls(windowWidth, windowHeight);
        
        // 3 / 16 of height
        this._rescaleMapConrols(windowWidth, windowHeight);
    };

    // these methods set the height of the different parts, to ensure that even if one object
    // is too big, there is no scrolling (which may be an odd design choice)
    // _rescaleCanvas is an exception; since the canvas is a square, this also sets its width.

    ElementScaler.prototype._rescaleTitle = function(windowWidth, windowHeight) {
        // bottom most element minus start element
        let desiredHeight = ($("#from_node").offset().top + $("#from_node").height()) - $("#game_name").offset().top;
        let height = Math.min(windowHeight * (3 / 16.0));

        this._$title.height(height);
    };

    ElementScaler.prototype._rescaleCanvas = function(windowWidth, windowHeight) {
        let height = Math.min(500, windowHeight * (8 / 16.0), windowWidth);
        let width = height;

        this._$canvasContainer.css({'width': width, 'height': height});
        this._$lowerCanvas.css({'width': width, 'height': height});
        this._$upperCanvas.css({'width': width, 'height': height});
    };

    ElementScaler.prototype._rescaleMarkerControls = function(windowWidth, windowHeight) {
       let height = Math.min(500, windowHeight * (2 / 16.0));
       this._$controlsDiv.height(height);
    };

    ElementScaler.prototype._rescaleMapConrols = function(windowWidth, windowHeight) {
       let height = Math.min(500, windowHeight * (3 / 16.0));
       this._$mapControlsDiv.height(height);
    };

    return ElementScaler;
})();
