var ImageLoader = (function() {
    
    let that = {},
        loadedImages = {},


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

    _createId = function() {
        let images = $(".loaded_image_hidden");
        return "loaded_images_hidden_" + images.length;
    };

    that.loadImage = loadImage;
    return that;
}());
