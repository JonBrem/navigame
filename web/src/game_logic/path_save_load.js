navigame.PathSaveLoad = (function() {
    
    let that = {},

    requestId = function (onSuccess, onError) {
        Log.log("verbose", "requesting id", that);

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: 'request_id',
            },
            success: onSuccess,
            error: onError
        });
    },

    savePath = function (pathJson, onSuccess, onError) {
        Log.log("verbose", "saving path", that);

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: 'save_path',
                path_data: JSON.stringify(pathJson)
            },
            success: onSuccess,
            error: onError
        });
    },

    loadPath = function (whichId, onSuccess, onError) {
        Log.log("verbose", "loading path", that);

        $.ajax({
            url: WEBROOT + NAVIGAME_API,
            type: 'GET',
            dataType: 'json',
            data: {
                method: 'load_path',
                path_id: whichId
            },
            success: onSuccess,
            error: onError
        });
    };

    that.requestId = requestId;
    that.savePath = savePath;
    that.loadPath = loadPath;

    return that;
})();
