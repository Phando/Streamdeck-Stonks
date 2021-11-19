const FooterType = Object.freeze({
    CHANGE  : 'change',
    METER   : 'meter',
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
    TICKER          : 'defaultView',
    //TICKER          : 'showView',
    DAY_DEC         : 'showDayDecimal',
    DAY_PERC        : 'showDayPercent',
    LIMITS          : 'showLimits',
    CHART_MIN_30    : 'show30MinChart',
    CHART_HR_1      : 'show1HourChart',
    CHART_HR_2      : 'show2HourChart',
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
            this.settings[ViewType.TICKER]        = 'enabled'
            this.settings[ViewType.DAY_DEC]       = 'enabled'
            this.settings[ViewType.CHART_MIN_30]  = 'enabled'
            this.settings[ViewType.CHART_HR_2]    = 'enabled'
            this.settings[ViewType.CHART_DAY_1]   = 'enabled'
            this.settings[ViewType.CHART_DAY_5]   = 'enabled'
            this.settings[ViewType.CHART_MONTH_1] = 'enabled'
        }

        this.viewList = this.viewList || []
        this.viewList.length = 0
        this.viewList.push(ViewType.TICKER)
        
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
        payload.symbol = symbol.symbol//.split('-')[0]

        payload.price       = symbol.regularMarketPrice
        payload.priceMarket = symbol.regularMarketPrice
        payload.open        = symbol.regularMarketOpen
        payload.close       = symbol.regularMarketPreviousClose
        payload.prevClose   = symbol.regularMarketPreviousClose
        payload.volume      = symbol.regularMarketVolume
        payload.foreground  = COLOR_FOREGROUND
        payload.background  = COLOR_BACKGROUND
        
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

        payload.lowPerc = Utils.toFixed(Math.abs(payload.low/payload.close), 2)
        payload.highPerc = Utils.toFixed(Math.abs(payload.high/payload.close), 2)

        if(this.showTrend == 'enabled'){
            var color = payload.price > payload.close ? COLOR_GREEN : payload.foreground
            payload.foreground = payload.price < payload.close ? COLOR_RED : color
        }

        this.data = payload
        this.limitManager.prepData(jsn)
    }

    // Display Handlers
    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn) {
        super.updateDisplay(jsn)
        
        if(this.state == STATE_LIMITS){
            this.limitManager.updateDisplay(jsn)
            return
        }

        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        
        // Background for screenshot
        // var img = document.getElementById('action')
        // this.drawingCtx.drawImage(img, 7, 6, 130, 130)

        switch(this.currentView){    
            case ViewType.TICKER:
                this.drawHeader(jsn)
                this.drawFooter()
                break
            case ViewType.LIMITS:
                this.drawSymbol(jsn);
                this.drawLeft('limit',COLOR_FOREGROUND, 16, 21, 600, 6)
                this.limitManager.updateInfoView(jsn)
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

        $SD.api.setImage(this.uuid, this.canvas.toDataURL())
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
            case FooterType.METER:
                this.drawMeter()
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
        let precision = this.decimals < 3 ? this.decimals : Number(this.decimals)+1
        let color = COLOR_GREEN

        if(change < 0){
            color = COLOR_RED
            change = Math.abs(change)
            percent = Math.abs(percent)
        }
        
        change = this.prepPrice(change, precision)
        percent = Utils.toFixed(percent, 2)
        this.drawSmartPair('', percent+'%', color, '', change, color,)
    }
    
    //-----------------------------------------------------------------------------------------

    drawMarketState(state, xPos=0, yPos=0){
        if(state == MarketStateType.REG) return

        var img = document.getElementById(state)
        this.drawingCtx.drawImage(img, xPos, yPos, 40, 35)
    }
    
    //-----------------------------------------------------------------------------------------

    drawSymbol(){
        let symbol = this.symbol.split('-')[0]
        this.drawRight(symbol, COLOR_FOREGROUND, 18, 24, 600, 2)
    }

    //-----------------------------------------------------------------------------------------

    drawPrice(value){
        value = this.prepPrice(value)
        this.drawRight(value, this.data.foreground, 50, 40)
    }

    //-----------------------------------------------------------------------------------------

    drawVolume(){
        let volume = Utils.abbreviateNumber(this.data.volume)
        this.drawRight(volume, COLOR_FOREGROUND, 78, 24)
    }

    //-----------------------------------------------------------------------------------------

    drawRange(){
        var price  = this.prepPrice(this.data.priceMarket)
        var high = this.prepPrice(this.data.high)
        var low = this.prepPrice(this.data.low)

        var isFooter = this.currentView == ViewType.TICKER
        var font = isFooter ? 23 : 26
        var yPos = isFooter ? [81,103,126,87] : [52,89,126,74]

        console.log(this.currentView)
        if( this.currentView == ViewType.DAY_PERC ||
            ( this.footerMode == FooterType.RANGE_PERC || this.footerMode == FooterType.RANGE_PLUS_PERC )){
            high = this.data.highPerc + '%'
            low = this.data.lowPerc + '%'
        }

        if( isFooter && (this.footerMode == FooterType.RANGE || this.footerMode == FooterType.RANGE_PERC)){
            this.drawSmartPair("Lo", low, COLOR_RED, "Hi", high, COLOR_GREEN)
            return
        }

        if(this.data.state != MarketStateType.REG){
            var img = document.getElementById('closedIcon')
            this.drawingCtx.drawImage(img, 10, yPos[3], 22, 22)
            price = this.prepPrice(this.data.close)
        }

        this.drawLeft('range',COLOR_FOREGROUND, 16, 21, 600, 6)
        this.drawPair('', COLOR_FOREGROUND, high, COLOR_GREEN, yPos[0], font)
        this.drawPair('', COLOR_FOREGROUND, price, COLOR_FOREGROUND, yPos[1], font)
        this.drawPair('', COLOR_FOREGROUND, low, COLOR_RED, yPos[2], font)
    }

    //-----------------------------------------------------------------------------------------

    drawMeter(){
        let centerX = CANVAS_WIDTH/2
        let centerY = CANVAS_HEIGHT+80
        let radius  = 130
        let width  = 14
        let start = deg2rad(-180)
        let end = deg2rad(0)
        let scale = Utils.rangeToPercent(this.data.price, this.data.low, this.data.high)
        scale = deg2rad(-55 -(70*scale)) // 125 55 = 70

        this.drawingCtx.lineWidth = 3
        this.drawingCtx.fillStyle = COLOR_GREEN_LT
        this.drawingCtx.strokeStyle = COLOR_GREEN
        this.drawingCtx.beginPath()
        this.drawingCtx.arc(centerX, centerY, radius, start, end)
        this.drawingCtx.arc(centerX, centerY, radius-width, start, end)
        this.drawingCtx.fill()
        this.drawingCtx.stroke()
    
        this.drawingCtx.fillStyle = COLOR_RED_LT
        this.drawingCtx.strokeStyle = COLOR_RED
        this.drawingCtx.beginPath()
        this.drawingCtx.arc(centerX, centerY, radius, start, scale)
        this.drawingCtx.lineTo(centerX, centerY)
        this.drawingCtx.arc(centerX, centerY, radius-width, start, scale)
        this.drawingCtx.fill()
        this.drawingCtx.stroke()

        this.drawingCtx.beginPath()
        this.drawingCtx.arc(centerX, centerY, radius-width-1, start, end)
        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fill()

        this.drawingCtx.beginPath()
        this.drawingCtx.lineWidth = 4
        this.drawingCtx.strokeStyle = COLOR_FOREGROUND
        this.drawingCtx.moveTo(centerX, centerY)
        this.drawingCtx.lineTo(centerX + (radius+4) * Math.cos(scale), centerY + (radius+4) * Math.sin(scale))
        this.drawingCtx.stroke()

        this.drawingCtx.beginPath()
        this.drawingCtx.arc(centerX, centerY, radius-width-8, start, end)
        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fill()
    }

    //-----------------------------------------------------------------------------------------

    drawSlider(){
        var high = this.prepPrice(this.data.high)
        var low = this.prepPrice(this.data.low)
        this.drawScaledPair(low, COLOR_RED, high, COLOR_GREEN, 98)
        
        var scale = 144 * Utils.rangeToPercent(this.data.priceMarket, this.data.low, this.data.high)
        
        this.drawingCtx.lineWidth = 2
        this.drawingCtx.fillStyle = COLOR_GREEN_LT
        this.drawingCtx.strokeStyle = COLOR_GREEN
        this.drawingCtx.fillRect(0, 116, 144, 14)
        this.drawingCtx.strokeRect(0, 116, 144, 14)
        
        this.drawingCtx.fillStyle = COLOR_RED_LT
        this.drawingCtx.strokeStyle = COLOR_RED
        this.drawingCtx.fillRect(0, 116, scale, 14)
        this.drawingCtx.strokeRect(0, 116, scale, 14)

        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        this.drawingCtx.fillRect(Utils.minmax(scale-3, 6, 134), 110, 4, 26)
    }

}
