// Global Variables
//-----------------------------------------------------------------------------------------

let dataManager = new DataManager()

// All actions in the plugin need to be added to the 'actions' array.
// This is true even if your plugin has a single action.
//-----------------------------------------------------------------------------------------

actions.push(new SimpleAction())
actions.push(new ComplexAction())
actions.push(new DecrementAction())
actions.push(new IncrementAction())

// There's only one StreamDeck object. It carries connection parameters 
// and handles communication to/from the software's PluginManager.
//-----------------------------------------------------------------------------------------
$SD = StreamDeck.getInstance();

// The 'connected' event is sent to your plugin, after the plugin's instance
// is registered with Stream Deck software. It carries the current websocket
// and other information about the current environmet in a JSON object
// You can use it to subscribe to events you want to use in your plugin.
//-----------------------------------------------------------------------------------------

$SD.on('connected', (jsn) => { 
  _canvas = document.createElement("canvas")
  _canvas.width = CANVAS_WIDTH
  _canvas.height = CANVAS_HEIGHT
  _drawingCtx = _canvas.getContext("2d");

  actions.forEach(function(item){
    item.onConnected(jsn);
  }); 
});

//-----------------------------------------------------------------------------------------

$SD.on('didReceiveGlobalSettings', (jsn) => {
  // Initialize the globalSettings here if needed
  if(Object.keys(globalSettings).length == 0) {
    console.log("Init GlobalSettings")
    globalSettings.interval = 20
    $SD.api.setGlobalSettings($SD.uuid, globalSettings)
  }

  // TODO : Move polling to the Action and out of the DataManager
  // This change is needed to optimize queries to the API
  dataManager.startPolling()
});
