var action = {}
var onchangeevt = "onchange"; // 'oninput';
let sdpiWrapper = document.querySelector(".sdpi-wrapper");

actions.push(new SimpleActionPI())
//actions.push(new ComplexActionPI())
//actions.push(new CoreActionPi())

$SD = StreamDeck.getInstance();

//------------------------------ Streamdeck Event Handlers -----------------------------------//

/**
 * The 'connected' event is the first event sent to Property Inspector, after it's instance
 * is registered with Stream Deck software. It carries the current websocket, settings,
 * and other information about the current environmet in a JSON object.
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on("connected", (jsn) => {
  console.log("PI Connected", jsn);
  
  let actionType = Utils.getProp(jsn, "actionInfo.action", "")
  
  actions.forEach((item) => {
    console.log("Action Type", item.type)
    contextList[jsn.actionInfo.context] = new Context(jsn.actionInfo)

    if(item.type == actionType){
		  item.init(jsn)
      action = item
    }
  });

});

//-----------------------------------------------------------------//

// $SD.on('didReceiveGlobalSettings', (jsn) => {
// });

//-----------------------------------------------------------------//

/**
 * The 'sendToPropertyInspector' event can be used to send messages directly from your plugin
 * to the Property Inspector without saving these messages to the settings.
 */

$SD.on("sendToPropertyInspector", (jsn) => {
  const pl = jsn.payload;
  console.log("sendToPropertyInspector", jsn)
  
  /**
   *  This is an example, how you could show an error to the user
   */
  if (pl.hasOwnProperty("error")) {
    sdpiWrapper.innerHTML = `<div class="sdpi-item">
             <details class="message caution">
             <summary class="${pl.hasOwnProperty("info") ? "pointer" : ""}">${
      pl.error
    }</summary>
                 ${pl.hasOwnProperty("info") ? pl.info : ""}
             </details>
         </div>`;
  } else {
    if(pl.hasOwnProperty("settings")){
      updateUI(pl.settings)
    }
  }
});

/**
 * Something in the PI changed:
 * either you clicked a button, dragged a slider or entered some text
 *
 *  {
 *      checked: false
 *      group: false
 *      index: 0
 *      key: "mynameinput"
 *      selection: []
 *      value: "Elgato"
 *  }
 *
 * If you set an 'id' to an input-element, this will get the 'key' of this object.
 * The input's value will get the value.
 * There are other fields
 *      - 'checked' if you clicked a checkbox
 *      - 'index', if you clicked an element within a group of other elements
 *      - 'selection', if the element allows multiple-selections
 */

$SD.on("piDataChanged", (returnValue) => {
  console.log(
    "%c%s",
    "color: white; background: black}; font-size: 13px;",
    "piDataChanged"
  );
  console.log("Return Value", returnValue);

  if (returnValue.key != 'external') {
    saveValue(returnValue);
    sendValueToPlugin("sdpi_collection", returnValue)
    return
  }

  // Open New Window
  postMessage = (w) => {
    w.postMessage(Object.assign({}, $SD.applicationInfo.application, {action: $SD.actionInfo.action}),'*');
  }

  if (!window.xtWindow || window.xtWindow.closed) {
      window.xtWindow  = window.open('../externalWindow.html', 'External Window');
      setTimeout(() => postMessage(window.xtWindow), 200);
  } else {
    postMessage(window.xtWindow);
  }
});

/**
 * 'sendValueToPlugin' is a wrapper to send some values to the plugin
 *
 * It is called with a value and the name of a property:
 *
 * sendValueToPlugin(<any value>), 'key-property')
 *
 * where 'key-property' is the property you listen for in your plugin's
 * 'sendToPlugin' events payload.
 *
 */
//-----------------------------------------------------------------------------------------

function sendValueToPlugin(key, value) {
  console.log("sendValueToPlugin", key, value);
  if ($SD.connection && $SD.connection.readyState == 1) {
    const json = {
      action: $SD.actionInfo["action"],
      event: "sendToPlugin",
      context: $SD.uuid,
      payload: {
        [key]: value,
        targetContext: $SD.actionInfo["context"],
      },
    };
    
    $SD.connection.send(JSON.stringify(json));
  }
}

//-----------------------------------------------------------------------------------------

