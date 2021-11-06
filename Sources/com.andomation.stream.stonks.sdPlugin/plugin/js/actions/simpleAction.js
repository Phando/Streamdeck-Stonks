
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
    limitManager = new LimitManager()

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
        $SD.on(this.type + '.exitLimits', (jsonObj) => this.onExitLimits(jsonObj));
        
        // Data Provider Handlers
        $SD.on(this.type + '.didReceiveChartData', (jsonObj) => this.onDidReceiveChartData(jsonObj));
        $SD.on(this.type + '.didReceiveChartError', (jsonObj) => this.onDidReceiveChartError(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolData', (jsonObj) => this.onDidReceiveSymbolData(jsonObj));
        $SD.on(this.type + '.didReceiveSymbolError', (jsonObj) => this.onDidReceiveSymbolError(jsonObj));
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)
        
        console.log("SimpleAction - onDidReceiveSettings", jsn, this.settings)
        this.settings.symbol     = this.settings.symbol || 'GME'
        this.settings.decimals   = this.settings.decimals || 2
        this.settings.foreground = this.settings.foreground || '#D8D8D8'
        this.settings.background = this.settings.background || '#1D1E1F'
        this.settings.footerMode = this.settings.footerMode || FooterType.CHANGE
        
        this.prepViewList()
        this.chartManager.onDidReceiveSettings(jsn)
        this.limitManager.onDidReceiveSettings(jsn)
    
        //this.settings = {} // Uncomment to clear the settings
        $SD.api.setSettings(this.uuid, this.settings) 
    } 

    //-----------------------------------------------------------------------------------------

    onKeyDown(jsn) {
        super.onKeyDown(jsn)
        
        if( this.state == STATE_LIMITS ){    
            this.limitManager.onKeyDown(jsn)
            return
        }
    }

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn){
        super.onKeyUp(jsn)
        
        if( this.state == STATE_LIMITS ){    
            this.limitManager.onKeyUp(jsn)
            return
        }
        
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

    onLongPress(jsn){
        super.onLongPress(jsn)
        
        switch(this.state){
            case STATE_DEFAULT : 
                this.state = STATE_LIMITS
                break
            case STATE_LIMITS:
                this.limitManager.onLongPress(jsn)
                break
        }
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
        this.limitManager.onSendToPlugin(jsn)
        this.prepViewList()
        dataManager.fetchSymbolData()
    }

    // Custom Event Handlers
    //-----------------------------------------------------------------------------------------
    
    onExitLimits(jsn){
        this.uuid = jsn.context
        this.state = STATE_DEFAULT
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSymbolData(jsn) {
        console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        this.uuid = jsn.context
        var symbol = jsn.payload

        if(typeof symbol == 'undefined'){
            var payload = {context : jsn.context, error:{}}
            payload.error.message = this.settings.symbol
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

        this.prepData(jsn)
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

    prepData(jsn){
        var symbol = jsn.payload
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
                payload.change = symbol.postMarketChange || payload.change // 
                payload.percent = symbol.postMarketChangePercent || payload.percent
            }
            else {
                payload.state = symbol.marketState == "PREPRE" ? "Cl" : "Pre"
                payload.price = symbol.preMarketPrice || payload.price
                payload.change = symbol.preMarketChange || payload.change
                payload.percent = symbol.preMarketChangePercent || payload.percent
            }
            
            payload.low = payload.price < payload.low ? payload.price : payload.low
            payload.high = payload.price > payload.high ? payload.price : payload.high
        }

        this.data = payload
        this.limitManager.prepData(jsn)
    }

    //-----------------------------------------------------------------------------------------

    prepPrice(value){
        value = Utils.abbreviateNumber(value, this.settings.decimals)
        return value
    }

    // Display Handlers
    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn) {
        super.updateDisplay(jsn)
        
        if(this.state == STATE_LIMITS){
            this.limitManager.updateDisplay(jsn)
            return
        }

        this.drawingCtx.fillStyle = this.settings.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        this.drawingCtx.fillStyle = this.settings.foreground
        this.limitManager.updateLimitView(jsn)

        switch(this.currentView){    
            case ViewType.DEFAULT:
                this.drawSymbol()
                this.drawPrice(this.data.price)
                this.drawFooter()
                break
            case ViewType.DAY_DEC :
            case ViewType.DAY_PERC : 
                this.updateDayView()
                break
            default:
                this.drawSymbol()
                this.drawPrice(this.data.price)
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
        this.drawPair("Cl", this.data.prevClose, 40)
        this.drawPair("Hi", this.data.high, 72, '#00FF00')
        this.drawPair("Lo", this.data.low, 104, '#FF0000')
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
        // this.drawingCtx.fillStyle = this.price >= this.data.prevClose ? '#00FF00' : '#FF0000'
        this.drawingCtx.fillStyle = this.settings.foreground
        Utils.setFontFor(value, 600, CANVAS_WIDTH - 20)
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
                this.drawHighLow()
                break
            case FooterType.HIGHLOP:
                this.drawHighLow(true)
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
        let color = '#00FF00'

        console.log("CHANGE", change, percent)
        if(change < 0){
            change *= -1
            percent *= -1
            color = '#FF0000'
        }
        
        change = this.prepPrice(change)
        percent = percent.toFixed(2)
        
        if(String(change).length > 5){
            this.drawingCtx.font = 600 + " " + 20 + "px Arial"
            this.drawPair("%", percent, 95, color)
            this.drawPair("$", change, 115, color)
        }
        else {
            this.drawMaxPair('$'+change, percent+'%', 110, color, color)
        }
    }

    //-----------------------------------------------------------------------------------------

    drawHighLow(asPercent=false){
        let high = this.data.high || 0
        let low = this.data.low || 0
        
        if(asPercent){
            // TODO: Calculate the proper percent values
            // high = high.toFixed(2) +'%'
            // low = low.toFixed(2) + '%' 
        }
        else {
            high = this.prepPrice(high)
            low = this.prepPrice(low)
        }
        
        if(String(high).length > 6 || String(low).length > 6){
            this.drawingCtx.font = 600 + " " + 20 + "px Arial"
            this.drawPair("Hi", high, 95, '#00FF00')
            this.drawPair("Lo", low, 115, '#FF0000')
        }
        else {
            this.drawMaxPair(high, low, 110, '#00FF00', '#FF0000')
        }
    }

    //-----------------------------------------------------------------------------------------

    drawFooterSlider(){
        // Range Percent
        this.drawingCtx.fillStyle = '#FFFF00'
        this.drawingCtx.textAlign = 'center'
        this.drawingCtx.fillText('Not Yet', CHART_WIDTH/2, 94);
        this.drawingCtx.fillText('Implemented', CHART_WIDTH/2, 114);
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
