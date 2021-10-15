class Action {
  type = "com.andomation.stream.stonks";
  symbol = "";
  settings = null;

  constructor() {
    this.canvas = document.createElement("canvas")
    this.canvas.width = 144
    this.canvas.height = 144
    this.drawingCtx = this.canvas.getContext("2d");
  }

  updateSettings(jsn){
    console.log("Settings", this.settings)
    //this.setTitle = this.settings.title;
    $SD.api.setSettings($SD.uuid, this.settings);
  }
  
  onDidReceiveSettings(jsn) {
    // Populate or initialize settings
    this.settings = Utils.getProp(jsn, 'payload.settings', {});
    this.updateSettings(jsn)
  }

  onDidReceiveGlobalSettings(jsn) {
    // Populate or initialize settings
  }

  onWillAppear(jsn) {
    // You can cache your settings in 'onWillAppear'
    // $SD.api.getSettings(jsn.context);
    //this.deckCtx = jsn.context
    this.onDidReceiveSettings(jsn)
    contexts[jsn.context] = new Context(jsn)
    console.log("Will Appear", jsn)
  }

  onKeyUp(jsn) {
      this.doSomeThing(jsn, 'onKeyUp', 'green');
  }

  onSendToPlugin(jsn) {
      console.log("We just got", jsn)
      const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
      if (sdpi_collection.value && sdpi_collection.value !== undefined) {
        console.log("onSendToPlugin do something!")  
        //this.doSomeThing({ [sdpi_collection.key] : sdpi_collection.value }, 'onSendToPlugin', 'fuchsia');            
      }
  }

  saveSettings(jsn, sdpi_collection) {
      console.log('Action saveSettings:', jsn);
      if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
          if (sdpi_collection.value && sdpi_collection.value !== undefined) {
              if( globalSettings.hasOwnProperty(sdpi_collection.key) ){
                globalSettings[sdpi_collection.key] = sdpi_collection.value;
                $SD.api.setGlobalSettings(jsn.context, globalSettings);
                console.log('setGlobalSettings....', globalSettings);
              }
              else {
                this.settings[sdpi_collection.key] = sdpi_collection.value;
                $SD.api.setSettings(jsn.context, this.settings);
                console.log('setSettings....', this.settings);
              }
          }
      }
  }

  setTitle(jsn) {
      if (this.settings && this.settings.hasOwnProperty('mynameinput')) {
          console.log("watch the key on your StreamDeck - it got a new title...", this.settings.mynameinput);
          $SD.api.setTitle(jsn.context, this.settings.mynameinput);
      }
  }

  doSomeThing(inJsonData, caller, tagColor) {
      console.log('%c%s', `color: white; background: ${tagColor || 'grey'}; font-size: 15px;`, `[app.js]doSomeThing from: ${caller}`);
      // console.log(inJsonData);
  }

}
