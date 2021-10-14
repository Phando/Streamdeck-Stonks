class ActionPI {
	type = "com.andomation.stream.stonks"
	
	constructor() {
	}

	init(jsn) {
		console.log("SD", $SD)
		this.uuid = $SD.uuid
		this.context = $SD.actionInfo.context
		this.settings = $SD.actionInfo.payload.settings
	}

	initFields(){
		Object.keys(this.settings).forEach((key) => {
			element = document.getElementById("dynamicContent");
			if( element != "undefined" ){
				element = document.getElementById("dynamicContent");
			}
			// if (actions[key].type == action) {
			// 	actions[key].init(inUUID, settings);
			// }
		});
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
				if(callback){ callback(); }
			}
		};

		try { 
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		} catch(err) {
			/* todo catch error */
		}
	}

	initField(fieldName) {
		const field = document.getElementById(fieldName + "_data");
		field.value = this.settings[fieldName];
		field.onchange = (evt) => {
			if ( evt.target.value == "") {
				field.value = this.settings[fieldName];
			}

			this.settings[fieldName] = field.value;
			
			//websocketUtils.setSettings(this.type, this.inUUID, this.settings);
			//console.log("Utils", websocketUtils, this.settings)
		};
	}
}
