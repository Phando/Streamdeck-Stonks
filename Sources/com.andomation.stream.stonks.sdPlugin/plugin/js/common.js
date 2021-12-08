const MIN_FONT = 18
const MAX_FONT = 24
const WRAP_SIZE = 122.5
const CANVAS_WIDTH  = 144
const CANVAS_HEIGHT = 144
const MARGIN_LEFT = 6
const MARGIN_RIGHT = 138
const STATE_DEFAULT = 'default'

const COLOR_PRE      = '#F8981D'
const COLOR_POST     = '#26AAE1'
const COLOR_DIM      = '#C0C0C0'
const COLOR_DISABLED = '#909090'
const COLOR_ERROR    = '#FFFF00'
const COLOR_FOREGROUND = '#D8D8D8'
const COLOR_BACKGROUND = '#1D1E1F'
const COLOR_GREEN    = '#00FF00'
const COLOR_GREEN_CL = '#008800'
const COLOR_GREEN_LT = '#006600'
const COLOR_RED      = '#FF0000'
const COLOR_RED_CL   = '#880000'
const COLOR_RED_LT   = '#660000'

// Global Variables
// TODO : Maybe rename all these to _varName
//-----------------------------------------------------------------------------------------

var _canvas = null
var _drawingCtx = null

let actions = []
let globalSettings = {}
let contextList = {}

//-----------------------------------------------------------------------------------------

function Context(jsn){
    this.clickCount  = 0
    this.downtimer   = null
    this.isLongPress = false
    this.stateName   = STATE_DEFAULT
    this.action      = Utils.getProp(jsn, 'action', '')
    this.context     = Utils.getProp(jsn, 'context', '')
    this.coordinates = Utils.getProp(jsn, 'payload.coordinates', {})
    this.settings    = Utils.getProp(jsn, 'payload.settings', {})
}

// Bass class for Actions and PI Components for interacting with the StreamDeck
//-----------------------------------------------------------------------------------------

class StreamDeckClient {
    _uuid = 0

    get uuid(){    
        //return $SD.actionInfo["context"]
        return this._uuid
    }

    set uuid(value){    
        this._uuid = value
    }

    get canvas(){
        return _canvas
    }

    get clickCount(){
        return this.context.clickCount
    }

    set clickCount(value){
        this.context.clickCount = value
    }

    get context(){    
        return contextList[this._uuid]
    }

    get currentView(){
        return this.viewList[this.clickCount]
    }
    
    get data(){
        return this.context.data
    }

    set data(value){
        this.context.data = value
    }

    get drawingCtx(){
        return _drawingCtx
    }

    get isLongPress(){
        return this.context.isLongPress
    }

    set isLongPress(value){
        this.context.isLongPress = value
    }

    get settings(){
        return this.context.settings || {}
    }

    set settings(value){
        this.context.settings = value
    }

    set state(stateName){
        this.clickCount = 0
        this.context.stateName = stateName
        this.updateDisplay(this.context)
    }
    
    get state(){
        return this.context.stateName
    }

    get viewList(){
        return this.context.viewList
    }

    set viewList(value){
        this.context.viewList = value
    }

    //-----------------------------------------------------------------------------------------

    onConnected(jsn) {
    }

    //-----------------------------------------------------------------------------------------

    onWillAppear(jsn) {
        this.uuid = jsn.context
        var settings = Utils.getProp(jsn, 'payload.settings', {})
        var symbol = settings.symbol
        this.initDisplay(jsn)
        
        // if(settings.version != $pluginVersion){
        //     console.log('onWillAppear - new instance or version')
        //     settings = {}
        //     settings.version = $pluginVersion
        //     settings.symbol = symbol || "GME"
        //     jsn.payload.settings = settings
        // }

        this.onDidReceiveSettings(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onPropertyInspectorDidAppear(jsn) {
        this.uuid = jsn.context
        
        if(Object.keys(this.settings).length == 0){
            console.log("onPropertyInspectorDidAppear - WHY ARE WE HERE?", this.settings, jsn)
            this.onDidReceiveSettings({context:this.uuid,payload:{settings:{}}})
        }
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
        this.settings = Utils.getProp(jsn, 'payload.settings', {})
    }

    //-----------------------------------------------------------------------------------------
    
    onSendToPlugin(jsn) {
        this.uuid = jsn.context
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {})

        if(sdpi_collection.key == 'restoreDefaults'){
            this.onDidReceiveSettings({context:this.uuid,payload:{settings:{}}})
            this.updateDisplay(jsn)
            return
        }
        
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
            this.settings[sdpi_collection.key] = sdpi_collection.value;      
            $SD.api.setSettings(this.uuid, this.settings); 
        }

        this.updateDisplay(jsn)
    } 

