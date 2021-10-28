class SimpleActionPI extends ActionPI {

    constructor(){
        super()
        this.type = this.type + ".simplePI";
    }

    init(jsn) {
        super.init(jsn)
        this.settings.symbol = this.settings.symbol ? this.settings.symbol : "CRM";
        this.settings.decimals = this.settings.decimals ? this.settings.decimals : 2;
        this.settings.interval = globalSettings.interval ? globalSettings.interval : 60;
        //this.settings.single-check = "checked" //true//this.settings.interval ? this.settings.interval : 60;
        //singlechk
        //saveSettings(this.uuid, this.settings);
        saveSettings(this.settings);
        this.injectContent("content/simpleAction.html", this.onContentLoaded);
    }

    onContentLoaded = () => {
        console.log("Callback")
        
        // this.initField("symbol");//, "CRM"); 
        // this.initField("decimals");//, 2);
        // this.initField("interval");//, 60);
    };

    onSymbolResult() {
        console.log("onSymbolResult", this.settings.symbol, dataprovider.getResultForSymbo(this.settings.symbol))
  //   var data = {}

  //   data.open = true;
  //   data.symbol = response.symbol;
  //   data.price = response.regularMarketPrice + 0.0;
  //   data.volume = this.abbreviateNumber(response.regularMarketVolume);
  //   data.foreground = this.settings.foreground;
  //   data.background = this.settings.background;
  //   this.action = this.settings.action;
  //   this.actionMode = this.settings.action1mode;

  //   // Parse Range
  //   var range = response.regularMarketDayRange.split(" - ");
  //   data.low = range[0];
  //   data.high = range[1];

  //   // Factor after market pricing
  //   if (response.marketState != "REGULAR") {
  //       data.open = false;
  //       data.price = response.postMarketPrice || data.price;
  //       data.low = data.price < data.low ? data.price : data.low;
  //       data.high = data.price > data.high ? data.price : data.high;
  //   }

  //   // Check upper limit
  //   if (String(this.settings.upperlimit).length > 0 && data.price >= this.settings.upperlimit) {
  //       data.foreground = this.settings.upperlimitforeground;
  //       data.background = this.settings.upperlimitbackground;
  //       this.action = this.settings.upperlimitaction || this.settings.action;
  //       this.actionMode = this.settings.upperlimitaction ? this.settings.action2mode : this.settings.action1mode;
  //   }

  //   // Check lower limit
  //   if (String(this.settings.lowerlimit).length > 0 && data.price <= this.settings.lowerlimit) {
  //       data.foreground = this.settings.lowerlimitforeground;
  //       data.background = this.settings.lowerlimitbackground;
  //       this.action = this.settings.lowerlimitaction || this.settings.action;
  //       this.actionMode = this.settings.lowerlimitaction ? this.settings.action3mode : this.settings.action1mode;
  //   }
    }
};