
const updatePlayPauseActions = (player) => {
  contexts.playPauseAction.forEach((context) => {
    player.playbackState &&
      websocketUtils.setState(context, PlaybackState[player.playbackState]);
  });
};

// const updateCurrentPlaying = (player) => {
//   contexts.nowPlayingAction.forEach((context) => {
//     if (player.playbackState === "stopped") {
//       intervals[context] && clearInterval(intervals[context]);
//       websocketUtils.setTitle(context, "Stopped");
//       return;
//     }
//     if (player.activeItem.columns[0] !== currentPlaying) {
//       intervals[context] && clearInterval(intervals[context]);
//       player.activeItem.columns.length > 0 &&
//         websocketUtils.setAsyncTitle(
//           player.activeItem.columns[0].replace("-", " - "),
//           300,
//           context
//         );
//       currentPlaying = player.activeItem.columns[0];
//     }
//   });
// };

class Dataprovider {
  symbolURL = "https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=history,symbol,regularMarketDayRange,regularMarketVolume,regularMarketPrice,marketState,preMarketPrice,postMarketPrice&symbols=";
    
  charts = {};
  symbols = {"AMC":{}, "GME":{} };
  interval = 60;
  refreshTimer = null;
  
  constructor(){
    this.startPolling()
  }

  startPolling() {
    console.log('Polling - Start');
    this.fetchData();
    this.refreshTimer = setInterval(this.fetchData.bind(this), this.interval * 1000);
  }

  // Public function to stop polling
  stopPolling() {
    console.log('Polling - Stop');
    clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  }

  fetchData(){
    console.log('Fetch Data')
    
    if(Object.keys(this.symbols).length > 0){
      this.requestData(this.symbolURL + Object.keys(this.symbols).join(), this.handleSymbolResponse.bind(this))
    }

    if(Object.keys(this.charts).length > 0){
      this.fetchCharts()
    }
  }

  
  fetchCharts(){
    console.log('Fetch Charts')
    ranges = ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]
    
    // daily historical prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=2y&interval=1d&indicators=quote&includeTimestamps=true

    // weekly historical prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=5y&interval=1wk&indicators=quote&includeTimestamps=true
    
    // weekly historical prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=max&interval=1mo&indicators=quote&includeTimestamps=true
    
    // 1-minute intraday prices:
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1d&interval=1m&indicators=quote&includeTimestamps=true
    
    // 60-minute intraday prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1mo&interval=60m&indicators=quote&includeTimestamps=true
    
    // 15-minute intraday prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=5d&interval=15m&indicators=quote&includeTimestamps=true
    
    // 5-minute intraday prices
    // https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1d&interval=5m&indicators=quote&includeTimestamps=true
  }

  handleSymbolResponse(response){
    //console.log("SymbolResponse", response)
    
    response.quoteResponse.result.forEach(function(item){
      this.symbols[item.symbol] = item
    }.bind(this))
    
    console.log(this.symbols)
  }

  handleChartResponse(response){
    console.log('handleChartData', response)
  }

  requestData(url, callback) {
    const fetchPromise = fetch(url);
    fetchPromise
      .then( response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error({error:{message:"Request Error"}});
        }
      })
      .then( json => {
        console.log("RequestData (response)", json)
        if (Object.keys(json).length > 0) return json;
        else {
          throw new Error({error:{messsage:"Data not found"}});
        }
      })
      .then( response => callback(response))
      .catch( error => {
        console.log(error)
        this.handleError(error)
      });
  }

  fetchSymbols(){
    console.log('Fetch Symbols', Object.keys(this.symbols).join() )
    this.requestData('https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1d&interval=1m&interval=1d&indicators=quote&includeTimestamps=true', this.handleChartResponse)
    return
    let url = this.symbolURL + Object.keys(this.symbols).join()
    console.log(url)
    const fetchPromise = fetch(url);
    fetchPromise
      .then( response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error({error:{message:"Request Error"}});
        }
      })
      .then( json => {
        var payload = json.quoteResponse.result;
        if (payload.length > 0) return payload;
        else {
          throw new Error({error:{messsage:"Symbol not found"}});
        }
      })
      .then( response => this.handleSymbolResponse(response))
      .catch( error => {
        console.log(error)
        this.handleError(error)
      });
  }

  
  //fetchData(url, )
  // handleError(response) {
  //   console.log('Error', response)
    
  //   this.drawingCtx.fillStyle = '#1d1e1f'
  //   this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  //   this.drawingCtx.fillStyle =  '#FF0000'
  //   this.drawingCtx.font = 600 + " " + 28 + "px Arial";
  //   this.drawingCtx.textAlign = "right"
  //   this.drawingCtx.textBaseline = "top"
  //   this.drawingCtx.fillText(this.settings.symbol, 138, 6);
    
  //   // Render Price
  //   this.drawingCtx.fillStyle = '#d8d8d8'
  //   this.setFontFor('Not Found', 400, this.canvas.width - 20)
  //   this.drawingCtx.textAlign = "right"
  //   this.drawingCtx.textBaseline = "bottom"
  //   this.drawingCtx.fillText('Not Found', 140, 70);
    
  //   //$SD.api.setImage(this.deckCtx, this.canvas.toDataURL());
  // }
  
  // handleResponse(response) {
  //   console.log("Response", response)
  //   var data = {}

  //   data.open = true;
  //   data.symbol = response.symbol;
  //   data.price = response.regularMarketPrice + 0.0;
  //   data.volume = this.abbreviateNumber(response.regularMarketVolume);
  //   data.foreground = this.settings.foreground;
  //   data.background = this.settings.background;
  //   this.action = this.settings.action;
  //   this.actionMode = this.settings.action1mode;

  //   // Parse Range
  //   var range = response.regularMarketDayRange.split(" - ");
  //   data.low = range[0];
  //   data.high = range[1];

  //   // Factor after market pricing
  //   if (response.marketState != "REGULAR") {
  //       data.open = false;
  //       data.price = response.postMarketPrice || data.price;
  //       data.low = data.price < data.low ? data.price : data.low;
  //       data.high = data.price > data.high ? data.price : data.high;
  //   }

  //   // Check upper limit
  //   if (String(this.settings.upperlimit).length > 0 && data.price >= this.settings.upperlimit) {
  //       data.foreground = this.settings.upperlimitforeground;
  //       data.background = this.settings.upperlimitbackground;
  //       this.action = this.settings.upperlimitaction || this.settings.action;
  //       this.actionMode = this.settings.upperlimitaction ? this.settings.action2mode : this.settings.action1mode;
  //   }

  //   // Check lower limit
  //   if (String(this.settings.lowerlimit).length > 0 && data.price <= this.settings.lowerlimit) {
  //       data.foreground = this.settings.lowerlimitforeground;
  //       data.background = this.settings.lowerlimitbackground;
  //       this.action = this.settings.lowerlimitaction || this.settings.action;
  //       this.actionMode = this.settings.lowerlimitaction ? this.settings.action3mode : this.settings.action1mode;
  //   }

  //   this.updateDisplay(data); 
  // }
}