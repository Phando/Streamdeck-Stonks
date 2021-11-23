const deg2rad = deg => (deg * Math.PI) / 180.0;

Number.prototype.countDigits = function () {
    if(Math.floor(this.valueOf()) === this.valueOf() || Math.abs(this.valueOf()) < 1) return 0
    return this.toString().split(".")[0].length || 0
}

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0
    return this.toString().split(".")[1].length || 0
}

Number.prototype.countDecimalZeros = function () {
    if(Math.floor(this.valueOf()) === this.valueOf() || this.valueOf() > 0.1) return 0
    let test = this.toString().split(".")[1]
    return (test.match(/^0+/) || [''])[0].length
}

Number.prototype.toPrecisionPure = function(precision) {
	  if(typeof precision == 'undefined') return this.valueOf()
		
    let parts = this.toString().split(".")
    let whole = parts[0]
    let fraction = parts.length > 1 ? parts[1] : ''
  	
    if(precision <= 0)
    	return whole
    
    fraction = fraction.substring(0,precision)
    fraction = fraction.padEnd(precision, 0)
    return whole +'.'+ fraction
}

Number.prototype.abbreviateNumber = function (maxLength=6, precision=2) {
  let value = this.valueOf()
  let dig = value.countDigits()
  let dec = Math.max(value.countDecimals(), precision)
  let zer = value.countDecimalZeros()
  
  if(dig + dec <= maxLength)
  	return value.toPrecisionPure(dec)
  
  if(zer>2){ 
  	value = value.toString().replace(/^[.|0]*/,'').substring(0,maxLength-1)
  	return '`0' + value
  }
  
  if(maxLength - dig >= 0)
  	return value.toPrecisionPure(Math.min(2, maxLength - dig))
  
  let digits = dig % 3 == 0 ? 0 :  3 - Math.round(dig % 3)
  return new Intl.NumberFormat( 'en-US', { maximumFractionDigits: digits, notation: 'compact', compactDisplay: 'short'}).format(value)
}



