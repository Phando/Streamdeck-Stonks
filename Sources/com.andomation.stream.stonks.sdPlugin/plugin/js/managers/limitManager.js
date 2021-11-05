const LimitType = Object.freeze({
    NUMERIC  : 'numeric',
    PERCENT  : 'percent'
});

class LimitManager extends Manager{
    
    constructor() {
        super()
    }

    get enabled(){
        return this.settings.limitEnabled
    }

    set enabled(value){
        this.settings.limitEnabled = value
    }

    get increment(){
        return this.settings.limitIncrement
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

    get lower(){
        return this.settings.lowerLimit
    }

    set lower(value){
        this.settings.lowerLimit = value
    }

    get lowerBackground(){
        return this.settings.lowerLimitBackground
    }

    set lowerBackground(value){
        this.settings.lowerLimitBackground = value
    }

    get upper(){
        return this.settings.upperLimit
    }

    set upper(value){
        this.settings.upperLimit = value
    }

    get upperBackground(){
        return this.settings.upperLimitBackground
    }

    set upperBackground(value){
        this.settings.upperLimitBackground = value
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)

        this.enabled   = this.enabled || 'false'
        this.increment = this.increment || 1
        this.type      = this.type || LimitType.PERCENT
        
        this.lower = this.lower || 0
        this.upper = this.upper || 0
        this.lowerBackground = this.lowerBackground || '#AA0000'
        this.upperBackground = this.upperBackground || '#00AA00'
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

    prepData(jsn){
        super.prepData(jsn)
        var symbol = jsn.payload
        var payload = {}

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
    }

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        let isLow = this.clickCount == 0
        var label = isLow ? "Low" : "High"
        var value = isLow ? this.settings.lowerlimit : this.settings.upperlimit
        
        this.drawingCtx.fillStyle =  this.settings.foreground;
        this.drawingCtx.font = 600 + " " + 24 + "px Arial";
        this.drawingCtx.textAlign = "right"
        this.drawingCtx.textBaseline = "top"
        this.drawingCtx.fillText(label + ' Limit', 136, 8);

        if(this.settings.limitType == LimitType.NUMERIC){
            this.drawPrice(value)
        }
        else {
            value += '%'
            Utils.setFontFor(value, 600, this.canvas.width - 20)
            this.drawingCtx.fillText(value, 140, 38);
        }
    }
}