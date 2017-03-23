navigame.PathManager = (function () {

    function PathManager() {
        this.markerControls = null;
    }

    PathManager.prototype.init = function(markerControls) {
        this.markerControls = markerControls;

        let that = this;

        $(this.markerControls).on("markerCreated", function(event, marker) {
            console.log(marker);
        });
    };

    return PathManager;
}());
