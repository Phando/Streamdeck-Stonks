const STATE_CHARTS  = 'charts'
const STATE_DAY     = 'day'
const STATE_LIMITS  = 'limits'

const LIMIT_TYPE_NUMERIC = 'numeric'
const LIMIT_TYPE_PERCENT = 'percent'

const FooterType = Object.freeze({
    CHANGE  : 'change',
    HIGHLO  : 'hilo',
    HIGHLOP : 'hiloprc',
    SLIDER  : 'slider'
});

const ViewType = Object.freeze({
    DEFAULT         : 'defaultView',
    DAY_DEC         : 'showDayDecmial',
    DAY_PERC        : 'showDayPercent',
    CHART_1MIN      : 'show1minChart',
    CHART_3MIN      : 'show3minChart',
    CHART_DAY_3MIN  : 'show3minDayChart',
    CHART_DAY_5MIN  : 'show5minDayChart',
    CHART_DAY_5     : 'show5DayChart',
    CHART_MONTH_1   : 'show1MonthChart',
    CHART_MONTH_3   : 'show3MonthChart',
    CHART_MONTH_6   : 'show6MonthChart',
    CHART_MONTH_12  : 'show12MonthChart',

    keyFor : (value) => {
        for (const [key, match] of Object.entries(ViewType)) {
            if(value == match){
                return key
            }
        }
    }
});

class SimpleAction extends Action {
    chartManager = new ChartManager()

    constructor() {
        super() 
        this.type = this.type + ".simple";
    }

    get chartData(){
        return this.context.chartData
    }

    set chartData(value){
        this.context.chartData = value
    }

    // Streamdeck Event Handlers
    //-----------------------------------------------------------------------------------------

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
        super.onDidReceiveSettings(jsn)
        this.chartManager.onDidReceiveSettings(jsn)

        console.log("SimpleAction - onDidReceiveSettings", jsn, this.settings)
        this.settings.symbol     = this.settings.symbol || 'GME'
        this.settings.decimals   = this.settings.decimals || 2
        this.settings.foreground = this.settings.foreground || '#D8D8D8'
        this.settings.background = this.settings.background || '#1D1E1F'
        this.settings.footerMode = this.settings.footerMode || FooterType.CHANGE
        
        this.settings.limitType      = this.settings.limitType || LIMIT_TYPE_PERCENT
        this.settings.limitIncrement = this.settings.limitIncrement = 1
        this.settings.limitsEnabled  = this.settings.limitsEnabled || 'false'
        
        this.settings.upperlimit = this.settings.upperlimit || 0
        this.settings.lowerlimit = this.settings.lowerlimit || 0
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || '#00AA00'
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || '#AA0000'
        this.prepViewList()
        
