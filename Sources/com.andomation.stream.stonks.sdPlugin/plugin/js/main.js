let dataprovider = new Dataprovider();

/** 
 * All actions in your plugin need to be added to the 'actions' array.
 * This is true even if your plugin has a single action.
 */

actions.push(new SimpleAction())
actions.push(new ComplexAction())

/**
 * There's only one StreamDeck object. It carries connection parameters 
 * and handles communication to/from the software's PluginManager.
 */

$SD = StreamDeck.getInstance();

$SD.on('didReceiveGlobalSettings', (jsn) => {
  // Initialize the globalSettings here if needed
  if(Object.keys(globalSettings).length == 0) {
    console.log("Init GlobalSettings")
    globalSettings.interval = 20
    $SD.api.setGlobalSettings($SD.uuid, globalSettings)
  }

  dataprovider.startPolling()
});

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on('connected', (jsn) => {
  actions.forEach(function(item){
    item.onConnected(jsn);
    // $SD.on(item.type + '.willAppear', (jsonObj) => item.onWillAppear(jsonObj));
    // $SD.on(item.type + '.didReceiveSettings', (jsonObj) => item.onDidReceiveSettings(jsonObj));
    // $SD.on(item.type + '.keyUp', (jsonObj) => item.onKeyUp(jsonObj));
    // $SD.on(item.type + '.sendToPlugin', (jsonObj) => item.onSendToPlugin(jsonObj));
    // $SD.on(item.type + '.propertyInspectorDidAppear', (jsonObj) => console.log("propertyInspectorDidAppear"));
    // $SD.on(item.type + '.propertyInspectorDidDisappear', (jsonObj) => console.log("propertyInspectorDidDisappear"));
    
    // // Data Provider Handlers
    // $SD.on(item.type + '.didReceiveChartData', (jsonObj) => item.onDidReceiveChartData(jsonObj));
    // $SD.on(item.type + '.didReceiveChartError', (jsonObj) => item.onDidReceiveChartError(jsonObj));
    // $SD.on(item.type + '.didReceiveSymbolData', (jsonObj) => item.onDidReceiveSymbolData(jsonObj));
    // $SD.on(item.type + '.didReceiveSymbolError', (jsonObj) => item.onDidReceiveSymbolError(jsonObj));
  }); 
});
