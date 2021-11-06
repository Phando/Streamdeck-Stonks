class Action extends StreamDeckClient {
    
    type = "com.andomation.stream.stonks"
    isLongPress  = false

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

}
