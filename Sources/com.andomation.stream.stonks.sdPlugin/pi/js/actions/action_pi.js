class ActionPI extends StreamDeckClient{
	type = "com.andomation.stream.stonks"
	
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
