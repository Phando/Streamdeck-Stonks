const CHART_BASE = 10
const CHART_SCALE = 50
const CHART_WIDTH = 140

const ChartType = Object.freeze({
    // ranges    ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    // intervals [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
    
    // NOTE : The ranges below were chosen to optimize API polling.
    // Unfortunately they make for more complicated rendering.
    CHART_MIN_30    : {range:'1d',  interval:'1m',  label:'30m', type:'range1'},
    CHART_HR_1      : {range:'1d',  interval:'1m',  label:'1hr', type:'range1'},
    CHART_HR_2      : {range:'1d',  interval:'1m',  label:'2hr', type:'range1'},
    CHART_DAY_1     : {range:'1d',  interval:'2m',  label:'1d',  type:'range2'},
    CHART_DAY_5     : {range:'5d',  interval:'15m', label:'5d',  type:'range3'},
    CHART_MONTH_1   : {range:'3mo', interval:'60m', label:'1M',  type:'range4'},
    CHART_MONTH_3   : {range:'3mo', interval:'60m', label:'3M',  type:'range4'},
    CHART_MONTH_6   : {range:'1y',  interval:'1d',  label:'6M',  type:'range5'},
    CHART_MONTH_12  : {range:'1y',  interval:'1d',  label:'1y',  type:'range5'},
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
        return this.type.range == '1d'
    }

    get isTail(){
        return this.type.type == 'range1'
    }
    
    //-----------------------------------------------------------------------------------------

    dataMatch(jsn) {
        this.uuid = jsn.context
        return !Utils.isUndefined(this.type) && this.type.type == jsn.payload.userInfo.type
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
        
        this.chart = Object.assign({}, jsn.payload.response[0].meta)
        this.chart.raw = jsn.payload.response[0].indicators.quote[0].close.filter(Number)
        
        let slice = 0
        let interval = 1
        let scratch = this.chart.raw
        let tickWidth = 1
        
        switch(this.type){
            case ChartType.CHART_MIN_30 :
                tickWidth = 4
                slice = Math.floor(CHART_WIDTH/tickWidth)
                break
            case ChartType.CHART_HR_1 :
                tickWidth = 2
                slice = Math.floor(CHART_WIDTH/tickWidth)
                break
            case ChartType.CHART_HR_2 :
                slice = Math.max(140,scratch.length)
                break
            case ChartType.CHART_MONTH_1 :
                slice = Math.max(140,scratch.length/3)
                break
            case ChartType.CHART_MONTH_6 :
                slice = Math.max(140,scratch.length/2)
                break
        }

        scratch = scratch.slice(-slice)
        if(!this.type.tail)
            interval = Math.max(1, scratch.length/CHART_WIDTH)

        this.chart.data = []
        for(var index = 0; index < scratch.length; index += Math.round(interval)){
            for(let t=0; t<tickWidth; t++)
                this.chart.data.push(scratch[index])
        }
        
        let rangeSource = this.chart.data //this.showRaw ? this.chart.raw : this.chart.data
        this.chart.min = Math.min(...rangeSource)
        this.chart.max = Math.max(...rangeSource)

        if(this.isDay)
            this.chart.isUp = this.data.close < this.chart.data[this.chart.data.length-1]
        else
            this.chart.isUp = this.chart.data[0] < this.chart.data[this.chart.data.length-1]    
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawLeft(this.type.label,COLOR_FOREGROUND, 16, 21, 600, 6)
        
        if(!this.chart.hasOwnProperty('data') || this.chart.data.length == 0){
            this.drawingCtx.textAlign = "center"
            this.drawingCtx.fillStyle = COLOR_ERROR
            this.drawingCtx.fillText('Chart Data', CANVAS_WIDTH/2, 85);
            this.drawingCtx.fillText('Not Found', CANVAS_WIDTH/2, 110);
            return
        }
        
        this.drawChartData()
        
        if(this.isDay == true)
            this.drawCharLine()
    }

    //-----------------------------------------------------------------------------------------

    drawCharLine(){
        let scale = Utils.rangeToPercent(this.data.prevClose, this.chart.min, this.chart.max)
        this.drawingCtx.fillStyle = COLOR_FOREGROUND
        this.drawingCtx.fillRect(0, 144 - (CHART_BASE + CHART_SCALE * scale), 144, 2);
    }

    //-----------------------------------------------------------------------------------------

    drawChartData(){
        let xPos = 2
        let scale = 0
        let fillColor = this.chart.isUp ? COLOR_GREEN_CL : COLOR_RED_CL
        let tipColor = this.chart.isUp ? COLOR_GREEN : COLOR_RED

        this.chart.data.forEach((item, index) => {
            scale = Utils.rangeToPercent(item, this.chart.min, this.chart.max)
            this.drawingCtx.fillStyle = fillColor
            this.drawingCtx.fillRect(xPos, 144, 1, -(CHART_BASE + CHART_SCALE * scale));
            this.drawingCtx.fillStyle = tipColor
            this.drawingCtx.fillRect(xPos, 144-(CHART_BASE + CHART_SCALE * scale), 1, 3);
            xPos++
        });

        if(this.shouldZoom){
        }
    }

}
