class StonksActionPI extends ActionPI {

    constructor(){
        super()
        this.type = this.type + ".stonks";
    }

    init(jsn) {
        super.init(jsn)
        this.injectContent("content/stonksAction.html", this.onContentLoaded);
    }

    onContentLoaded = () => {
        console.log("onContentLoaded")
        var parent = document.getElementById('currency')
        
        $.each( Currencies, function( key, value ) {
            $(parent).append($('<option>', {value:key, text:value.name})); 
        })
    };

    onSymbolResult() {
        console.log("onSymbolResultPI", this.settings.symbol, dataManager.getResultForSymbo(this.settings.symbol))
    }
};