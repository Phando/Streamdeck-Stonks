class Manager extends StreamDeckClient {
    constructor() {
        super()
    }

    onWillAppear(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onPropertyInspectorDidAppear(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------
    
    onSendToPlugin(jsn) {
        this.uuid = jsn.context
    } 
}