const Currencies = Object.freeze({
    //"AFN":{code:"AFN",symbol:"Af",name:"Afghani"},
    //"DZD":{code:"DZD",symbol:"د.ج",name:"Algerian Dinar"},
    //"ARS":{code:"ARS",symbol:"$",name:"Argentine Peso"},
    //"AMD":{code:"AMD",symbol:"Դ",name:"Armenian Dram"},
    //"AWG":{code:"AWG",symbol:"ƒ",name:"Aruban Guilder/Florin"},
    "AUD":{code:"AUD",symbol:"$",name:"Australian Dollar"},
    //"AZN":{code:"AZN",symbol:"ман",name:"Azerbaijanian Manat"},
    //"BSD":{code:"BSD",symbol:"$",name:"Bahamian Dollar"},
    //"BHD":{code:"BHD",symbol:"ب.د",name:"Bahraini Dinar"},
    //"THB":{code:"THB",symbol:"฿",name:"Baht"},
    //"PAB":{code:"PAB",symbol:"฿",name:"Balboa"},
    //"BBD":{code:"BBD",symbol:"$",name:"Barbados Dollar"},
    //"BYN":{code:"BYN",symbol:"Br",name:"Belarusian Ruble"},
    //"BZD":{code:"BZD",symbol:"$",name:"Belize Dollar"},
    //"BMD":{code:"BMD",symbol:"$",name:"Bermudian Dollar"},
    "BOB":{code:"BOB",symbol:"Bs.",name:"Boliviano"},
    "BRL":{code:"BRL",symbol:"R$",name:"Brazilian Real"},
    //"BND":{code:"BND",symbol:"$",name:"Brunei Dollar"},
    //"BGN":{code:"BGN",symbol:"лв",name:"Bulgarian Lev"},
    //"BIF":{code:"BIF",symbol:"₣",name:"Burundi Franc"},
    "CAD":{code:"CAD",symbol:"$",name:"Canadian Dollar"},
    //"CVE":{code:"CVE",symbol:"$",name:"Cape Verde Escudo"},
    "KYD":{code:"KYD",symbol:"$",name:"Cayman Islands Dollar"},
    //"GHS":{code:"GHS",symbol:"₵",name:"Cedi"},
    //"XAF":{code:"XAF",symbol:"₣",name:"CFA Franc BCEAO"},
    //"XPF":{code:"XPF",symbol:"₣",name:"CFP Franc"},
    //"CLP":{code:"CLP",symbol:"$",name:"Chilean Peso"},
    "COP":{code:"COP",symbol:"$",name:"Colombian Peso"},
    //"CDF":{code:"CDF",symbol:"₣",name:"Congolese Franc"},
    //"NIO":{code:"NIO",symbol:"C$",name:"Cordoba Oro"},
    "CRC":{code:"CRC",symbol:"₡",name:"Costa Rican Colon"},
    //"HRK":{code:"HRK",symbol:"Kn",name:"Croatian Kuna"},
    //"CUP":{code:"CUP",symbol:"$",name:"Cuban Peso"},
    //"CZK":{code:"CZK",symbol:"Kč",name:"Czech Koruna"},
    //"GMD":{code:"GMD",symbol:"D",name:"Dalasi"},
    "DKK":{code:"DKK",symbol:"kr",name:"Danish Krone"},
    //"MKD":{code:"MKD",symbol:"ден",name:"Denar"},
    //"DJF":{code:"DJF",symbol:"₣",name:"Djibouti Franc"},
    //"STN":{code:"STN",symbol:"Db",name:"Dobra"},
    //"DOP":{code:"DOP",symbol:"$",name:"Dominican Peso"},
    "VND":{code:"VND",symbol:"₫",name:"Dong"},
    //"XCD":{code:"XCD",symbol:"$",name:"East Caribbean Dollar"},
    "EGP":{code:"EGP",symbol:"£",name:"Egyptian Pound"},
    "EUR":{code:"EUR",symbol:"€",name:"Euro"},
    "FKP":{code:"FKP",symbol:"£",name:"Falkland Islands Pound"},
    //"FJD":{code:"FJD",symbol:"$",name:"Fiji Dollar"},
    //"HUF":{code:"HUF",symbol:"Ft",name:"Forint"},
    //"GIP":{code:"GIP",symbol:"£",name:"Gibraltar Pound"},
    //"HTG":{code:"HTG",symbol:"G",name:"Gourde"},
    //"PYG":{code:"PYG",symbol:"₲",name:"Guarani"},
    //"GNF":{code:"GNF",symbol:"₣",name:"Guinea Franc"},
    //"GYD":{code:"GYD",symbol:"$",name:"Guyana Dollar"},
    "HKD":{code:"HKD",symbol:"$",name:"Hong Kong Dollar"},
    //"UAH":{code:"UAH",symbol:"₴",name:"Hryvnia"},
    "ISK":{code:"ISK",symbol:"Kr",name:"Iceland Krona"},
    //"INR":{code:"INR",symbol:"₹",name:"Indian Rupee"},
    //"IRR":{code:"IRR",symbol:"﷼",name:"Iranian Rial"},
    //"IQD":{code:"IQD",symbol:"ع.د",name:"Iraqi Dinar"},
    //"JMD":{code:"JMD",symbol:"$",name:"Jamaican Dollar"},
    //"JOD":{code:"JOD",symbol:"د.ا",name:"Jordanian Dinar"},
    //"KES":{code:"KES",symbol:"Sh",name:"Kenyan Shilling"},
    //"PGK":{code:"PGK",symbol:"K",name:"Kina"},
    //"LAK":{code:"LAK",symbol:"₭",name:"Kip"},
    //"BAM":{code:"BAM",symbol:"КМ",name:"Konvertibilna Marka"},
    //"KWD":{code:"KWD",symbol:"د.ك",name:"Kuwaiti Dinar"},
    //"MWK":{code:"MWK",symbol:"MK",name:"Kwacha"},
    //"AOA":{code:"AOA",symbol:"Kz",name:"Kwanza"},
    //"MMK":{code:"MMK",symbol:"K",name:"Kyat"},
    //"GEL":{code:"GEL",symbol:"ლ",name:"Lari"},
    //"LBP":{code:"LBP",symbol:"ل.ل",name:"Lebanese Pound"},
    //"ALL":{code:"ALL",symbol:"L",name:"Lek"},
    //"HNL":{code:"HNL",symbol:"L",name:"Lempira"},
    "SLL":{code:"SLL",symbol:"Le",name:"Leone"},
    //"RON":{code:"RON",symbol:"L",name:"Leu"},
    //"LRD":{code:"LRD",symbol:"$",name:"Liberian Dollar"},
    //"LYD":{code:"LYD",symbol:"ل.د",name:"Libyan Dinar"},
    //"SZL":{code:"SZL",symbol:"L",name:"Lilangeni"},
    //"LSL":{code:"LSL",symbol:"L",name:"Loti"},
    //"MYR":{code:"MYR",symbol:"RM",name:"Malaysian Ringgit"},
    //"TMT":{code:"TMT",symbol:"m",name:"Manat"},
    //"MUR":{code:"MUR",symbol:"₨",name:"Mauritius Rupee"},
    //"MZN":{code:"MZN",symbol:"MTn",name:"Metical"},
    "MXN":{code:"MXN",symbol:"$",name:"Mexican Peso"},
    "MDL":{code:"MDL",symbol:"L",name:"Moldovan Leu"},
    //"MAD":{code:"MAD",symbol:"د.م.",name:"Moroccan Dirham"},
    //"NGN":{code:"NGN",symbol:"₦",name:"Naira"},
    //"ERN":{code:"ERN",symbol:"Nfk",name:"Nakfa"},
    //"NAD":{code:"NAD",symbol:"$",name:"Namibia Dollar"},
    "NPR":{code:"NPR",symbol:"₨",name:"Nepalese Rupee"},
    "ILS":{code:"ILS",symbol:"₪",name:"New Israeli Shekel"},
    "NZD":{code:"NZD",symbol:"$",name:"New Zealand Dollar"},
    //"KPW":{code:"KPW",symbol:"₩",name:"North Korean Won"},
    "NOK":{code:"NOK",symbol:"kr",name:"Norwegian Krone"},
    //"PEN":{code:"PEN",symbol:"S/",name:"Nuevo Sol"},
    //"MRU":{code:"MRU",symbol:"UM",name:"Ouguiya"},
    //"TOP":{code:"TOP",symbol:"T$",name:"Pa’anga"},
    //"PKR":{code:"PKR",symbol:"₨",name:"Pakistan Rupee"},
    //"MOP":{code:"MOP",symbol:"P",name:"Pataca"},
    //"UYU":{code:"UYU",symbol:"$",name:"Peso Uruguayo"},
    "PHP":{code:"PHP",symbol:"₱",name:"Philippine Peso"},
    "GBP":{code:"GBP",symbol:"£",name:"Pound Sterling"},
    //"BWP":{code:"BWP",symbol:"P",name:"Pula"},
    "PLN":{code:"PLN",symbol:"zł",name:"Polish Zloty"},
    //"QAR":{code:"QAR",symbol:"ر.ق",name:"Qatari Rial"},
    //"GTQ":{code:"GTQ",symbol:"Q",name:"Quetzal"},
    //"ZAR":{code:"ZAR",symbol:"R",name:"Rand"},
    //"OMR":{code:"OMR",symbol:"ر.ع.",name:"Rial Omani"},
    //"KHR":{code:"KHR",symbol:"៛",name:"Riel"},
    //"MVR":{code:"MVR",symbol:"ރ.",name:"Rufiyaa"},
    //"IDR":{code:"IDR",symbol:"Rp",name:"Rupiah"},
    "RUB":{code:"RUB",symbol:"р.",name:"Russian Ruble"},
    //"RWF":{code:"RWF",symbol:"₣",name:"Rwanda Franc"},
    //"SHP":{code:"SHP",symbol:"£",name:"Saint Helena Pound"},
    //"SAR":{code:"SAR",symbol:"ر.س",name:"Saudi Riyal"},
    //"RSD":{code:"RSD",symbol:"din",name:"Serbian Dinar"},
    //"SCR":{code:"SCR",symbol:"₨",name:"Seychelles Rupee"},
    "SGD":{code:"SGD",symbol:"$",name:"Singapore Dollar"},
    //"SBD":{code:"SBD",symbol:"$",name:"Solomon Islands Dollar"},
    //"SOS":{code:"SOS",symbol:"Sh",name:"Somali Shilling"},
    //"TJS":{code:"TJS",symbol:"ЅМ",name:"Somoni"},
    "KRW":{code:"KRW",symbol:"₩",name:"South Korean Won"},
    //"LKR":{code:"LKR",symbol:"Rs",name:"Sri Lanka Rupee"},
    //"SDG":{code:"SDG",symbol:"£",name:"Sudanese Pound"},
    //"SRD":{code:"SRD",symbol:"$",name:"Suriname Dollar"},
    "SEK":{code:"SEK",symbol:"kr",name:"Swedish Krona"},
    "CHF":{code:"CHF",symbol:"₣",name:"Swiss Franc"},
    //"SYP":{code:"SYP",symbol:"ل.س",name:"Syrian Pound"},
    "TWD":{code:"TWD",symbol:"$",name:"Taiwan Dollar"},
    //"BDT":{code:"BDT",symbol:"৳",name:"Taka"},
    //"WST":{code:"WST",symbol:"T",name:"Tala"},
    //"TZS":{code:"TZS",symbol:"Sh",name:"Tanzanian Shilling"},
    "KZT":{code:"KZT",symbol:"〒",name:"Tenge"},
    //"TTD":{code:"TTD",symbol:"$",name:"Trinidad and Tobago Dollar"},
    //"MNT":{code:"MNT",symbol:"₮",name:"Tugrik"},
    //"TND":{code:"TND",symbol:"د.ت",name:"Tunisian Dinar"},
    //"TRY":{code:"TRY",symbol:"₤",name:"Turkish Lira"},
    //"AED":{code:"AED",symbol:"د.إ",name:"UAE Dirham"},
    //"UGX":{code:"UGX",symbol:"Sh",name:"Uganda Shilling"},
    "USD":{code:"USD",symbol:"$",name:"US Dollar"},
    //"VUV":{code:"VUV",symbol:"Vt",name:"Vatu"},
    //"YER":{code:"YER",symbol:"﷼",name:"Yemeni Rial"},
    "JPY":{code:"JPY",symbol:"¥",name:"Yen"},
    "CNY":{code:"CNY",symbol:"¥",name:"Yuan"},
    //"ZMW":{code:"ZMW",symbol:"ZK",name:"Zambian Kwacha"},
    //"ZWL":{code:"ZWL",symbol:"$",name:"Zimbabwe Dollar"},
})

