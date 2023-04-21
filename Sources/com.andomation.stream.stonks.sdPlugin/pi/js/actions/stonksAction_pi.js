class StonksActionPI extends ActionPI {

    constructor(){
        super()
        this.type = this.type + ".stonks";
    }

    init(jsn) {
        super.init(jsn)
        this.injectContent("content/stonksAction.html", this.onContentLoaded);
        console.log(jsn);
    }

    onContentLoaded = () => {
        console.log("onContentLoaded")
        var parent = document.getElementById('currency')
        
        $.each( Currencies, function( key, value ) {
            $(parent).append($('<option>', {value:key, text:value.name})); 
        })

        // Making the Label automatically match the symbol when changed
        var source = document.getElementById('symbol');
        var target = document.getElementById('symbolLabel');
        source.addEventListener('input', function (evt) {
            target.value = this.value;
        });
        source.addEventListener('focusout', function (evt) {
            $SD.emit("piDataChanged", {key:'symbolLabel',value:this.value,group:false})
        });
    };

    onSymbolResult() {
        console.log("onSymbolResultPI", this.settings.symbol, dataManager.getResultForSymbo(this.settings.symbol))
    }
};