function restoreDefaults(){
    let context = contextList[$SD.actionInfo["context"]]
    
    let freshy = new Context()
    freshy.action = context.action
    freshy.context = context.context
    freshy.coordinates = context.coordinates
    freshy.settings = {}
    contextList[context.context] = freshy
    sendValueToPlugin("sdpi_collection", {key:'restoreDefaults', value:freshy.settings})
}

//-----------------------------------------------------------------------------------------

function handleSdpiItemChange(e, idx) {
  /** Following items are containers, so we won't handle clicks on them */
  if (["OL", "UL", "TABLE"].includes(e.tagName)) {
    return;
  }

  if(e.id == 'restoreDefaults'){
    restoreDefaults()
    return
  }
  
  if (e.tagName === "SPAN") {
    const inp = e.parentNode.querySelector("input");
    var tmpValue;

    // if there's no attribute set for the span, try to see, if there's a value in the textContent
    // and use it as value
    if (!e.hasAttribute("value")) {
      tmpValue = Number(e.textContent);
      if (typeof tmpValue === "number" && tmpValue !== null) {
        e.setAttribute("value", 0 + tmpValue); // this is ugly, but setting a value of 0 on a span doesn't do anything
        e.value = tmpValue;
      }
    } else {
      tmpValue = Number(e.getAttribute("value"));
    }

    if (inp && tmpValue !== undefined) {
      inp.value = tmpValue;
    } else return;
  }

  const selectedElements = [];
  const isList = ["LI", "OL", "UL", "DL", "TD"].includes(e.tagName);
  const sdpiItem = e.closest(".sdpi-item");
  const sdpiItemGroup = e.closest(".sdpi-item-group");
  let sdpiItemChildren = isList
    ? sdpiItem.querySelectorAll(e.tagName === "LI" ? "li" : "td")
    : sdpiItem.querySelectorAll(".sdpi-item-child > input");

  if (isList) {
    const siv = e.closest(".sdpi-item-value");
    if (!siv.classList.contains("multi-select")) {
      for (let x of sdpiItemChildren) x.classList.remove("selected");
    }
    if (!siv.classList.contains("no-select")) {
      e.classList.toggle("selected");
    }
  }

  console.log("E Type", e.type, e, $SD)

  if(e.type == "radio" || e.type == "checkbox"){
    var settings = $SD.actionInfo.payload.settings
    
    sdpiItemChildren.forEach((item) => { 
      if(!item.checked || e.type == "radio"){
        delete settings[item.id]
      }
    });

    if(e.checked){
      e.setAttribute("_value", e.value)
      if(e.type == "radio")
        e.setAttribute("_name", e.name)
      else 
        settings[e.id] = e.value
    }
    else if(e.value == 'enabled'){
      e.setAttribute("_value", '_false')
    }
    
    $SD.actionInfo.payload.settings = settings
    //saveSettings(action.settings)
  }

  if (sdpiItemGroup && !sdpiItemChildren.length) {
    for (let x of ["input", "meter", "progress"]) {
      sdpiItemChildren = sdpiItemGroup.querySelectorAll(x);
      if (sdpiItemChildren.length) break;
    }
  }

  if (e.selectedIndex !== undefined) {
    if (e.tagName === 'SELECT') {
        sdpiItemChildren.forEach((ec, i) => {
            selectedElements.push({ [ec.id]: ec.value });
        });
    }
    idx = e.selectedIndex;
  } else {
      sdpiItemChildren.forEach((ec, i) => {
          if (ec.classList.contains('selected')) {
              selectedElements.push(ec.textContent);
          }
          if (ec === e) {
              idx = i;
              selectedElements.push(ec.value);
          }
      });
  }

  const returnValue = {
    key: e.hasAttribute('_name') ? e.getAttribute('_name') : e.id && e.id.charAt(0) !== '_' ? e.id : sdpiItem.id,
    value: isList
      ? e.textContent : e.hasAttribute('_value')
      ? e.getAttribute('_value') : e.hasAttribute('value')
      ? e.getAttribute('value') : e.value,
    group: sdpiItemGroup ? sdpiItemGroup.id : false,
    index: idx,
    selection: selectedElements,
    checked: e.checked
  };

  $SD.emit("piDataChanged", returnValue)
}

//------------------------------ DOM Helpers -----------------------------------//