class RateManager {
    dataTimer = null;
    rates = []
    rateURL  = "https://api.exchangerate.host/latest?base=usd&places=6" // symbols= amount=
    
    //-----------------------------------------------------------------------------------------
    
    constructor() {
        this.startPolling()
    }

    //-----------------------------------------------------------------------------------------
    
    startPolling() {
        this.fetchData()
        this.dataTimer = setInterval(this.fetchData.bind(this), 60000)
    }

    //-----------------------------------------------------------------------------------------
        
    stopPolling() {
        clearInterval(this.dataTimer)
        this.dataTimer = null
    }

    //-----------------------------------------------------------------------------------------

    handleError(response, event){
        console.log("Unable to get rate data")
    }

    //-----------------------------------------------------------------------------------------

    handleResponse(response, event){
        var data = {}
        this.rates = response.hasOwnProperty("rates") ? response.rates : {}
    }

    //-----------------------------------------------------------------------------------------

    fetchData(){
        this.requestData(this.rateURL, 
            (response, event) => this.handleResponse(response, 'didReceiveRateData'), 
            (response, event) => this.handleError(response, 'didReceiveRateError'))
    }

    //-----------------------------------------------------------------------------------------

    requestData(url, callback, errorCallback, userInfo={}) {
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
                console.log(error)
                errorCallback(error)
            });
    }

    //-----------------------------------------------------------------------------------------

    getCurrency(code){    
        if(Currencies[code] != undefined) 
            return Currencies[code];

        console.log(`No currency found for: ${code}`)
        return {}
    }

    rateFor(code){    
        if(this.rates[code] != undefined)
            return this.rates[code];

        console.log(`No rate available for: ${this.rates[code]}`);
        return 1.0
    }

    symbolFor(code){   
        if(this.rates[code] != undefined)
            return this.getCurrency(code).symbol;

        console.log(`No symbol available for: ${this.rates[code]}`);
        return 'ERROR'
    }
}
