//UTILS
function extend(out){
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
        if (!arguments[i])
            continue;

        for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key))
                out[key] = arguments[i][key];
        }
    }

    return out;
};


const data = (function () {
    let lastId = 0,
        store = {};

    return {
        set: function (element, prop, info) {
            if (element.myCustomDataTag === undefined) {
                element.myCustomDataTag = {};
            }
            var id;
            if (element.myCustomDataTag[prop] === undefined) {
                id = lastId++;
                element.myCustomDataTag[prop] = id;
            } else {
                store[element.myCustomDataTag[prop]] = info;
                return;
            }

            store[id] = info;
        },

        get: function (element, prop) {
            if (element.myCustomDataTag === undefined) {
                element.myCustomDataTag = {};
            }
            return store[element.myCustomDataTag[prop]];
        },
        remove: function (element, prop) {
            if (element.myCustomDataTag === undefined) {
                return;
            }

            if(!prop){
                for(let key  in element.myCustomDataTag){
                    if(element.myCustomDataTag.hasOwnProperty(key)){
                        delete store[element.myCustomDataTag[key]];
                    };
                }
                delete element.myCustomDataTag;
                return;
            }

            if (element.myCustomDataTag[prop] === undefined) {
                return;
            }
            delete store[element.myCustomDataTag[prop]];
            delete  element.myCustomDataTag[prop];
        }
    };
}());


const defaults = {
    reCalcOnWindowResize: true,
    throttleDuration: 17 //ms - set to 0 to disable throttling
};

//Setup a container instance
const setupContainer = (el) => {
    var imageSrc = el.querySelector('img').getAttribute('src');

    data.set(el, 'imageSrc', imageSrc);

    resolveImageSize(imageSrc, function (err, dim) {
        data.set(el, 'imageW', dim.width);
        data.set(el, 'imageH', dim.height);
        adjustFocus(el);
    });
};

//Get the width and the height of an image
//by creating a new temporary image
var resolveImageSize = function (src, cb) {
    //Create a new image and set a
    //handler which listens to the first
    //call of the 'load' event.
    var img = new Image();

    function onImgLoad() {
        cb(null, {
            width: this.naturalWidth,
            height: this.naturalHeight
        });

        img.removeEventListener('load', onImgLoad);
    }

    img.addEventListener('load', onImgLoad);

    img.src = src;

};

//Create a throttled version of a function
var throttle = function (fn, ms) {
    var isRunning = false;
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (isRunning) return false;
        isRunning = true;
        setTimeout(function () {
            isRunning = false;
            fn.apply(null, args);
        }, ms);
    };
};

//Calculate the new left/top values of an image
var calcShift = function (conToImageRatio, containerSize, imageSize, focusSize, toMinus) {
    var containerCenter = Math.floor(containerSize / 2); //Container center in px
    var focusFactor = (focusSize + 1) / 2; //Focus point of resize image in px
    var scaledImage = Math.floor(imageSize / conToImageRatio); //Can't use width() as images may be display:none
    var focus = Math.floor(focusFactor * scaledImage);
    if (toMinus) focus = scaledImage - focus;
    var focusOffset = focus - containerCenter; //Calculate difference between focus point and center
    var remainder = scaledImage - focus; //Reduce offset if necessary so image remains filled
    var containerRemainder = containerSize - containerCenter;
    if (remainder < containerRemainder) focusOffset -= containerRemainder - remainder;
    if (focusOffset < 0) focusOffset = 0;

    return (focusOffset * -100 / containerSize) + '%';
};

//Re-adjust the focus
var adjustFocus = function (el) {
    var imageW = data.get(el, 'imageW');
    var imageH = data.get(el, 'imageH');
    var imageSrc = data.get(el, 'imageSrc');

    if (!imageW && !imageH && !imageSrc) {
        return setupContainer(el); //Setup the container first
    }

    var containerW = el.offsetWidth;
    var containerH = el.offsetHeight;
    var focusX = parseFloat(el.getAttribute('data-focus-x'));
    var focusY = parseFloat(el.getAttribute('data-focus-y'));
    var $image = el.querySelectorAll('img')[0];

    //Amount position will be shifted
    var hShift = 0;
    var vShift = 0;

    if (!(containerW > 0 && containerH > 0 && imageW > 0 && imageH > 0)) {
        return false; //Need dimensions to proceed
    }

    //Which is over by more?
    var wR = imageW / containerW;
    var hR = imageH / containerH;

    //Reset max-width and -height
    $image.style.maxWidth = '';
    $image.style.maxHeight = '';

    //Minimize image while still filling space
    if (imageW > containerW && imageH > containerH) {
        if (wR > hR) {
            $image.style.maxHeight = '100%';
        } else {
            $image.style.maxWidth = '100%';
        }

    }

    if (wR > hR) {
        hShift = calcShift(hR, containerW, imageW, focusX);
    } else if (wR < hR) {
        vShift = calcShift(wR, containerH, imageH, focusY, true);
    }

    $image.style.top = vShift;
    $image.style.left = hShift;

};


var focusPoint = function ($el, settings) {
    var thrAdjustFocus = settings.throttleDuration ?
        throttle(function () {
            adjustFocus($el);
        }, settings.throttleDuration)
        : function () {
            adjustFocus($el);
        };//Only throttle when desired
    var isListening = false;

    adjustFocus($el); //Focus image in container

    //Expose a public API
    return {

        adjustFocus: function () {
            return adjustFocus($el);
        },

        windowOn: function () {
            if (isListening) return;
            //Recalculate each time the window is resized
            window.addEventListener('resize', thrAdjustFocus);
            return isListening = true;
        },

        windowOff: function () {
            if (!isListening) return;
            //Stop listening to the resize event
            window.removeEventListener('resize', thrAdjustFocus);
            isListening = false;
            return true;
        }

    };
};

function FocusPoint(el, optionsOrMethod) {
    const settings = extend({}, defaults, optionsOrMethod);
    const fp = focusPoint(el, settings);
    if (data.get(el, 'focusPoint')) {
        data.get(el, 'focusPoint').windowOff();
    }
    data.set(el, 'focusPoint', fp);
    if (settings.reCalcOnWindowResize) fp.windowOn();
    return fp;
}


export default FocusPoint;