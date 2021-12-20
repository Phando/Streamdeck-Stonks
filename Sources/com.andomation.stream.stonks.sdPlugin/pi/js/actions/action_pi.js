class ActionPI extends StreamDeckClient{
	type = "com.andomation.stream"
	
	constructor() {
		super()
	}

	init(jsn) {
		this.uuid = jsn.actionInfo.context
		$SD.on(this.type + '.didReceiveSettings', (jsonObj) => this.onDidReceiveSettings(jsonObj))
	}

	onDidReceiveSettings(jsn) {
        this.uuid = jsn.context
        this.settings = Utils.getProp(jsn, 'payload.settings', false)
		console.log("ActionPI - onDidReceiveSettings", jsn, this.settings)

		// Future home of analytics
		// gtag('event','settings', {
		// 	"symbol" : this.settings.symbol,
		// 	"maxDigits" : this.settings.maxDigits,
		// 	"home" : this.settings.home,
		// 	"fillCharts" : this.settings.fillCharts,
		// 	"frameTime" : this.settings.frameTime,
		// 	"updateClose" : this.settings.updateClose,
		// 	"limitType" : this.settings.limitType,
		// 	"lowerLimitEnabled" : this.settings.lowerLimitEnabled,
		// 	"upperLimitEnabled" : this.settings.upperLimitEnabled,
		// 	"visLimits" : this.settings.visLimits,
		// 	"show1DayChart" : this.settings.show1DayChart,
		// 	"show1MonthChart" : this.settings.show1MonthChart,
		// 	"show2HourChart" : this.settings.show2HourChart,
		// 	"show5DayChart" : this.settings.show5DayChart,
		// 	"show30MinChart" : this.settings.show30MinChart,
		// 	"showDayDecimal" : this.settings.showDayDecimal,
		// 	"showState" : this.settings.showState,
		// 	"showTrend" : this.settings.showTrend
		// });
    }

	onReceiveGlobalSettings(jsonObj){
		updateUI(globalSettings).bind(this);
	}

	injectContent(url, callback) {
		var localTest = /^(?:file):/;
		var xmlhttp = new XMLHttpRequest();
		var element = document.getElementById("dynamicContent");
		var status = 0;

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				status = xmlhttp.status;
			}
			if (localTest.test(location.href) && xmlhttp.responseText) {
				status = 200;
			}
			if (xmlhttp.readyState == 4 && status == 200) {
				element.outerHTML = xmlhttp.responseText;
				if(callback){ callback() }
				
				// Set up a flag in the dom so DOMContentLoaded knows what to do.
				const node = document.getElementById('contentLoaded') || document.createElement('div');
				node.setAttribute('id', 'contentLoaded');
				document.body.appendChild(node);
        		document.dispatchEvent(new Event('DOMContentLoaded'));
			}
		};

		try { 
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		} catch(err) {
			/* todo catch error */
		}
	}
	
}
