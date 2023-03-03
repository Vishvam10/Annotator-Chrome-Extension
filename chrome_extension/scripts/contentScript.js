console.log("loaded", document)
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log("received : ", req["dataURI"])
    try {
        if(req["dataURI"]) {
            downloadFile(req["dataURI"], "ss.png");
            sendResponse({message: "Downloaded file !"});
        }
    } catch(e) {
        console.log("ERROR : ", e.message)
    }
})

function downloadFile(dataURI, fileName) {
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURI;
    downloadLink.download = fileName;
    downloadLink.click();
}

// function disableAllRemarkStyles() {
//     console.log(first)
// }