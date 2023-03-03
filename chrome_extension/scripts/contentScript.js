var screenShotFile;

console.log("loaded", document)
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log("received : ", req["dataURI"])
    try {
        if(req["dataURI"]) {
            screenShotBlob = dataURIToBlob(res["dataURI"]);
            sendImageToSrver(screenShotBlob)

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

async function sendImageToSrver(imgBlob) {

    const url = "http://ec2-3-93-77-238.compute-1.amazonaws.com:8000/send_to_s3_images"
    console.log("img blob : ", imgBlob)

    const formData = new FormData()
    formData.append("img", imgBlob)

    let data = await fetch(url, {
        mode: "cors",
        body: formData,
        method: "POST"
    });

    if(data.status == 200) { 
        data = await data.json();
        data = JSON.parse(data);
        console.log("data : ", data);

        // Store the ID in localStorage so that the injected script can access it
        
        // setDataToStorage("screenshot_id", data["id"])
    }

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