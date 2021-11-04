class Manager extends StreamDeckClient {
    constructor() {
        super()
    }
    
    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
    }
    
    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        this.uuid = jsn.context
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

    updateDisplay(jsn){
        this.uuid = jsn.context
    }
}