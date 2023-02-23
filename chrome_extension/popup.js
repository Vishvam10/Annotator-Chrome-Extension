// var remarkGlobalState = {
//     remark_settings: {
//         // Grouping
//         groupByClassName: true,
//         groupByTagName: false,
//         confirmBeforeGrouping: false,

//         // Debug info
//         showDebugInfo: false,
        
//         // Extras 
//         showToolTip: false,
//     }
// }

const startStopBtn = document.getElementById("start_annotation");

startStopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("clicked popup")
    
    remark_start();
})

async function remark_start() {

    // Check if the extension is already running
    const running = getDataFromStorage("remark_running");
    if(running === true) {
        return;
    }

    setDataToStorage("remark_running", true);

    // Configure the settings and store them for this session
    const remark_settings = getSettings();
    setDataToStorage("remark_settings", remark_settings);

    const temp = await getDataFromStorage("remark_settings");

    console.log("SETTINGS : ", temp)

    // Execute the contentScript
    try {
        const curTab = await getCurrentTab()
        chrome.scripting.executeScript({ 
            target: { 
                tabId: curTab.id, 
                allFrames: true
            }, 
            files: ["scripts/contentScript.js"] ,
        });
    } catch(e) {
        console.log("chrome error : ", e.message)
    }   

    window.close();
}

function remark_destroy() {
    setDataToStorage("remark_running", false);
    return;

    // Stop annotation process

    // Save the current state (annotations)

    // Probably push to server at this point
    
    // Reset global variables

}

function getSettings() {

    const inps = document.querySelectorAll(".remark_toggle_checkbox");
    let remark_settings = {}
    console.log(inps);

    Array.from(inps).forEach((ele) => {
        if(ele.id) {
            console.log(ele.id, ele.checked)
            remark_settings[ele.id] = ele.checked
        }
    });

    return remark_settings;

}

async function getCurrentTab() {
    let queryOptions = { active: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function setDataToStorage(key, value) {
    try {
        // [k] is a computed property. 
        // Without it, we can not set dynamic keys.
        chrome.storage.local.set({
            [key]: value 
        });
    } catch(e) {
        console.log("chrome error : ", e.message)
    }
}

function getDataFromStorage(key) {
    return new Promise((resolve) => {
                chrome.storage.local.get([key], function(res) {
                resolve(res);
            })
        }
    )
}