    //-----------------------------------------------------------------------------------------

    onKeyDown(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onLongPress(jsn) {
        this.uuid = jsn.context
        this.isLongPress = true
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveData(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        this.uuid = jsn.context
    }
    
    //-----------------------------------------------------------------------------------------
    initDisplay(jsn){
        this.uuid = jsn.context
    }
     
    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------
    
    drawItem(value, valueColor, yPos, fontSize, fontWeight, pad, isLeft=true){
        this.drawingCtx.textAlign = isLeft ? 'left' : 'right'
        this.drawingCtx.textBaseline = 'middle'
        this.drawingCtx.fillStyle = valueColor
        
        // if(valueColor == COLOR_GREEN)
        //     fontWeight -= 100
        
        this.drawingCtx.font = fontWeight + " " + fontSize + "px Arial"
        this.drawingCtx.fillText(value, isLeft ? MARGIN_LEFT+pad : MARGIN_RIGHT-pad, yPos)
    }

    //-----------------------------------------------------------------------------------------
    
    drawLeft(value, valueColor, yPos, fontSize=MAX_FONT, fontWeight=600, pad=0){
        this.drawItem(value, valueColor, yPos, fontSize, fontWeight, pad)
    }

    //-----------------------------------------------------------------------------------------
    
    drawRight(value, valueColor, yPos, fontSize=MAX_FONT, fontWeight=600, pad=0){
        this.drawItem(value, valueColor, yPos, fontSize, fontWeight, pad, false)
    }

    //-----------------------------------------------------------------------------------------
    
    drawScaledRight(label, labelColor, yPos, maxWidth, maxFont=MAX_FONT, fontWeight=600, pad=0){
        var font = Utils.calculateFont(label, maxWidth, 18, maxFont)
        this.drawRight(label, labelColor, yPos, font, fontWeight, pad)
    }


    //-----------------------------------------------------------------------------------------
    
    drawPair(label, labelColor, value, valueColor, yPos, fontSize=MAX_FONT){
        this.drawLeft(label, labelColor, yPos, fontSize)
        this.drawRight(value, valueColor, yPos, fontSize)
    }

    //-----------------------------------------------------------------------------------------
    
    drawScaledPair(label, labelColor, value, valueColor, yPos, maxFont=MAX_FONT){
        var content = label.toString() + value.toString()
        var font = Utils.calculateFont(content, CANVAS_WIDTH-16, 18, maxFont)
        this.drawPair(label, labelColor, value, valueColor, yPos, font)
    }

    //-----------------------------------------------------------------------------------------
    
    drawSmartPair(label1, value1, color1, label2, value2, color2, yPos=116, maxFont=MAX_FONT, maxWidth=CANVAS_WIDTH-14){
        var yPos1 = 103
        var yPos2 = 126
        var test1 = this.getIntegratedValue(label1, value1)
        var test2 = this.getIntegratedValue(label2, value2)

        var content = test1.toString() + test2.toString()
        var font = Utils.calculateFont(content, maxWidth, MIN_FONT, maxFont)
        var width = _drawingCtx.measureText(content).width
        
        if( _drawingCtx.measureText(content).width <= maxWidth){
            this.drawLeft(test1, color1, yPos, font)
            this.drawRight(test2, color2, yPos, font)
            return
        }

        // Wrap the values on two lines (the 'smart' part)
        let pSize = CANVAS_WIDTH * 0.8
        font = Math.min(
            Utils.calculateFont(value1, pSize, MIN_FONT, maxFont), 
            Utils.calculateFont(value2, pSize, MIN_FONT, maxFont))  

        if(label2.toLowerCase() == 'hi')
            [yPos1, yPos2] = [yPos2, yPos1];

        this.drawPair(label1, COLOR_FOREGROUND, value1, color1, yPos1, font)
        this.drawPair(label2, COLOR_FOREGROUND, value2, color2, yPos2, font)
    }

    //-----------------------------------------------------------------------------------------
    
    getIntegratedValue(label, value){
        var pre  = label == '$' ? label : ''
        var post = label == '%' ? label : ''
        return pre + value + post
    }

    // Generic Error Handler
    //-----------------------------------------------------------------------------------------

    renderError(jsn) {
        //console.log('StonksAction - renderError', jsn)
        this.uuid = jsn.context
        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        this.drawingCtx.fillStyle =  COLOR_ERROR
        this.drawingCtx.font = 600 + " " + 26 + "px Arial";
        this.drawingCtx.textAlign = "center"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText("Error", CANVAS_WIDTH/2, 6);

        // Render Message
        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        this.drawingCtx.font = 600 + " " + 19 + "px Arial";
        this.drawingCtx.fillText(jsn.error.message, CANVAS_WIDTH/2, 40);

        if(jsn.error.hasOwnProperty('message1'))
            this.drawingCtx.fillText(jsn.error.message1, CANVAS_WIDTH/2, 70);

        if(jsn.error.hasOwnProperty('message2'))
            this.drawingCtx.fillText(jsn.error.message2, CANVAS_WIDTH/2, 100);

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

}

//-----------------------------------------------------------------------------------------

var $localizedStrings = $localizedStrings || {},
    REMOTESETTINGS = REMOTESETTINGS || {},
    DestinationEnum = Object.freeze({
        HARDWARE_AND_SOFTWARE: 0,
        HARDWARE_ONLY: 1,
        SOFTWARE_ONLY: 2
    }),
    
    isQT = navigator.appVersion.includes('QtWebEngine'),
    debug = debug || false,
    debugLog = function () {},
    MIMAGECACHE = MIMAGECACHE || {};

const setDebugOutput = debug => (debug === true ? console.log.bind(window.console) : function() {});
debugLog = setDebugOutput(debug);

// Create a wrapper to allow passing JSON to the socket
WebSocket.prototype.sendJSON = function (jsn, log) {
    if (log) {
        console.log('SendJSON', this, jsn);
    }
    
    this.send(JSON.stringify(jsn));
};

String.prototype.lox = function () {
    var a = String(this);
    try {
        a = $localizedStrings[a] || a;
    } catch (b) {}
    return a;
};

String.prototype.sprintf = function (inArr) {
    let i = 0;
    const args = inArr && Array.isArray(inArr) ? inArr : arguments;
    return this.replace(/%s/g, function () {
        return args[i++];
    });
};

const sprintf = (s, ...args) => {
    let i = 0;
    return s.replace(/%s/g, function () {
        return args[i++];
    });
};

const loadLocalization = (lang, pathPrefix, cb) => {
    Utils.readJson(`${pathPrefix}${lang}.json`, function (jsn) {
        const manifest = Utils.parseJson(jsn);
        $localizedStrings = manifest && manifest.hasOwnProperty('Localization') ? manifest['Localization'] : {};
        debugLog($localizedStrings);
        if (cb && typeof cb === 'function') cb();
    });
};

const loadVersion = (cb) => {
    Utils.readJson(`../manifest.json`, function (jsn) {
        const manifest = Utils.parseJson(jsn);
        $pluginVersion = manifest && manifest.hasOwnProperty('Version') ? manifest['Version'] : 0;
        debugLog($pluginVersion);
        if (cb && typeof cb === 'function') cb();
    });
};

/*
 * connectElgatoStreamDeckSocket
 * This is the first function StreamDeck Software calls, when
 * establishing the connection to the plugin or the Property Inspector
 * @param {string} inPort - The socket's port to communicate with StreamDeck software.
 * @param {string} inUUID - A unique identifier, which StreamDeck uses to communicate with the plugin
 * @param {string} inMessageType - Identifies, if the event is meant for the property inspector or the plugin.
 * @param {string} inApplicationInfo - Information about the host (StreamDeck) application
 * @param {string} inActionInfo - Context is an internal identifier used to communicate to the host application.
 */


function connectElgatoStreamDeckSocket (
    inPort,
    inUUID,
    inMessageType,
    inApplicationInfo,
    inActionInfo
) {
    StreamDeck.getInstance().connect(arguments);
    window.$SD.api = Object.assign({ send: SDApi.send }, SDApi.common, SDApi[inMessageType]);
}

/* legacy support */

function connectSocket (
    inPort,
    inUUID,
    inMessageType,
    inApplicationInfo,
    inActionInfo
) {
    connectElgatoStreamDeckSocket(
        inPort,
        inUUID,
        inMessageType,
        inApplicationInfo,
        inActionInfo
    );
}

function initializeControlCenterClient () {
    const settings = Object.assign(REMOTESETTINGS || {}, { debug: false });
    var $CC = new ControlCenterClient(settings);
    window['$CC'] = $CC;
    return $CC;
}

function saveValue(sdpi_collection) {
    console.log("saveValue:", sdpi_collection)
    
    if (   typeof sdpi_collection !== "object"
        || !sdpi_collection.hasOwnProperty("key") 
        || sdpi_collection.key == ""
        || !sdpi_collection.value 
        || sdpi_collection.value == undefined) { return }
    
    if( globalSettings.hasOwnProperty(sdpi_collection.key) ){
        globalSettings[sdpi_collection.key] = sdpi_collection.value
        saveSettings(globalSettings)
    }
    else {
        var settings = $SD.actionInfo.payload.settings
        settings[sdpi_collection.key] = sdpi_collection.value
        saveSettings(settings)
    }
}

function saveSettings(data){
    if( data == globalSettings) {
        console.log('SaveSettings Global:', globalSettings)
        $SD.api.setGlobalSettings($SD.uuid, data)
    }
    else {
        console.log('SaveSettings Local:', data)
        $SD.api.setSettings($SD.actionInfo["context"], data)
    }
}

/** ELGEvents
 * Publish/Subscribe pattern to quickly signal events to
 * the plugin, property inspector and data.
 */

 const ELGEvents = {
    eventEmitter: function (name, fn) {
        const eventList = new Map();

        const on = (name, fn) => {
            if (!eventList.has(name)) eventList.set(name, ELGEvents.pubSub());
            return eventList.get(name).sub(fn);
        };

        const has = name => eventList.has(name);
        const emit = (name, data) => eventList.has(name) && eventList.get(name).pub(data);

        return Object.freeze({ on, has, emit, eventList });
    },

    pubSub: function pubSub () {
        const subscribers = new Set();

        const sub = fn => {
            subscribers.add(fn);
            return () => {
                subscribers.delete(fn);
            };
        };

        const pub = data => subscribers.forEach(fn => fn(data));
        return Object.freeze({ pub, sub });
    }
};

/**
 * StreamDeck object containing all required code to establish
 * communication with SD-Software and the Property Inspector
 */

 const StreamDeck = (function () {
    // Hello it's me
    var instance;
    /*
      Populate and initialize internally used properties
    */

    function init () {
        // *** PRIVATE ***

        var inPort,
            inUUID,
            inMessageType,
            inApplicationInfo,
            inActionInfo,
            websocket = null;

        var events = ELGEvents.eventEmitter();
        var logger = SDDebug.logger();

        function showVars () {
            debugLog('---- showVars');
            debugLog('- port', inPort);
            debugLog('- uuid', inUUID);
            debugLog('- messagetype', inMessageType);
            debugLog('- info', inApplicationInfo);
            debugLog('- inActionInfo', inActionInfo);
            debugLog('----< showVars');
        }

        function connect (args) {
            inPort = args[0];
            inUUID = args[1];
            inMessageType = args[2];
            inApplicationInfo = Utils.parseJson(args[3]);
            inActionInfo = args[4] !== 'undefined' ? Utils.parseJson(args[4]) : args[4];
            loadVersion( function() { events.emit('versionLoaded', {version:$pluginVersion}); });

            /** Debug variables */
            if (debug) {
                showVars();
            }

            const lang = Utils.getProp(inApplicationInfo,'application.language', false);
            if (lang) {
                loadLocalization(lang, '../', function() { 
                    events.emit('localizationLoaded', {language:lang});
                });
            }

            if (websocket) {
                websocket.close();
                websocket = null;
            }

            websocket = new WebSocket('ws://127.0.0.1:' + inPort);

            websocket.onopen = function () {
                var json = {
                    event: inMessageType,
                    uuid: inUUID
                };

                websocket.sendJSON(json);
                $SD.uuid = inUUID;
                $SD.actionInfo = inActionInfo;
                $SD.applicationInfo = inApplicationInfo;
                $SD.messageType = inMessageType;
                $SD.connection = websocket;
                $SD.api.getGlobalSettings();

                instance.emit('connected', {
                    connection: websocket,
                    port: inPort,
                    uuid: inUUID,
                    actionInfo: inActionInfo,
                    applicationInfo: inApplicationInfo,
                    messageType: inMessageType
                });
            };

            websocket.onerror = function (evt) {
                console.warn('WEBOCKET ERROR', evt, evt.data);
            };

            websocket.onclose = function (evt) {
                // Websocket is closed
                var reason = WEBSOCKETERROR(evt);
                console.warn('[STREAMDECK]***** WEBOCKET CLOSED **** reason:', reason);
            };
            
            websocket.onmessage = function (evt) {
                var jsonObj = Utils.parseJson(evt.data)
                var m = inMessageType

                console.log('[STREAMDECK] websocket.onmessage ... ', jsonObj.event, jsonObj);

                if (!jsonObj.hasOwnProperty('action')) {
                    m = jsonObj.event;
                    if( m == 'didReceiveGlobalSettings') {
                        globalSettings = jsonObj.payload.settings
                    }
                    //console.log('%c%s', 'color: white; background: red; font-size: 12px;', '[common.js]onmessage:', m);
                } else {
                    switch (inMessageType) {
                    case 'registerPlugin':
                        m = jsonObj.action + '.' + jsonObj.event;
                        break;
                    case 'registerPropertyInspector':
                        m = 'sendToPropertyInspector';
                        break;
                    default:
                        console.log('%c%s', 'color: white; background: red; font-size: 12px;', '[STREAMDECK] websocket.onmessage +++++++++  INFO ++++++++');
                        console.warn('UNREGISTERED MESSAGETYPE:', inMessageType);
                    }
                    
                    if(jsonObj.hasOwnProperty('payload') && jsonObj.payload.hasOwnProperty('settings')){
                        if(typeof contextList[jsonObj.context] == 'undefined'){
                            contextList[jsonObj.context] = new Context(jsonObj)
                        } else {
                            contextList[jsonObj.context].settings = jsonObj.payload.settings
                        }
                    }
                }

                switch(jsonObj.event){
                    case "keyDown": 
                        var context = contextList[jsonObj.context]
                        context.downtimer = setInterval( function(context) {
                            clearInterval(context.downtimer)
                            events.emit(jsonObj.action + '.longPress', context)
                        }, 500, context);
                        break
                    case "keyUp" :
                    var context = contextList[jsonObj.context]
                    clearInterval(context.downtimer)
                    break
                }

                //jsonObj.scope = contextList[jsonObj.context]
                if (m && m !== '')
                    events.emit(m, jsonObj);
            };

            instance.connection = websocket;
        }

        return {
            // *** PUBLIC ***

            uuid: inUUID,
            on: events.on,
            emit: events.emit,
            connection: websocket,
            connect: connect,
            api: null,
            logger: logger
        };
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
                instance.api = SDApi;
            }
            return instance;
        }
    };
})();

/** SDApi
 * This ist the main API to communicate between plugin, property inspector and
 * application host.
 * Internal functions:
 * - setContext: sets the context of the current plugin
 * - exec: prepare the correct JSON structure and send
 *
 * Methods exposed in the $SD.api alias
 * Messages send from the plugin
 * -----------------------------
 * - showAlert
 * - showOK
 * - setSettings
 * - setTitle
 * - setImage
 * - sendToPropertyInspector
 *
 * Messages send from Property Inspector
 * -------------------------------------
 * - sendToPlugin
 *
 * Messages received in the plugin
 * -------------------------------
 * willAppear
 * willDisappear
 * keyDown
 * keyUp
 */

