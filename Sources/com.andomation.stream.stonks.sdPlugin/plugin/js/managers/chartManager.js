const CHART_BASE = 10
const CHART_SCALE = 50
const CHART_WIDTH = 140

const ChartType = Object.freeze({
    // ranges    ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    // intervals [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
    
    // NOTE : The ranges below were chosen to optimize API polling.
    // Unfortunately they make for more complicated rendering.
    CHART_MIN_1     : {range:'1d', interval:'1m', label:'1m', tail:true},
    CHART_MIN_2     : {range:'1d', interval:'2m', label:'2m', tail:true},
    CHART_DAY_1     : {range:'1d', interval:'2m', label:'1d', tail:false},
    CHART_DAY_5     : {range:'5d', interval:'15m', label:'5d', tail:false},
    CHART_MONTH_1   : {range:'3mo', interval:'60m', label:'1M', tail:false},
    CHART_MONTH_3   : {range:'3mo', interval:'60m', label:'3M', tail:false},
    CHART_MONTH_6   : {range:'1y', interval:'1d', label:'6M', tail:false},
    CHART_MONTH_12  : {range:'1y', interval:'1d', label:'1y', tail:false},

});

class ChartManager extends Manager {
    
    constructor() {
        super()
    }

    get chart(){
        return this.context.chartData || {}
    }

    set chart(value){
        this.context.chartData = value
    }

    get type(){
        return this.context.chartType
    }

    set type(value){
        this.context.chartType = value
    }

    get isDay(){
        return  this.type == ChartType.CHART_MIN_1 || 
                this.type == ChartType.CHART_MIN_2 || 
                this.type == ChartType.CHART_DAY_1
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)
        this.type = this.type || ChartType.CHART_MIN_1
    }
    
    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        super.onKeyUp(jsn)
        let viewName = ViewType.keyFor(this.currentView)

        console.log("looking for", this.currentView, viewName)
        for (const [key, value] of Object.entries(ChartType)) {
            if(viewName == key){
                this.type = value
                return
            }
        }
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveData(jsn) {
        super.onDidReceiveData(jsn)
        console.log("ChartManager - onDidReceiveData: ", jsn)
        
        // If the response is other than what is expected, return
        if(jsn.payload.userInfo.label != this.type.label) return

        this.chart = jsn.payload.response[0].meta
        this.chart.raw = jsn.payload.response[0].indicators.quote[0].close.filter(Number) 

        let interval = 1
        let scratch = this.chart.raw
        let tickWidth = this.type.tail ? 3 : 1
        let cells = Math.floor(CHART_WIDTH/tickWidth)
        
        if(this.type.tail)
            scratch = scratch.slice(-cells)
        else
            interval = Math.max(1, scratch.length/CHART_WIDTH)

        this.chart.data = []
        for(var index = 0; index < scratch.length; index += Math.round(interval)){
            for(let t=0; t<tickWidth; t++)
                this.chart.data.push(scratch[index])
        }

        if(this.isDay)
            this.chart.isUp = this.data.close < this.chart.data[this.chart.data.length-1]
        else
            this.chart.isUp = this.chart.data[0] < this.chart.data[this.chart.data.length-1]
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawCharLabel()
        
        if(!this.chart.hasOwnProperty('data') || this.chart.data.length == 0){
            this.drawingCtx.textAlign = "center"
            this.drawingCtx.fillStyle = '#FFFF00'
            this.drawingCtx.fillText('Chart Data', CANVAS_WIDTH/2, 85);
            this.drawingCtx.fillText('Not Found', CANVAS_WIDTH/2, 110);
            return
        }
        
        this.drawChartData()
        
        if(this.isDay == true)
            this.drawCharLine()
    }
    
    //-----------------------------------------------------------------------------------------

    drawCharLabel(){
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(this.type.label, 3, 10);
    }

    //-----------------------------------------------------------------------------------------

    drawCharLine(){
        let min = Math.min(...this.chart.data)
        let max = Math.max(...this.chart.data)
        
        // Line is not in chart range
        if(min > this.chart.previousClose || max < this.chart.previousClose) return

        // The line is based on the raw dataset range
        let scale = Utils.rangeToPercent(this.chart.previousClose, min, max)
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.fillRect(0, 144 - (CHART_BASE + CHART_SCALE * scale), 144, 2);
    }

    //-----------------------------------------------------------------------------------------

    drawChartData(){
        let xPos = 2
        let scale = 0
        let min = Math.min(...this.chart.data)
        let max = Math.max(...this.chart.data)
        let fillColor = this.chart.isUp ? '#007700' : '#770000'
        let tipColor = this.chart.isUp ? '#00FF00' : '#FF0000'
        
        this.chart.data.forEach((item, index) => {
            scale = Utils.rangeToPercent(item, min, max)
            this.drawingCtx.fillStyle = fillColor
            this.drawingCtx.fillRect(xPos, 144, 1, -(CHART_BASE + CHART_SCALE * scale));
            this.drawingCtx.fillStyle = tipColor
            this.drawingCtx.fillRect(xPos, 144-(CHART_BASE + CHART_SCALE * scale), 1, 3);
            xPos++
        });

        // Chart Numeric Range
        // min = Utils.abbreviateNumber(max-min, this.settings.decimals)
        // this.drawingCtx.fillStyle = this.settings.foreground
        // this.drawingCtx.font = 500 + " " + 21 + "px Arial";
        // this.drawingCtx.textAlign = "center"
        // this.drawingCtx.textBaseline = "top"
        // this.drawingCtx.fillText(min, CANVAS_WIDTH/2, 124);   
    }

    //-----------------------------------------------------------------------------------------

    prepSingleChart(){
        let data = this.chart.raw
        let interval = Math.max(1,data.length / CHART_WIDTH)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.chart.data.push(data[index])
        }
    }

    //-----------------------------------------------------------------------------------------

    prepDoubleChart(){
        let data = this.chart.raw
        let interval = data.length / (CHART_WIDTH / 2)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.chart.data.push(data[Math.round(index)])
            this.chart.data.push(data[Math.round(index)])
        }  
    }
    
    //-----------------------------------------------------------------------------------------

    prepSingleChartTail(){
        let data = this.chart.raw
        var start = data.length > CHART_WIDTH ? data.length - CHART_WIDTH : 0
        
        for(var i = start; i < data.length; i++){
            this.chart.data.push(data[i])
        }
    }
    
    //-----------------------------------------------------------------------------------------

    prepDoubleChartTail(){
        let data = this.chart.raw
        var start = data.length > CHART_WIDTH/2 ? data.length - CHART_WIDTH/2 : 0
        
        for(var i = start; i < data.length; i++){
            this.chart.data.push(data[i])
            this.chart.data.push(data[i])
        }  
    }

    //-----------------------------------------------------------------------------------------

    prepPartialChart(divisor){
        let data = this.chart.raw
        let start = Math.max(data.length-140, data.length/divisor)
        
        data = data.slice(start)
        let interval = Math.max(1,data.length / CHART_WIDTH)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.chart.data.push(data[index])
        } 
    }
}
