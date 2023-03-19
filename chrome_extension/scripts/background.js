var BACKEND_URL = "http://localhost:3000/api";

chrome.runtime.onMessage.addListener(async function (
  data,
  sender,
  sendResponse
) {
  if (data.action === "pushToServer") {
    console.log("data : ", data);
    try {
      const url = `${BACKEND_URL}/submit`;
	  const email = data.email;

      const imgFile = dataURItoFile(data.screenshotDataURI, "screenshot.png");

      const labelBlob = new Blob([data.labels], { type: "text/plain" });
      const labelFile = new File([labelBlob], "labels.txt", {
        type: "text/plain",
      });

	  console.log("imgFile : ", imgFile)
	  console.log("labelFile : ", labelFile)

      var myHeaders = new Headers();
      myHeaders.append("email", String(email));

      var formdata = new FormData();
      formdata.append("label", labelFile);
      formdata.append("image", imgFile);
      logFormData(formdata);

      const requestOptions = {
        method: "POST",
        mode: "cors",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      let res = await fetch(url, requestOptions);
      res = await res.text();

      console.log("res : ", res, typeof res, res.includes("Submitted"));

      if (res && res.includes("Submitted")) {
        console.log("SUCCESSFUL SUBMISSION !");
        sendResponse("success");
      } else {
        console.log("FAILED : ", res);
        sendResponse("failed");
      }
    } catch (e) {
      sendResponse({
        error: e.message,
      });
    }

    return true; // keep the message channel open for sendResponse()
  }
  return true;
});


function logFormData(formData) {
  for (let e of Array.from(formData)) {
    console.log(e[0], " : ", e[1]);
  }
}

function downloadFile(dataURI, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = dataURI;
  downloadLink.download = fileName;
  downloadLink.click();
  downloadLink.remove();
}

function dataURIToBlob(dataURI) {
  const splitDataURI = dataURI.split(",");
  const byteString =
    splitDataURI[0].indexOf("base64") >= 0
      ? atob(splitDataURI[1])
      : decodeURI(splitDataURI[1]);
  const mimeString = splitDataURI[0].split(":")[1].split(";")[0];

  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

  return new Blob([ia], { type: mimeString });
}

function dataURItoFile(dataurl, filename) {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}