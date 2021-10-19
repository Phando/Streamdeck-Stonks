class Action {
    uuid = 0
    type = "com.andomation.stream.stonks";
    symbol = "";

    constructor() {
    this.canvas = document.createElement("canvas")
    this.canvas.width = 144
    this.canvas.height = 144
    this.drawingCtx = this.canvas.getContext("2d");
    }

    get settings(){
        return contexts[this.uuid]
    }

    updateSettings(jsn){
        this.uuid = jsn.context
        console.log("Action Settings", this.settings)
        $SD.api.setTitle(this.context, this.settings.symbol)
        //this.setTitle = this.settings.title;
        //$SD.api.setSettings($SD.uuid, this.settings);
    }

    onDidReceiveSettings(jsn) {
        this.updateSettings(jsn)
        // Populate or initialize settings
        //this.settings = Utils.getProp(jsn, 'payload.settings', {});
        //console.log("GET SETTINGS", jsn)
        
    }

    onDidReceiveGlobalSettings(jsn) {
    // Populate or initialize settings
    }

    onWillAppear(jsn) {
        console.log("Will Appear", jsn)
        this.onDidReceiveSettings(jsn)
    }

    onKeyUp(jsn) {
    }

    onSendToPlugin(jsn) {
        console.log("We just got", jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
        console.log("onSendToPlugin do something!")  
        }
    }

    // handleError(title, message) {
    //   console.log('Error', response)

    //   this.drawingCtx.fillStyle = '#1d1e1f'
    //   this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //   this.drawingCtx.fillStyle =  '#FF0000'
    //   this.drawingCtx.font = 600 + " " + 28 + "px Arial";
    //   this.drawingCtx.textAlign = "right"
    //   this.drawingCtx.textBaseline = "top"
    //   this.drawingCtx.fillText(title, 138, 6);

    //   // Render Price
    //   this.drawingCtx.fillStyle = '#d8d8d8'
    //   this.setFontFor(message, 400, this.canvas.width - 20)
    //   this.drawingCtx.textAlign = "right"
    //   this.drawingCtx.textBaseline = "bottom"
    //   this.drawingCtx.fillText(message, 140, 70);

    //   //$SD.api.setImage(this.deckCtx, this.canvas.toDataURL());
    // }

}
