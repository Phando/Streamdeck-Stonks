class SimpleAction extends Action {
    chartWidth = 138

    get data(){
        return this.context.data
    }

    set data(data){
        this.context.data = data
    }

    get chart(){
        return this.context.chart
    }

    set chart(data){
        this.context.chart = data
    }

    constructor() {
        super()
        this.type = this.type + ".simple";
    }

    onConnected(jsn) {
        super.onConnected(jsn)
        // Data Provider Handlers
        $SD.on(this.type + '.didReceiveChartData', (jsonObj) => this.onDidReceiveChartData(jsonObj));
        $SD.on(this.type + '.didReceiveChartError', (jsonObj) => this.onDidReceiveChartError(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolData', (jsonObj) => this.onDidReceiveSymbolData(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolError', (jsonObj) => this.onDidReceiveSymbolError(jsonObj));
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn);
        console.log("SimpleAction - Update Settings", jsn, this.settings);
        
        this.context.chartRange = this.context.chartRange || ''
        this.context.pressCount = this.context.pressCount || 0
        this.settings.interval = this.settings.interval || 60
        this.settings.symbol = this.settings.symbol || "GME"
        this.settings.decimals  = this.settings.decimals || 2
        this.settings.foreground = this.settings.foreground || "#D8D8D8"
        this.settings.background = this.settings.background || "#1D1E1F"
        this.settings.action = this.settings.action || "http://andomation.com"
        this.settings.upperlimitaction = this.settings.upperlimitaction || "http://andomation.com"
        this.settings.lowerlimitaction = this.settings.lowerlimitaction || "http://andomation.com"

        this.settings.upperlimitforeground = this.settings.upperlimitforeground || "#1D1E1F"
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || "#00FF00"
        this.settings.lowerlimitforeground = this.settings.lowerlimitforeground || "#1D1E1F"
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"

        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#FF0000"

        this.settings.action1mode = this.settings.action1mode || "refresh"
        this.settings.action2mode = this.settings.action2mode || "refresh"
        this.settings.action3mode = this.settings.action3mode || "refresh"

        $SD.api.setSettings(this.uuid, this.settings);
    }

    onKeyUp(jsn){
        //ranges = ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]

        super.onKeyUp(jsn)
        this.context.pressCount = this.context.pressCount + 1

        switch (this.context.pressCount) {
            case 1:
                this.context.chartRange = '1d'
                dataprovider.fetchChartData('1d','1m')
                break
            case 2:
                this.context.chartRange = '5d'
                dataprovider.fetchChartData('5d','15m')
                break
            case 3:
                this.context.chartRange = '1mo'
                dataprovider.fetchChartData('1mo','1h')
                break
            default:
                this.context.chartRange = ''
                this.context.pressCount = 0
                this.updateDisplay() 
            break
        }
    }

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        dataprovider.fetchSymbolData()
    }

    onDidReceiveChartData(jsn) {
        console.log("SimpleAction - onDidReceiveChartData: ", jsn)
        
        this.uuid = jsn.context
        var payload = jsn.payload.response[0].meta
        
        // If the response chart range is other than what is expected, return
        if(payload.range != this.context.chartRange) return

        payload.data = jsn.payload.response[0].indicators.quote[0].close
        
        payload.min = Math.min(...payload.data)
        payload.max = Math.max(...payload.data)
        payload.interval = (payload.data.length-1) / this.chartWidth

        this.chart = payload
        this.updateDisplay()
    }

    onDidReceiveSymbolData(jsn) {
        console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        
        var payload = {}
        this.uuid = jsn.context
        var symbol = jsn.payload

        payload.open   = true
        payload.price  = symbol.regularMarketPrice + 0.0
        payload.volume = Utils.abbreviateNumber(symbol.regularMarketVolume)
        payload.action     = this.settings.action
        payload.actionMode = this.settings.action1mode
        payload.foreground = this.settings.foreground
        payload.background = this.settings.background
        
        // Symbol remove currency conversion for Crypto
        payload.symbol = symbol.symbol.split('-')[0]

        // Range
        payload.low = symbol.regularMarketDayLow
        payload.high = symbol.regularMarketDayHigh
        payload.change = symbol.regularMarketChangePercent

        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {
            payload.open = false
            payload.price = symbol.postMarketPrice || data.price
            //payload.change = symbol.postMarketChangePercent
            payload.low = payload.price < payload.low ? payload.price : payload.low
            payload.high = payload.price > payload.high ? payload.price : payload.high
        }

        // Check upper limit
        if (String(this.settings.upperlimit).length > 0 && payload.price >= this.settings.upperlimit) {
            payload.action = this.settings.upperlimitaction || this.settings.action
            payload.actionMode = this.settings.upperlimitaction ? this.settings.action2mode : this.settings.action1mode
            payload.foreground = this.settings.upperlimitforeground
            payload.background = this.settings.upperlimitbackground
        }

        // Check lower limit
        if (String(this.settings.lowerlimit).length > 0 && payload.price <= this.settings.lowerlimit) {
            payload.action = this.settings.lowerlimitaction || this.settings.action
            payload.actionMode = this.settings.lowerlimitaction ? this.settings.action3mode : this.settings.action1mode
            payload.foreground = this.settings.lowerlimitforeground
            payload.background = this.settings.lowerlimitbackground
        }

        this.data = payload
        this.updateDisplay()
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

    drawSymbol(){
        let data = this.data
        this.drawingCtx.fillStyle =  data.foreground;
        this.drawingCtx.font = 500 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(data.symbol, 118, 6, 118);
    }

    drawPrice(){
        let data = this.data
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

    drawVolume(){
        let data = this.data
        this.drawingCtx.fillStyle = data.foreground;
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(data.volume, 142, 110);
    }

    drawRange(){
        let data = this.data
        var change = data.change
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
        this.drawingCtx.fillStyle = change < 0 ? '#FF0000' : '#00FF00';
        change *= change < 0 ? -1 : 1
        change = change.toFixed(2) + "%";
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(change, 2, 138);
    }

    drawMarketState(){
        let data = this.data
        const image = new Image(60, 45); // Using optional size for image
        var img = document.getElementById(data.open ? 'openImg' : 'closedImg');
        this.drawingCtx.drawImage(img, 122, 6, 20, 21);
    }

    drawChart(){
        let xPos = (this.canvas.width-this.chartWidth)/2
        let range = 0
        var index = 0
        let chart = this.chart
        let isUp = chart.data[0] < chart.data[chart.data.length-1]
        let fillColor = isUp ? '#008800' : '#880000';
        let tipColor = isUp ? '#00FF00' : '#FF0000';
        
        console.log(isUp, chart.data[0], chart.data[chart.data.length-1])

        for(let i = 0; i < this.chartWidth && index < chart.data.length; i++){
            range = (chart.data[Math.round(index)] - chart.min) / (chart.max - chart.min)
            this.drawingCtx.fillStyle = fillColor
            this.drawingCtx.fillRect(xPos, 144, 1, -(15 + 40 * range));
            this.drawingCtx.fillStyle = tipColor
            this.drawingCtx.fillRect(xPos, 144-(15 + 40 * range), 1, 3);
            index += chart.interval
            xPos++
        }

        if(chart.range == '1d') {
            this.drawingCtx.fillStyle = '#D8D8D8';
            range = (chart.chartPreviousClose - chart.min) / (chart.max - chart.min)
            this.drawingCtx.fillRect(0, 144 - (15 + 40 * range), 144, 2);
        }
        
        var chartRange = chart.range.toUpperCase()
        chartRange = chartRange.substring(0, 2)
    
        this.drawingCtx.fillStyle = '#D8D8D8';
        this.drawingCtx.font = 600 + " " + 20 + "px Arial";
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.fillText(chartRange, 3, 10);
    }

    updateDisplay() {
        this.drawingCtx.fillStyle = this.data.background;
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMarketState()
        this.drawSymbol()
        this.drawPrice()
        
        if(this.context.pressCount == 0){
            this.drawVolume()
            this.drawRange()
        }
        else {
            this.drawChart()
        }

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

}
