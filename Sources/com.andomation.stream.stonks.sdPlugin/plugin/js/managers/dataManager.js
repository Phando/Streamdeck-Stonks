class DataManager {
  chartInc = 0;
  crumb = null;
  batchTimer = null;
  chartTimer = null;
  dataTimer = null;
  // chartURL  = "https://query1.finance.yahoo.com/v6/finance/spark?includePrePost=true&" //indicators=close&includeTimestamps=false&includePrePost=false
  // symbolURL = "https://query1.finance.yahoo.com/v6/finance/quote?lang=en-US&corsDomain=finance.yahoo.com&fields="
  chartURL = "https://query1.finance.yahoo.com/v8/finance/chart"
  symbolURL = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
  symbolFields = "modules=price&formatted=false"; //summaryDetail
  // symbolFields = [
  //   'symbol',
  //   'currency',
  //   //'shortName',
  //   //'longName',
  //   //'priceHint',
  //   //'quantity',
  //   //'sparkline',
  //   //'marketCap',
  //   //'fiftyTwoWeekHigh',
  //   //'fiftyTwoWeekLow',
  //   'marketState',
  //   'preMarketPrice',
  //   'preMarketVolume',
  //   'preMarketChange',
  //   'preMarketChangePercent',
  //   'regularMarketDayHigh',
  //   'regularMarketDayLow',
  //   'regularMarketPrice',
  //   'regularMarketVolume',
  //   'regularMarketChange',
  //   'regularMarketChangePercent',
  //   'regularMarketOpen',
  //   'regularMarketPreviousClose',
  //   'regularMarketOpen',
  //   'postMarketPrice',
  //   'postMarketVolume',
  //   'postMarketChange',
  //   'postMarketChangePercent',
  // ]

  //-----------------------------------------------------------------------------------------

  headers = new Headers({
    "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language" : "en-US,en;q=0.5",
    "Accept-Encoding" : "gzip, deflate, br",
    "Connection" : "keep-alive",
    "Upgrade-Insecure-Requests" : "1",
    "Sec-Fetch-Dest" : "document",
    "Sec-Fetch-Mode" :  "navigate",
    "Sec-Fetch-Site" : "none",
    "Sec-Fetch-User" : "?1",
    "DNT" : "1",
  });

  //-----------------------------------------------------------------------------------------

  requestOptions = {
    method: 'GET', // or 'POST', 'PUT', 'DELETE', etc.
    headers: this.headers
  };
  
  //-----------------------------------------------------------------------------------------

  constructor(){
    // this.generateCrumb();
  }

  // ----------------------------------------------------------------------------------------

  // generateCrumb(){    
  //   this.crumb = ''
  //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   const charactersLength = characters.length;
  
  //   for (let i = 0; i < 11; i++) {
  //     this.crumb += characters.charAt(Math.floor(Math.random() * charactersLength));
  //   }
  // }

  //-----------------------------------------------------------------------------------------

  // async getSession(){
  //   let crumbURL = 'https://query1.finance.yahoo.com/v1/test/getcrumb';
    
  //   const fetchPromise = fetch(crumbURL, this.requestOptions);
  //   const data = await fetchPromise
  //     .then(response => response.text())
  //     .then(data => {
  //       // console.log("GetCrumb", data);
  //       const match = data.match(/"crumb":"(.*?)"/);
  //       const crumb = match ? match[1] : null;
  //       console.log(crumb);
  //       return crumb;
  //     })
  //     .catch(error => {
  //       console.error('Error:', error);
  //     });
  //   return data;
  // }

  //-----------------------------------------------------------------------------------------

  get symbols(){
    let symbols = []
    Object.values(contextList).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      if(symbols.includes(symbol)) return
      symbols.push(symbol)
    })

    return symbols
  }

  //-----------------------------------------------------------------------------------------

  get symbolString(){
    return '&symbols=' + this.symbols.join()
  }

  //-----------------------------------------------------------------------------------------

  partialSymbolString(i, count){
    return '&symbols=' + this.symbols.slice(i * count, (i + 1) * count).join()
  }
  
  //-----------------------------------------------------------------------------------------

  async startPolling() {
    console.log('Polling - Start')
    this.fetchData();
    this.dataTimer = setInterval(this.fetchData.bind(this), globalSettings.interval * 1000)
  }

  //-----------------------------------------------------------------------------------------
  
  stopPolling() {
    console.log('Polling - Stop')
    clearInterval(this.dataTimer)
    this.dataTimer = null
  }

  //-----------------------------------------------------------------------------------------

  scheduleData() {
    if(this.batchTimer != null)
      return

    this.batchTimer = setTimeout(this.fetchData.bind(this), 1000)
  }

  //-----------------------------------------------------------------------------------------

  async fetchData(){
    // TODO : Check for crumb here and do the refresh
    // if(this.crumb == ''){
    //   this.crumb = await this.getSession();
    // }

    if(this.batchTimer != null){
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }

    await this.fetchSymbolData()
    
    if(this.chartInc == 0)
      setTimeout(this.fetchChartData.bind(this),10)
    
    this.chartInc = this.chartInc == 4 ? 0 : this.chartInc + 1
  }

  //-----------------------------------------------------------------------------------------

  async fetchSymbolData(){
    if(this.symbols.length == 0) return 
    
    const urls = this.symbols.map(value => `${this.symbolURL}/${value}?${this.symbolFields}`);  
    // console.log(urls);  
    const requests = urls.map(url => fetch(url));
    // console.log(requests)
    Promise.all(requests)
    .then(responseArray => Promise.allSettled(responseArray.map(response => response.json())))
    .then(dataArray => {
      let errorArray = [];
      dataArray.forEach((result, index) => {
        if(result.value.quoteSummary.error == null){
          let data = result.value.quoteSummary.result[0].price;
          this.handleResponse([data], 'didReceiveSymbolData')
        } else {
          const text = result.value.quoteSummary.error.description;
          const lastSpacePosition = text.lastIndexOf(" ");
          result.value.quoteSummary.symbol = text.substring(lastSpacePosition + 1);
          console.log(result.value.quoteSummary)
          errorArray.push(result.value.quoteSummary)
        }
      });
      return errorArray;
    })
    .then(errorArray => {
      for (const item of errorArray) {
        this.handleError(item, 'didReceiveSymbolError')
      }
    })
    // Promise.allSettled(requests)
    // .then(results => {
    //   // Loop through each result
    //   results.forEach((result, index) => {
    //     //console.log(result.value);
    //     if (result.value.status != '200') {
    //       console.log(result.value);
    //       // result.value.json().then(dataArray => {
    //       //   console.log(dataArray);
    //       //   // let data = dataArray.map(item => item.quoteSummary.result[0].price);
    //       //   // this.handleResponse(data, 'didReceiveSymbolData')
    //       // });
    //     } else {
    //       this.handleError("Symbol Not Found", 'didReceiveSymbolError')
    //     }
    //   });
    // })
    // .then(responseArray => Promise.all(responseArray.map(response => response.json())))
    // .then(dataArray => {
    //   let data = dataArray.map(item => item.quoteSummary.result[0].price);
    //   this.handleResponse(data, 'didReceiveSymbolData')
    // })
    // .catch(error => {
    //   this.handleError(error, 'didReceiveSymbolError')
    // });

    
  }

  //-----------------------------------------------------------------------------------------

  async fetchChartData(){
    const types = {}
    const urls = [];
    if(this.symbols.length == 0) return 

    Object.values(contextList).forEach(item => {
      let chart = Utils.getProp(item, "chartType", false);
      
      if(!chart) return
      urls.push(`${this.chartURL}/${item.settings.symbol}?range=${chart.range}&interval=${chart.interval}`)
    }) 

    const requests = urls.map(url => fetch(url));
    
    Promise.all(requests)
    .then(responseArray => Promise.all(responseArray.map(response => response.json())))
    .then(dataArray => {
      let data = dataArray.map(item => {
        let data1 = {
          symbol:item.chart.result[0].meta.symbol,
          range:item.chart.result[0].meta.range,
          interval:item.chart.result[0].meta.dataGranularity,
          chart:item.chart.result[0].indicators.quote[0].close
        }
        console.log(data1);
        return data1;
      })
      console.log("Okay",data)
      this.handleResponse(data, 'didReceiveChartData')
    })
    .catch(error => {
      console.log("ERRor",error)
      this.handleError(error, 'didReceiveChartError')
    });
  }

  //-----------------------------------------------------------------------------------------

  handleError(response, event){
    Object.values(contextList).forEach(item => {
      if(item.settings.symbol == response.symbol){
        item.payload = event
        $SD.emit(item.action + '.' + event, item) 
      }
      // console.log(item.settings.symbol)
      // console.log(response);
      // item.payload = event
      // $SD.emit(item.action + '.' + event, item)
    })
  }

  //-----------------------------------------------------------------------------------------

  handleResponse(response, event){
    console.log("handleResponse:", response);

    let data = response.reduce((acc, item) => {
        console.log(item);
        acc[item.symbol] = item;
        return acc;
    }, {});

    // response.forEach(function(item){
    //   if(item.symbol == "") return
    //   item.symbol = item.symbol.toUpperCase()
    //   // item.userInfo = response.userInfo
    //   data[item.symbol] = item
    // })
    
    Object.values(contextList).forEach(item => {
      let symbol = Utils.getProp(item, "settings.symbol", false);
      
      if(!symbol) return
      symbol = symbol.toUpperCase()
      if (symbol in data){
        $SD.emit(item.action + '.' + event, {context:item.context, payload:data[symbol]})
      }
    })
  }

  //-----------------------------------------------------------------------------------------

  requestData(url, callback, errorCallback, userInfo={}) {
    const fetchPromise = fetch(url, this.requestOptions);
    fetchPromise
      .then( response => {
        console.log(response)
        if (response.ok) {
          return response.json();
        } else {
          throw new Error({error:{message:"Request Error"}});
        }
      })
      .then( json => {
        console.log("requestData (response)", json)
        if (Object.keys(json).length > 0){ 
          json.userInfo = userInfo
          return json
        }
        else {
          throw new Error({error:{messsage:"Data not found"}});
        }
      })
      .then( response => callback(response))
      .catch( error => {
        errorCallback(error)
      });
  }
}

