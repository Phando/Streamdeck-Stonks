class AssetManager {
    static dataUrl = "https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=symbol,regularMarketDayRange,regularMarketVolume,regularMarketPrice,marketState,preMarketPrice,postMarketPrice&symbols=";
    interval = 60000
    dataTimer = undefined

    constructor(jsn) {
        this.canvas = document.createElement("canvas")
        this.canvas.width = 144
        this.canvas.height = 144
        this.drawingCtx = this.canvas.getContext("2d");
        this.deckCtx = jsn.context
        this.updateSettings(jsn)
    }

    updateSettings(jsn) {
        console.log("Update Settings", jsn);
        this.jsonObj = jsn
        
        // Settings Initialization
        this.settings = Utils.getProp(this.jsonObj, "payload.settings", {});
        this.settings.interval = this.settings.interval || 60; 
        this.settings.symbol = this.settings.symbol || "GME";
        this.settings.decimals  = this.settings.decimals || 2;
        this.settings.foreground = this.settings.foreground || "#D8D8D8";
        this.settings.background = this.settings.background || "#1D1E1F";
        this.settings.action = "http://andomation.com"
        this.settings.upperlimitaction = "http://andomation.com"
        this.settings.lowerlimitaction = "http://andomation.com"

        // Fix for - https://github.com/Phando/Streamdeck-Stonks/issues/2
        this.settings.upperlimitforeground = this.settings.upperlimitforeground || "#1D1E1F";
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || "#00FF00";
        this.settings.lowerlimitforeground = this.settings.lowerlimitforeground || "#1D1E1F";
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 

        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"; 
        
        // Feature for - https://github.com/Phando/Streamdeck-Stonks/issues/5
        this.settings.action1mode = this.settings.action1mode || "refresh"; 
        this.settings.action2mode = this.settings.action2mode || "refresh"; 
        this.settings.action3mode = this.settings.action3mode || "refresh"; 

        $SD.api.setSettings(this.deckCtx, this.settings);
    }

    updateItem(jsn) {
        console.log('updateItem:', jsn);
        var sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
    
        if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
            this.settings[sdpi_collection.key] = sdpi_collection.value;
            console.log('setSettings....', this.settings);
            $SD.api.setSettings(this.deckCtx, this.settings);
        }
    }

    keyPressed(jsn){
        if (this.actionMode == "url") {
            console.log("OpenURL", this.action)
            $SD.api.openUrl(this.deckCtx, this.action)
        }
        else {
            console.log("Manual Refresh")
            this.startStream()
        }
    }

    

    drawSymbol(data){
        this.drawingCtx.fillStyle =  data.foreground;
        this.drawingCtx.font = 500 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(this.settings.symbol, 140, 6, 137);
    }
    
    drawVolume(data){
        this.drawingCtx.fillStyle = data.foreground;
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(data.volume, 118, 86);
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
        this.drawingCtx.fillText(displayPrice, 142, 86);
    }

    drawRange(data){
        var thumb = 5;
        var height = 14;
        var xPos = (data.price - data.low) / (data.high - data.low)
        xPos = thumb/2 + (xPos * (144-(thumb/2)))

        this.drawingCtx.fillStyle = '#50A050';
        this.drawingCtx.fillRect(0, 144-height, xPos, height);

        this.drawingCtx.fillStyle = '#A05050';
        this.drawingCtx.fillRect(xPos, 144-height, 144, height);

        this.drawingCtx.fillStyle = '#FFFFFF';
        this.drawingCtx.fillRect(xPos, 144-height-4, thumb, height+4);
    }

    drawMarketState(data){
        const image = new Image(60, 45); // Using optional size for image
        var img = document.getElementById(data.open ? 'open' : 'closed');
        this.drawingCtx.drawImage(img, 124, 86, 20, 21);
    }

    updateDisplay(data) {
        this.drawingCtx.fillStyle = data.background;
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Handle Empty/Inital Case
        if (typeof data == "undefined") {
            console.log("UpdateDisplay Empty Case")
        }

        this.drawMarketState(data)
        this.drawSymbol(data)
        this.drawVolume(data)
        this.drawPrice(data)
        this.drawRange(data)

        $SD.api.setImage(this.deckCtx, this.canvas.toDataURL());
    }

    setFontFor(text, weight, maxWidth) {
        return this.calculateFont(text, weight, 4, 40, maxWidth);
    }
    
    calculateFont(text, weight, min, max, desiredWidth) {
        if (max - min < 1) {
            this.drawingCtx.font = weight + " " + min + "px Arial";
            return
        }

        var test = min + (max - min) / 2; //Find half interval
        this.drawingCtx.font = weight + " " + test + "px Arial";
        
        if( this.drawingCtx.measureText(text).width > desiredWidth) {
            return this.calculateFont(text, weight, min, test, desiredWidth);
        }   
        
        return this.calculateFont(text, weight, test, max, desiredWidth);
    }
    
}