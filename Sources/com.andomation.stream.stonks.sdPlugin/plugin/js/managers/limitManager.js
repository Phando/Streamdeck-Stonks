// Additional View States
const STATE_LIMITS  = 'limits'

const LimitType = Object.freeze({
    NUMERIC  : 'numeric',
    PERCENT  : 'percent'
});

const LimitViewType = Object.freeze({
    //LIMIT_INFO  : 'summary',
    UPPER_ENABLED : 'upperEnabled',
    UPPER_INC   : 'upperInc',
    UPPER_DEC   : 'upperDec',
    LOWER_ENABLED : 'lowerEnabled',
    LOWER_DEC   : 'lowerDec',
    LOWER_INC   : 'lowerInc',
    LOWER_INFO  : 'lowerInfo',
    UPPER_INFO  : 'upperInfo'   
});

class LimitManager extends Manager{
    _viewList = []
    countdown = 5

    constructor() {
        super()
        for (const [key, value] of Object.entries(LimitViewType))
            this.viewList.push(value)
    }

    get increment(){
        return Number(this.settings.limitIncrement)
    }

    set increment(value){
        this.settings.limitIncrement = value
    }

    get type(){
        return this.settings.limitType
    }

    set type(value){
        this.settings.limitType = value
    }

    get lowerEnabled(){
        return this.settings.lowerLimitEnabled
    }

    set lowerEnabled(value){
        this.settings.lowerLimitEnabled = value
    }


    get lowerLimit(){
        return Number(this.settings.lowerLimit)
    }

    set lowerLimit(value){
        this.settings.lowerLimit = value
    }

    get lowerBackground(){
        return this.settings.lowerLimitBackground
    }

    set lowerBackground(value){
        this.settings.lowerLimitBackground = value
    }

    get upperEnabled(){
        return this.settings.upperLimitEnabled
    }

    set upperEnabled(value){
        this.settings.upperLimitEnabled = value
    }

    get upperLimit(){
        return Number(this.settings.upperLimit)
    }

    set upperLimit(value){
        this.settings.upperLimit = value
    }

    get upperBackground(){
        return this.settings.upperLimitBackground
    }

    set upperBackground(value){
        this.settings.upperLimitBackground = value
    }

    get frameTime(){
        return this.settings.frameTime
    }

    set frameTime(value){
        this.settings.frameTime = value
    }
    
    // Runtime Variables
    //-----------------------------------------------------------------------------------------

    get isEnabledViewView(){
        return this.currentView == LimitViewType.UPPER_ENABLED || this.currentView == LimitViewType.LOWER_ENABLED
    }