var Utils = {
    sleep: function (milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    isUndefined: function (value) {
        return typeof value === 'undefined';
    },
    isObject: function (o) {
        return (
            typeof o === 'object' &&
            o !== null &&
            o.constructor &&
            o.constructor === Object
        );
    },
    isArray: function (value) {
        return Array.isArray(value);
    },
    isNumber: function (value) {
        return typeof value === 'number' && value !== null;
    },
    isInteger (value) {
        return typeof value === 'number' && value === Number(value);
    },
    isString (value) {
        return typeof value === 'string';
    },
    isImage (value) {
        return value instanceof HTMLImageElement;
    },
    isCanvas (value) {
        return value instanceof HTMLCanvasElement;
    },
    isValue: function (value) {
        return !this.isObject(value) && !this.isArray(value);
    },
    isNull: function (value) {
        return value === null;
    },
    toInteger: function (value) {
        const INFINITY = 1 / 0,
            MAX_INTEGER = 1.7976931348623157e308;
        if (!value) {
            return value === 0 ? value : 0;
        }
        value = Number(value);
        if (value === INFINITY || value === -INFINITY) {
            const sign = value < 0 ? -1 : 1;
            return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
    }
};

Utils.minmax = function (v, min = 0, max = 100) {
    return Math.min(max, Math.max(min, v));
};

Utils.unique = function(arr) {
    return Array.from(new Set(arr));
};

//-----------------------------------------------------------------------------------------

Utils.transformValue = function(prcnt, min, max) {
    return Math.round(((max - min) * prcnt) / 100 + min);
};

//-----------------------------------------------------------------------------------------

Utils.rangeToPercent = function (value, min, max) {
    return (value - min) / (max - min);
};

//-----------------------------------------------------------------------------------------

Utils.percentToRange = function (percent, min, max) {
    return (max - min) * percent + min;
};

//-----------------------------------------------------------------------------------------

Utils.abbreviateNumber = function(value, precision=2, delta=0) {
    if(value == 0 || (value > 0.001 && value < 10000))
        return value.toDecimals(precision)

    if(value > 0.001){
        let digits = value % 3 == 0 ? 0 : 1
        return new Intl.NumberFormat( 'en-US', { maximumFractionDigits: digits, notation: 'compact', compactDisplay: 'short'}).format(value)
    }
    
    // Small number truncation
    let pad = delta==0 ? '`0' : '`0' + Array(delta).fill(0).join('')
    value = value.toString().substring(2, Number(precision)+2)
    return  pad + value.replace(/^[^1-9]*/,'')
};

//-----------------------------------------------------------------------------------------

Utils.calculateFont = function(text, width=CANVAS_WIDTH, min=10, max=50, weight=600) {
    if (max - min < 1){
        _drawingCtx.font = weight + " " + min + "px Arial"
        return min
    }

    var test = min + (max - min) / 2 //Find half interval
    _drawingCtx.font = weight + " " + test + "px Arial"
    
    if( _drawingCtx.measureText(text).width > width) 
        return Utils.calculateFont(text, width, min, test, weight)
    
    return Utils.calculateFont(text, width, test, max, weight)
};

//-----------------------------------------------------------------------------------------

Utils.setDebugOutput = debug => {
    return debug === true ? console.log.bind(window.console) : function() {};
};

Utils.randomComponentName = function (len = 6) {
    return `${Utils.randomLowerString(len)}-${Utils.randomLowerString(len)}`;
};

Utils.shuffleArray = arr => {
    let i, j, tmp;
    for(i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        tmp = arr[ i ];
        arr[ i ] = arr[ j ];
        arr[ j ] = tmp;
    }
    return a;
};

Utils.randomElementFromArray = arr => {
    return arr[ Math.floor(Math.random() * arr.length) ];
};

Utils.arrayToObject = (arr, key) => {
    arr.reduce((obj, item) => {
        obj[item[key]] = item;
        return obj;
    }, {});
};

Utils.randomString = function (len = 8) {
    return Array.apply(0, Array(len))
        .map(function () {
            return (function (charset) {
                return charset.charAt(
                    Math.floor(Math.random() * charset.length)
                );
            })('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        })
        .join('');
};

Utils.rs = function (len = 8) {
    return [...Array(len)].map(i => (~~(Math.random() * 36)).toString(36)).join('');
};

Utils.randomLowerString = function (len = 8) {
    return Array.apply(0, Array(len))
        .map(function () {
            return (function (charset) {
                return charset.charAt(
                    Math.floor(Math.random() * charset.length)
                );
            })('abcdefghijklmnopqrstuvwxyz');
        })
        .join('');
};

Utils.capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

Utils.generateID = (len = 4, num = Number.MAX_SAFE_INTEGER) => {
    return Array.from(new Array(len))
        .map(() => Math.floor(Math.random() * num).toString(16))
        .join("-");
};

Utils.measureText = (text, font) => {
    const canvas = Utils.measureText.canvas || (Utils.measureText.canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    ctx.font = font || 'bold 10pt system-ui';
    return ctx.measureText(text).width;
};

Utils.fixName = (d, dName) => {
    let i = 1;
    const base = dName;
    while (d[dName]) {
        dName = `${base} (${i})`;
        i++;
    }
    return dName;
};

Utils.isEmptyString = str => {
    return !str || str.length === 0;
};

Utils.isBlankString = str => {
    return !str || /^\s*$/.test(str);
};

Utils.log = function () {};
Utils.count = 0;
Utils.counter = function () {
    return (this.count += 1);
};
Utils.getPrefix = function () {
    return this.prefix + this.counter();
};

Utils.prefix = Utils.randomString() + '_';

Utils.getUrlParameter = function (name) {
    const nameA = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + nameA + '=([^&#]*)');
    const results = regex.exec(location.search.replace(/\/$/, ''));
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

Utils.debounce = function (func, wait = 100) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
};

Utils.throttle = function(fn, threshold = 250, context) {
    let last, timer;
    return function() {
        var ctx = context || this;
        var now = new Date().getTime(),
            args = arguments;
        if (last && now < last + threshold) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                last = now;
                fn.apply(ctx, args);
            }, threshold);
        } else {
            last = now;
            fn.apply(ctx, args);
        }
    };
};

Utils.getRandomColor = function () {
    return '#' + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, 0); // just a random color padded to 6 characters
};

/*
    Quick utility to lighten or darken a color (doesn't take color-drifting, etc. into account)
    Usage:
    fadeColor('#061261', 100); // will lighten the color
    fadeColor('#200867'), -100); // will darken the color
*/

Utils.fadeColor = function (col, amt) {
    const min = Math.min, max = Math.max;
    const num = parseInt(col.replace(/#/g, ''), 16);
    const r = min(255, max((num >> 16) + amt, 0));
    const g = min(255, max((num & 0x0000FF) + amt, 0));
    const b = min(255, max(((num >> 8) & 0x00FF) + amt, 0));
    return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, 0);
}

Utils.lerpColor = function (startColor, targetColor, amount) {
    const ah = parseInt(startColor.replace(/#/g, ''), 16);
    const ar = ah >> 16;
    const ag = (ah >> 8) & 0xff;
    const ab = ah & 0xff;
    const bh = parseInt(targetColor.replace(/#/g, ''), 16);
    const br = bh >> 16;
    var bg = (bh >> 8) & 0xff;
    var bb = bh & 0xff;
    const rr = ar + amount * (br - ar);
    const rg = ag + amount * (bg - ag);
    const rb = ab + amount * (bb - ab);

    return (
        '#' +
        (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0)
            .toString(16)
            .slice(1)
            .toUpperCase()
    );
};

Utils.hexToRgb = function (hex) {
    const match = hex.replace(/#/, '').match(/.{1,2}/g);
    return {
        r: parseInt(match[0], 16),
        g: parseInt(match[1], 16),
        b: parseInt(match[2], 16)
    };
};

Utils.rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    return x.toString(16).padStart(2,0)
}).join('')


Utils.nscolorToRgb = function (rP, gP, bP) {
    return {
        r : Math.round(rP * 255),
        g : Math.round(gP * 255),
        b : Math.round(bP * 255)
    };
};

Utils.nsColorToHex = function (rP, gP, bP) {
    const c = Utils.nscolorToRgb(rP, gP, bP);
    return Utils.rgbToHex(c.r, c.g, c.b);
};

Utils.miredToKelvin = function (mired) {
    return Math.round(1e6 / mired);
};

Utils.kelvinToMired = function (kelvin, roundTo) {
    return roundTo ? Utils.roundBy(Math.round(1e6 / kelvin), roundTo) : Math.round(1e6 / kelvin);
};

Utils.roundBy = function(num, x) {
    return Math.round((num - 10) / x) * x;
}

Utils.getBrightness = function (hexColor) {
    // http://www.w3.org/TR/AERT#color-contrast
    if (typeof hexColor === 'string' && hexColor.charAt(0) === '#') {
        var rgb = Utils.hexToRgb(hexColor);
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }
    return 0;
};

Utils.readJson = function (file, callback) {
    var req = new XMLHttpRequest();
    req.onerror = function (e) {
        // Utils.log(`[Utils][readJson] Error while trying to read  ${file}`, e);
    };
    req.overrideMimeType('application/json');
    req.open('GET', file, true);
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            // && req.status == "200") {
            if (callback) callback(req.responseText);
        }
    };
    req.send(null);
};

Utils.readFile = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            //resolve(new Response(xhr.responseText, {status: xhr.status}))
            resolve(xhr.responseText);
        };
        xhr.onerror = function() {
            reject(new TypeError('Local request failed'));
        };
        xhr.open('GET', url);
        xhr.send(null);
    });
};

