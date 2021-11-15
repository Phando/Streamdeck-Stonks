class Action extends StreamDeckClient {
    
    type = "com.andomation.stream.stonks"

    constructor() {
        super()
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

    // Error Handler
    //-----------------------------------------------------------------------------------------

    renderError(jsn) {
        //console.log('SimpleAction - renderError', jsn)
        this.uuid = jsn.context
        this.drawingCtx.fillStyle = this.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        this.drawingCtx.fillStyle =  '#FFFF00'
        this.drawingCtx.font = 600 + " " + 26 + "px Arial";
        this.drawingCtx.textAlign = "center"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText("Error", CANVAS_WIDTH/2, 6);

        // Render Message
        this.drawingCtx.fillStyle = this.foreground
        this.drawingCtx.font = 600 + " " + 19 + "px Arial";
        this.drawingCtx.fillText(jsn.error.message, CANVAS_WIDTH/2, 40);

        if(jsn.error.hasOwnProperty('message1'))
            this.drawingCtx.fillText(jsn.error.message1, CANVAS_WIDTH/2, 70);

        if(jsn.error.hasOwnProperty('message2'))
            this.drawingCtx.fillText(jsn.error.message2, CANVAS_WIDTH/2, 100);

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

}
