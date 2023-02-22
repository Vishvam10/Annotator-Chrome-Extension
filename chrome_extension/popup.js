var remarkGlobalState = {
    running: false,
}

const startStopBtn = document.getElementById("start_annotation");

startStopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if(!remarkGlobalState["running"]) {
        remark_start();
        startStopBtn.innerText = "STOP ANNOTATION"
    }

})

function remark_start() {
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
}