    get isUpper(){
        return this.currentView == LimitViewType.UPPER_ENABLED || this.currentView == LimitViewType.UPPER_DEC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInc(){
        return this.currentView == LimitViewType.LOWER_INC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInteractive(){
        return  this.currentView != LimitViewType.LOWER_INFO && this.currentView != LimitViewType.UPPER_INFO
    }
    
    get timer(){
        return this.context.limitTimer
    }

    set timer(value){
        this.context.limitTimer = value
    }

    // Overrides
    //-----------------------------------------------------------------------------------------

    get currentView(){
        return this.viewList[this.clickCount]
    }

    set currentView(value){
        this.clickCount = this.viewList.findIndex(item => item == value)
        this.updateDisplay(this.context)
    }

    get viewList(){
        return this._viewList
    }

    set viewList(value){
        this._viewList = value
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)

        this.increment = this.increment || 1
        this.frameTime = this.frameTime || 4
        this.type      = this.type || LimitType.PERCENT
        
        this.upperLimit = this.upperLimit || 0
        this.upperEnabled   = this.upperEnabled || 'disabled'
        this.upperBackground = this.upperBackground || '#00AA00'

        this.lowerLimit = this.lowerLimit || 0
        this.lowerEnabled   = this.lowerEnabled || 'disabled'
        this.lowerBackground = this.lowerBackground || '#AA0000'
    } 

    //-----------------------------------------------------------------------------------------

    onKeyDown(jsn){
        super.onKeyDown(jsn)

        if(this.isInteractive)
            this.incrementOnClick = false
    }

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn){
        this.uuid = jsn.context
        this.startTimer(jsn)

        // Interactive view click handling
        if( this.isInteractive) {
            this.incrementOnClick = false
            
            if(this.isLongPress){
                this.countdown = this.frameTime
                this.isLongPress = false
                this.updateDisplay(jsn)
                return
            }
            
            if(this.isEnabledViewView)
                this.handleEnabled(jsn)
            else 
                this.handleAdjustment(jsn)
            
            $SD.api.setSettings(this.uuid, this.settings)
        }
        else {
            super.onKeyUp(jsn)
        }

        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    handleEnabled(jsn){
        this.uuid = jsn.context
        
        if(this.isUpper)
            this.upperEnabled = this.upperEnabled == 'enabled' ? 'disabled' : 'enabled'
        else 
            this.lowerEnabled = this.lowerEnabled == 'enabled' ? 'disabled' : 'enabled'
    }

    //-----------------------------------------------------------------------------------------

    handleAdjustment(jsn){
        this.uuid = jsn.context
        let increment = Number(this.increment) * this.isInc ? 1 : -1 
        
        // NOTE: Special case to keep percentages positive
        if(this.type == LimitType.PERCENT && !this.isUpper)
            increment *= -1 

        if(this.isUpper) {
            this.upperLimit += increment
            this.upperLimit = this.type == LimitType.PERCENT ? Math.max(0, this.upperLimit) : this.upperLimit
        }
        else {
            this.lowerLimit += increment
            this.lowerLimit = this.type == LimitType.PERCENT ? Math.max(0, this.lowerLimit) : this.lowerLimit 
        }
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        super.prepData(jsn)
        
        let isLimit = 0
        this.data.limitBackground = this.settings.background
    
        if(this.type == LimitType.PERCENT){
            isLimit = this.data.percent <= -this.lowerLimit ? -1 : 0
            isLimit = this.data.percent >= this.upperLimit ? 1 : isLimit
        }
        else {
            isLimit = this.data.price <= this.lowerLimit ? -1 : 0
            isLimit = this.data.price >= this.upperLimit ? 1 : isLimit
        }  
        
        if( isLimit == 0) return // Not in limit state
        this.data.limitBackground = isLimit == 1 ? this.upperBackground : this.lowerBackground
    }

    //-----------------------------------------------------------------------------------------

    prepPrice(value){
        return Utils.abbreviateNumber(value, this.settings.decimals)
    }

    //-----------------------------------------------------------------------------------------

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
            
        if(sdpi_collection.key == 'limitType'){
            this.lowerLimit = this.type == LimitType.NUMERIC ? this.data.price : 0
            this.upperLimit = this.type == LimitType.NUMERIC ? this.data.price : 0
            $SD.api.setSettings(this.uuid, this.settings); 
        }

        this.updateDisplay(jsn)
    } 

    //-----------------------------------------------------------------------------------------

    exitlLimits(jsn){
        this.uuid = jsn.context
        
        clearInterval(this.timer)
        this.countdown = this.frameTime
        this.incrementOnClick = true
        $SD.emit(jsn.action + '.exitLimits', this.context)
    }

    //-----------------------------------------------------------------------------------------

