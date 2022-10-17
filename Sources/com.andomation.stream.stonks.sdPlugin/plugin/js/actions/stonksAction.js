const MarketStateType = Object.freeze({
    PRE     : 'marketPre',
    REG     : 'marketReg',
    POST    : 'marketPost',
    CLOSED  : 'marketClosed'
});

const ViewType = Object.freeze({
    NONE            : {header:true,  vol:true,   perc:false, id:'none'},
    CHANGE          : {header:true,  vol:true,   perc:false, id:'change'},
    VIZ             : {header:true,  vol:true,   perc:false, id:'viz'},
    VIZ_PERC        : {header:true,  vol:true,   perc:true,  id:'vizPerc'},
    RANGE           : {header:true,  vol:true,   perc:false, id:'range'},
    RANGE_PERC      : {header:true,  vol:true,   perc:true,  id:'rangePerc'},
    RANGE_PLUS      : {header:true,  vol:false,  perc:false, id:'rangePlus'},
    RANGE_PLUS_PERC : {header:true,  vol:false,  perc:true,  id:'rangePlusPerc'},
    DAY_DEC         : {header:false, vol:false,  perc:false, id:'showDayDecimal'},
    DAY_PERC        : {header:false, vol:false,  perc:true,  id:'showDayPercent'},
    LIMITS          : {header:false, vol:false,  perc:false, id:'showLimits'},
    CHART_MIN_30    : {header:true,  vol:false,  perc:false, id:'show30MinChart'},
    CHART_HR_1      : {header:true,  vol:false,  perc:false, id:'show1HourChart'},
    CHART_HR_2      : {header:true,  vol:false,  perc:false, id:'show2HourChart'},
    CHART_DAY_1     : {header:true,  vol:false,  perc:false, id:'show1DayChart'},
    CHART_DAY_5     : {header:true,  vol:false,  perc:false, id:'show5DayChart'},
    CHART_MONTH_1   : {header:true,  vol:false,  perc:false, id:'show1MonthChart'},
    CHART_MONTH_3   : {header:true,  vol:false,  perc:false, id:'show3MonthChart'},
    CHART_MONTH_6   : {header:true,  vol:false,  perc:false, id:'show6MonthChart'},
    CHART_MONTH_12  : {header:true,  vol:false,  perc:false, id:'show12MonthChart'},

    keyFor : (value) => {
        for (const [key, match] of Object.entries(ViewType))
            if(value == match.id)
                return key
    },

    valueFor : (value) => {
        for (const [key, match] of Object.entries(ViewType))
            if(value == match.id)
                return match
    }
});

class StonksAction extends Action {
    chartManager = new ChartManager()
    limitManager = new LimitManager()

    constructor() {
        super() 
        this.type = this.type + ".stonks"
    }

    get currency(){
        return this.settings.currency
    }

    set currency(value){
        this.settings.currency = value
    }

    get home(){
        return this.settings.home
    }

    set home(value){
        this.settings.home = value
    }

    get maxDigits(){
        return Number(this.settings.maxDigits)
    }

    set maxDigits(value){
        this.settings.maxDigits = value
    }

    get symbol(){
        return this.settings.symbol
    }

    set symbol(value){
        this.settings.symbol = value
    }

    get symbolLabel(){
        return this.settings.symbolLabel
    }

    set symbolLabel(value){
        this.settings.symbolLabel = value
    }

    get showState(){
        return this.settings.showState
    }

    set showState(value){
        this.settings.showState = value
    }

    get showTrend(){
        return this.settings.showTrend
    }

    set showTrend(value){
        this.settings.showTrend = value
    }

    get updateClose(){
        return this.settings.updateClose
    }

    set updateClose(value){
        this.settings.updateClose = value
    }

    get visLimits(){
        return this.settings.visLimits
    }

    set visLimits(value){
        this.settings.visLimits = value
    }

    get isChart() {
        return this.currentView.id.includes('Chart')
    }

