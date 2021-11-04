const ChartType = Object.freeze({
    // ranges    ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    // intervals [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
    CHART_1MIN      : {range:'1d', interval:'1m', label:'1m', hasLine: false},
    CHART_3MIN      : {range:'1d', interval:'1m', label:'3m', hasLine: false},
    CHART_DAY_3MIN  : {range:'1d', interval:'1m', label:'1d3', hasLine: true},
    CHART_DAY_5MIN  : {range:'1d', interval:'1m', label:'1d5', hasLine: true},
    CHART_DAY_5     : {range:'5d', interval:'15m', label:'5d', hasLine: false},
    CHART_MONTH_1   : {range:'3mo', interval:'60m', label:'1M', hasLine: false},
    CHART_MONTH_3   : {range:'3mo', interval:'60m', label:'3M', hasLine: false},
    CHART_MONTH_6   : {range:'1y', interval:'1d', label:'6M', hasLine: false},
    CHART_MONTH_12  : {range:'1y', interval:'1d', label:'1y', hasLine: false},
});

class ChartManager extends Manager {
    
    get chartData(){
        return this.context.chartData
    }

    set chartData(value){
        this.context.chartData = value
    }

    get chartType(){
        return this.context.chartType
    }

    set chartType(value){
        this.context.chartType = value
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)
        this.chartData = this.chartData || {}
        this.chartType = this.chartType || ChartType.CHART_1MIN
    }
    
    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        super.onKeyUp(jsn)
        let viewName = ViewType.keyFor(this.currentView)

        for (const [key, value] of Object.entries(ChartType)) {
            if(viewName == key){
                this.chartType = value
            }
        }
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveData(jsn) {
        super.onDidReceiveData(jsn)
        console.log("ChartManager - onDidReceiveData: ", jsn)
        
        // If the response is other than what is expected, return
        if(jsn.payload.userInfo.label != this.chartType.label) return

        var payload = jsn.payload.response[0].meta
        payload.data = jsn.payload.response[0].indicators.quote[0].close 
        payload.min = Math.min(...payload.data)
        payload.max = Math.max(...payload.data)
        payload.userInfo = jsn.payload.userInfo
        payload.isUp = payload.chartPreviousClose <= payload.regularMarketPrice
        
        delete this.chartData
        this.chartData = payload
        
        switch(this.chartData.userInfo.label){
            case ChartType.CHART_1MIN.label :
                this.prep1MinChart()
                break
            case ChartType.CHART_3MIN.label :
                this.prep3MinChart()
                break
            case ChartType.CHART_DAY_3MIN.label :
                this.prepDay3MinChart()
                break
            case ChartType.CHART_DAY_5MIN.label :
                this.prepDay5MinChart()
                break
            case ChartType.CHART_DAY_5.label :
                this.prep5DayChart()
                break
            case ChartType.CHART_MONTH_1.label :
                this.prep1MonthChart()
                break
            case ChartType.CHART_MONTH_3.label :
                this.prep3MonthChart()
                break
            case ChartType.CHART_MONTH_6.label :
                this.prep6MonthChart()
                break
            case ChartType.CHART_MONTH_12.label :
                this.prep12MonthChart()
                break
        }  
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawCharLabel()
        this.drawChartData()
        if(this.chartData.hasLine == true)
            this.drawCharLine()
    }
    
    //-----------------------------------------------------------------------------------------

    drawCharLabel(){
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.fillText(this.chartData.userInfo.label, 3, 10);
    }

    //-----------------------------------------------------------------------------------------

    drawCharLine(){
        let range = (this.chartData.chartPreviousClose - this.chartData.min) / (this.chartData.max - this.chartData.min)
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.fillRect(0, 144 - (15 + 40 * range), 144, 2);
    }

    //-----------------------------------------------------------------------------------------

    drawChartData(){
        return
        let xPos = (this.canvas.width-this.chartWidth)/2
        let range = 0
        var index = 0
        let chart = this.chartData
        let isUp = chart.chartPreviousClose <= chart.regularMarketPrice
        let fillColor = isUp ? '#007700' : '#770000'
        let tipColor = isUp ? '#00FF00' : '#FF0000'

        for(let i = 0; i < this.chartWidth && index < chart.data.length; i++){
            range = (chart.data[Math.round(index)] - chart.min) / (chart.max - chart.min)
            this.drawingCtx.fillStyle = fillColor
            this.drawingCtx.fillRect(xPos, 144, 1, -(15 + 40 * range));
            this.drawingCtx.fillStyle = tipColor
            this.drawingCtx.fillRect(xPos, 144-(15 + 40 * range), 1, 3);
            index += chart.interval
            xPos++
        }
    }

    //-----------------------------------------------------------------------------------------

    prep1MinChart(){
        //payload.interval = (payload.data.length-1) / this.chartWidth
        // if(this.context.clickCount == 1){
        //     var tmp = []
        //     for(var i = payload.data.length - 1; i >= 0; i--){
        //         tmp.push(payload.data[i]);
        //     }
        //     payload.range = "1m"
        //     payload.data = tmp.reverse();
        //     payload.interva = 1
        // }
    }
    
    //-----------------------------------------------------------------------------------------

    prep3MinChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prepDay3MinChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prepDay5MinChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prep5DayChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prep1MonthChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prep3MonthChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prep6MonthChart(){}
    
    //-----------------------------------------------------------------------------------------
    
    prep12MonthChart(){}
}
