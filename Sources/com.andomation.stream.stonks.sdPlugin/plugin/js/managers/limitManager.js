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
        var isPerc = this.type == LimitType.PERCENT
        var high = isPerc ? this.data.close + this.data.close * this.upperLimit/100 : this.upperLimit
        var low  = isPerc ? this.data.close - this.data.close * this.lowerLimit/100 : this.lowerLimit
        
        if(this.isUpperEnabled)
            result = this.data.price >= high ? 1 : 0

        if(this.isLowerEnabled)
            result = this.data.price <= low ? -1 : result

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
        
        if(!this.isInteractive)
            this.clickCount++
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
        this.clickCount = 0
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
        $SD.emit(jsn.action + '.exitLimits', this.context)
    }

    //-----------------------------------------------------------------------------------------

    handleEnabled(jsn){
        this.uuid = jsn.context
        
        if(this.isUpper) {
            this.upperEnabled = this.isUpperEnabled ? 'disabled' : 'enabled'
            if(this.isUpperEnabled)
                this.upperLimit = this.type == LimitType.PERCENT ? 1 : this.data.close + this.increment
        }
        else {
            this.lowerEnabled = this.isLowerEnabled ? 'disabled' : 'enabled'
            if(this.isLowerEnabled)
                this.lowerLimit = this.type == LimitType.PERCENT ? 1 : this.data.close - this.increment
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
        console.log("Current View", this.currentView, this.isUpperEnabled, this.isLowerEnabled)
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
        
        console.log("Current View2", this.currentView, this.isUpperEnabled, this.isLowerEnabled)
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
        var yPos = 76
        this.uuid = jsn.context
        var upper = this.upperLimit.abbreviateNumber(this.settings.maxDigits)
        var lower = this.lowerLimit.abbreviateNumber(this.settings.maxDigits)
        var price = this.data.money + this.data.close.abbreviateNumber(this.settings.maxDigits)
        
        if(this.type == LimitType.PERCENT){
            upper = '+' + this.upperLimit + '%'
            lower = '-' + this.lowerLimit + '%'
       }
        
        if(editable)
            this.drawEditableContent()
        
        this.drawingCtx.fillStyle = COLOR_POST
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(0, yPos)
        this.drawingCtx.lineTo(15, yPos+9)
        this.drawingCtx.lineTo(0, yPos+18)
        this.drawingCtx.fill()

        this.drawRight(upper, this.isUpperEnabled ? COLOR_GREEN : COLOR_DISABLED, 52, 26)
        this.drawRight(price, COLOR_FOREGROUND, 88, 26)
        this.drawRight(lower, this.isLowerEnabled ? COLOR_RED : COLOR_DISABLED, 126, 26)
    }

    //-----------------------------------------------------------------------------------------

    drawEditableContent(){
        var enablePos = this.isUpper ? 50 : 122
        var iconPos = this.isUpper ? 60 : 133
        var linePos = this.isUpper ? 32 : 106
        var enabled = this.isUpper ? this.isUpperEnabled : this.isLowerEnabled
        
        this.drawHeader('Limits')
        this.drawingCtx.lineWidth = 1
        this.drawingCtx.fillStyle = '#444444'
        this.drawingCtx.fillRect(-2, linePos, CANVAS_WIDTH+4, 34)

        switch(this.currentView){    
            case LimitViewType.UPPER_ENABLED :
            case LimitViewType.LOWER_ENABLED :
                this.drawSwitch(8, enablePos, enabled)
                break
            default :
                this.drawArrow(6, iconPos, this.isInc)    
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

    drawArrow(xPos, yPos, state){
        let width = 20
        let height = 20

        this.drawingCtx.strokeStyle = COLOR_FOREGROUND
        this.drawingCtx.fillStyle = state ? COLOR_GREEN : COLOR_RED
        this.drawingCtx.beginPath();
        if(state){
            this.drawingCtx.moveTo(xPos, yPos)
            this.drawingCtx.lineTo(xPos+(width/2), yPos-height)
            this.drawingCtx.lineTo(xPos+width, yPos)
        }
        else {
            this.drawingCtx.moveTo(xPos, yPos-height)
            this.drawingCtx.lineTo(xPos+(width/2), yPos)
            this.drawingCtx.lineTo(xPos+width, yPos-height)
        }
        this.drawingCtx.closePath()
        this.drawingCtx.fill()
        //this.drawingCtx.stroke()
    }

    //-----------------------------------------------------------------------------------------

    drawSwitch(xPos, yPos, state){
        this.drawingCtx.strokeStyle = COLOR_FOREGROUND
        this.drawingCtx.fillStyle = state ? COLOR_GREEN : COLOR_DISABLED
        this.drawingCtx.beginPath();
        this.drawingCtx.arc(xPos, yPos, 8, 0, 2 * Math.PI, false);
        this.drawingCtx.rect(0, yPos-8, xPos, 16);
        this.drawingCtx.fill();
        //this.drawingCtx.stroke();
    }

}