const populateRelated = (pl) => {
  // Populate related select lists with their selected values
  var selects = $("select");
  selects.each( function(i,sel){
    var payload = null
    var selected = false
    var related = $("[related="+sel.id+"]")
    if(related.length==0) return

    $(sel).find('option').detach();
    
    related.each( function(j,item){
      if(item.checked){
        if(!selected && item.id == pl[sel.id])
          selected = item.id
        
        let label = $("label[for='"+ item.id+"']").text()
        $(sel).append($('<option>', {value:item.id, text:label}));
      }
    });
    
    // Solid match return
    if(selected != false){
      $(sel).val(selected)
      return
    }

    // Not found check for an empty list
    if($(sel).find('option').length == 0){
      let label = $("label[for='"+ related[0].id+"']").text()
      $(sel).append($('<option>', {value:related[0].id, text:label}));
      payload = { key:related[0].id, value:'enabled', group:false, index:0, selection:null, checked:true }
      $SD.emit("piDataChanged", payload)
    }

    // No selection, pick the first element
    payload = { key:sel.id, value:sel.options[0].value, group:false, index:0, selection:[], checked:false }
    $SD.emit("piDataChanged", payload)
  });
}

const isRelated = (element) => {
  return element.hasAttribute("related");
};

const hasRelated = (element) => {
  console.log("Action Test", element.id, action.settings)
  for (const [key, value] of Object.entries(action.settings)) {
    let item = document.querySelector('#'+ key);
    //console.log("=>", key, value)
    if(item == null) continue
    console.log("=>", key, isRelated(item))
  }
  return false
}


const updateRelated = (element, pl) => {
  //if(!element.hasAttribute('related'))
  if(!isRelated(element))//.hasAttribute('related'))
    return
  
  var related = document.getElementById( element.getAttribute('related') )
  let label = $("label[for='"+ element.id +"']").text()
  $(related).append($('<option>', {value:element.id, text:label}));

  if(pl[related.id] == element.id)
    $(related).val(element.id)
}

const updateUI = (pl) => {
  // Insert Radio Values if Needed
  for (const [key, value] of Object.entries(pl)) {
    var fieldList = document.querySelectorAll("[id^="+key+"-radio]") 
    if( fieldList.length == 0 ) continue
    
    fieldList.forEach(function(item){
        console.log("Field", item, item.id, item.value)
        if(item.value == pl[key]){
          pl[item.id] = pl[key]
        } 
        else {
            delete pl[item.id]
        }
    });
    
    let test = document.querySelector('#home'); 
    hasRelated(test)
  }

  // Default Functionality
  Object.keys(pl).map((e) => {
    if (e && e != "") {
      const foundElement = document.querySelector(`#${e}`);
      console.log(`searching for: #${e}`, "found:", foundElement);
      
      if(!foundElement || foundElement.type == "file")
        return
      
      if(foundElement.type == "checkbox" || foundElement.type ==  "radio"){
        foundElement.checked = foundElement.value == pl[e]
        updateRelated(foundElement, pl)
      }
      else {
        foundElement.value = pl[e];
        const maxl = foundElement.getAttribute("maxlength") || 50;
        const labels = document.querySelectorAll(`[for='${foundElement.id}']`);
        if (labels.length) {
          for (let x of labels) {
            x.textContent = maxl
              ? `${foundElement.value.length}/${maxl}`
              : `${foundElement.value.length}`;
          }
        }
      }
    }
  });

  //populateRelated(pl)
};

/**
 * This is a quick and simple way to localize elements and labels in the Property
 * Inspector's UI without touching their values.
 * It uses a quick 'lox()' function, which reads the strings from a global
 * variable 'localizedStrings' (in 'common.js')
 */

 function localizeUI() {
  const el = document.querySelector(".sdpi-wrapper") || document;
  let t;
  Array.from(el.querySelectorAll("sdpi-item-label")).forEach((e) => {
    t = e.textContent.lox();
    if (e !== t) {
      e.innerHTML = e.innerHTML.replace(e.textContent, t);
    }
  });
  Array.from(el.querySelectorAll("*:not(script)")).forEach((e) => {
    if (
      e.childNodes &&
      e.childNodes.length > 0 &&
      e.childNodes[0].nodeValue &&
      typeof e.childNodes[0].nodeValue === "string"
    ) {
      t = e.childNodes[0].nodeValue.lox();
      if (e.childNodes[0].nodeValue !== t) {
        e.childNodes[0].nodeValue = t;
      }
    }
  });
}