Utils.loadScript = function (url, callback) {
    const el = document.createElement('script');
    el.src = url;
    el.onload = function () {
        callback(url, true);
    };
    el.onerror = function () {
        console.error('Failed to load file: ' + url);
        callback(url, false);
    };
    document.body.appendChild(el);
};

Utils.parseJson = function (jsonString) {
    if (typeof jsonString === 'object') return jsonString;
    try {
        const o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === 'object') {
            return o;
        }
    } catch (e) {}

    return false;
};

Utils.parseJSONPromise = function (jsonString) {
    // fetch('/my-json-doc-as-string')
    // .then(Utils.parseJSONPromise)
    // .then(heresYourValidJSON)
    // .catch(error - or return default JSON)

    return new Promise((resolve, reject) => {
        try {
            const o = JSON.parse(jsonString);
            if(o && typeof o === 'object') {
                resolve(o);
            } else {
                resolve({});
            }
        } catch (e) {
            reject(e);
        }
    });
};


Utils.getProperty = function (obj, dotSeparatedKeys, defaultValue) {
    if (arguments.length > 1 && typeof dotSeparatedKeys !== 'string') return undefined;
    if (typeof obj !== 'undefined' && typeof dotSeparatedKeys === 'string') {
        const pathArr = dotSeparatedKeys.split('.');
        pathArr.forEach((key, idx, arr) => {
            if (typeof key === 'string' && key.includes('[')) {
                try {
                    // extract the array index as string
                    const pos = /\[([^)]+)\]/.exec(key)[1];
                    // get the index string length (i.e. '21'.length === 2)
                    const posLen = pos.length;
                    arr.splice(idx + 1, 0, Number(pos));

                    // keep the key (array name) without the index comprehension:
                    // (i.e. key without [] (string of length 2)
                    // and the length of the index (posLen))
                    arr[idx] = key.slice(0, -2 - posLen); // eslint-disable-line no-param-reassign
                } catch (e) {
                    // do nothing
                }
            }
        });
        // eslint-disable-next-line no-param-reassign, no-confusing-arrow
        obj = pathArr.reduce((o, key) => (o && o[key] !== 'undefined' ? o[key] : undefined), obj);
    }
    return obj === undefined ? defaultValue : obj;
};

