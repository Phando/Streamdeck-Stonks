const STATE_CHARTS = 'charts'
const STATE_LIMITS = 'limits'

const LIMIT_TYPE_NUMERIC = 'numeric'
const LIMIT_TYPE_PERCENT = 'percent'

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

        // Limit Handlers
        $SD.on(this.type + '.onDecrement', (jsonObj) => this.onAdjustLimit(jsonObj, false));
        $SD.on(this.type + '.onIncrement', (jsonObj) => this.onAdjustLimit(jsonObj, true));
        
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
        
        this.settings.symbol = this.settings.symbol || "GME"
        this.settings.decimals  = this.settings.decimals || 2
        this.settings.foreground = this.settings.foreground || "#D8D8D8"
        this.settings.background = this.settings.background || "#1D1E1F"

        this.settings.limitType = this.settings.limitType || LIMIT_TYPE_PERCENT
        this.settings.limitIncrement = this.settings.limitIncrement = 1
        this.settings.limitsEnabled = this.settings.limitsEnabled || false
        
        this.settings.upperlimit = this.settings.upperlimit || Number.MIN_VALUE
        this.settings.upperlimitforeground = this.settings.upperlimitforeground || "#1D1E1F"
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || "#00AA00"
        
        this.settings.lowerlimit = this.settings.lowerlimit || Number.MIN_VALUE
        this.settings.lowerlimitforeground = this.settings.lowerlimitforeground || "#1D1E1F"
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#AA0000"

        // $SD.api.setSettings(this.uuid, {}) // Clear the settings
        $SD.api.setSettings(this.uuid, this.settings) 
    } 

    onKeyUp(jsn){
        //ranges = ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
        //valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
        super.onKeyUp(jsn)

        switch(this.state){    
            case STATE_CHARTS : 
                this.onChartClick(jsn)
                break
            case STATE_LIMITS :        
                if(this.context.clickCount == 2){
                    this.state = STATE_DEFAULT
                    return
                }
                this.updateDisplay() 
                break
            default:
                this.context.clickCount = 0
                this.context.stateName = STATE_CHARTS
                this.onChartClick(jsn)    
                //this.state = STATE_CHARTS

        }
    }

    onLongPress(jsn){
        super.onLongPress(jsn)
        this.onAdjustLimit(jsn,true)

        // Decrementing clickCount to anticipate the keyUp
        this.context.clickCount -= 1
    }

    onChartClick(jsn){
        console.log("Chart Click", this.context.clickCount, jsn)
        switch (this.context.clickCount) {
            case 0:
                this.context.chartRange = '1d'
                dataprovider.fetchChartData('1d','1m')
                break
            case 1:
                this.context.chartRange = '5d'
                dataprovider.fetchChartData('5d','15m')
                break
            case 2:
                this.context.chartRange = '1mo'
                dataprovider.fetchChartData('1mo','1h')
                break
            default:
                this.state = STATE_DEFAULT
                return
        }
    }

    onAdjustLimit(jsn, increment){
        this.uuid = jsn.context
        clearInterval(this.context.adjustTimer)
        
        this.context.adjustTimer = setInterval( function(uuid) {
            this.uuid = uuid
            clearInterval(this.context.adjustTimer)
            this.state = STATE_DEFAULT
        }.bind(this), 5000, this.uuid);

        if(this.state != STATE_LIMITS){
            this.settings.limitEnabled = true
            
            if(this.settings.lowerlimit == Number.MIN_VALUE){
                this.settings.lowerlimit = this.settings.limitType == LIMIT_TYPE_PERCENT ? 0 : this.data.price
            }
            
            if(this.settings.upperlimit == Number.MIN_VALUE){
                this.settings.upperlimit = this.settings.limitType == LIMIT_TYPE_PERCENT ? 0 : this.data.price
            }

            $SD.api.setSettings(this.uuid, this.settings);
            this.state = STATE_LIMITS
            return
        }

        let value = increment ? this.settings.limitIncrement : -this.settings.limitIncrement
        
        if( this.context.clickCount == 0){    
            this.settings.lowerlimit = this.settings.lowerlimit + value
        }
        else {
            this.settings.upperlimit = this.settings.upperlimit + value
        }
        
        $SD.api.setSettings(this.uuid, this.settings)
        this.updateDisplay()
    }

    updatePIValue(keyName, collection){
        for (const [key, value] of Object.entries(this.settings)) {
            if(keyName != key && keyName.includes(key)){
                delete this.settings[key]
                return
            }
        }

        this.settings[keyName] = collection.value
        this.settings[collection.key] = collection.value
        $SD.api.setSettings(this.uuid, this.settings); 
    }

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});

        // TODO : Automate this better, the root is radios and checkboxes
        if(sdpi_collection.hasOwnProperty('key') && sdpi_collection.hasOwnProperty('value')){
            if(sdpi_collection.key.includes('limitType')){
                this.updatePIValue('limitType', sdpi_collection)
            }

            if(sdpi_collection.key.includes('limitsEnabled')){
                this.updatePIValue('limitsEnabled', sdpi_collection)
            }
        }

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

        // if(this.context.clickCount == 1){
        //     var tmp = []
        //     for(var i = payload.data.length - 1; i >= 0; i--){
        //         tmp.push(payload.data[i]);
        //     }
        //     payload.range = "1m"
        //     payload.data = tmp.reverse();
        //     payload.interva = 1
        // }

        this.chart = payload
        this.updateDisplay()
    }

    onDidReceiveSymbolData(jsn) {
        console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        
        var payload = {}
        this.uuid = jsn.context
        var symbol = jsn.payload

        if(typeof symbol == 'undefined'){
            var data = {context : jsn.context, error:{}}
            data.error.message = this.settings.symbol
            data.error.message1 = 'Not Found'
            this.renderError(data)
            return
        }

        if(symbol.quoteType == "MUTUALFUND"){
            var data = {context : jsn.context, error:{}}
            data.error.message = 'Mutual Funds'
            data.error.message1 = 'Not Supported'
            data.error.message2 = 'Yet'
            this.renderError(data)
            return
        }

        payload.price       = symbol.regularMarketPrice
        payload.open        = symbol.regularMarketOpen
        payload.prevClose   = symbol.regularMarketPreviousClose
        payload.volume      = Utils.abbreviateNumber(symbol.regularMarketVolume)
        payload.action      = this.settings.action
        payload.actionMode  = this.settings.action1mode
        payload.foreground  = this.settings.foreground
        payload.background  = this.settings.background
        
        // Symbol remove currency conversion for Crypto
        payload.symbol = symbol.symbol.split('-')[0]

        // Range
        payload.state   = ''
        payload.low     = symbol.regularMarketDayLow
        payload.high    = symbol.regularMarketDayHigh
        payload.change  = symbol.regularMarketChangePercent

        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {

            if(symbol.marketState.includes("POST")){
                payload.state = symbol.marketState == "POSTPOST" ? "CLD" : "AH"
                payload.price = symbol.postMarketPrice || payload.price
                payload.change = symbol.postMarketChangePercent || ''
            }
            else {
                payload.state = symbol.marketState == "PREPRE" ? "CLD" : "PRE"
                payload.price = symbol.preMarketPrice || payload.price
                payload.change = symbol.preMarketChangePercent || ''
            }
            
            payload.low = payload.price < payload.low ? payload.price : payload.low
            payload.high = payload.price > payload.high ? payload.price : payload.high
        }

        // Implement the limits
        var limit = 0
        if (this.settings.limitsEnabled) {
            if(this.settings.limitType == LIMIT_TYPE_PERCENT){
                limit = payload.change >= this.settings.upperlimit ? 1 : 0
                limit = payload.change <= this.settings.upperlimit ? -1 : limit
            } 
            else {
                limit = payload.price >= this.settings.upperlimit ? 1 : 0
                limit = payload.price <= this.settings.upperlimit ? -1 : limit
            }
            
            if( limit == 1){
                // Upper Limit
                payload.foreground = this.settings.upperlimitforeground
                payload.background = this.settings.upperlimitbackground
            }
            if( limit == 1){
                // Lower Limit
                payload.foreground = this.settings.lowerlimitforeground
                payload.background = this.settings.lowerlimitbackground
            }
        }

        this.data = payload
        this.updateDisplay()
    }

    onDidReceiveSymbolError(jsn) {
        console.log('Action - Error', jsn)
        this.uuid = jsn.context
        this.drawingCtx.fillStyle = '#1d1e1f'
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawingCtx.fillStyle =  '#FF0000'
        this.drawingCtx.font = 600 + " " + 28 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText("HELLO", 138, 6);

        // Render Message
        this.drawingCtx.fillStyle = '#d8d8d8'
        this.setFontFor(jsn.error.message, 400, this.canvas.width - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(jsn.error.message, 140, 70);

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    drawSymbol(){
        let data = this.data
        this.drawingCtx.fillStyle =  data.foreground;
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(data.symbol, 136, 8);
    }

    drawPrice(color, value){
        var displayPrice = value;
        
        // Apply decimal option
        if (typeof this.settings.decimals != "undefined") {
            displayPrice = value.toFixed(this.settings.decimals);
        }
        
        if(value > 100000){
            displayPrice = this.abbreviateNumber(value, 4);
        }

        // Render Price
        this.drawingCtx.fillStyle = color;
        this.setFontFor(displayPrice, 600, this.canvas.width - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(displayPrice, 142, 36);
    }

    drawVolume(){
        let data = this.data
        this.drawingCtx.fillStyle = data.foreground;
        this.drawingCtx.font = 500 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(data.volume, 142, 110);
    }

    drawMarketState(){
        let data = this.data
        this.drawingCtx.fillStyle = data.foreground
        this.drawingCtx.font = 500 + " " + 18 + "px Arial"
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.fillText(data.state, 5, 88);
    }

    drawRange(){
        let data = this.data
        if(data.change == '') return

        var change = data.change
        this.drawingCtx.fillStyle = change < 0 ? '#FF0000' : '#00FF00';
        change *= change < 0 ? -1 : 1
        change = change.toFixed(2) + "%";
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "bottom"
        this.drawingCtx.fillText(change, 2, 138);
    }

    drawChart(){
        let xPos = (this.canvas.width-this.chartWidth)/2
        let range = 0
        var index = 0
        let chart = this.chart
        let isUp = chart.data[0] < chart.data[chart.data.length-1]
        let fillColor = isUp ? '#008800' : '#880000'
        let tipColor = isUp ? '#00FF00' : '#FF0000'

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
            this.drawingCtx.fillStyle = this.data.foreground
            range = (chart.chartPreviousClose - chart.min) / (chart.max - chart.min)
            this.drawingCtx.fillRect(0, 144 - (15 + 40 * range), 144, 2);
        }
        
        var chartRange = chart.range.toUpperCase()
        chartRange = chartRange.substring(0, 2)
    
        this.drawingCtx.fillStyle = this.data.foreground
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.fillText(chartRange, 3, 10);
    }

    updateDefaultView(){
        this.drawSymbol()
        this.drawPrice(this.data.foreground, this.data.price)
        
        if(this.state == STATE_DEFAULT){
            this.drawMarketState()
            this.drawVolume()
            this.drawRange()
        }
    }

    updateLimitsView(){
        let isLow = this.context.clickCount == 0
        this.drawingCtx.fillStyle = "#1D1E1F";
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        var label = isLow ? "Low" : "High"
        var value = isLow ? this.settings.lowerlimit : this.settings.upperlimit
        
        this.drawingCtx.fillStyle =  "#D8D8D8";
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(label + ' Limit', 136, 8);

        if(this.settings.limitType == LIMIT_TYPE_NUMERIC){
            this.drawPrice("#D8D8D8", value)
        }
        else {
            value += '%'
            this.setFontFor(value, 600, this.canvas.width - 20)
            this.drawingCtx.fillText(value, 140, 38);
        }
    }

    updateChartView(){
        this.updateDefaultView()
        this.drawChart()
    }

    updateDisplay() {
        this.drawingCtx.fillStyle = this.data.background;
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        switch(this.state){    
            case STATE_CHARTS : 
                this.updateChartView()
                break
            case STATE_LIMITS :
                this.updateLimitsView()
                break
            default:
                this.updateDefaultView()
        }

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    renderError(jsn) {
        console.log('Action - renderError', jsn)
        this.drawingCtx.fillStyle = '#1d1e1f'
        this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawingCtx.fillStyle =  '#FF0000'
        this.drawingCtx.font = 600 + " " + 26 + "px Arial";
        this.drawingCtx.textAlign = "center"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText("Error", this.canvas.width/2, 6);

        // Render Message
        this.drawingCtx.fillStyle = '#d8d8d8'
        this.drawingCtx.font = 600 + " " + 19 + "px Arial";
        this.drawingCtx.fillText(jsn.error.message, this.canvas.width/2, 40);

        if(jsn.error.hasOwnProperty('message1'))
            this.drawingCtx.fillText(jsn.error.message1, this.canvas.width/2, 70);

        if(jsn.error.hasOwnProperty('message2'))
            this.drawingCtx.fillText(jsn.error.message2, this.canvas.width/2, 100);

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

}
