
class DecrementAction extends Action {
 
  constructor(){
    super();
    this.type = this.type + ".decrement";
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