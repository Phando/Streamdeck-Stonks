class SimpleActionPI extends ActionPI {

    constructor(){
        super()
        this.type = this.type + ".simple";
    }

    init(jsn) {
        super.init(jsn)
        this.injectContent("content/simpleAction.html", this.onContentLoaded);
    }

    onContentLoaded = () => {
        console.log("onContentLoaded")
    };

    onSymbolResult() {
        console.log("onSymbolResultPI", this.settings.symbol, dataprovider.getResultForSymbo(this.settings.symbol))
    }
};