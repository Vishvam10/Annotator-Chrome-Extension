var screenShotFile;

console.log("loaded", document)
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log("received : ", req["dataURI"])
    try {
        if(req["dataURI"]) {
            screenShotBlob = dataURIToBlob(res["dataURI"]);
        }
    } catch(e) {
        console.log("ERROR : ", e.message)
    }
})


function dataURIToBlob(dataURI) {
    const splitDataURI = dataURI.split(',')
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

    const ia = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
}

function downloadFile(dataURI, fileName) {
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURI;
    downloadLink.download = fileName;
    downloadLink.click();
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