let dataprovider = new Dataprovider();

/** 
 * All actions in your plugin need to be added to the 'actions' array.
 * This is true even if your plugin has a single action.
 */

actions.push(new SimpleAction())
actions.push(new ComplexAction())
actions.push(new CoreAction())

/**
 * There's only one StreamDeck object. It carries connection parameters 
 * and handles communication to/from the software's PluginManager.
 */

$SD = StreamDeck.getInstance();

$SD.on('didReceiveGlobalSettings', (jsn) => {
  
  // Initialize the globalSettings here if needed
  if(Object.keys(globalSettings).length == 0) {
    console.log("Init GlobalSettings")
    globalSettings.interval = 60
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
    $SD.on('didReceiveGlobalSettings', (jsonObj) => item.onDidReceiveGlobalSettings(jsonObj));
    $SD.on(item.type + '.willAppear', (jsonObj) => item.onWillAppear(jsonObj));
    $SD.on(item.type + '.didReceiveSettings', (jsonObj) => item.onDidReceiveSettings(jsonObj));
    $SD.on(item.type + '.keyUp', (jsonObj) => item.onKeyUp(jsonObj));
    $SD.on(item.type + '.sendToPlugin', (jsonObj) => item.onSendToPlugin(jsonObj));
    $SD.on(item.type + '.propertyInspectorDidAppear', (jsonObj) => console.log("propertyInspectorDidAppear"));
    $SD.on(item.type + '.propertyInspectorDidDisappear', (jsonObj) => console.log("propertyInspectorDidDisappear"));
  });
});