    get homeIndex(){
        return this.viewList.findIndex(item => item.id === this.home.id)
    }

    get state(){
        return this.context.stateName
    }

    set state(stateName){
        this.clickCount = stateName == STATE_DEFAULT ? this.homeIndex : 0
        this.context.stateName = stateName
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
        
        console.log("StonksAction - onDidReceiveSettings", jsn, this.settings)
        this.home       = this.home || ViewType.VIZ.id
        this.currency   = this.currency || "USD"
        this.maxDigits  = this.maxDigits || 5
        this.symbol     = this.symbol || 'GME'
        this.symbolLabel= this.symbolLabel || this.symbol
        this.showTrend  = this.showTrend || 'disabled'
        this.showState  = this.showState || 'disabled'
        this.updateClose = this.updateClose || 'disabled'
        this.visLimits  = this.visLimits || 'enabled'
        
        this.prepViewList()
        this.chartManager.onDidReceiveSettings(jsn)
        this.limitManager.onDidReceiveSettings(jsn)

        $SD.api.setSettings(this.uuid, this.settings)
        dataManager.scheduleData()
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
        this.uuid = jsn.context
        super.onPropertyInspectorDidAppear(jsn)
        this.limitManager.stopTimer(jsn)
        
        this.clickCount = 0
        this.context.stateName = STATE_DEFAULT
        dataManager.fetchData()
    }

