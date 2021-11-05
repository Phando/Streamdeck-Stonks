const CHART_BASE = 10
const CHART_SCALE = 60
const CHART_WIDTH = 140

const ChartType = Object.freeze({
    // ranges    ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    // intervals [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
    
    // NOTE : The ranges below were chosen to optimize API polling.
    // Unfortunately they make for more complicated rendering.
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
    
    constructor() {
        super()
    }

    get data(){
        return this.context.chartData
    }

    set data(value){
        this.context.chartData = value
    }

    get type(){
        return this.context.chartType
    }

    set type(value){
        this.context.chartType = value
    }

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)
        this.data = this.data || {}
        this.type = this.type || ChartType.CHART_1MIN
    }
    
    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        super.onKeyUp(jsn)
        let viewName = ViewType.keyFor(this.currentView)

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

        var payload = jsn.payload.response[0].meta
        payload.raw = jsn.payload.response[0].indicators.quote[0].close 
        payload.isUp = payload.chartPreviousClose <= payload.regularMarketPrice
        
        this.data = payload
        this.data.chart = []

        switch(this.type){
            case ChartType.CHART_1MIN :
                this.prepDoubleChartTail()
                break
            case ChartType.CHART_3MIN :
                this.prepSingleChartTail()
                break
            case ChartType.CHART_MONTH_1 :
                this.prepPartialChart(3)
            case ChartType.CHART_MONTH_6 :
                this.prepPartialChart(2)
            default :
                this.prepSingleChart()
                break
        }  

        // NOTE : It might be best to just go this route
        // switch(this.type){
        //     case ChartType.CHART_1MIN : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_3MIN : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_DAY_3MIN : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_DAY_5MIN : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_DAY_5 : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_MONTH_1 : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_MONTH_3 : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_MONTH_6 : 
        //         this.prepChart()
        //         break
        //     case ChartType.CHART_MONTH_12 : 
        //         this.prepChart()
        //         break
        // }
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawingCtx.textBaseline = "top" 
        this.drawingCtx.font = 600 + " " + 20 + "px Arial"
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawCharLabel()
        
        if(!this.data.hasOwnProperty('chart') || this.data.chart.length == 0){
            this.drawingCtx.textAlign = "center"
            this.drawingCtx.fillStyle = '#FFFF00'
            this.drawingCtx.fillText('Chart Data', CANVAS_WIDTH/2, 85);
            this.drawingCtx.fillText('Not Found', CANVAS_WIDTH/2, 110);
            return
        }
        
        this.drawChartData()
        
        if(this.type.hasLine == true)
            this.drawCharLine()
    }
    
    //-----------------------------------------------------------------------------------------

    drawCharLabel(){
        this.drawingCtx.textAlign = "left"
        this.drawingCtx.fillText(this.type.label, 3, 10);
    }

    //-----------------------------------------------------------------------------------------

    drawCharLine(){
        let min = Math.min(...this.data.raw)
        let max = Math.max(...this.data.raw)

        // The line is based on the raw dataset range
        let scale = Utils.rangeToPercent(this.data.chartPreviousClose, min, max)
        //let scale = (this.data.chartPreviousClose - min) / (max - min)
        this.drawingCtx.fillStyle = this.settings.foreground
        this.drawingCtx.fillRect(0, 144 - (CHART_BASE + CHART_SCALE * scale), 144, 2);
    }

    //-----------------------------------------------------------------------------------------

    drawChartData(){
        let xPos = 2
        let scale = 0
        let min = Math.min(...this.data.chart)
        let max = Math.max(...this.data.chart)
        let fillColor = this.data.isUp ? '#007700' : '#770000'
        let tipColor = this.data.isUp ? '#00FF00' : '#FF0000'
        
        this.data.chart.forEach((item, index) => {
            scale = Utils.rangeToPercent(item, min, max)
            this.drawingCtx.fillStyle = fillColor
            this.drawingCtx.fillRect(xPos, 144, 1, -(CHART_BASE + CHART_SCALE * scale));
            this.drawingCtx.fillStyle = tipColor
            this.drawingCtx.fillRect(xPos, 144-(CHART_BASE + CHART_SCALE * scale), 1, 3);
            xPos++
        });
    }

    //-----------------------------------------------------------------------------------------

    prepSingleChart(){
        let data = this.data.raw
        let interval = Math.max(1,data.length / CHART_WIDTH)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.data.chart.push(data[index])
        }
    }

    //-----------------------------------------------------------------------------------------

    prepDoubleChart(){
        let data = this.data.raw
        let interval = data.length / (CHART_WIDTH / 2)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.data.chart.push(data[Math.round(index)])
            this.data.chart.push(data[Math.round(index)])
        }  
    }
    
    //-----------------------------------------------------------------------------------------

    prepSingleChartTail(){
        let data = this.data.raw
        var start = data.length > CHART_WIDTH ? data.length - CHART_WIDTH : 0
        
        for(var i = start; i < data.length; i++){
            this.data.chart.push(data[i])
        }
    }
    
    //-----------------------------------------------------------------------------------------

    prepDoubleChartTail(){
        let data = this.data.raw
        var start = data.length > CHART_WIDTH/2 ? data.length - CHART_WIDTH/2 : 0
        
        for(var i = start; i < data.length; i++){
            this.data.chart.push(data[i])
            this.data.chart.push(data[i])
        }  
    }

    //-----------------------------------------------------------------------------------------

    prepPartialChart(divisor){
        let data = this.data.raw
        let start = Math.max(data.length-140, data.length/divisor)
        
        data = data.slice(start)
        let interval = Math.max(1,data.length / CHART_WIDTH)
        
        for(var index = 0; index < data.length; index += Math.round(interval)){
            this.data.chart.push(data[index])
        } 
    }
}
