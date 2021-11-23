// Additional View States
const STATE_LIMITS  = 'limits'

const LimitType = Object.freeze({
    NUMERIC  : 'numeric',
    PERCENT  : 'percent'
});

const LimitViewType = Object.freeze({
    UPPER_ENABLED : 'upperEnabled',
    UPPER_INC   : 'upperInc',
    UPPER_DEC   : 'upperDec',
    LOWER_ENABLED : 'lowerEnabled',
    LOWER_DEC   : 'lowerDec',
    LOWER_INC   : 'lowerInc',
    EXIT_LIMITS : 'exitLimits',
    LOWER_INFO  : 'lowerInfo',
    UPPER_INFO  : 'upperInfo'   
});
 
class LimitManager extends Manager{
    _viewList = []
 
    constructor() {
        super()
        this.countdown = 5
        for (const [key, value] of Object.entries(LimitViewType))
            this.viewList.push(value)
    }

    get countDown(){
        return this.context.countDown
    }

    set countDown(value){
        this.context.countDown = value
    }

    get frameTime(){
        return this.settings.frameTime
    }

    set frameTime(value){
        this.settings.frameTime = value
    }

    get increment(){
        return Number(this.settings.limitIncrement)
    }

    set increment(value){
        this.settings.limitIncrement = value
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

    get type(){
        return this.settings.limitType
    }

    set type(value){
        this.settings.limitType = value
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
    
    // Runtime Variables
    //-----------------------------------------------------------------------------------------

    get limitState(){
        var result = 0
        var price = this.data.price
        
        if(this.type == LimitType.PERCENT)
            price = Math.abs(this.data.percent)    
        
        if(this.isUpperEnabled)
            result = price >= this.upperLimit ? 1 : 0

        if(this.isLowerEnabled)
            result = price <= this.lowerLimit ? -1 : result

        return result
    }

    get isUpperEnabled(){
        return this.upperEnabled == 'enabled'
    }

    get isLowerEnabled(){
        return this.lowerEnabled == 'enabled'
    }

    get limitsEnabled(){
        return this.isUpperEnabled || this.isLowerEnabled
    }

    get isEnabledView(){
        return this.currentView == LimitViewType.UPPER_ENABLED || this.currentView == LimitViewType.LOWER_ENABLED
    }

    get isInfoView(){
        return this.currentView == LimitViewType.POST_INFO
    }

    get isUpper(){
        return this.currentView == LimitViewType.UPPER_ENABLED || this.currentView == LimitViewType.UPPER_DEC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInc(){
        return this.currentView == LimitViewType.LOWER_INC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInteractive(){
        return  this.isEnabledView || 
                this.currentView ==  LimitViewType.LOWER_INC ||  this.currentView ==  LimitViewType.LOWER_DEC || 
                this.currentView ==  LimitViewType.UPPER_INC ||  this.currentView ==  LimitViewType.UPPER_DEC
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
        this.frameTime = this.frameTime || 5
        this.type      = this.type || LimitType.NUMERIC

        this.upperLimit = this.upperLimit || 0
        this.upperEnabled = this.upperEnabled || 'disabled'

        this.lowerLimit = this.lowerLimit || 0
        this.lowerEnabled   = this.lowerEnabled || 'disabled'

        this.countdown = this.frameTime
    } 

    //-----------------------------------------------------------------------------------------

    onKeyDown(jsn){
        super.onKeyDown(jsn)
        
        if(!this.isInteractive){
            this.clickCount++
        }
    }

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn){
        super.onKeyUp(jsn)
        
        // Ignore the long press click
        if(this.isLongPress){
            this.isLongPress = false
        }
        else if(this.isInteractive) {        
            if(this.isEnabledView)
                this.handleEnabled(jsn)
            else 
                this.handleAdjustment(jsn)

            $SD.api.setSettings(this.uuid, this.settings)
        }

        this.startTimer(jsn)
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    onLongPress(jsn){
        super.onLongPress(jsn)
        
        this.clickCount = this.viewList.findIndex(item => item == LimitViewType.UPPER_ENABLED)
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        super.prepData(jsn)
        this.data.limitBackground = COLOR_BACKGROUND

        if(this.limitState == 0) return
        this.data.limitBackground = this.limitState == 1 ? '#00AA00' : '#CC0000'
    }

    //-----------------------------------------------------------------------------------------

    onSendToPlugin(jsn) {
        super.onSendToPlugin(jsn)
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        
        if(sdpi_collection.key == 'limitType'){
            this.lowerLimit = this.type == LimitType.NUMERIC ? this.data.price - this.increment : 1
            this.upperLimit = this.type == LimitType.NUMERIC ? this.data.price + this.increment : 1
            $SD.api.setSettings(this.uuid, this.settings); 
        }

        this.updateDisplay(jsn)
    } 

    //-----------------------------------------------------------------------------------------

    resetLimits(){
        this.upperLimit = 0
        this.upperEnabled = 'disabled'
        this.lowerLimit = 0
        this.lowerEnabled = 'disabled'
    }

    //-----------------------------------------------------------------------------------------
    
    exitlLimits(jsn){
        this.uuid = jsn.context
        
        this.stopTimer(jsn)
        this.countdown = this.frameTime
        this.incrementOnClick = true
        $SD.emit(jsn.action + '.exitLimits', this.context)
    }

    //-----------------------------------------------------------------------------------------

    handleEnabled(jsn){
        this.uuid = jsn.context
        
        if(this.isUpper) {
            this.upperEnabled = this.isUpperEnabled ? 'disabled' : 'enabled'
            if(this.isUpperEnabled && this.type == LimitType.NUMERIC)
                this.upperLimit = this.data.price
        }
        else {
            this.lowerEnabled = this.isLowerEnabled ? 'disabled' : 'enabled'
            if(this.isLowerEnabled && this.type == LimitType.NUMERIC)
                this.lowerLimit = this.data.price
        }
    }

    //-----------------------------------------------------------------------------------------

    handleAdjustment(jsn){
        this.uuid = jsn.context
        var increment = Number(this.increment) * (this.isInc ? 1 : -1) 
        
        // NOTE: Special case to keep percentages positive
        if(this.type == LimitType.PERCENT && !this.isUpper)
            increment *= -1 

        if(this.isUpper) {
            this.upperLimit += increment
            this.upperLimit = this.type == LimitType.PERCENT ? 
                Math.max(1, this.upperLimit) : 
                Math.max(this.data.price + increment, this.upperLimit)  
        }
        else {
            this.lowerLimit += increment
            this.lowerLimit = this.type == LimitType.PERCENT ? 
                Math.max(1, this.lowerLimit) :
                Math.min(this.data.price + increment, this.lowerLimit)
        }
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

        this.stopTimer(jsn)
        
        // Show the next screen
        if(this.currentView == LimitViewType.UPPER_ENABLED && !this.isUpperEnabled){
            this.clickCount = this.viewList.findIndex(item => item == LimitViewType.LOWER_ENABLED)
        } 
        else if(this.currentView == LimitViewType.LOWER_ENABLED && !this.isLowerEnabled){
            this.clickCount = this.viewList.findIndex(item => item == LimitViewType.EXIT_LIMITS)
        }
        else {
            this.clickCount++
        }
        
        // Exit : No more adjustment screens
        if( this.currentView == LimitViewType.EXIT_LIMITS ) {
            this.exitlLimits(jsn)
            return
        }

        this.startTimer(jsn)
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    startTimer(jsn){
        this.uuid = jsn.context
        this.stopTimer(jsn)
        this.countdown = this.frameTime
        this.timer = setInterval( (jasnObj) => this.handleTimer(jasnObj), 900, this.context )
    }

    //-----------------------------------------------------------------------------------------

    stopTimer(jsn){
        this.uuid = jsn.context
        clearInterval(this.timer)
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawingCtx.fillStyle = COLOR_BACKGROUND
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        switch(this.currentView){    
            case LimitViewType.POST_INFO :
                this.updateInfoView(jsn)
                break
            case LimitViewType.UPPER_ENABLED :
            case LimitViewType.LOWER_ENABLED :
            case LimitViewType.LOWER_INC :
            case LimitViewType.LOWER_DEC :
            case LimitViewType.UPPER_INC :
            case LimitViewType.UPPER_DEC :
                this.updateInfoView(jsn, true)
                break
            case LimitViewType.LOWER_INFO :
            case LimitViewType.UPPER_INFO :
                this.updateDetailView()
                break
        }
        
        $SD.api.setImage(this.uuid, this.canvas.toDataURL());
    }

    //-----------------------------------------------------------------------------------------

    updateLimitView(jsn){
        this.uuid = jsn.context
        if(this.limitState == 0) return

        var grad = this.drawingCtx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
        grad.addColorStop(0.0, this.data.limitBackground)
        grad.addColorStop(0.25, COLOR_BACKGROUND)
        grad.addColorStop(0.9, COLOR_BACKGROUND)
        // grad.addColorStop(1.0, this.data.limitBackground)
        this.drawingCtx.fillStyle = grad
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } 

    //-----------------------------------------------------------------------------------------

    updateInfoView(jsn, editable = false){
        this.uuid = jsn.context
        var fillColor = COLOR_BACKGROUND
        var upper = this.upperLimit
        var lower = this.lowerLimit
        var price = this.data.priceMarket.abbreviateNumber()
        var state = this.data.state
        
        if(this.type == LimitType.PERCENT){
            upper = '+' + upper + '%'
            lower = '-' + lower + '%'
            state = MarketStateType.CLOSED
            price = this.data.close.abbreviateNumber()
            fillColor = COLOR_DISABLED
        }
        else {
            upper = upper.abbreviateNumber()
            lower = lower.abbreviateNumber()

            if(state != MarketStateType.REG){
                switch(this.data.state){
                    case MarketStateType.PRE:
                        fillColor = COLOR_PRE
                        break
                    case MarketStateType.POST:
                        fillColor = COLOR_POST
                        break
                    default:
                        fillColor = COLOR_DISABLED
                }
            }
        }
        
        if(editable)
            this.drawEditableContent()
        
        this.drawingCtx.fillStyle = fillColor
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(0, 75)
        this.drawingCtx.lineTo(15, 75+9)
        this.drawingCtx.lineTo(0, 75+18)
        this.drawingCtx.fill()

        this.drawRight(upper, this.isUpperEnabled ? COLOR_GREEN : COLOR_DISABLED, 52, 26)
        this.drawRight(price, COLOR_FOREGROUND, 88, 26)
        this.drawRight(lower, this.isLowerEnabled ? COLOR_RED : COLOR_DISABLED, 126, 26)
    }

    //-----------------------------------------------------------------------------------------

    drawEditableContent(){
        var imgName
        var enablePos = this.isUpper ? 40 : 114
        var iconPos = this.isUpper ? 35 : 109
        var linePos = this.isUpper ? 32 : 106
        var enabled = this.isUpper ? this.isUpperEnabled : this.isLowerEnabled
        
        this.drawHeader('Limits')
        this.drawingCtx.lineWidth = 1
        this.drawingCtx.fillStyle = '#333333'
        this.drawingCtx.strokeStyle = '#777777'
        this.drawingCtx.fillRect(-2, linePos, CANVAS_WIDTH+4, 34)

        switch(this.currentView){    
            case LimitViewType.UPPER_ENABLED :
            case LimitViewType.LOWER_ENABLED :
                this.drawSwitch(enabled, 3, enablePos)
                break
            default :
                var img = document.getElementById(this.isInc ? 'arrowUp' : 'arrowDown')
                this.drawingCtx.drawImage(img, -8, iconPos, 43, 26)
                break
        }
    }

    //-----------------------------------------------------------------------------------------

    updateDetailView(){
        this.drawRight('Not Implemented', COLOR_RED, 20)
    }

    //-----------------------------------------------------------------------------------------

    drawLimit(value){
        this.drawRight(value, this.isUpper ? COLOR_GREEN : COLOR_RED, 54, 30, 700)
    }

    //-----------------------------------------------------------------------------------------

    drawHeader(value){
        this.drawRight(value, COLOR_FOREGROUND, 20)
        this.drawLeft(this.countdown, COLOR_FOREGROUND, 20, 22, 600, 4)
    }

    //-----------------------------------------------------------------------------------------

    drawSwitch(state, xPos, yPos){
        var width = 10
        this.drawingCtx.strokeStyle = COLOR_FOREGROUND
        this.drawingCtx.fillStyle = state ? COLOR_GREEN : COLOR_DISABLED
        this.drawingCtx.fillRect(xPos, yPos, width, 15)
        this.drawingCtx.strokeRect(xPos, yPos, width, 15)
    }

}