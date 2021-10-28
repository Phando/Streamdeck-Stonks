
// const updatePlayPauseActions = (player) => {
//   contexts.playPauseAction.forEach((context) => {
//     player.playbackState &&
//       websocketUtils.setState(context, PlaybackState[player.playbackState]);
//   });
// };

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

// const fields = ['symbol', 'marketState', 'regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'preMarketPrice', 'preMarketChange', 'preMarketChangePercent', 'postMarketPrice', 'postMarketChange', 'postMarketChangePercent'];
// const finalQueryScript = 'https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=symbol,marketState,regularMarketPrice,regularMarketChange,regularMarketChangePercent,preMarketPrice,preMarketChange,preMarketChangePercent,postMarketPrice,postMarketChange,postMarketChangePercent&symbols=';
// const nasdaq = require('../DataSets/NASDAQ.json');

class Dataprovider {
  symbolURL = "https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=regularMarketChangePercent,symbol,regularMarketDayRange,regularMarketVolume,regularMarketPrice,marketState,preMarketPrice,postMarketPrice&symbols=";
    
  charts = {};
  refreshTimer = null;
  
  constructor(){
  }

  dataForChart(symbol){
    return this.charts[symbol]
  }

  startPolling() {
    console.log('Polling - Start');
    this.fetchSymbolData();
    this.refreshTimer = setInterval(this.fetchSymbolData.bind(this), globalSettings.interval * 1000);
  }

  // Public function to stop polling
  stopPolling() {
    console.log('Polling - Stop');
    clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  }

  fetchSymbolData(){
    var url = this.symbolURL

    Object.values(contexts).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      url += "," + item.settings.symbol
    })
    
    // Double check that we have symbols added to the URL
    if(url.length != this.symbolURL.length) {
      this.requestData(url, this.handleSymbolResponse.bind(this), this.handleSymbolError.bind(this))
    }
  }

  handleSymbolError(error){
    // Dispatch the error
    Object.values(contexts).forEach(item => {
      item.payload = error
      $SD.emit(item.action + '.didReceiveSymbolError', item)
    })
  }

  handleSymbolResponse(response){
    var symbols = {}
    
    response.quoteResponse.result.forEach(function(item){
      symbols[item.symbol] = item;
    })
    
    Object.values(contexts).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      $SD.emit(item.action + '.didReceiveSymbolData', {context:item.context, payload:symbols[symbol]})
    })
  }

  fetchChartData(){
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

  handleChartResponse(response){
    console.log('handleChartData', response)
  }

  handleChartResponse(response){
    console.log('handleChartData', response)
  }

  requestData(url, callback, errorCallback) {
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
        console.log("requestData (response)", json)
        if (Object.keys(json).length > 0) return json;
        else {
          throw new Error({error:{messsage:"Data not found"}});
        }
      })
      .then( response => callback(response))
      .catch( error => {
        console.log(error)
        errorCallback(error)
      });
  }
}