Utils.getProp = (jsn, str, defaultValue = {}, sep = '.') => {
    const arr = str.split(sep);
    return arr.reduce((obj, key) => (obj && obj.hasOwnProperty(key) ? obj[key] : defaultValue), jsn);
};

Utils.setProp = function (jsonObj, path, value) {
    const names = path.split('.');
    let jsn = jsonObj;

    // createNestedObject(jsn, names, values);
    // If a value is given, remove the last name and keep it for later:
    var targetProperty = arguments.length === 3 ? names.pop() : false;

    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for (var i = 0; i < names.length; i++) {
        jsn = jsn[names[i]] = jsn[names[i]] || {};
    }

    // If a value was given, set it to the target property (the last one):
    if (targetProperty) jsn = jsn[targetProperty] = value;

    // Return the last object in the hierarchy:
    return jsn;
};

Utils.getDataUri = function (url, callback, inCanvas, inFillcolor) {
    var image = new Image();

    image.onload = function () {
        const canvas =
            inCanvas && Utils.isCanvas(inCanvas)
                ? inCanvas
                : document.createElement('canvas');

        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        const ctx = canvas.getContext('2d');
        if (inFillcolor) {
            ctx.fillStyle = inFillcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(this, 0, 0);
        // Get raw image data
        // callback && callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
};

/** Quick utility to inject a style to the DOM
* e.g. injectStyle('.localbody { background-color: green;}')
*/
Utils.injectStyle = function (styles, styleId) {
   const node = document.createElement('style');
   const tempID = styleId || Utils.randomString(8);
   node.setAttribute('id', tempID);
   node.innerHTML = styles;
   document.body.appendChild(node);
   return node;
};

Utils.loadImageData = function(inUrl, callback) {
    let image = new Image();
    image.onload = function() {
        callback(image);
        // or to get raw image data
        // callback && callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
    };
    image.src = inUrl;
};

Utils.loadImagePromise = url =>
    new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({url, status: 'ok'});
        img.onerror = () => resolve({url, status: 'error'});
        img.src = url;
    });

Utils.loadImages = arrayOfUrls => Promise.all(arrayOfUrls.map(Utils.loadImagePromise));

Utils.loadImageWithOptions = (url, w, h, inCanvas, clearCtx, inFillcolor) =>
    new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = inCanvas && Utils.isCanvas(inCanvas) ? inCanvas : document.createElement('canvas');
            canvas.width = w || img.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = h || img.naturalHeight; // or 'height' if you want a special/scaled size
            console.log('IMG', img, img.naturalWidth);
            const ctx = canvas.getContext('2d');
            if(clearCtx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            if(inFillcolor) {
                ctx.fillStyle = inFillcolor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            window.bbb = canvas.toDataURL('image/png');
            resolve({url, status: 'ok', image: canvas.toDataURL('image/png')}); // raw image with: canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');
        };
        img.onerror = () => resolve({url, status: 'error'});
        img.src = url;
    });

