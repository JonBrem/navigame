/**
 * PathSaveLoad can ask the server to initiate a game,
 *  save a session and load a session.
 *  This is a singleton.
 *  @name navigame.PathSaveLoad
 */
navigame.PathSaveLoad = (function() {
    
    let that = {},

    /**
     * requestId asks the server to create a new session.
     * @name PathSaveLoad#requestId
     * @param  {Function} onSuccess - jQuery ajax success callback
     * @param  {Function} onError   - jQuery ajax error callback
     */
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

    /**
     * savePath stores the path for the current session.
     * @memberof PathSaveLoad
     * @param  {Function} onSuccess - jQuery ajax success callback
     * @param  {Function} onError   - jQuery ajax error callback
     */
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

    /**
     * loadPath loads a path (including its session id, start and goal).
     * @memberof PathSaveLoad
     * @param  {Function} onSuccess - jQuery ajax success callback
     * @param  {Function} onError   - jQuery ajax error callback
     */
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
