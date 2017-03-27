navigame.ElementScaler = (function() {

    function ElementScaler () {
        let that = this;
        $(window).resize(_.debounce(function(){
            that.rescale();
        }, 100));

        this._$title = null;
        this._$gameControls = null;

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

    ElementScaler.prototype.referenceElements = function () {
        this._$title = $("#title_bar_area");
        this._$gameControls = null;

        this._$canvasContainer = $(".canvas-container");
        this._$lowerCanvas = this._$canvasContainer.children().eq(0);
        this._$upperCanvas = this._$canvasContainer.children().eq(1);

        this._$controlsDiv = $("#controls-section");
        this._$mapControlsDiv = $("#map_list_area");
    };

    ElementScaler.prototype.rescale = function () {
        let windowWidth = $(window.top).width();
        let windowHeight = $(window.top).height();

        // max. 3 / 16 of height
        this._rescaleTitle(windowWidth, windowHeight);
        
        // 8 / 16 of height (but has a max. width)
        this._rescaleCanvas(windowWidth, windowHeight);
 
        // 2 / 16 of height
        this._rescaleMarkerControls(windowWidth, windowHeight);
        
        // 3 / 16 of height
        this._rescaleMapConrols(windowWidth, windowHeight);
    };

    ElementScaler.prototype._rescaleTitle = function(windowWidth, windowHeight) {
        // bottom most element minus start element
        let desiredHeight = ($("#from_node").offset().top + $("#from_node").height()) - $("#game_name").offset().top;
        let height = Math.min(desiredHeight, windowHeight * (3 / 16.0));

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
