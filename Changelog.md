# Changelog

## v1.1.6 (9/7/2022) -----

#### Enhancements:
- Removed automatic ticker truncation
- Added custom ticker labels

#### Bug Fixes:
- None
  
  
## v1.1.5 (7/22/2022) -----

#### Enhancements:
- Tuned polling for chart data
- Truncating tickers ending in '=x'
- Updated the symbol drawing font size to account for ticker/symbol length. 
- Abbreviated chart labels to 2 characters

#### Bug Fixes:
- None


## v1.1.3 (7/19/2022) -----
### Enhancements:
- Added Polish Zloty

### Bug Fixes:
- Verified charts are working


## v1.1.2 (12/22/2021) -----

#### Enhancements:
- Added 30 realtime currency conversions 
- Added max digits
- Added D3 charting
- Simplified the Viz slider

#### Bug Fixes:
- Fixed chart fill no fill

## v1.1.1 (12/09/2021) -----

#### Enhancements:
- Updated chart ranges to be more accurate
- Scaling 24hr charts to fit previous close line
- Removed change close from charts
- Removed localization (to be added later)

#### Bug Fixes:
- Updated plugin version handling

## v1.1.0 (12/06/2021) -----

#### Enhancements:
- **Total Rewrite**
- Charting
- Live Limits Adjustments
- Batched quote requests - less traffic and faster polling
- Added support for multiple actions
- So much more

#### Bug Fixes:
- None
 
## v1.0.4 (10/03/2021) -----

#### Enhancements:
- Added Adjustable Polling Interval
- Dynamic button, choose between Refresh or Open URL
[issue #5](https://github.com/Phando/Streamdeck-Stonks/issues/5)

#### Bug Fixes:
- Upper and Lower limit actions fall back to the default action if not set. 
[issue #3](https://github.com/Phando/Streamdeck-Stonks/issues/3)
- Stocks with no post market value showing wrong market state
[issue #4](https://github.com/Phando/Streamdeck-Stonks/issues/4)

## v1.0.2 (8/26/2021) -----

#### Enhancements:
- Added price abbreviations for prices >= $100,000
[issue #1](https://github.com/Phando/Streamdeck-Stonks/issues/1)

#### Bug Fixes:
- Upper and Lower limit colors initial values not persisting
[issue #2](https://github.com/Phando/Streamdeck-Stonks/issues/2)


## v1.0.1 (8/13/2021) -----

#### Enhancements:
- Reduced the verbosity of the plugin on the console
- Optimized the querystring to pass less data
- Updated the project URL
- Added the Changelog.md

#### Bug Fixes:
- No Bug Fixes in this release.

---

## v1.0.0 (7/26/2021) -----
*Initial Release*
