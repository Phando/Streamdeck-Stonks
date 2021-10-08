
# Stream Stonks

![Hero Imahge](images/Closed.png)

The `Stonks` plugin is not mispelled. It is intended for diamond handed investors to keep an eye on their Stocks and Crypto. 

It originated from the Elgato Plugin Template more information is available from [Stream Deck](https://developer.elgato.com/documentation/stream-deck/).

`Stonks` requires Stream Deck 4.1 or later.

# Description

`Stonks` is a simple plugin that lets you watch stocks and crypto assets. It shows the symbol, price, volume, market state and daily range. 

### Feedback
If you find bugs or want to see new features please log at ticket in the [github repo](https://github.com/Phando/Streamdeck-Stonks/issues).


## Features:

- Stock Market Lookups
- Crypto Lookups
- Adjustible Polling Interval
- Limit features (high and low)
- Dynamic button press actions
- Cross-platform (macOS, Windows)
- Localization support

You can see a [changelog](Changelog.md) as well.

## Quickstart: Start watching your assets

This short guide will help you get started.

![Labels](images/Layout.png)

### Pre-requisites

- Download or install the plugin

### Set the symbol:

For stocks use the stock symbol. GME, TSLA... 

For crypto you will need the coin symbol and the currency you want to display. ETH-USD, BTC_EUR...

If the plugin runs into any issues or can not find a symbol, you will see a 'Not Found' error state. If the plugin doesn't recover, restart the Streamdeck app.

![Error](images/Error.png)

### Polling Interval:

You can set how often the plugin fetches new data. The value is in seconds and needs to be between 3 and 300. The default value is 60 for once a minute. The API is limited to 2,000 requests per hour or 48,000 per day. Each instance of the plugin adds to that number. Be sure to choose an interval that will not exceed these limits.

To determine the maximum speed for your buttons use this formula

**60 / (33.34 / #buttons)**

If you have 5 buttons assigned to Stonks, the maximum interval you should choose would be 9.

48,000 (per day) / 24 (hours) / 60 (minutes) ~= 33.34

60(seconds) / (33.34 / 5) ~= 9

### Price Limits:

The plugin will change colors if a high or low limit are set. Aditionally, the url where the button links to can be changed if a limit is triggered.

### Button Mode:

You can choose what happens when a button is pressed. It will either refresh the stock value or it can open to a url. Depending on your limits settings, the button can have a different action for normal state, upper limit state and lower limit state.

Imagine a use case where refresh is the normal state, the upper state would open your brokers webpage and a low state would open your webmail.