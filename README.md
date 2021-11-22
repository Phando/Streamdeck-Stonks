
# Stonks

![Hero Imahge](./images/Closed.png)

*Stonks* is not mispelled. This plugin is intended for diamond handed investors to keep an eye on their investments. It is a simple plugin that lets you watch stocks and crypto. It shows the symbol, price, volume, market state, daily ranges, and more... 

If you find bugs or want to see new features please log at ticket in the [github repo](https://github.com/Phando/Streamdeck-Stonks/issues).

## Features:

- Stock Lookups
- Crypto Lookups
- Charting
- Limit notifications
- On device limit adjustments
- Multiple layouts
- Cross-platform (macOS, Windows)

Alternate locales and currencies will be supported in a future release.

Check the [changelog](Changelog.md) for the latest updates.

## Quickstart

This short guide will help you get started.

![Labels](images/Layout.png)

### Set the symbol:

**Stocks** use the stock symbol. AMC, GME, TSLA... 
**Crypto** uses the symbol and currency.  BTC-EUR, ETH-USD, SHIB-USD...

If the plugin runs into any issues or can not find a symbol, you will see a 'Not Found' error state. If the plugin doesn't recover, restart the Streamdeck app.

![Error](images/Error.png)

## Layout



## Settings Details

Symbol
Decimals
Show Trend
Footer

### Footer:
NONE        : 'none',
CHANGE      : 'change',
METER       : 'meter',
SLIDER1     : 'slider1',
SLIDER2     : 'slider2',
RANGE       : 'range',
RANGE_PERC  : 'rangePerc',
RANGE_PLUS  : 'rangePlus',
RANGE_PLUS_PERC : 'rangePlusPerc'

### Alternate Views:

TICKER          : 'defaultView',
DAY_DEC         : 'showDayDecimal',
DAY_PERC        : 'showDayPercent',
LIMITS          : 'showLimits',
CHART_MIN_30    : 'show30MinChart',
CHART_HR_1      : 'show1HourChart',
CHART_HR_2      : 'show2HourChart',
CHART_DAY_1     : 'show1DayChart',
CHART_DAY_5     : 'show5DayChart',
CHART_MONTH_1   : 'show1MonthChart',
CHART_MONTH_3   : 'show3MonthChart',
CHART_MONTH_6   : 'show6MonthChart',
CHART_MONTH_12  : 'show12MonthChart',
    
### Limits:

#### Adjusting

## Technical Details



You can set how often the plugin fetches new data. The value is in seconds and needs to be between 3 and 300. The default value is 60 for once a minute. The API is limited to 2,000 requests per hour or 48,000 per day. Each instance of the plugin adds to that number. Be sure to choose an interval that will not exceed these limits.

To determine the maximum speed for your interval use this formula

**60 / (33.34 / #buttons)**

If you have 5 buttons assigned to Stonks, the maximum interval you should choose would be 9.

48,000 (per day) / 24 (hours) / 60 (minutes) ~= 33.34

60(seconds) / (33.34 / 5) ~= 9

### Price Limits:

The plugin will change colors if a high or low limit are set. Aditionally, the url where the button links to can be changed if a limit is triggered.

### Button Mode:

You can choose what happens when a button is pressed. It will either refresh the stock value or it can open to a url. Depending on your limits settings, the button can have a different action for normal state, upper limit state and lower limit state.

Imagine a use case where refresh is the normal state, the upper state would open your brokers webpage and a low state would open your webmail.

###Requirements

Stream Deck 4.1 or later.