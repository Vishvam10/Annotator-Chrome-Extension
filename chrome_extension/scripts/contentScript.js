console.log("loaded")
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log("reached onMessage listener : ", req)
})