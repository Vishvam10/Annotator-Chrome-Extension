console.log("loaded", document)
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log("received : ", req["dataURI"])
    try {
        if(req["dataURI"]) {
            downloadFile(req["dataURI"], "ss.png");
        }
    } catch(e) {
        console.log("connection error : ", e.message)
    }
})

function downloadFile(dataURI, fileName) {
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURI;
    downloadLink.download = fileName;
    downloadLink.click();
}