
class DecrementAction extends Action {
 
  constructor(){
    super();
    this.type = this.type + "stonks.dec";
  }

  onKeyDown(jsn) {
    // Overriding to skip the automatic registration to main.lastPressed
  }

  onKeyUp(jsn) {
    if( lastPressed == '' ) return
    var context = contextList[lastPressed]
    $SD.emit(context.action + ".onDecrement", context);
  }

}

// {
//   "Icon": "images/plugin/incrementAction", 
//   "Name": "Stonks - Increment",
//   "States": [
//     {
//       "Image": "images/actions/incrementAction"
//     }
//   ],
//   "Tooltip": "A button to increment your watch limits.",
//   "UUID": "com.andomation.stream.stonks.increment"
// }