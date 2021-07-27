class StonksAction {
    
    // $SD.api.getSettings(jsn.context);
    constructor(){
        this.instanceList = {}
    }

    //------------------------------ Class API -----------------------------------//

    getInstance(jsn){
        if(!this.instanceList.hasOwnProperty(jsn.context)){
            console.log("Creating Instance")
            this.instanceList[jsn.context] = new AssetManager(jsn)
        }
        
        var instance = this.instanceList[jsn.context]
        return instance
    }

    startStream(jsn){
        console.log("startStream", jsn);
        var instance = this.getInstance(jsn)
        instance.updateSettings(jsn)
        instance.startStream()
    }

    stopStream(jsn){
        console.log("stopStream", jsn);
        var instance = this.getInstance(jsn)
        instance.stopStream();
    }


    //------------------------------ SD API Implementation -----------------------------------//
    onWillAppear(jsn){
        console.log("onWillAppear", jsn)
        var instance = this.getInstance(jsn)
        instance.startStream()
    }

    onDidReceiveSettings(jsn) {
        console.log("onDidReceiveSettings", jsn)
        var instance = this.getInstance(jsn)
        instance.updateSettings(jsn)
        instance.startStream()
    }
      
    onKeyUp(jsn) {
        console.log("onKeyUp", jsn)
        var instance = this.getInstance(jsn)
        instance.keyPressed(jsn)

        //this.doSomeThing(jsn, "onKeyUp", "green");
        //this.updateDisplay(jsn);
    }

    onSendToPlugin(jsn) {
        console.log("onSendToPlugin", jsn)
        var instance = this.getInstance(jsn)
        instance.updateItem(jsn)
        instance.startStream()
    }
}

connected = (jsonObj) => {
    console.log("Stonks Connected");
    $SD.on("com.andomation.stream.stonks.action.willAppear", jsonObj => stonks.onWillAppear(jsonObj));
    $SD.on('com.andomation.stream.stonks.action.keyUp', jsonObj => stonks.onKeyUp(jsonObj));
    $SD.on('com.andomation.stream.stonks.action.sendToPlugin', jsonObj => stonks.onSendToPlugin(jsonObj));
    $SD.on('com.andomation.stream.stonks.action.didReceiveSettings', jsonObj => stonks.onDidReceiveSettings(jsonObj));

    // $SD.on('com.andomation.stream.stonks.action.propertyInspectorDidAppear', jsonObj => {
    //     console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]propertyInspectorDidAppear:');
    //     stonks.stopStream(jsonObj);
    // });

    // $SD.on('com.andomation.stream.stonks.action.propertyInspectorDidDisappear', jsonObj => {
    //     console.log('%c%s', 'color: white; background: red; font-size: 13px;', '[app.js]propertyInspectorDidDisappear:');
    //     stonks.startStream(jsonObj);
    // });
};

const stonks = new StonksAction();
$SD.on("connected", (jsonObj) => connected(jsonObj));
