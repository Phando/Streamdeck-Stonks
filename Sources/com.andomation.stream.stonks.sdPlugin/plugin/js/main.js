// let websocket = null;
// let pluginUUID = null;
// let symbol = "GME";

let actions = [
  new CoreAction(),
  new SimpleAction(),
  new ComplexAction()
];

let contexts = {
  coreAction: [],
  simpleAction: [],
  complexAction: []
};

// const connectElgatoStreamDeckSocket = (
//   inPort,
//   inPluginUUID,
//   inRegisterEvent,
//   inInfo
// ) => {
//   pluginUUID = inPluginUUID;

//   websocket = new WebSocket("ws://127.0.0.1:" + inPort);

//   websocket.onopen = async () => {
//     // try {
//     //   foobarPlayerState = await foobar.getPlayerState();
//     // } catch {
//     //   websocketUtils.log(
//     //     "Error to connect with foobar2000, check if foobar is running!"
//     //   );
//     // }
//     websocketUtils.registerPlugin(pluginUUID, inRegisterEvent);
//   };

//   websocket.onmessage = (evt) => {
//     const { event, action, context, payload } = JSON.parse(evt.data);
//     const { settings, coordinates } = payload || {};

//     console.log(event, action, context, settings)
//     // if(String(action).includes("simple")){
//     //   actions.simpleAction.setSymbol(symbol)
//     //   if(symbol == "GME"){
//     //     symbol = "AMC"
//     //   }
//     // }
//     // if (foobarPlayerState) {
//     //   actions.currentVolumeAction.setCurrentVolume(
//     //     foobarPlayerState.volume.value
//     //   );
//       // actions.coreAction.setPlaybackState(foobarPlayerState.playbackState);
//       // actions.simpleAction.setMuteStatus(foobarPlayerState.volume.isMuted);
//       // actions.complexAction.setVolume(foobarPlayerState.volume.value);
//     //}

//     Object.keys(actions).forEach((key) => {
//       if (actions[key].type === action) {
//         actions[key].setContext(context);
//         actions[key].setSettings(settings);
//       }
//     });

//     if (event == "keyDown" || event == "keyUp") {
//       const { state } = payload;
//       Object.keys(actions).forEach((key) => {
//         if (actions[key].type === action) {
//           event === "keyDown"
//             ? actions[key].onKeyDown &&
//               actions[key].onKeyDown(coordinates, state)
//             : actions[key].onKeyUp && actions[key].onKeyUp(coordinates, state);
//         }
//       });
//     } 
//     else if (event == "willAppear") {
//       Object.keys(actions).forEach((key) => {
//         if (actions[key].type === action) {
//           contexts[key] && contexts[key].push(context);
//           actions[key].onWillAppear && actions[key].onWillAppear(coordinates);
//         }
//       });
//     } 
//     else if (event == "willDisappear") {
//       Object.keys(intervals).forEach((key) => {
//         clearInterval(intervals[key]);
//       });
//       intervals = {};
//     }
//   };

//   websocket.onclose = () => {
//     // Websocket is closed
//   };
// };

/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help you quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

/**
 * This is the instance of the StreamDeck object.
 * There's only one StreamDeck object, which carries
 * connection parameters and handles communication
 * to/from the software's PluginManager.
 */

$SD = StreamDeck.getInstance();
$SD.api = SDApi;
$SD.on('connected', (jsn) => {
  actions.forEach(function(item){
    $SD.on(item.type + '.didReceiveSettings', (jsonObj) => item.onDidReceiveSettings(jsonObj));
    $SD.on(item.type + '.willAppear', (jsonObj) => item.onWillAppear(jsonObj));
    $SD.on(item.type + '.keyUp', (jsonObj) => item.onKeyUp(jsonObj));
    $SD.on(item.type + '.sendToPlugin', (jsonObj) => item.onSendToPlugin(jsonObj));
    $SD.on(item.type + '.propertyInspectorDidAppear', (jsonObj) => console.log("propertyInspectorDidAppear"));
    $SD.on(item.type + '.propertyInspectorDidDisappear', (jsonObj) => console.log("propertyInspectorDidDisappear"));
  });
});