 const SDApi = {
    send: function (context, fn, payload, debug) {
        /** Combine the passed JSON with the name of the event and it's context
         * If the payload contains 'event' or 'context' keys, it will overwrite existing 'event' or 'context'.
         * This function is non-mutating and thereby creates a new object containing
         * all keys of the original JSON objects.
         */
        
        const pl = Object.assign({}, { event: fn, context: context }, payload);

        /** Check, if we have a connection, and if, send the JSON payload */
        if (debug) {
            console.log('-----SDApi.send-----');
            console.log('context', context);
            console.log(pl);
            console.log(payload.payload);
            console.log(JSON.stringify(payload.payload));
            console.log('-------');
        }
        $SD.connection && $SD.connection.sendJSON(pl);

        /**
         * DEBUG-Utility to quickly show the current payload in the Property Inspector.
         */

        if (
            $SD.connection &&
            [
                'sendToPropertyInspector',
                'showOK',
                'showAlert',
                'setSettings'
            ].indexOf(fn) === -1
        ) {
            // console.log("send.sendToPropertyInspector", payload);
            // this.sendToPropertyInspector(context, typeof payload.payload==='object' ? JSON.stringify(payload.payload) : JSON.stringify({'payload':payload.payload}), pl['action']);
        }
    },

    registerPlugin: {

        /** Messages send from the plugin */
        showAlert: function (context) {
            SDApi.send(context, 'showAlert', {});
        },

        showOk: function (context) {
            SDApi.send(context, 'showOk', {});
        },


        setState: function (context, payload) {
            SDApi.send(context, 'setState', {
                payload: {
                    state: 1 - Number(payload === 0)
                }
            });
        },

        setTitle: function (context, title, target) {
            SDApi.send(context, 'setTitle', {
                payload: {
                    title: '' + title || '',
                    target: target || DestinationEnum.HARDWARE_AND_SOFTWARE
                }
            });
        },

        clearTitle: function(context, title, target) {
            SDApi.send(context, 'setTitle', {
                payload: {
                    target: target || DestinationEnum.HARDWARE_AND_SOFTWARE
                }
            });
        },

        setImage: function (context, img, target) {
            SDApi.send(context, 'setImage', {
                payload: {
                    image: img || '',
                    target: target || DestinationEnum.HARDWARE_AND_SOFTWARE
                }
            });
        },

        sendToPropertyInspector: function (context, payload, action) {
            SDApi.send(context, 'sendToPropertyInspector', {
                action: action,
                payload: payload
            });
        },

        showUrl2: function (context, urlToOpen) {
            SDApi.send(context, 'openUrl', {
                payload: {
                    url: urlToOpen
                }
            });
        }
    },

    /** Messages send from Property Inspector */

    registerPropertyInspector: {

        sendToPlugin: function (piUUID, action, payload) {
            SDApi.send(
                piUUID,
                'sendToPlugin',
                {
                    action: action,
                    payload: payload || {}
                },
                false
            );
        }
    },

    /** COMMON */

    common: {

        getSettings: function (context) {
            const uuid = context ? context : $SD.uuid;
            SDApi.send(uuid, 'getSettings', {});
        },

        setSettings: function (context, payload) {
            SDApi.send(context, 'setSettings', {
                payload: payload
            });
        },

        getGlobalSettings: function(context) {
            const uuid = context ? context : $SD.uuid;
            SDApi.send(uuid, 'getGlobalSettings', {});
        },

        setGlobalSettings: function (context, payload) {
            const uuid = context ? context : $SD.uuid;
            SDApi.send(uuid, 'setGlobalSettings', {
                payload: payload
            });
        },

        switchToProfile: function(inContext, inDeviceID, inProfileName = null) {
            if(inDeviceID && inDeviceID.length !== 0) {
                const context = inContext ? inContext : $SD.uuid;
                const device = inDeviceID;
                const event = 'switchToProfile';
                if(inProfileName && inProfileName.length !== 0) {
                    const payload = {
                        profile: inProfileName
                    };
                    const pl = Object.assign({}, {event, context, device}, payload);
                    $SD.connection && $SD.connection.sendJSON(pl);
                }
            }
        },

        logMessage: function () {
           /**
            * for logMessage we don't need a context, so we allow both
            * logMessage(unneededContext, 'message')
            * and
            * logMessage('message')
            */

            let payload = arguments.length > 1 ? arguments[1] : arguments[0];

            SDApi.send(null, 'logMessage', {
                payload: {
                    message: payload
                }
            });
        },

        openUrl: function (context, urlToOpen) {
            SDApi.send(context, 'openUrl', {
                payload: {
                    url: urlToOpen
                }
            });
        },

        test: function () {
            console.log(this);
            console.log(SDApi);
        },

        debugPrint: function (context, inString) {
            // console.log("------------ DEBUGPRINT");
            // console.log([].slice.apply(arguments).join());
            // console.log("------------ DEBUGPRINT");
            SDApi.send(context, 'debugPrint', {
                payload: [].slice.apply(arguments).join('.') || ''
            });
        },

        dbgSend: function (fn, context) {
            /** lookup if an appropriate function exists */
            if ($SD.connection && this[fn] && typeof this[fn] === 'function') {
                /** verify if type of payload is an object/json */
                const payload = this[fn]();
                if (typeof payload === 'object') {
                    Object.assign({ event: fn, context: context }, payload);
                    $SD.connection && $SD.connection.sendJSON(payload);
                }
            }
            console.log(this, fn, typeof this[fn], this[fn]());
        }

    }
};

/** SDDebug
 * Utility to log the JSON structure of an incoming object
 */

