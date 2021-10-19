class SimpleAction extends Action {

  constructor(){
    super()
    this.type = this.type + ".simple";
  }

  onWillAppear(jsn) {
    super.onWillAppear(jsn);
  }

  onSendToPlugin(jsn) {
    //if(this.settings.symbol)
    //saveSettings()
  }

}
