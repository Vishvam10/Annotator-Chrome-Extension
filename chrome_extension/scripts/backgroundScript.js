console.log("from background", chrome.tabs);

var http_pattern =  /^https?:\/\/(.*)/

chrome.tabs.onActivated.addListener((tab) => {
    chrome.tabs.get(tab.tabId, (current_tab_info) => {
        if(http_pattern.test(current_tab_info.url)) {    
            chrome.scripting.executeScript(
            { 
                target: { 
                    tabId: current_tab_info.id
                }, 
                files: ["scripts/contentScript.js"] 
            });
        }
    })
})