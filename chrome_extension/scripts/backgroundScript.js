console.log("from background", chrome.tabs);

chrome.action.onClicked.addListener(function (tab) {
  console.log("CLICKED EXTENSION ICON");
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["/scripts/contentScript.js"],
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "takeScreenshot") {
    chrome.tabs.captureVisibleTab(null,{},function(dataUri){
        console.log(dataUri);
        sendData(dataUri)
    });
    }
});

function sendMessage(message) {
    chrome.runtime.sendMessage(message, (response) => {
        console.log("bg received  data", response);
    });
}

async function getCurrentTab() {
  let queryOptions = { active: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function getCurrentWindow() {
  const w = await chrome.windows.getCurrent({ populate: true });
  return w;
}