 const SDDebug = {
    logger: function (name, fn) {
        const logEvent = jsn => {
            console.log('____SDDebug.logger.logEvent');
            console.log(jsn);
            debugLog('-->> Received Obj:', jsn);
            debugLog('jsonObj', jsn);
            debugLog('event', jsn['event']);
            debugLog('actionType', jsn['actionType']);
            debugLog('settings', jsn['settings']);
            debugLog('coordinates', jsn['coordinates']);
            debugLog('---');
        };

        const logSomething = jsn => console.log('____SDDebug.logger.logSomething');

        return { logEvent, logSomething };
    }
};

function WEBSOCKETERROR (evt) {
    // Websocket is closed
    var reason = '';
    if (evt.code === 1000) {
        reason = 'Normal Closure. The purpose for which the connection was established has been fulfilled.';
    } else if (evt.code === 1001) {
        reason = 'Going Away. An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
    } else if (evt.code === 1002) {
        reason = 'Protocol error. An endpoint is terminating the connection due to a protocol error';
    } else if (evt.code === 1003) {
        reason = 'Unsupported Data. An endpoint received a type of data it doesn\'t support.';
    } else if (evt.code === 1004) {
        reason = '--Reserved--. The specific meaning might be defined in the future.';
    } else if (evt.code === 1005) {
        reason = 'No Status. No status code was actually present.';
    } else if (evt.code === 1006) {
        reason = 'Abnormal Closure. The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
    } else if (evt.code === 1007) {
        reason = 'Invalid frame payload data. The connection was closed, because the received data was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629]).';
    } else if (evt.code === 1008) {
        reason = 'Policy Violation. The connection was closed, because current message data "violates its policy". This reason is given either if there is no other suitable reason, or if there is a need to hide specific details about the policy.';
    } else if (evt.code === 1009) {
        reason = 'Message Too Big. Connection closed because the message is too big for it to process.';
    } else if(evt.code === 1010) {
        // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
        reason =
            'Mandatory Ext. Connection is terminated the connection because the server didn\'t negotiate one or more extensions in the WebSocket handshake. <br /> Mandatory extensions were: ' +
            evt.reason;
    } else if (evt.code === 1011) {
        reason = 'Internal Server Error. Connection closed because it encountered an unexpected condition that prevented it from fulfilling the request.';
    } else if (evt.code === 1015) {
        reason = 'TLS Handshake. The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
    } else {
        reason = 'Unknown reason';
    }

    return reason;
}

const SOCKETERRORS = {
    '0': 'The connection has not yet been established',
    '1': 'The connection is established and communication is possible',
    '2': 'The connection is going through the closing handshake',
    '3': 'The connection has been closed or could not be opened'
};