    //-----------------------------------------------------------------------------------------

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});

        if(sdpi_collection.key == 'symbol'){
            this.limitManager.resetLimits()
            $SD.api.setSettings(this.uuid, this.settings)
        }

        this.prepViewList()
        this.limitManager.onSendToPlugin(jsn)
        dataManager.fetchData()
    }

    // Custom Event Handlers
    //-----------------------------------------------------------------------------------------
    
    onExitLimits(jsn){
        this.uuid = jsn.context
        this.state = STATE_DEFAULT
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSymbolData(jsn) {
        console.log("StonksAction - onDidReceiveSymbol: ", jsn)
        this.uuid = jsn.context
        var symbol = jsn.payload

        if(Utils.isUndefined(symbol)){
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
            this.settings[ViewType.VIZ.id]           = 'enabled'
            this.settings[ViewType.DAY_DEC.id]       = 'enabled'
            this.settings[ViewType.CHART_MIN_30.id]  = 'enabled'
            this.settings[ViewType.CHART_HR_2.id]    = 'enabled'
            this.settings[ViewType.CHART_DAY_1.id]   = 'enabled'
            this.settings[ViewType.CHART_DAY_5.id]   = 'enabled'
            this.settings[ViewType.CHART_MONTH_1.id] = 'enabled'
        }

        this.viewList = this.viewList || []
        this.viewList.length = 0
        
        for (const [key, value] of Object.entries(ViewType)) {
            if(typeof value == 'function') continue
            if(this.settings[value.id] == 'enabled')
                this.viewList.push(value)
        }
        this.clickCount = this.homeIndex
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        var symbol = jsn.payload
        var payload = {symbol:symbol.symbol}
        let rate = rateManager.rateFor(this.currency)

        payload.money       = rateManager.symbolFor(this.currency)
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
        payload.change  = symbol.regularMarketChange
        payload.percent = symbol.regularMarketChangePercent 
        payload.dayLow  = symbol.regularMarketDayLow
        payload.dayHigh = symbol.regularMarketDayHigh
        payload.dayLowPerc = Math.abs(payload.dayLow.percentChange(payload.prevClose)).toPrecisionPure(2)
        payload.dayHighPerc = Math.abs(payload.dayHigh.percentChange(payload.prevClose)).toPrecisionPure(2)
        
        // Factor after market pricing
        if (symbol.marketState != "REGULAR") {
            if(symbol.marketState.includes("PRE")){
                payload.price   = symbol.preMarketPrice || payload.price
                payload.change  = symbol.preMarketChange || payload.change
                payload.percent = symbol.preMarketChangePercent || payload.percent
                payload.state   = symbol.marketState == "PRE" ? MarketStateType.PRE : MarketStateType.CLOSED
            }
            else {
                payload.close   = this.updateClose == 'enabled' ? symbol.regularMarketPrice : payload.close
                payload.price   = symbol.postMarketPrice || payload.price
                payload.change  = symbol.postMarketChange || payload.change
                payload.percent = symbol.postMarketChangePercent || payload.percent
                payload.state   = symbol.marketState == "POST" ? MarketStateType.POST : MarketStateType.CLOSED
            }
        }

        
        // Extended values
        payload.low      = this.updateClose == 'enabled' ? Math.min(symbol.regularMarketDayLow, payload.price) : symbol.regularMarketDayLow
        payload.high     = this.updateClose == 'enabled' ? Math.max(symbol.regularMarketDayHigh, payload.price) : symbol.regularMarketDayHigh
        payload.lowPerc  = Math.abs(payload.low.percentChange(payload.close)).toPrecisionPure(2)
        payload.highPerc = Math.abs(payload.high.percentChange(payload.close)).toPrecisionPure(2)

        // Adjust for currency
        payload.open    *= rate
        payload.close   *= rate
        payload.price   *= rate
        payload.change  *= rate
        payload.low     *= rate
        payload.high    *= rate
        payload.dayLow  *= rate
        payload.dayHigh *= rate
        payload.priceMarket *= rate
        payload.prevClose   *= rate

        if(this.showTrend == 'enabled'){
            var color = payload.price > payload.close ? COLOR_GREEN : payload.foreground
            payload.foreground = payload.price < payload.close ? COLOR_RED : color
        }

        this.data = payload
        this.limitManager.prepData(jsn)
    }

    // Display Handlers
    //-----------------------------------------------------------------------------------------

    initDisplay() {
        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        var img = document.getElementById('action');
        this.drawingCtx.drawImage(img, 10, 10, 124, 124);
        $SD.api.setImage(this.uuid, this.canvas.toDataURL())
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn) {
        super.updateDisplay(jsn)

        if(this.state == STATE_LIMITS){
            this.limitManager.updateDisplay(jsn)
            return
        }

        this.drawingCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        // this.drawingCtx.fillStyle = COLOR_BACKGROUND
        // this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        
        if(this.currentView.header)
            this.drawHeader(jsn)

        if(this.currentView.vol)
            this.drawVolume()
        
        switch(this.currentView){
            case ViewType.NONE:
                break     
            case ViewType.CHANGE:
                this.drawChange()   
                break 
            case ViewType.VIZ:          
            case ViewType.VIZ_PERC:        
                this.drawSlider()
                break
            case ViewType.RANGE:           
            case ViewType.RANGE_PERC:   
            case ViewType.RANGE_PLUS:     
            case ViewType.RANGE_PLUS_PERC: 
                this.drawRange()
                break
            case ViewType.LIMITS:
                this.drawSymbol(jsn);
                this.drawLeft('limit', COLOR_FOREGROUND, 16, 21, 600, 6)
                this.limitManager.updateInfoView(jsn)
                break
            case ViewType.DAY_DEC:
            case ViewType.DAY_PERC:
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

    // Rendering Functions (little to no logic)
    //-----------------------------------------------------------------------------------------

    drawChange(){
        let change = this.data.change || 0
        let percent = this.data.percent || 0
        let color = COLOR_GREEN
        
        if(change < 0){
            color = COLOR_RED
            change = Math.abs(change)
            percent = Math.abs(percent)
        }
        
        let zed1 = this.data.price.countDecimalZeros()
        let zed2 = change.countDecimalZeros()
        
        change = zed2 > zed1 ? change.abbreviateNumber(this.maxDigits, zed2-zed1) : change.abbreviateNumber(this.maxDigits)
        percent = percent.toPrecisionPure(2)
        this.drawSmartPair('', percent+'%', color, '', change, color,)
    }
    
    //-----------------------------------------------------------------------------------------

    drawMarketState(state, yPos=32){
        if(state == MarketStateType.REG || this.showState == 'disabled') return
        
        let blockHeight = 15
        this.drawingCtx.fillStyle = state == MarketStateType.PRE ? COLOR_PRE : COLOR_DISABLED
        this.drawingCtx.fillRect(0, yPos, 7, blockHeight)
        this.drawingCtx.fillStyle = state == MarketStateType.POST ? COLOR_POST : COLOR_DISABLED
        this.drawingCtx.fillRect(0, yPos+blockHeight, 7, blockHeight)
    }
    
    //-----------------------------------------------------------------------------------------

    drawSymbol(){
        //let trimList = ['-','=X']
        var label = this.symbolLabel
       
        // for (const element of trimList) {
        //     label = label.split(element)[0]
        // }

        this.drawScaledRight(label, COLOR_DIM, 18, 98, 24, 600, 2)
    }

    //-----------------------------------------------------------------------------------------

    drawPrice(value){
        this.drawScaledRight(value.abbreviateNumber(this.maxDigits), this.data.foreground, 50, CANVAS_WIDTH-20, 40)
    }

    //-----------------------------------------------------------------------------------------

    drawVolume(){
        let volume = this.data.volume.abbreviateNumber(3)
        this.drawRight(volume, COLOR_DIM, 78, 24)
    }

    //-----------------------------------------------------------------------------------------

    drawRange(){
        var price  = this.data.money + this.data.close.abbreviateNumber(this.maxDigits)
        var high = this.data.high.abbreviateNumber(this.maxDigits)
        var low = this.data.low.abbreviateNumber(this.maxDigits)

        var font = this.currentView.header ? 23 : 26
        var yPos = this.currentView.header ? [81,103,126,88] : [52,89,126,75] 

        if( !this.currentView.header ) {
            //this.drawLeft('-|+',COLOR_FOREGROUND, 16, 21, 600, 6)
            high = this.currentView.perc ? this.data.dayHighPerc + '%' : this.data.dayHigh.abbreviateNumber(this.maxDigits)
            low = this.currentView.perc ? this.data.dayLowPerc + '%' : this.data.dayLow.abbreviateNumber(this.maxDigits)
        }
        else if( this.currentView.perc ){
            high = this.data.highPerc + '%'
            low = this.data.lowPerc + '%'
        }

        if( this.currentView.header && (this.currentView == ViewType.RANGE || this.currentView == ViewType.RANGE_PERC)){
            if(low.length > 6 || high.length > 6){
                high = Number(high).abbreviateNumber(this.maxDigits)
                low = Number(low).abbreviateNumber(this.maxDigits)
            }
            this.drawSmartPair("Lo", low, COLOR_RED, "Hi", high, COLOR_GREEN)
            return
        }
        
        this.drawingCtx.fillStyle = COLOR_POST
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(0, yPos[3])
        this.drawingCtx.lineTo(15, yPos[3]+9)
        this.drawingCtx.lineTo(0, yPos[3]+18)
        this.drawingCtx.fill()
            
        this.drawPair('', COLOR_FOREGROUND, high, COLOR_GREEN, yPos[0], font)
        this.drawPair('', COLOR_FOREGROUND, price, COLOR_FOREGROUND, yPos[1], font)
        this.drawPair('', COLOR_FOREGROUND, low, COLOR_RED, yPos[2], font)
    }

    //-----------------------------------------------------------------------------------------

    drawSlider(){
        let padMin = 0
        let padMax = 0
        let yPos = 125
        this.drawingCtx.lineWidth = 3        
        let close = this.data.close
        let min = this.data.low
        let max = this.data.high
        var low = min.abbreviateNumber(this.maxDigits)
        var high = max.abbreviateNumber(this.maxDigits)
        let isPerc = this.limitManager.type == LimitType.PERCENT
        let showLimits = this.visLimits == 'enabled'

        if(this.currentView.perc){
            high = this.data.highPerc + '%'
            low = this.data.lowPerc + '%'
        }    

        // Set the new min and account for lowerLimit
        if(showLimits && this.limitManager.isLowerEnabled){
            padMin = isPerc ? close - close * this.limitManager.lowerLimit/100 : this.limitManager.lowerLimit
            min = Math.min(min, padMin)
        }

        // Set the new max and account for upperLimit
        if(showLimits && this.limitManager.isUpperEnabled){
            padMax = isPerc ? close + close * this.limitManager.upperLimit/100 : this.limitManager.upperLimit
            max = Math.max(max, padMax)
        }    

        //this.drawScaledPair(low, COLOR_DIM, high, COLOR_FOREGROUND, 103)
        this.drawScaledPair(low, COLOR_RED, high, COLOR_GREEN, 109)
        var scale = Math.round(144 * Utils.rangeToPercent(close, min, max).minmax())

        var grd = this.drawingCtx.createLinearGradient(0, yPos, 0, 145);
        grd.addColorStop(0.1, COLOR_RED_LT);
        grd.addColorStop(0.9, COLOR_BACKGROUND);
        this.drawingCtx.fillStyle = grd
        this.drawingCtx.fillRect(-1, yPos, scale, 25)
       
        grd = this.drawingCtx.createLinearGradient(0, yPos, 0, 145);
        grd.addColorStop(0.1, COLOR_GREEN_LT);
        grd.addColorStop(0.9, COLOR_BACKGROUND);
        this.drawingCtx.fillStyle = grd
        this.drawingCtx.fillRect(scale, yPos, 145, 25)
        
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(-1, yPos)
        this.drawingCtx.lineTo(scale, yPos)
        this.drawingCtx.strokeStyle = COLOR_RED
        this.drawingCtx.stroke()

        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(scale, yPos)
        this.drawingCtx.lineTo(145, yPos)
        this.drawingCtx.strokeStyle = COLOR_GREEN
        this.drawingCtx.stroke()

        // Use the new min/max to draw the lowerLimit
        if(showLimits && this.limitManager.isLowerEnabled){
            padMin = 144 * Utils.rangeToPercent(padMin, min, max)
            this.drawingCtx.fillStyle = '#300000'
            this.drawingCtx.fillRect(0, yPos+1, padMin.max(6), 25)
            
            grd = this.drawingCtx.createLinearGradient(0, yPos+2, 0, 144);
            grd.addColorStop(0.4, COLOR_RED)
            grd.addColorStop(0.9, COLOR_BACKGROUND)
            this.drawingCtx.fillStyle = grd
            this.drawingCtx.fillRect(padMin.minmax(6,138), yPos, 3, 25)
        }
        
        // Use the new min/max to draw the upperLimit
        if(showLimits && this.limitManager.isUpperEnabled){
            padMax = 144 * Utils.rangeToPercent(padMax, min, max)
            this.drawingCtx.fillStyle = '#003000'
            this.drawingCtx.fillRect(padMax, yPos+1, 144, 25)
            
            grd = this.drawingCtx.createLinearGradient(0, yPos+2, 0, 144);
            grd.addColorStop(0.4, COLOR_GREEN)
            grd.addColorStop(0.9, COLOR_BACKGROUND)
            this.drawingCtx.fillStyle = grd
            this.drawingCtx.fillRect(padMax.min(138), yPos, 3, 25)
        }

        // Remove the stroke between the green and red
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(scale-1, yPos)
        this.drawingCtx.lineTo(scale-1, 145)
        this.drawingCtx.strokeStyle = COLOR_BACKGROUND
        this.drawingCtx.stroke()

        // Draw the thumb
        scale = 144 * Utils.rangeToPercent(this.data.price, min, max)
        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        this.drawingCtx.fillRect(scale.minmax(8,138)-2, yPos-6, 4, 20)
    }

}
