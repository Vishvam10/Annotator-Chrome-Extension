window.onload = async function () {

    const Screenshot = async function (tab) {
        const windowId = tab.windowId;
        return new Promise((res) => chrome.windows.get(windowId, { populate: true }, async function (window) {
          const width = window.tabs[0].width;
          const height = window.tabs[0].height;
      
          console.log("window", width, height);
          const [{ result }] = await chrome.scripting.executeScript({ 
            target: { tabId: tab.id }, 
            func: () => {
              return document.body.scrollHeight;
            }
          });
      
          const canvas = document.createElement("canvas");
          canvas.height = 0;
          const context = canvas.getContext("2d");
          const times = Math.ceil(result / height);
          const Sleep = (n) => new Promise((res, rej) => setInterval(res, n))
          const screenShots = [];
          for(let i = 0, top = 0; i < times; i++, top += height) {
            await chrome.scripting.executeScript({ 
              target: { tabId: tab.id }, 
              func: (top) => {
                console.log('scrolltop', top);
                document.documentElement.scrollTop = top;
              },
              args: [top]
            });
      
            await Sleep(550);
            await new Promise((res, rej) => {
              chrome.tabs.captureVisibleTab(
                windowId,
                { format: "png" },
                function (dataUrl) {
                  screenShots.push(dataUrl);
                  return res(true);
                }
              );
            })
          }
          const getDataImageDIM = async (src) => {
            const img = new Image();
            img.src = src;
            return new Promise((res) => img.onload = () => {
              res([img.width, img.height]);
            });
          }
      
          const [screenshotWidth, screenshotHeight] = await getDataImageDIM(screenShots[0]);
          const canvasHeight = (screenshotHeight * result) / height;
      
          canvas.height = canvasHeight;
          canvas.width = screenshotWidth;
      
          for(let i = 0, top = 0; i < screenShots.length; i++, top += screenshotHeight) {
            const img = document.createElement("img");
            img.src = screenShots[i];
      
            if(i === screenShots.length - 1) top = canvasHeight - screenshotHeight;
      
            await new Promise((res) => {
                img.onload = () => {
                  context.drawImage(img, 0, top);
                  res(true);
                }
            })
          }
          return res(canvas.toDataURL('image/png'));
        }));
    };
    
    document.getElementById("remark_start").addEventListener("click", async(e) => {
        e.preventDefault();
        e.stopPropagation();
        const started = await getDataFromStorage("remarkStarted");
        if(started === true) {
            e.target.innerText == "Stop Annotation"
        } else {
            document.querySelector(".remark_init_container").classList.add("remark_init_container_resize");
            e.target.innerText = "Stop Annotation";
            const tab = await getCurrentTab();
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["/scripts/injectedScript.js"],
            });
        }
    })

    const screenShotBtn = document.getElementById("remarkTakeScreenShot");
    screenShotBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
    
        const tab = await getCurrentTab();
        const dataURI = await Screenshot(tab);
        console.log(dataURI);
        
        chrome.tabs.sendMessage(tab.id,{
          message: dataURI
        });
    })
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
    console.log("reached : ", key)
    return new Promise((resolve) => {
            chrome.storage.local.get([key], function(res) {
                resolve(res);
            })
        }
    )
}