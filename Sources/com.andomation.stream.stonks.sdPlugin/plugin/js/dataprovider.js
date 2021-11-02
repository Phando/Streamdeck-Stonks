class Dataprovider {
  symbolTimer = null;
  chartURL  = "https://query1.finance.yahoo.com/v7/finance/spark?" //indicators=close&includeTimestamps=false&includePrePost=false
  symbolURL = "https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields="
  symbolFields = [
    'symbol',
    'marketState',
    'preMarketPrice',
    'preMarketVolume',
    'preMarketChangePercent',
    'regularMarketPrice',
    'regularMarketVolume',
    'regularMarketChangePercent',
    'regularMarketPreviousClose',
    'regularMarketOpen',
    'postMarketPrice',
    'postMarketVolume',
    'postMarketChangePercent'
  ]

  constructor(){
  }

  startPolling() {
    console.log('Polling - Start');
    this.fetchSymbolData();
    this.symbolTimer = setInterval(this.fetchSymbolData.bind(this), globalSettings.interval * 1000);
  }

  // Public function to stop polling
  stopPolling() {
    console.log('Polling - Stop');
    clearInterval(this.symbolTimer);
    this.symbolTimer = null;
  }

  fetchSymbolData(){
    var url = this.symbolURL
    url += this.symbolFields.join()
    url += "&symbols="

    Object.values(contextList).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      url += item.settings.symbol + ","
    })
    
    console.log("Data PRovider", url)
    // Double check that we have symbols added to the URL
    if(url.length != this.symbolURL.length) {
      this.requestData(url, 
        (response, event) => this.handleResponse(response, 'didReceiveSymbolData'), 
        (response, event) => this.handleError(response, 'didReceiveSymbolError'))
    }
  }

  fetchChartData(range, interval){
    var url = this.chartURL + "range="+ range +"&interval="+ interval +"&symbols="
    let urlLength = url.length

    Object.values(contextList).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      url += item.settings.symbol + ","
    })
    
    // Double check that we have symbols added to the URL
    if(url.length != urlLength) {
      this.requestData(url, 
        (response, event) => this.handleResponse(response, 'didReceiveChartData'), 
        (response, event) => this.handleError(response, 'didReceiveChartError'))
    }
  }

  handleError(response, event){
    Object.values(contextList).forEach(item => {
      item.payload = error
      $SD.emit(item.action + '.' + event, item)
    })
  }

  handleResponse(response, event){
    var data = {}
    var result = response.hasOwnProperty("spark") ? response.spark.result : response.quoteResponse.result
    
    result.forEach(function(item){
      if(item.symbol == "") return
      item.symbol = item.symbol.toUpperCase()
      data[item.symbol] = item;
    })
    
    Object.values(contextList).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      symbol = symbol.toUpperCase()
      $SD.emit(item.action + '.' + event, {context:item.context, payload:data[symbol]})
    })
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

/*
https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EDJI

https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EDJI&range=1d&interval=5m&indicators=close&includeTimestamps=false&includePrePost=false

daily historical prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=2y&interval=1d&indicators=quote&includeTimestamps=true

weekly historical prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=5y&interval=1wk&indicators=quote&includeTimestamps=true

weekly historical prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=max&interval=1mo&indicators=quote&includeTimestamps=true

1-minute intraday prices:
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1d&interval=1m&indicators=quote&includeTimestamps=true

60-minute intraday prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1mo&interval=60m&indicators=quote&includeTimestamps=true

15-minute intraday prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=5d&interval=15m&indicators=quote&includeTimestamps=true

5-minute intraday prices
https://query1.finance.yahoo.com/v7/finance/chart/GME?range=1d&interval=5m&indicators=quote&includeTimestamps=true

daily losers: 
https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=day_losers&count=5

most active (vol): 
https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=most_actives&count=5

top funds: 
https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=enUS&region=US&scrIds=top_mutual_funds&count=5

top etf: 
https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=top_etfs_us&count=5

top options open interest: 
https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=65f51cea-8dc8-4e56-9f99-6ef7720eb69c&count=5

top options implied volatility: 
https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=671c40b0-5ea8-4063-89b9-9db45bf9edf0&count=5

crypto: 
https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=enUS&region=US&scrIds=all_cryptocurrencies_us&count=5


const fields = ['symbol', 'marketState', 'regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent', 'preMarketPrice', 'preMarketChange', 'preMarketChangePercent', 'postMarketPrice', 'postMarketChange', 'postMarketChangePercent'];
const finalQueryScript = 'https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=symbol,marketState,regularMarketPrice,regularMarketChange,regularMarketChangePercent,preMarketPrice,preMarketChange,preMarketChangePercent,postMarketPrice,postMarketChange,postMarketChangePercent&symbols=';
const nasdaq = require('../DataSets/NASDAQ.json');
regularMarketDayRange,
https://query1.finance.yahoo.com/v7/finance/quote?formatted=true&crumb=PUgrfiU145z&lang=en-US&region=US&symbols=CNNX%2CICON%2CCBK%2CM%2CSUNE&fields=longName%2CshortName%2CregularMarketPrice%2CregularMarketChange%2CregularMarketChangePercent%2CregularMarketVolume%2Cuuid&corsDomain=beta.finance.yahoo.com
https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=
symbol,regularMarketDayRange,regularMarketVolume,marketState,regularMarketPrice,regularMarketChange,preMarketPrice,preMarketChange,postMarketPrice,postMarketChange&symbols=";

*/