        //this.settings = {} // Uncomment to clear the settings
        $SD.api.setSettings(this.uuid, this.settings) 
    } 

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn){
        super.onKeyUp(jsn)
        
        if( this.state == STATE_LIMITS ){    
            this.onLimitClick()
            return
        }
        
        this.onDefaultClick(jsn) 
    }

    //-----------------------------------------------------------------------------------------

    onLongPress(jsn){
        super.onLongPress(jsn)
        this.onAdjustLimit(jsn,true)
    }

    //-----------------------------------------------------------------------------------------

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

    //-----------------------------------------------------------------------------------------

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        this.prepViewList()
        dataManager.fetchSymbolData()
    }

    // Custom Event Handlers
    //-----------------------------------------------------------------------------------------
    
    onDefaultClick(jsn){
        if(this.clickCount >= this.viewList.length)
            this.clickCount = 0

        if(this.currentView.includes('Chart')){
            this.chartManager.onKeyUp(jsn)
            dataManager.fetchChartData(this.chartManager.type)
            return
        }
        
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onLimitClick(jsn){
    }

    //-----------------------------------------------------------------------------------------

    onAdjustLimit(jsn, increment){
        this.uuid = jsn.context
        clearInterval(this.context.adjustTimer)
        
        this.context.adjustTimer = setInterval( function(uuid) {
            this.uuid = uuid
            clearInterval(this.context.adjustTimer)
            this.state = STATE_DEFAULT
        }.bind(this), 5000, this.uuid);

        if(this.state != STATE_LIMITS){
            this.settings.limitsEnabled = true
            
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
        
        if( this.clickCount == 0){    
            this.settings.lowerlimit = this.settings.lowerlimit + value
        }
        else {
            this.settings.upperlimit = this.settings.upperlimit + value
        }
        
        $SD.api.setSettings(this.uuid, this.settings)
        this.updateDisplay()
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSymbolData(jsn) {
        console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        this.uuid = jsn.context
        var symbol = jsn.payload

        if(typeof symbol == 'undefined'){
            var payload = {context : jsn.context, error:{}}
            dapayloadta.error.message = this.settings.symbol
            payload.error.message1 = 'Not Found'
            this.renderError(payload)
            return
        }

        if(symbol.quoteType == "MUTUALFUND"){
            var payload = {context : jsn.context, error:{}}
            payload.error.message = 'Mutual Funds'
            payload.error.message1 = 'Not Supported'
            payload.error.message2 = 'Yet'
            this.renderError(payload)
            return
        }

        this.data = this.prepData(symbol)
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveChartData(jsn) {
        console.log("SimpleAction - onDidReceiveChartData: ", jsn)
        this.uuid = jsn.context
        this.chartManager.onDidReceiveData(jsn)
        
        if(Object.keys(this.chartManager.data).length > 0)
            this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSymbolError(jsn) {
        console.log('Action - onDidReceiveSymbolError', jsn)
        this.renderError(jsn)
    }

    // Utils
    //-----------------------------------------------------------------------------------------

    prepViewList(){
        this.settings.hasViews = this.settings.hasViews || false
        
        if(this.settings.hasViews == false){
            this.settings.hasViews = true
            this.settings[ViewType.DEFAULT]        = 'true'
            this.settings[ViewType.DAY_DEC]        = 'true'
            this.settings[ViewType.CHART_1MIN]     = 'true'
            this.settings[ViewType.CHART_DAY_3MIN] = 'true'
            this.settings[ViewType.CHART_DAY_5]    = 'true'
            this.settings[ViewType.CHART_MONTH_1]  = 'true'
        }

        this.viewList = this.viewList || []
        this.viewList.length = 0
        this.viewList.push(ViewType.DEFAULT)
        
        for (const [key, value] of Object.entries(ViewType)) {
            if(typeof value == 'function') continue
            if(value.startsWith('show') && this.settings[value] == 'true'){
                this.viewList.push(value)
            }
        }
    }

    //-----------------------------------------------------------------------------------------

    prepData(symbol){
        var payload = {}
        
        payload.price       = symbol.regularMarketPrice
        payload.open        = symbol.regularMarketOpen
        payload.prevClose   = symbol.regularMarketPreviousClose
        payload.volume      = Utils.abbreviateNumber(symbol.regularMarketVolume)
        payload.foreground  = this.settings.foreground
        payload.background  = this.settings.background
        
        // Symbol remove currency conversion for Crypto
        payload.symbol = symbol.symbol.split('-')[0]

        // Range
        payload.state   = ''
        payload.low     = symbol.regularMarketDayLow
        payload.high    = symbol.regularMarketDayHigh
        payload.change  = symbol.regularMarketChange
        payload.percent = symbol.regularMarketChangePercent

        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {

            if(symbol.marketState.includes("POST")){
                payload.state = symbol.marketState == "POSTPOST" ? "Cl" : "AH"
                payload.price = symbol.postMarketPrice || payload.price
                payload.change = symbol.postMarketChange || ''
                payload.percent = symbol.postMarketChangePercent || ''
            }
            else {
                payload.state = symbol.marketState == "PREPRE" ? "Cl" : "Pre"
                payload.price = symbol.preMarketPrice || payload.price
                payload.change = symbol.preMarketChange || ''
                payload.percent = symbol.preMarketChangePercent || ''
            }
            
            payload.low = payload.price < payload.low ? payload.price : payload.low
            payload.high = payload.price > payload.high ? payload.price : payload.high
        }

        // Limits
        if (this.settings.limitsEnabled == 'true') {
            var limit = 0
            if(this.settings.limitType == LIMIT_TYPE_PERCENT){
                limit = payload.percent >= this.settings.upperlimit ? 1 : 0
                limit = payload.percent <= this.settings.lowerlimit ? -1 : limit
            } 
            else {
                limit = payload.price >= this.settings.upperlimit ? 1 : 0
                limit = payload.price <= this.settings.lowerlimit ? -1 : limit
            }
            
            if( limit == 1){
                payload.background = this.settings.upperlimitbackground
            }
            if( limit == -1){
                payload.background = this.settings.lowerlimitbackground
            }
        }

        return payload
    }

    //-----------------------------------------------------------------------------------------

    prepPrice(value){
        // Apply decimal option
        value = value.toFixed(this.settings.decimals)
        
        if(value > 100000)
            value = this.abbreviateNumber(value, 4)

        return value
    }

    // Display Handlers
    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn) {
        super.updateDisplay(jsn)
        
        this.drawingCtx.fillStyle = this.settings.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        this.drawingCtx.fillStyle = this.settings.foreground
        
        switch(this.currentView){    
            case ViewType.DEFAULT:
                this.updateDefaultView()
                this.drawFooter()
                break
            case ViewType.DAY_DEC :
            case ViewType.DAY_PERC : 
                this.updateDayView()
                break
            default:
                this.updateDefaultView()
                this.chartManager.updateDisplay(jsn)
        }

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    //-----------------------------------------------------------------------------------------

    updateDayView(){
        this.drawSymbol(this.settings.foreground)

        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.font = 400 + " " + 25 + "px Arial";
        
        let asPercent = this.currentView == ViewType.DAY_PERC
        this.drawChangeItemValue("Cl", this.data.prevClose, 40)
        this.drawChangeItemValue("Hi", this.data.high, 72, asPercent)
        this.drawChangeItemValue("Lo", this.data.low, 104, asPercent)
    }
    
    //-----------------------------------------------------------------------------------------

    updateDefaultView(){
        var grd = this.drawingCtx.createLinearGradient(0, 0, 0, 50)
        grd.addColorStop(0, this.data.background)
        grd.addColorStop(1, this.settings.background)
        this.drawingCtx.fillStyle = grd
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        this.drawSymbol()
        this.drawPrice(this.data.price)
    }

    //-----------------------------------------------------------------------------------------

    updateLimitsView(){
        let isLow = this.clickCount == 0
        var label = isLow ? "Low" : "High"
        var value = isLow ? this.settings.lowerlimit : this.settings.upperlimit
        
        this.drawingCtx.fillStyle =  this.settings.foreground;
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(label + ' Limit', 136, 8);

        if(this.settings.limitType == LIMIT_TYPE_NUMERIC){
            this.drawPrice(value)
        }
        else {
            value += '%'
            this.setFontFor(value, 600, CANVAS_WIDTH - 20)
            this.drawingCtx.fillText(value, 140, 38);
        }
    }

    // Rendering Functions (little to no logic)
    //-----------------------------------------------------------------------------------------

    drawSymbol(){
        this.drawingCtx.fillStyle =  this.settings.foreground
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(this.data.symbol, 136, 8);
    }
    
    //-----------------------------------------------------------------------------------------

    drawPrice(value){
        value = this.prepPrice(value)

        // Render Price
        this.drawingCtx.fillStyle = this.settings.foreground
        this.setFontFor(value, 600, CANVAS_WIDTH - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 140, 34);
    }

    //-----------------------------------------------------------------------------------------

    drawFooter(){
        // Volume
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.font = 500 + " " + 25 + "px Arial";
        this.drawingCtx.fillText(this.data.volume, 138, 72);

        // Market State
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.fillText(this.data.state, 7, 74);

        switch(this.settings.footerMode){
            case FooterType.CHANGE:
                this.drawFooterChange()
                break
            case FooterType.HIGHLO:
                this.drawChangeItemValue("Hi", this.data.high, 95)
                this.drawChangeItemValue("Lo", this.data.low, 115)
                break
            case FooterType.HIGHLOP:
                this.drawChangeItemValue("Hi", this.data.high, 95, true)
                this.drawChangeItemValue("Lo", this.data.low, 115, true)
                break
            case FooterType.SLIDER:
                this.drawFooterSlider()
                break
        }
    }

    //-----------------------------------------------------------------------------------------

    drawFooterChange(){
        let change = this.data.change || 0
        let percent = this.data.percent || 0

        // Range Percent
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText("$", 7, 95);
        this.drawingCtx.fillText("%", 7, 115);

        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillStyle = percent >= 0 ? '#00FF00' : '#FF0000'
        change *= change < 0 ? -1 : 1 
        change = this.prepPrice(change)
        this.drawingCtx.fillText(change, 134, 95);

        percent *= percent < 0 ? -1 : 1
        percent = percent.toFixed(2)
        this.drawingCtx.fillText(percent, 134, 115);
    }

    //-----------------------------------------------------------------------------------------

    drawFooterSlider(){
        // Range Percent
        this.drawingCtx.fillStyle = '#FFFF00'
        this.drawingCtx.textAlign = 'center'
        this.drawingCtx.fillText('Not Yet', CHART_WIDTH/2, 94);
        this.drawingCtx.fillText('Implemented', CHART_WIDTH/2, 114);
    }


    //-----------------------------------------------------------------------------------------

    drawChangeItemPercent(label, value, yPos){ 
        this.drawingCtx.fillStyle = this.settings.foreground;
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(label, 7, yPos);

        // These lines retain white for the market close value
        this.drawingCtx.fillStyle = value < this.data.prevClose ? '#FF0000' : this.drawingCtx.fillStyle;
        this.drawingCtx.fillStyle = value > this.data.prevClose ? '#00FF00' : this.drawingCtx.fillStyle;
        value *= value < 0 ? -1 : 1
        value = value.toFixed(2) + "%";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillText(value, 130, yPos);

        this.drawingCtx.fillStyle = this.settings.foreground;
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(label, 2, yPos);
    }

    //-----------------------------------------------------------------------------------------
    
    drawChangeItemValue(label, value, yPos, asPercent=false){
        this.drawingCtx.fillStyle = this.settings.foreground;
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(label, 7, yPos);

        value = Number(value)
        
        if(!isNaN(value)){
            // These lines retain white for the market close value
            this.drawingCtx.fillStyle = value < this.data.prevClose ? '#FF0000' : this.drawingCtx.fillStyle;
            this.drawingCtx.fillStyle = value > this.data.prevClose ? '#00FF00' : this.drawingCtx.fillStyle;
            
            if(asPercent == true){
                value = (value - this.data.prevClose) / this.data.prevClose
                if(value < 0) value *= -1
                value = value.toFixed(2) + '%'
            }
            else{
                value = this.prepPrice(value)
            }
            
        }
        else {
            value = '--'
        }

        // Render Price
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillText(value, 134, yPos);
    }

    // Error Handler
    //-----------------------------------------------------------------------------------------

    renderError(jsn) {
        console.log('Action - renderError', jsn)
        this.uuid = jsn.context
        this.drawingCtx.fillStyle = this.settings.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        this.drawingCtx.fillStyle =  '#FFFF00'
        this.drawingCtx.font = 600 + " " + 26 + "px Arial";
        this.drawingCtx.textAlign = "center"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText("Error", CANVAS_WIDTH/2, 6);

        // Render Message
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.font = 600 + " " + 19 + "px Arial";
        this.drawingCtx.fillText(jsn.error.message, CANVAS_WIDTH/2, 40);

        if(jsn.error.hasOwnProperty('message1'))
            this.drawingCtx.fillText(jsn.error.message1, CANVAS_WIDTH/2, 70);

        if(jsn.error.hasOwnProperty('message2'))
            this.drawingCtx.fillText(jsn.error.message2, CANVAS_WIDTH/2, 100);

        $SD.api.setImage(this.uuid, canvas.toDataURL());
    }

}
