/**
 * The ImageLoader is not in the navigame namespace because it is completely independent
 * of the game, although it does require a template ('hiddenImage').
 *
 * It can load an image and trigger a callback when it is fully loaded.
 */
var ImageLoader = (function() {
    
    let that = {},
        loadedImages = {},

    /**
     * loadImage downloads an image with a given src and
     *  triggers a callback when the download is complete.
     *  If the image has already been loaded, it will not be downloaded again.
     * @param  {string}   src      - image src (some url, can be relative)
     * @param  {object} callback - object containing two functions:
     *                             {success: function(imgElement) {...},
     *                              error: function() {...} }
     */
    loadImage = function (src, callback) {
        if (src in loadedImages) {
            callback.success(loadedImages[src]);
        } else {
            let id = _createId();
            let imgString = compiledTemplates.hiddenImage({
                data: {
                    src: src,
                    id: id
                }
            });

            $("body").append(imgString);
            imgElement = document.getElementById(id);

            if (imgElement.complete) {
                callback.success(imgElement);
            } else {
                imgElement.addEventListener('load', function() {
                   callback.success(imgElement);
                });
                imgElement.addEventListener('error', callback.error);
            }

            loadedImages[src] = imgElement;
        }
    },

    /**
     * _createId creates a unique HTML id for an image. only unique if this is the
     *  only place that creates these ids; they could, theoretically, not be unique.
     * @return {string} description
     */
    _createId = function() {
        let images = $(".loaded_image_hidden");
        return "loaded_images_hidden_" + images.length;
    };

    that.loadImage = loadImage;
    return that;
}());
