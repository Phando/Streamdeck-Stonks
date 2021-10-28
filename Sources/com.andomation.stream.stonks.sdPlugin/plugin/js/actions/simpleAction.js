class SimpleAction extends Action {

    constructor() {
        super()
        this.type = this.type + ".simple";
    }

    onConnected(jsn) {
        super.onConnected(jsn)
        // Data Provider Handlers
        //$SD.on(this.type + '.didReceiveChartData', (jsonObj) => this.onDidReceiveChartData(jsonObj));
        //$SD.on(this.type + '.didReceiveChartError', (jsonObj) => this.onDidReceiveChartError(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolData', (jsonObj) => this.onDidReceiveSymbolData(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolError', (jsonObj) => this.onDidReceiveSymbolError(jsonObj));
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn);
        console.log("SimpleAction - Update Settings", jsn, this.settings);

        this.settings.interval = this.settings.interval || 60; 
        this.settings.symbol = this.settings.symbol || "GME";
        this.settings.decimals  = this.settings.decimals || 2;
        this.settings.foreground = this.settings.foreground || "#D8D8D8";
        this.settings.background = this.settings.background || "#1D1E1F";
        this.settings.action = this.settings.action || "http://andomation.com"
        this.settings.upperlimitaction = this.settings.upperlimitaction || "http://andomation.com"
        this.settings.lowerlimitaction = this.settings.lowerlimitaction || "http://andomation.com"

        this.settings.upperlimitforeground = this.settings.upperlimitforeground || "#1D1E1F";
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || "#00FF00";
        this.settings.lowerlimitforeground = this.settings.lowerlimitforeground || "#1D1E1F";
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 

        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 

        this.settings.action1mode = this.settings.action1mode || "refresh"; 
        this.settings.action2mode = this.settings.action2mode || "refresh"; 
        this.settings.action3mode = this.settings.action3mode || "refresh"; 

        $SD.api.setSettings(this.uuid, this.settings);
    }

    onKeyUp(jsn){
        super.onKeyUp(jsn);
        console.log("Click!")
            
        // if (this.actionMode == "url") {
        //     console.log("OpenURL", this.action)
        //     $SD.api.openUrl(this.uuid, this.action)
        // }
        // else {
        //     console.log("Manual Refresh")
        //     this.startStream()
        // }
    }

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        dataprovider.fetchSymbolData();
    }

    onDidReceiveSymbolData(jsn) {
        console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        
        var data = {}
        var symbol = jsn.payload
        this.uuid = jsn.context

        data.open = true;
        data.price = symbol.regularMarketPrice + 0.0;
        data.volume = Utils.abbreviateNumber(symbol.regularMarketVolume);
        data.foreground = this.settings.foreground;
        data.background = this.settings.background;
        this.action = this.settings.action;
        this.actionMode = this.settings.action1mode;
        
        // Symbol remove currency conversion for Crypto
        data.symbol = symbol.symbol.split('-')[0];

        // Range
        data.low = symbol.regularMarketDayLow
        data.high = symbol.regularMarketDayHigh
        data.change = symbol.regularMarketChangePercent

        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {
            data.open = false;
            data.price = symbol.postMarketPrice || data.price;
            data.low = data.price < data.low ? data.price : data.low;
            data.high = data.price > data.high ? data.price : data.high;
        }

        // Check upper limit
        if (String(this.settings.upperlimit).length > 0 && data.price >= this.settings.upperlimit) {
            data.foreground = this.settings.upperlimitforeground;
            data.background = this.settings.upperlimitbackground;
            this.action = this.settings.upperlimitaction || this.settings.action;
            this.actionMode = this.settings.upperlimitaction ? this.settings.action2mode : this.settings.action1mode;
        }

        // Check lower limit
        if (String(this.settings.lowerlimit).length > 0 && data.price <= this.settings.lowerlimit) {
            data.foreground = this.settings.lowerlimitforeground;
            data.background = this.settings.lowerlimitbackground;
            this.action = this.settings.lowerlimitaction || this.settings.action;
            this.actionMode = this.settings.lowerlimitaction ? this.settings.action3mode : this.settings.action1mode;
        }

        this.updateDisplay(data); 
    }

    onDidReceiveSymbolError(jsn) {
        console.log('Action - Error', jsn)
        this.updateDisplay(jsn);
        this.drawingCtx.fillStyle = '#1d1e1f'
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawingCtx.fillStyle =  '#FF0000'
        this.drawingCtx.font = 600 + " " + 28 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(title, 138, 6);

        // Render Price
        this.drawingCtx.fillStyle = '#d8d8d8'
        this.setFontFor(message, 400, this.canvas.width - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(message, 140, 70);

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    drawSymbol(data){
        this.drawingCtx.fillStyle =  data.foreground;
        this.drawingCtx.font = 500 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(data.symbol, 118, 6, 118);
    }

    drawPrice(data){
        var displayPrice = data.price;
        
        // Apply decimal option
        if (typeof this.settings.decimals != "undefined") {
            displayPrice = data.price.toFixed(this.settings.decimals);
        }
        
        if(data.price > 100000){
            displayPrice = this.abbreviateNumber(data.price, 4);
        }

        // Render Price
        this.drawingCtx.fillStyle = data.foreground;
        this.setFontFor(displayPrice, 600, this.canvas.width - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(displayPrice, 142, 80);
    }

    drawVolume(data){
        this.drawingCtx.fillStyle = data.foreground;
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(data.volume, 142, 124);
    }

    drawRange(data){
        // var thumb = 5;
        // var height = 14;
        // var xPos = (data.price - data.low) / (data.high - data.low)
        // xPos = thumb/2 + (xPos * (144-(thumb/2)))

        // this.drawingCtx.fillStyle = '#50A050';
        // this.drawingCtx.fillRect(0, 144-height, xPos, height);

        // this.drawingCtx.fillStyle = '#A05050';
        // this.drawingCtx.fillRect(xPos, 144-height, 144, height);

        // this.drawingCtx.fillStyle = '#FFFFFF';
        // this.drawingCtx.fillRect(xPos, 144-height-4, thumb, height+4);
        this.drawingCtx.fillStyle = data.change < 0 ? '#FF0000' : '#00FF00';
        data.change *= data.change < 0 ? -1 : 1
        data.change = data.change.toFixed(2);
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(data.change, 2, 124);
    }

    drawMarketState(data){
        const image = new Image(60, 45); // Using optional size for image
        var img = document.getElementById(data.open ? 'openImg' : 'closedImg');
        this.drawingCtx.drawImage(img, 122, 6, 20, 21);
    }

    updateDisplay(data) {
        this.drawingCtx.fillStyle = data.background;
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        console.log("Got some data", data)
        // Handle Empty/Inital Case
        if (typeof data == "undefined") {
            console.log("UpdateDisplay Empty Case")
        }

        this.drawMarketState(data)
        this.drawSymbol(data)
        this.drawVolume(data)
        this.drawPrice(data)
        this.drawRange(data)

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

}
