class Manager{
    uuid = 0
    
    constructor() {
    }

    get context(){    
        return contextList[this.uuid]
    }

    get clickCount(){
        return this.context.clickCount
    }

    set clickCount(value){
        this.context.clickCount = value
    }

    get currentView(){
        return this.viewList[this.clickCount]
    }

    get settings(){
        return this.context.settings
    }

    set settings(data){
        this.context.settings = data
    }

    get viewList(){
        return this.context.viewList
    }

    set viewList(value){
        this.context.viewList = value
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
    }
    
    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveData(jsn) {
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        this.uuid = jsn.context
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        this.uuid = jsn.context
    }
}