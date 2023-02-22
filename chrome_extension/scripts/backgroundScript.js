console.log("from background", chrome.tabs);

var http_pattern =  /^https?:\/\/(.*)/

chrome.tabs.onActivated.addListener((tab) => {
    chrome.tabs.captureVisibleTab(null, {
        "format": "png"
    }, function(dataURI) {        
        if (typeof dataURI !== "undefined") {
            image = new Image();
            image.src = dataURI;
            chrome.tabs.sendMessage(tab.tabId, {
                "msg": "screenshotResult",
                "dataURI" : dataURI
            })

        }

    }); 
    

})