/*
https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EDJI

https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EDJI&range=1d&interval=5m&
indicators=close&
includeTimestamps=false&
includePrePost=true

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
*/

// https://query1.finance.yahoo.com/v1/finance/search?q=dax&quotesCount=6&newsCount=0&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&enableCb=true

// https://query1.finance.yahoo.com/v7/finance/quote?symbols=UNP&fields=ebitda,shortRatio,priceToSales
// https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=symbol,longName,shortName,priceHint,regularMarketPrice,regularMarketChange,regularMarketChangePercent,currency,regularMarketTime,regularMarketVolume,quantity,averageDailyVolume3Month,regularMarketDayHigh,regularMarketDayLow,regularMarketPrice,regularMarketOpen,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketPrice,regularMarketOpen,sparkline,marketCap&symbols=000001.SS,600600.SS
// https://query1.finance.yahoo.com/v7/finance/quote?formatted=true&crumb=KRXGDVywE2G&lang=de-DE&region=DE&symbols=FRE.DE%2CFME.DE%2CALV.DE%2CBMW.DE%2CWDI.DE%2CBEI.DE%2CLIN.DE%2CHEI.DE%2CBAYN.DE%2CDBK.DE%2CLHA.DE%2CADS.DE%2C1COV.DE%2CVOW3.DE%2CDTE.DE%2CTKA.DE%2CRWE.DE%2CDPW.DE%2CDB1.DE%2CCON.DE%2CIFX.DE%2CBAS.DE%2CMRK.DE%2CSIE.DE%2CEOAN.DE%2CVNA.DE%2CHEN3.DE%2CMUV2.DE%2CSAP.DE%2CDAI.DE&fields=messageBoardId%2ClongName%2CshortName%2CmarketCap%2CunderlyingSymbol%2CunderlyingExchangeSymbol%2CheadSymbolAsString%2CregularMarketPrice%2CregularMarketChange%2CregularMarketChangePercent%2CregularMarketVolume%2Cuuid%2CregularMarketOpen%2CfiftyTwoWeekLow%2CfiftyTwoWeekHigh&corsDomain=de.finance.yahoo.com
// https://query1.finance.yahoo.com/v7/finance/quote?formatted=true&crumb=PUgrfiU145z&lang=en-US&region=US&symbols=CNNX%2CICON%2CCBK%2CM%2CSUNE&fields=longName%2CshortName%2CregularMarketPrice%2CregularMarketChange%2CregularMarketChangePercent%2CregularMarketVolume%2Cuuid&corsDomain=beta.finance.yahoo.com
// https://query1.finance.yahoo.com/v7/finance/quote?lang=en-US&region=US&corsDomain=finance.yahoo.com&fields=

// https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=assetProfile%2CearningsHistory
// https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=defaultKeyStatistics
// https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=financialData
// https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=assetProfile
// https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=assetProfile%2CearningsHistory

// Charts
// https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=2m
// https://query1.finance.yahoo.com/v8/finance/chart/AAPL?symbol=AAPL&period1=0&period2=9999999999&interval=1d&includePrePost=true&events=div%2Csplit
// https://query1.finance.yahoo.com/v8/finance/chart/AAPL?symbol=AAPL&period1=0&period2=9999999999&interval=1d&includePrePost=true&events=div%2Csplit

// Version 2
// https://query2.finance.yahoo.com/v10/finance/quoteSummary/aapl?modules=summaryDetail