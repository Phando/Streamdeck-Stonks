// Additional View States
const STATE_LIMITS  = 'limits'

const LimitType = Object.freeze({
    NUMERIC  : 'numeric',
    PERCENT  : 'percent'
});

const LimitViewType = Object.freeze({
    LIMIT_INFO  : 'summary',
    LOWER_INC   : 'lowerInc',
    LOWER_DEC   : 'lowerDec',
    UPPER_INC   : 'upperInc',
    UPPER_DEC   : 'upperDec',
    LOWER_INFO  : 'LOWER_INFO',
    UPPER_INFO  : 'UPPER_INFO'   
});

class LimitManager extends Manager{
    _viewList = []
    screenTime = 4
    countdown = 0

    constructor() {
        super()
        for (const [key, value] of Object.entries(LimitViewType))
            this.viewList.push(value)
    }

    get enabled(){
        return this.settings.limitEnabled == 'true'
    }

    set enabled(value){
        this.settings.limitEnabled = String(value)
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
    
    // Runtime Variables
    //-----------------------------------------------------------------------------------------

    get isUpper(){
        return this.currentView == LimitViewType.UPPER_DEC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInc(){
        return this.currentView == LimitViewType.LOWER_INC || this.currentView == LimitViewType.UPPER_INC
    }

    get isInteractive(){
        return  this.currentView == LimitViewType.LOWER_INC || this.currentView == LimitViewType.LOWER_DEC ||
                this.currentView == LimitViewType.UPPER_INC || this.currentView == LimitViewType.UPPER_DEC 
    }
    
    get timer(){
        return this.context.limitTimer
    }

    set timer(value){
        this.context.limitTimer = value
    }

    get currentView(){
        return this.viewList[this.clickCount]
    }

    set currentView(value){
        this.viewList.forEach(function(item, index){
            if(value == item){
                this.clickCount = index
                return
            }
        })
        this.updateDisplay(this.context)
    }

    get viewList(){
        return this._viewList
    }

    set viewList(value){
        this._viewList = value
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)

        this.enabled   = this.enabled || 'false'
        this.increment = this.increment || 1
        this.type      = this.type || LimitType.PERCENT
        
        this.lowerLimit = this.lowerLimit || 0
        this.upperLimit = this.upperLimit || 0
        this.lowerBackground = this.lowerBackground || '#AA0000'
        this.upperBackground = this.upperBackground || '#00AA00'
    } 

    //-----------------------------------------------------------------------------------------

    onKeyDown(jsn){
        super.onKeyDown(jsn)

        // Pad the click count
        if(this.currentView == LimitViewType.LIMIT_INFO){
            this.clickCount++
        }
    }

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn){
        super.onKeyUp(jsn)
        this.startTimer(jsn)
        console.log('Click', this.clickCount, this.context)

        // Interactive view click handling
        if( this.isInteractive || this.currentView == LimitViewType.LOWER_INFO) {
            this.clickCount = Math.max(0, this.clickCount-1) // Ignore clickCount 
            this.handleAdjustment(jsn)
        }
        else {
            this.updateDisplay(jsn)
        }
    }


    //-----------------------------------------------------------------------------------------

    handleAdjustment(jsn){
        this.uuid = jsn.context
        this.enabled = true
        let increment = Number(this.increment) 

        if(this.isUpper){
            this.upperLimit += this.isInc ? increment : -increment 
        }
        else {
            this.lowerLimit += this.isInc ? increment : -increment 
        }
        
        console.log("Limits", typeof this.lowerLimit, typeof this.upperLimit, this.lowerLimit, this.upperLimit)
        $SD.api.setSettings(this.uuid, this.settings)
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    prepData(jsn){
        super.prepData(jsn)
        
        let isLimit = 0
        this.data.limitBackground = this.settings.background
    
        if(this.type == LimitType.PERCENT){
            isLimit = this.data.percent <= this.lowerLimit ? -1 : 0
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
        value = Utils.abbreviateNumber(value, this.settings.decimals)
        return value
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
    } 

    //-----------------------------------------------------------------------------------------

    handleTimer(jsn){
        this.uuid = jsn.context

        if( this.currentView == LimitViewType.UPPER_DEC || this.currentView == LimitViewType.UPPER_INFO ){
            clearInterval(this.timer)
            $SD.emit(jsn.action + '.exitLimits', this.context)
            return
        }

        this.countdown--
        if(this.countdown < 0){
            this.clickCount++
            this.startTimer(jsn)
        }
        this.updateDisplay(jsn)
    }

    //-----------------------------------------------------------------------------------------

    startTimer(jsn){
        clearInterval(this.timer)
        this.countdown = this.screenTime
        this.timer = setInterval( (jasnObj) => this.handleTimer(jasnObj), 1000, this.context )
    }

    //-----------------------------------------------------------------------------------------

    stopTimer(jsn){
        clearInterval(this.timer)
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        console.log(jsn, this.currentView)
        this.drawingCtx.fillStyle = this.settings.background
        this.drawingCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillStyle = this.settings.foreground

        switch(this.currentView){    
            case LimitViewType.LIMIT_INFO :
                this.updateInfoView()
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
        this.drawHeader('Limits')
        // Upper
        this.drawingCtx.fillStyle = '#00FF00'
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText('Upper', 8, 95);

        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillText( this.upperLimit, 134, 95);

        // Lower
        this.drawingCtx.fillStyle = '#FF0000'
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText('Lower', 10, 115);

        this.drawingCtx.textAlign = "right"
        this.drawingCtx.fillText( this.lowerLimit, 134, 115);
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
        let value = this.isUpper ? this.upperLimit : this.lowerLimit
        let price = value    

        if(this.type == LimitType.PERCENT){
            price  = this.data.prevClose
            price += price * (this.isInc ? value/100 : -value/100)
            value  = value + '%'
        }
        else {
            value = this.prepPrice(value)
        }  

        price = this.prepPrice(price)
        this.drawHeader(this.isUpper ? 'Upper' : 'Lower')
        this.drawLimit(price)

        this.drawingCtx.fillStyle =  this.settings.foreground
        //this.drawingCtx.font = 600 + " " + 22 + "px Arial";
        
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.font = 500 + " " + 25 + "px Arial";
        this.drawingCtx.fillText(this.isInc ? '+Inc' : '-Dec', 138, 72);

        // Limit
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(value, 8, 95);

        // this.drawingCtx.textAlign = "right"
        // this.drawingCtx.fillText( price, 134, 95);

        // Price
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(this.prepPrice(this.data.price), 10, 115);

        // this.drawingCtx.textAlign = "right"
        // this.drawingCtx.fillText( this.data.price, 134, 115);
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
        Utils.setFontFor(value, 600, CANVAS_WIDTH - 20)
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 140, 34);
    }

    //-----------------------------------------------------------------------------------------

    drawHeader(value){
        this.drawingCtx.fillStyle =  this.settings.foreground
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(this.countdown, 136, 8);

        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(value, 10, 8);
    }

    

}