class Action extends StreamDeckClient {
    
    type = "com.andomation.stream.stonks"

    constructor() {
        super()
    }

    set state(stateName){
        this.context.clickCount = 0
        this.context.stateName = stateName
        this.updateDisplay()
    }
    
    get state(){
        return this.context.stateName
    }

    onConnected(jsn) {
        $SD.on(this.type + '.willAppear', (jsonObj) => this.onWillAppear(jsonObj))
        $SD.on(this.type + '.didReceiveSettings', (jsonObj) => this.onDidReceiveSettings(jsonObj))
        $SD.on(this.type + '.keyDown', (jsonObj) => this.onKeyDown(jsonObj))
        $SD.on(this.type + '.keyUp', (jsonObj) => this.onKeyUp(jsonObj))
        $SD.on(this.type + '.longPress', (jsonObj) => this.onLongPress(jsonObj))
        $SD.on(this.type + '.sendToPlugin', (jsonObj) => this.onSendToPlugin(jsonObj))
        $SD.on(this.type + '.propertyInspectorDidAppear', (jsonObj) => this.onPropertyInspectorDidAppear(jsonObj))
        $SD.on(this.type + '.propertyInspectorDidDisappear', (jsonObj) => console.log("propertyInspectorDidDisappear"))
    }

    onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
        this.settings = Utils.getProp(jsn, 'payload.settings', {})
        console.log("Action - onDidReceiveSettings", jsn, this.settings)
    }

    onWillAppear(jsn) {
        this.uuid = jsn.context
        this.onDidReceiveSettings(jsn)
    }

    onKeyDown(jsn) {
        this.uuid = jsn.context
    }

    onKeyUp(jsn) {
        this.uuid = jsn.context
        this.context.clickCount += 1
    }
    
    onLongPress(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onPropertyInspectorDidAppear(jsn) {
        this.uuid = jsn.context
        this.state = STATE_DEFAULT
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------
    
    onSendToPlugin(jsn) {
        this.uuid = jsn.context
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
            this.settings[sdpi_collection.key] = sdpi_collection.value;

            if(sdpi_collection.key == "symbol")
                this.settings[sdpi_collection.key] = this.settings[sdpi_collection.key].toUpperCase()
                  
            $SD.api.setSettings(this.uuid, this.settings); 
        }
    } 

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        this.uuid = jsn.context
    };

    //-----------------------------------------------------------------------------------------

    setFontFor = function(text, weight, maxWidth) {
        return this.calculateFont(text, weight, 4, 40, maxWidth);
    };
    
    //-----------------------------------------------------------------------------------------

    calculateFont = function(text, weight, min, max, desiredWidth) {
        if (max - min < 1) {
            this.drawingCtx.font = weight + " " + min + "px Arial";
            return
        }
    
        var test = min + (max - min) / 2; //Find half interval
        this.drawingCtx.font = weight + " " + test + "px Arial";
        
        if( this.drawingCtx.measureText(text).width > desiredWidth) {
            return this.calculateFont(text, weight, min, test, desiredWidth);
        }   
        
        return this.calculateFont(text, weight, test, max, desiredWidth);
    };

}