    handleTimer(jsn){
        this.uuid = jsn.context
        this.countdown--
        
        // Note: Update countdown timer if not below limit
        if(this.countdown >= 0){
            this.updateDisplay(jsn)
            return
        }
        
        this.countdown = this.frameTime

        // Show the next screen
        if(this.currentView == LimitViewType.UPPER_ENABLED && this.upperEnabled == 'disabled'){
            this.clickCount = this.viewList.findIndex(item => item == LimitViewType.LOWER_ENABLED)
        } 
        else if(this.currentView == LimitViewType.LOWER_ENABLED && this.lowerEnabled == 'disabled'){
            this.exitlLimits(jsn)
            return
        }
        else {
            this.clickCount++
        }

        // Exit : No more adjustment screens
        if(!this.incrementOnClick && this.currentView == LimitViewType.LOWER_INFO) {
            this.exitlLimits(jsn)
            return
        }

        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    startTimer(jsn){
        this.uuid = jsn.context
        clearInterval(this.timer)
        this.countdown = this.frameTime
        this.timer = setInterval( (jasnObj) => this.handleTimer(jasnObj), 1000, this.context )
    }

    //-----------------------------------------------------------------------------------------

    stopTimer(jsn){
        clearInterval(this.timer)
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        console.log('LimitManager updateDisplay', jsn, this.currentView)
        this.drawingCtx.fillStyle = this.settings.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillStyle = this.settings.foreground

        switch(this.currentView){    
            case LimitViewType.LIMIT_INFO :
                this.updateInfoView()
                break
            case LimitViewType.UPPER_ENABLED :
            case LimitViewType.LOWER_ENABLED :
                this.updateEnabledView()
                break
            case LimitViewType.LOWER_INC :
            case LimitViewType.LOWER_DEC :
            case LimitViewType.UPPER_INC :
            case LimitViewType.UPPER_DEC :
                this.updateAdjustmentView()
                break
            case LimitViewType.LOWER_INFO :
            case LimitViewType.UPPER_INFO :
                this.updateDetailView()
                break
        }
        
        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    //-----------------------------------------------------------------------------------------

    updateInfoView(){
        let upper = this.upperLimit
        let lower = this.lowerLimit
        
        if(this.type == LimitType.PERCENT){
            upper += '%'
            lower += '%'
        }
        else {
            upper = this.prepPrice(upper)
            lower = this.prepPrice(lower)
        }

        this.drawHeader('Limits')
        this.drawPair("Up", upper, 95, '#00FF00')
        this.drawPair("Low", lower, 115, '#FF0000')
    }

    //-----------------------------------------------------------------------------------------

    updateEnabledView(){
        let enabled = this.isUpper ? this.upperEnabled : this.lowerEnabled
        enabled = enabled == 'enabled'
        
        this.drawHeader(this.isUpper ? 'Upper' : 'Lower')

        this.drawingCtx.fillStyle =  this.settings.foreground 
        this.drawingCtx.font = 600 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText('Limit', 136, 36);

        var img = document.getElementById(enabled ? 'limitEnabledImg' : 'limitDisabledImg')
        this.drawingCtx.drawImage(img, 35, 66)
    }
    
    //-----------------------------------------------------------------------------------------

    updateLimitView(jsn){
        this.uuid = jsn.context
        if(!this.enabled) return

        var grd = this.drawingCtx.createLinearGradient(0, 0, 0, 70)
        grd.addColorStop(0, this.data.limitBackground)
        grd.addColorStop(1, this.settings.background)
        this.drawingCtx.fillStyle = grd
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } 

    //-----------------------------------------------------------------------------------------

    updateAdjustmentView(){
        let limit = this.isUpper ? this.upperLimit : this.lowerLimit
        let price = this.data.price    
        let adjusted = limit

        if(this.type == LimitType.PERCENT){
            price = this.data.prevClose
            adjusted = price + (price * (this.isUpper ? limit/100 : -limit/100))
            limit +='%'
        }
        else {
            limit = this.prepPrice(limit - price)
        }

        adjusted = this.prepPrice(adjusted)
        price = this.prepPrice(price)
        
        var img = document.getElementById(this.isInc ? 'arrowUp' : 'arrowDown')
        this.drawingCtx.drawImage(img, 30, 6)

        this.drawHeader(this.isUpper ? 'Upper' : 'Lower')
        this.drawLimit(adjusted)

        // Adjustment
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillStyle =  this.settings.foreground
        this.drawingCtx.font = 500 + " " + 25 + "px Arial";
        this.drawingCtx.fillText(limit, 138, 72);
        
        // Limit
        // this.drawingCtx.font = 600 + " " + 26 + "px Arial"
        // this.drawingCtx.textAlign = "left"
        // this.drawingCtx.fillText(value, 8, 85);

        // this.drawingCtx.textAlign = "right"
        // this.drawingCtx.fillText(price, 134, 95);

        // Price
        //this.drawPair("%", percent, 95, color)
        //this.drawingCtx.font = 600 + " " + 24 + "px Arial"
        //this.drawingCtx.textAlign = "left"
        //this.drawingCtx.fillText(price, 10, 115);

        // this.drawingCtx.textAlign = "right"
        // this.drawingCtx.fillText(price, 134, 115);
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText('Icn', 8, 95)

        // Render VALUE
        Utils.setFontFor(price, 600, 26, CANVAS_WIDTH-20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillText(price, 136, 115)

    }
    
    //-----------------------------------------------------------------------------------------

    updateDetailView(){
        this.drawingCtx.textAlign = "center"
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.fillText((this.isUpper?'Upper':'Lower') + ' Limit', CANVAS_WIDTH/2, 8);
    }
    
    //-----------------------------------------------------------------------------------------

    drawLimit(value){
        // Render Price
        this.drawingCtx.fillStyle = this.isUpper ? '#00FF00' : '#FF0000'
        // this.drawingCtx.fillStyle = this.settings.foreground
        Utils.setFontFor(value, 600, 40, CANVAS_WIDTH - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 140, 34);
    }

    //-----------------------------------------------------------------------------------------

    drawHeader(value){
        this.drawingCtx.fillStyle =  this.settings.foreground
        this.drawingCtx.font = 600 + " " + 25 + "px Arial";
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(this.countdown, 10, 8);

        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 136, 8);
    }
}