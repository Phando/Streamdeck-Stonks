const FooterType = Object.freeze({
    CHANGE  : 'change',
    SLIDER  : 'slider',
    RANGE   : 'range',
    RANGE_PERC : 'rangePerc',
    RANGE_PLUS : 'rangePlus',
    RANGE_PLUS_PERC : 'rangePlusPerc'
});

const MarketStateType = Object.freeze({
    PRE     : 'premarket',
    REG     : 'marketReg',
    POST    : 'postmarket',
    CLOSED  : 'postmarket'
});

const ViewType = Object.freeze({
    DEFAULT         : 'defaultView',
    DAY_DEC         : 'showDayDecimal',
    DAY_PERC        : 'showDayPercent',
    CHART_MIN_1     : 'show1minChart',
    CHART_MIN_2     : 'show2minChart',
    CHART_DAY_1     : 'show1DayChart',
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

    get symbol(){
        return this.settings.symbol
    }

    set symbol(value){
        this.settings.symbol = value
    }

    get decimals(){
        return this.settings.decimals
    }

    set decimals(value){
        this.settings.decimals = value
    }

    get background(){
        return this.settings.background
    }

    set background(value){
        this.settings.background = value
    }

    get foreground(){
        return this.settings.foreground
    }

    set foreground(value){
        this.settings.foreground = value
    }

    
    get footerMode(){
        return this.settings.footerMode
    }

    set footerMode(value){
        this.settings.footerMode = value
    }

    get showTrend(){
        return this.settings.showTrend
    }

    set showTrend(value){
        this.settings.showTrend = value
    }

    get isChart() {
        return this.currentView.includes('Chart')
    }

    get zoomCharts(){
        return this.settings.zoomCharts
    }

    set zoomCharts(value){
        this.settings.zoomCharts = value
    }

    // Streamdeck Event Handlers
    //-----------------------------------------------------------------------------------------

    onConnected(jsn) {
        super.onConnected(jsn)
        this.limitManager.onConnected(jsn)

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
        this.symbol     = this.symbol || 'GME'
        this.decimals   = this.decimals || 2
        this.foreground = this.foreground || '#D8D8D8'
        this.background = this.background || '#1D1E1F'
        this.showTrend  = this.showTrend  || 'disabled'
        this.zoomCharts = this.zoomCharts || 'disabled'
        this.footerMode = this.footerMode || FooterType.CHANGE
        
        this.prepViewList()
        this.chartManager.onDidReceiveSettings(jsn)
        this.limitManager.onDidReceiveSettings(jsn)
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
        if( this.state == STATE_LIMITS ){    
            this.limitManager.onKeyUp(jsn)
            return
        }
        
        super.onKeyUp(jsn)
        this.clickCount += 1

        if(this.clickCount >= this.viewList.length)
            this.clickCount = 0

        if(this.isChart){
            this.chartManager.onKeyUp(jsn)
            dataManager.fetchChartData()
            return
        }
        
        this.context.chartType = null
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onLongPress(jsn){
        super.onLongPress(jsn)
        
        switch(this.state){
            case STATE_DEFAULT : 
                this.state = STATE_LIMITS
                this.limitManager.onLongPress(jsn)
                break
        }
    }

    //-----------------------------------------------------------------------------------------

    onPropertyInspectorDidAppear(jsn) {
        super.onPropertyInspectorDidAppear(jsn)

        if(this.state == STATE_DEFAULT)
            this.limitManager.stopTimer(jsn)
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
        $SD.api.setSettings(this.uuid, this.settings)
    }

    //-----------------------------------------------------------------------------------------

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});

        if(sdpi_collection.key == 'symbol')
            this.symbol = this.symbol.toUpperCase()
            
        this.prepViewList()
        this.limitManager.onSendToPlugin(jsn)
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
        //console.log("SimpleAction - onDidReceiveSymbol: ", jsn)
        this.uuid = jsn.context
        var symbol = jsn.payload

        if(typeof symbol == 'undefined'){
            var payload = {context : jsn.context, error:{}}
            payload.error.message = this.symbol
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
        this.uuid = jsn.context
        
        if(this.isChart && this.chartManager.dataMatch(jsn)){
            this.chartManager.onDidReceiveData(jsn)
            this.updateDisplay(jsn)
        }
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSymbolError(jsn) {
        this.renderError(jsn)
    }

    // Utils
    //-----------------------------------------------------------------------------------------

    prepViewList(){
        this.settings.hasViews = this.settings.hasViews || false
        
        if(this.settings.hasViews == false){
            this.settings.hasViews = true
            this.settings[ViewType.DEFAULT]        = 'enabled'
            this.settings[ViewType.DAY_DEC]        = 'enabled'
            this.settings[ViewType.CHART_MIN_1]    = 'enabled'
            this.settings[ViewType.CHART_MIN_2]    = 'enabled'
            this.settings[ViewType.CHART_DAY_1]    = 'enabled'
            this.settings[ViewType.CHART_DAY_5]    = 'enabled'
            this.settings[ViewType.CHART_MONTH_1]  = 'enabled'
        }

        this.viewList = this.viewList || []
        this.viewList.length = 0
        this.viewList.push(ViewType.DEFAULT)
        
        for (const [key, value] of Object.entries(ViewType)) {
            if(typeof value == 'function') continue
            if(value.startsWith('show') && this.settings[value] == 'enabled'){
                this.viewList.push(value)
            }
        }
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        var symbol = jsn.payload
        var payload = {}
        
        // Symbol remove currency conversion for Crypto
        payload.symbol = symbol.symbol.split('-')[0]

        payload.price       = symbol.regularMarketPrice
        payload.priceMarket = symbol.regularMarketPrice
        payload.open        = symbol.regularMarketOpen
        payload.close       = symbol.regularMarketPreviousClose
        payload.prevClose   = symbol.regularMarketPreviousClose
        payload.volume      = symbol.regularMarketVolume
        payload.foreground  = this.settings.foreground
        payload.background  = this.settings.background
        
        // Range
        payload.state   = MarketStateType.REG
        payload.low     = symbol.regularMarketDayLow
        payload.high    = symbol.regularMarketDayHigh
        payload.change  = symbol.regularMarketChange
        payload.percent = symbol.regularMarketChangePercent

        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {
            if(symbol.marketState.includes("POST")){
                payload.close = symbol.regularMarketPrice
                payload.state = symbol.marketState == "POSTPOST" ? MarketStateType.CLOSED : MarketStateType.POST
                payload.price = symbol.postMarketPrice || payload.price
                payload.change = symbol.postMarketChange || payload.change // 
                payload.percent = symbol.postMarketChangePercent || payload.percent
            }
            else {
                payload.state = symbol.marketState == "PREPRE" ? MarketStateType.CLOSED : MarketStateType.PRE
                payload.price = symbol.preMarketPrice || payload.price
                payload.change = symbol.preMarketChange || payload.change
                payload.percent = symbol.preMarketChangePercent || payload.percent
            }
        }

        payload.lowPerc = (Math.abs(payload.low/payload.close)).toFixed(2)
        payload.highPerc = (Math.abs(payload.high/payload.close)).toFixed(2)

        this.data = payload
        this.limitManager.prepData(jsn)

        // Show Trend
        if(this.showTrend == 'enabled' && this.limitManager.limitState == 0){
            var color = payload.price > payload.close ? "#00FF00" : payload.foreground
            payload.foreground = payload.price < payload.close ? "#FF0000" : color
        }

    }

    //-----------------------------------------------------------------------------------------

    prepPrice(value){
        return Utils.abbreviateNumber(value, this.decimals)
    }

    // Display Handlers
    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn) {
        super.updateDisplay(jsn)
        
        if(this.state == STATE_LIMITS){
            this.limitManager.updateDisplay(jsn)
            return
        }

        this.drawingCtx.fillStyle = this.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        this.drawingCtx.fillStyle = this.foreground
        
        switch(this.currentView){    
            case ViewType.DEFAULT:
                this.drawHeader(jsn)
                this.drawFooter()
                break
            case ViewType.DAY_DEC :
            case ViewType.DAY_PERC :
                this.drawSymbol()
                this.drawRange()
                break
            default:
                this.limitManager.updateLimitView(jsn)
                this.drawSymbol()
                this.drawPrice(this.data.price)
                this.chartManager.updateDisplay(jsn)
        }

        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    //-----------------------------------------------------------------------------------------
    
    drawHeader(jsn){
        if(!Utils.isUndefined(this.data)){
            this.limitManager.updateLimitView(jsn)
            this.drawMarketState(this.data.state)
            this.drawPrice(this.data.price)
        }
        this.drawSymbol()
    }

    //-----------------------------------------------------------------------------------------

    drawFooter(){
        if(Utils.isUndefined(this.data))
            return

        switch(this.footerMode){
            case FooterType.CHANGE:
                this.drawVolume()
                this.drawChange()
                break
            case FooterType.SLIDER:
                this.drawSlider()
                break
            case FooterType.RANGE:
            case FooterType.RANGE_PERC:
                this.drawVolume()
            default:
                this.drawRange()
        }
    }

    // Rendering Functions (little to no logic)
    //-----------------------------------------------------------------------------------------

    drawChange(){
        let change = this.data.change || 0
        let percent = this.data.percent || 0
        let color = '#00FF00'

        if(change < 0){
            color = '#FF0000'
            change = Math.abs(change)
            percent = Math.abs(percent)
        }
        
        change = this.prepPrice(change)
        percent = percent.toFixed(2)
        this.drawSmartPair('$ ', change, color, '%', percent, color)
    }
    
    //-----------------------------------------------------------------------------------------

    drawMarketState(state, xPos=0, yPos=0){
        if(state == MarketStateType.REG) return

        var img = document.getElementById(state)
        this.drawingCtx.drawImage(img, xPos, yPos, 35, 35)

        // let limitState = this.limitManager.limitState
        // if(limitState != 0){
        //     img = document.getElementById(limitState > 0 ? 'upperLimit' : 'lowerLimit')
        //     this.drawingCtx.drawImage(img, xPos, yPos, 50, 45)
        // }
    }
    
    //-----------------------------------------------------------------------------------------

    drawPrice(value){
        value = this.prepPrice(value)

        // Render Price
        this.drawingCtx.fillStyle = this.data.foreground
        Utils.setFontFor(value, 600, 40, CANVAS_WIDTH - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 138, 32);
    }

    //-----------------------------------------------------------------------------------------

    drawRange(){
        var price  = this.prepPrice(this.data.priceMarket)
        var high = this.prepPrice(this.data.high)
        var low = this.prepPrice(this.data.low)

        var isFooter = this.currentView == ViewType.DEFAULT
        var font = isFooter ? 22 : 26
        var yPos = isFooter ? [81,103,126,87] : [52,89,126,74]

        if( this.currentView == ViewType.DAY_PERC ||
            ( this.footerMode == FooterType.RANGE_PERC || this.footerMode == FooterType.RANGE_PLUS_PERC )){
            high = this.data.highPerc + '%'
            low = this.data.lowPerc + '%'
        }

        if( isFooter && (this.footerMode == FooterType.RANGE || this.footerMode == FooterType.RANGE_PERC)){
            this.drawSmartPair("Hi", high, '#00FF00', "Lo", low, '#FF0000')
            return
        }

        if(this.data.state != MarketStateType.REG){
            var img = document.getElementById('closedIcon')
            this.drawingCtx.drawImage(img, 10, yPos[3], 22, 22)
            price = this.prepPrice(this.data.close)
        }

        this.drawPair('', high, '#00FF00', yPos[0], font)
        this.drawPair('', price, this.settings.foreground, yPos[1], font)
        this.drawPair('', low, '#FF0000', yPos[2], font)
    }

    //-----------------------------------------------------------------------------------------

    drawSlider(){
        // Range Percent
        this.drawingCtx.fillStyle = '#FFFF00'
        this.drawingCtx.textAlign = 'center'
        this.drawingCtx.fillText('Not Yet', CHART_WIDTH/2, 94);
        this.drawingCtx.fillText('Implemented', CHART_WIDTH/2, 114);
    }

    //-----------------------------------------------------------------------------------------

    drawSymbol(){
        this.drawingCtx.fillStyle =  this.foreground
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(this.symbol, 136, 8);
    }

    //-----------------------------------------------------------------------------------------

    drawVolume(){
        if(Utils.isUndefined(this.data))
            return

        let volume = Utils.abbreviateNumber(this.data.volume)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillStyle = this.foreground
        this.drawingCtx.font = 500 + " " + 24 + "px Arial"
        this.drawingCtx.fillText(volume, 138, 68)
    }
}
