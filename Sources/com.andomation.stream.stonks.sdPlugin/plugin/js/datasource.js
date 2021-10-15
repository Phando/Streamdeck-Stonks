const updatePlayPauseActions = (player) => {
  contexts.playPauseAction.forEach((context) => {
    player.playbackState &&
      websocketUtils.setState(context, PlaybackState[player.playbackState]);
  });
};

// const updateToggleMuteActions = (player) => {
//   contexts.toggleMuteAction.forEach((context) => {
//     player.volume &&
//       websocketUtils.setState(
//         context,
//         player.volume.isMuted ? MuteState.muted : MuteState.unmuted
//       );
//   });
// };

// const updateCurrentVolumeActions = (player) => {
//   contexts.currentVolumeAction.forEach((context) => {
//     player.volume &&
//       websocketUtils.setTitle(
//         context,
//         `${Math.ceil(100 + player.volume.value)}`
//       );
//   });
// };

// let currentPlaying = "";

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

class Datasource {
  stopStream(){
    console.log("Stop Stream")
    clearInterval(this.dataTimer)
  }

  startStream(){
    console.log("Start Stream")
    clearInterval(this.dataTimer)
    this.fetchData()
    this.interval = globalSettings.interval * 1000
    this.dataTimer = setInterval(this.fetchData.bind(this), this.interval)
  }

  fetchData() {
    const fetchPromise = fetch(AssetManager.dataUrl + this.settings.symbol);
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
        if (payload.length > 0) return payload[0];
        else {
          throw new Error({error:{messsage:"Symbol not found"}});
        }
      })
      .then( response => this.handleResponse(response))
      .catch( error => {
        console.log(error)
        this.handleError(error)
      });
  }

  handleError(response) {
    console.log('Error', response)
    
    this.drawingCtx.fillStyle = '#1d1e1f'
    this.drawingCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawingCtx.fillStyle =  '#FF0000'
    this.drawingCtx.font = 600 + " " + 28 + "px Arial";
    this.drawingCtx.textAlign = "right"
    this.drawingCtx.textBaseline = "top"
    this.drawingCtx.fillText(this.settings.symbol, 138, 6);
    
    // Render Price
    this.drawingCtx.fillStyle = '#d8d8d8'
    this.setFontFor('Not Found', 400, this.canvas.width - 20)
    this.drawingCtx.textAlign = "right"
    this.drawingCtx.textBaseline = "bottom"
    this.drawingCtx.fillText('Not Found', 140, 70);
    
    //$SD.api.setImage(this.deckCtx, this.canvas.toDataURL());
  }

  handleResponse(response) {
    console.log("Response", response)
    var data = {}

    data.open = true;
    data.symbol = response.symbol;
    data.price = response.regularMarketPrice + 0.0;
    data.volume = this.abbreviateNumber(response.regularMarketVolume);
    data.foreground = this.settings.foreground;
    data.background = this.settings.background;
    this.action = this.settings.action;
    this.actionMode = this.settings.action1mode;

    // Parse Range
    var range = response.regularMarketDayRange.split(" - ");
    data.low = range[0];
    data.high = range[1];

    // Factor after market pricing
    if (response.marketState != "REGULAR") {
        data.open = false;
        data.price = response.postMarketPrice || data.price;
        data.low = data.price < data.low ? data.price : data.low;
        data.high = data.price > data.high ? data.price : data.high;
    }

    // Check upper limit
    if (String(this.settings.upperlimit).length > 0 && data.price >= this.settings.upperlimit) {
        data.foreground = this.settings.upperlimitforeground;
        data.background = this.settings.upperlimitbackground;
        this.action = this.settings.upperlimitaction || this.settings.action;
        this.actionMode = this.settings.upperlimitaction ? this.settings.action2mode : this.settings.action1mode;
    }

    // Check lower limit
    if (String(this.settings.lowerlimit).length > 0 && data.price <= this.settings.lowerlimit) {
        data.foreground = this.settings.lowerlimitforeground;
        data.background = this.settings.lowerlimitbackground;
        this.action = this.settings.lowerlimitaction || this.settings.action;
        this.actionMode = this.settings.lowerlimitaction ? this.settings.action3mode : this.settings.action1mode;
    }

    this.updateDisplay(data); 
  }
}