Utils.loadImage = function (inUrl, callback, inCanvas, inFillcolor) {
    /** Convert to array, so we may load multiple images at once */
    const aUrl = !Array.isArray(inUrl) ? [inUrl] : inUrl;
    const canvas = inCanvas && inCanvas instanceof HTMLCanvasElement
        ? inCanvas
        : document.createElement('canvas');
    var imgCount = aUrl.length - 1;
    const imgCache = {};

    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';

    for (let url of aUrl) {
        let image = new Image();
        let cnt = imgCount;
        let w = 144, h = 144;

        image.onload = function () {
            imgCache[url] = this;
            // look at the size of the first image
            if (url === aUrl[0]) {
                canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
                canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
            }
            // if (Object.keys(imgCache).length == aUrl.length) {
            if (cnt < 1) {
                if (inFillcolor) {
                    ctx.fillStyle = inFillcolor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                // draw in the proper sequence FIFO
                aUrl.forEach(e => {
                    if (!imgCache[e]) {
                        console.warn(imgCache[e], imgCache);
                    }

                    if (imgCache[e]) {
                        ctx.drawImage(imgCache[e], 0, 0);
                        ctx.save();
                    }
                });

                callback(canvas.toDataURL('image/png'));
                // or to get raw image data
                // callback && callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
            }
        };

        imgCount--;
        image.src = url;
    }
};

Utils.getData = function (url) {
    // Return a new promise.
    return new Promise(function (resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        // Make sure to call .open asynchronously
        req.open('GET', url, true);

        req.onload = function () {
            // This is called even on 404 etc
            // so check the status
            if (req.status === 200) {
                // Resolve the promise with the response text
                resolve(req.response);
            } else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                reject(Error(req.statusText));
            }
        };

        // Handle network errors
        req.onerror = function () {
            reject(Error('Network Error'));
        };

        // Make the request
        req.send();
    });
};

Utils.negArray = function (arr) {
    /** http://h3manth.com/new/blog/2013/negative-array-index-in-javascript/ */
    return Proxy.create({
        set: function (proxy, index, value) {
            index = parseInt(index);
            return index < 0 ? (arr[arr.length + index] = value) : (arr[index] = value);
        },
        get: function (proxy, index) {
            index = parseInt(index);
            return index < 0 ? arr[arr.length + index] : arr[index];
        }
    });
};

Utils.onChange = function (object, callback) {
    /** https://github.com/sindresorhus/on-change */
    'use strict';
    const handler = {
        get (target, property, receiver) {
            try {
                return new Proxy(target[property], handler);
            } catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },
        set (target, property, value, receiver) {
            try {
                if(callback && !callback(target, property, value)) {
                    throw new Error(`${value} is not a valid ${property}`);
                };

                const oldValue = Reflect.get(target, property, value, receiver);
                const success = Reflect.set(target, property, value);

                if(oldValue !== value && typeof changedCallback === 'function') {
                    changedCallback(target, property, value, oldValue);
                }
                return success;
            } catch(err) {
                console.warn(`proxy:property was not SAVED: ${err}`);
                return Reflect.get(target, property, receiver) || {};
            }
        },
        defineProperty (target, property, descriptor) {
            console.log('Utils.onChange:defineProperty:', target, property, descriptor);
            callback(target, property, descriptor);
            return Reflect.defineProperty(target, property, descriptor);
        },
        deleteProperty (target, property) {
            console.log('Utils.onChange:deleteProperty:', target, property);
            callback(target, property);
            return Reflect.deleteProperty(target, property);
        }
    };

    return new Proxy(object, handler);
};

Utils.observeArray = function (object, callback) {
    'use strict';
    const array = [];
    const handler = {
        get (target, property, receiver) {
            try {
                return new Proxy(target[property], handler);
            } catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },
        set (target, property, value, receiver) {
            console.log('XXXUtils.observeArray:set1:', target, property, value, array);
            target[property] = value;
            console.log('XXXUtils.observeArray:set2:', target, property, value, array);
        },
        defineProperty (target, property, descriptor) {
            callback(target, property, descriptor);
            return Reflect.defineProperty(target, property, descriptor);
        },
        deleteProperty (target, property) {
            callback(target, property, descriptor);
            return Reflect.deleteProperty(target, property);
        }
    };

    return new Proxy(object, handler);
};

Utils.noop = function() {};

window['_'] = Utils;
