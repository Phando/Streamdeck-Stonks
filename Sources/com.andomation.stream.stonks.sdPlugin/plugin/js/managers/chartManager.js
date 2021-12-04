const CHART_SCALE = 50
const CHART_BASE = 130
const CHART_WIDTH = 140

const ChartType = Object.freeze({
    // ranges    ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    // intervals [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
    
    // NOTE : The ranges below were chosen to optimize API polling.
    CHART_MIN_30    : {range:'1d',  interval:'1m',  label:'30m', type:'range1'},
    CHART_HR_1      : {range:'1d',  interval:'1m',  label:'1hr', type:'range1'},
    CHART_HR_2      : {range:'1d',  interval:'1m',  label:'2hr', type:'range1'},
    CHART_DAY_1     : {range:'1d',  interval:'2m',  label:'1d',  type:'range2'},
    CHART_DAY_5     : {range:'5d',  interval:'5m',  label:'5d',  type:'range3'},
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

    get fill(){
        return this.settings.fillCharts
    }

    set fill(value){
        this.settings.fillCharts = value
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

    initType(){
        let viewName = ViewType.keyFor(this.currentView.id)
        
        for (const [key, value] of Object.entries(ChartType)) {
            if(viewName == key){
                this.type = value
                return
            }
        }
    }
    
    //-----------------------------------------------------------------------------------------

    dataMatch(jsn) {
        this.uuid = jsn.context
        return !Utils.isUndefined(this.type) && this.type.type == jsn.payload.userInfo.type
    }

    //-----------------------------------------------------------------------------------------

    onDidReceiveSettings(jsn) {
        super.onDidReceiveSettings(jsn)
        this.fill = this.fill || 'enabled'
        this.initType()
    } 

    //-----------------------------------------------------------------------------------------

    onKeyUp(jsn) {
        super.onKeyUp(jsn)
        this.initType()
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

        for(var index = 0; index < scratch.length; index += interval){
            for(let t=0; t<tickWidth; t++){
                if(Math.round(index) < scratch.length)
                    this.chart.data.push(scratch[Math.round(index)])
            }
        }
        
        let rangeSource = this.chart.data
        this.chart.min = Math.min(...rangeSource)
        this.chart.max = Math.max(...rangeSource)

        if(this.isDay)
            this.chart.isUp = this.data.close < this.chart.data[this.chart.data.length-1]
        else
            this.chart.isUp = this.chart.data[0] < this.chart.data[this.chart.data.length-1]    

        if(this.chart.data.length == 141){
            console.log("Chart Data", this.chart.data)
        }
    }

    //-----------------------------------------------------------------------------------------

    updateDisplay(jsn){
        super.updateDisplay(jsn)
        this.drawLeft(this.type.label,COLOR_FOREGROUND, 16, 21, 600, 6)
        
        if(!this.chart.hasOwnProperty('data') || this.chart.data.length == 0){
            this.drawingCtx.textAlign = "center"
            this.drawingCtx.fillStyle = COLOR_DIM
            this.drawingCtx.fillText('Loading', CANVAS_WIDTH/2, 110);
            return
        }
        
        this.drawChartData()
        
        if(this.isDay == true)
            this.drawCharLine()
    }

    //-----------------------------------------------------------------------------------------

    drawCharLine(){
        let scale = Utils.rangeToPercent(this.data.prevClose, this.chart.min, this.chart.max)
        
        // Hiding the line if it is too high
        if(scale > 1.1) return
        
        this.drawingCtx.lineWidth = 2
        this.drawingCtx.strokeStyle = COLOR_FOREGROUND
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(0, CHART_BASE - (CHART_SCALE * scale))
        this.drawingCtx.lineTo(CHART_WIDTH, CHART_BASE - (CHART_SCALE * scale))
        this.drawingCtx.stroke()
    }

    //-----------------------------------------------------------------------------------------

    drawChartData(){
        let xPos = 2
        let yMax = 0
        let scale = Utils.rangeToPercent(this.chart.data[0], this.chart.min, this.chart.max)

        this.drawingCtx.lineWidth = 2
        this.drawingCtx.strokeStyle = this.chart.isUp ? COLOR_GREEN : COLOR_RED // '#A32CC4'
        this.drawingCtx.beginPath()
        this.drawingCtx.moveTo(-2,146)
        this.drawingCtx.lineTo(-2,CHART_BASE - (CHART_SCALE * scale))
        
        this.chart.data.forEach((item, index) => {
            scale = Utils.rangeToPercent(item, this.chart.min, this.chart.max)
            this.drawingCtx.lineTo(xPos,CHART_BASE - (CHART_SCALE * scale))
            xPos++
            yMax = Math.max(yMax, CHART_SCALE * scale)
        });

        // Close the path
        this.drawingCtx.lineTo(146,CHART_BASE - (CHART_SCALE * scale))
        this.drawingCtx.lineTo(146,146)
        this.drawingCtx.closePath()
        
        if(this.fill == 'enabled'){
            var grd = this.drawingCtx.createLinearGradient(0, CHART_BASE - yMax, 0, 144);
            grd.addColorStop(0.2, this.chart.isUp ? COLOR_GREEN_CL : COLOR_RED_CL);
            grd.addColorStop(0.9, COLOR_BACKGROUND);
            this.drawingCtx.fillStyle = grd;
            this.drawingCtx.fill()
        } 

        this.drawingCtx.stroke()
    }
    
}
