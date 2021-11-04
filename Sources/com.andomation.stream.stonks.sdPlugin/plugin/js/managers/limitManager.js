class Limits extends Manager{
    onDidReceiveSettings(jsn) {
        
        this.settings.limitType = this.settings.limitType || LIMIT_TYPE_PERCENT
        this.settings.limitIncrement = this.settings.limitIncrement = 1
        this.settings.limitsEnabled = this.settings.limitsEnabled || 'false'
        
        this.settings.upperlimit = this.settings.upperlimit || 0
        this.settings.lowerlimit = this.settings.lowerlimit || 0
        this.settings.upperlimitbackground = this.settings.upperlimitbackground || "#00AA00"
        this.settings.lowerlimitbackground = this.settings.lowerlimitbackground || "#AA0000"
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
            this.setFontFor(value, 600, this.canvas.width - 20)
            this.drawingCtx.fillText(value, 140, 38);
        }
    }
}