/** 
 * CREATE INTERACTIVE HTML-DOM
 * The 'prepareDOMElements' helper is called, to install events on all kinds of
 * elements (as seen e.g. in PISamples)
 * Elements can get clicked or act on their 'change' or 'input' event. (see at the top
 * of this file)
 * Messages are then processed using the 'handleSdpiItemChange' method below.
 * If you use common elements, you don't need to touch these helpers. Just take care
 * setting an 'id' on the element's input-control from which you want to get value(s).
 * These helpers allow you to quickly start experimenting and exchanging values with
 * your plugin.
 */

 function prepareDOMElements(baseElement) {
  baseElement = baseElement || document;
  Array.from(baseElement.querySelectorAll(".sdpi-item-value")).forEach(
    (el, i) => {
      const elementsToClick = [
        "BUTTON",
        "OL",
        "UL",
        "TABLE",
        "METER",
        "PROGRESS",
        "CANVAS",
      ].includes(el.tagName);
      const evt = elementsToClick ? "onclick" : onchangeevt || "onchange";

      /** Look for <input><span> combinations, where we consider the span as label for the input
       * we don't use `labels` for that, because a range could have 2 labels.
       */
      const inputGroup = el.querySelectorAll("input + span");
      if (inputGroup.length === 2) {
        const offs = inputGroup[0].tagName === "INPUT" ? 1 : 0;
        inputGroup[offs].textContent = inputGroup[1 - offs].value;
        inputGroup[1 - offs]["oninput"] = function () {
          inputGroup[offs].textContent = inputGroup[1 - offs].value;
        };
      }
      /** We look for elements which have an 'clickable' attribute
       * we use these e.g. on an 'inputGroup' (<span><input type="range"><span>) to adjust the value of
       * the corresponding range-control
       */
      Array.from(el.querySelectorAll(".clickable")).forEach((subel, subi) => {
        subel["onclick"] = function (e) {
          handleSdpiItemChange(e.target, subi);
        };
      });
      /** Just in case the found HTML element already has an input or change - event attached,
       * we clone it, and call it in the callback, right before the freshly attached event
       */
      const cloneEvt = el[evt];
      el[evt] = function (e) {
        if (cloneEvt) cloneEvt();
        handleSdpiItemChange(e.target, i);
      };
    }
  );

  /**
   * You could add a 'label' to a textares, e.g. to show the number of charactes already typed
   * or contained in the textarea. This helper updates this label for you.
   */
  baseElement.querySelectorAll("textarea").forEach((e) => {
    const maxl = e.getAttribute("maxlength");
    e.targets = baseElement.querySelectorAll(`[for='${e.id}']`);
    if (e.targets.length) {
      let fn = () => {
        for (let x of e.targets) {
          x.textContent = maxl
            ? `${e.value.length}/${maxl}`
            : `${e.value.length}`;
        }
      };
      fn();
      e.onkeyup = fn;
    }
  });

  baseElement.querySelectorAll("[data-open-url").forEach((e) => {
    const value = e.getAttribute("data-open-url");
    if (value) {
      e.onclick = () => {
        let path;
        if (value.indexOf("http") !== 0) {
          path = document.location.href.split("/");
          path.pop();
          path.push(value.split("/").pop());
          path = path.join("/");
        } else {
          path = value;
        }
        $SD.api.openUrl($SD.uuid, path);
      };
    } else {
      console.log(`${value} is not a supported url`);
    }
  });
}

//-----------------------------------------------------------------//

document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add(
    navigator.userAgent.includes("Mac") ? "mac" : "win"
  );
  
  if(document.getElementById('contentLoaded') != null){
    updateUI(action.settings);
    prepareDOMElements();
  }
  else {
    console.log("Skipping prepareDOMElements, contentLoaded (html element) not found")
  }

  $SD.on("localizationLoaded", (language) => {
    localizeUI();
  });
});

//-----------------------------------------------------------------//

window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  sendValueToPlugin("property_inspector", "propertyInspectorWillDisappear");
  // Don't set a returnValue to the event, otherwise Chromium with throw an error.  // e.returnValue = '';
});

//-----------------------------------------------------------------//

function gotCallbackFromWindow(parameter) {
  console.log("gotCallbackFromWindow", parameter);
}
