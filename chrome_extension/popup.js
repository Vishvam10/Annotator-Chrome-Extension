var remarkGlobalState = {
    remark_settings: {
        // Grouping
        groupByClassName: true,
        groupByTagName: false,
        confirmBeforeGrouping: false,

        // Debug info
        debugInfo: false,
        
        // Extras 
        showToolTip: false,
    }
}

const startStopBtn = document.getElementById("start_annotation");

startStopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("clicked popup")
    if(!remarkGlobalState["running"]) {

        setDataToStorage("remark_running", true);

        remark_start();

        startStopBtn.innerText = "STOP ANNOTATION";

    } else {

        setDataToStorage("remark_running", false);

        remark_destroy();
    }

})

async function remark_start() {

    // Check if the extension is already running


    // Configure the settings and store them for this session


    // Execute the contentScript
   
   
    const curTab = await getCurrentTab()

    chrome.scripting.executeScript({ 
        args: JSON.stringify(remarkGlobalState),
        target: { 
            tabId: curTab.id, 
            allFrames: true
        }, 
        files: ["scripts/contentScript.js"] 
    });
        
}

function remark_destroy() {

    // Stop annotation process

    // Save the current state (annotations)

    // Probably push to server at this point
    
    // Reset global variables

}

async function getCurrentTab() {
    let queryOptions = { active: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}


function setDataToStorage(key, value) {
    chrome.storage.local.set({ key: value }).then(() => {
        console.log("Value is set to " + value);
        return value;
    });
}

function getDataFromStorage(key) {
    chrome.storage.local.get([key]).then((result) => {
      console.log("Value currently is " + result.key);
      return result.key;
    });
}    

