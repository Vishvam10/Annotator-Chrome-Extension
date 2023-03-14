window.onload = async function () {
  const storageData = await getDataFromStorage(null);
  const email = storageData["remark_email"];
  const running = storageData["remark_running"];

  // Check if the user has signed in
  if (email !== null) {
    renderUserStats();
  } else {
    renderSignupForm();
  }
  
};

var BACKEND_URL = "http://localhost:3000/api"
// var BACKEND_URL = "https://data-science-theta.vercel.app/api"

async function handleInit() {
  
  // const remarkRunningStorageData = await getDataFromStorage("remark_running");
  // const running = remarkRunningStorageData["remark_running"];

  // if(running == true) {
  //   return;
  // } else {
  const initBtn = document.getElementById("remark_start");
  initBtn.removeEventListener("click", handleInit);
  initBtn.classList.add("remark_fade");
  initBtn.innerText = "Running ...";
  
  setDataToStorage("remark_running", true);
  
  const tab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["/scripts/injectedScript.js"],
  });
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["scripts/style.css"],
  })
  return;
// }
    
}

async function handleSignup(signupForm) {
  const formData = new FormData(signupForm);
  logFormData(formData);
  const signupBtn = document.getElementById("signupBtn");
  signupBtn.innerText = "Registering ..."

  const url = `${BACKEND_URL}/create-user`;
  console.log("URL : ", url)
  const data = JSON.stringify(Object.fromEntries(formData));

  const res = await POST(url, data);
  if (
    res.status === 200 ||
    res.msg === "User is registered." ||
    res.msg === "This email is already registered."
  ) {
    removeHTMLElement(signupForm);
    setDataToStorage("remark_email", JSON.parse(data)["email"]);
    renderUserStats();
    signupBtn.innerText = "Register"
    return;
  }
}

async function handlePushToServer() {
  const tab = await getCurrentTab()
  const url = `${BACKEND_URL}/submit`;
  
  const emailStorageData = await getDataFromStorage("remark_email");
  const email = emailStorageData["remark_email"];

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // const allAnnotations = document.querySelectorAll(
      //   "[data-annotation_id]"
      // );
      let res = []

      for(let annotation of window.annotations) {
        res.push(annotation);
      }
      console.log("res : ", res)
      return res;
    },
  });

  const labels = result["result"]
  const screenshotDataURI = await handleScreenshot();

  console.log("all labels : ", result, result["result"])

  const jsn = JSON.stringify(labels);
  setDataToStorage("remark_annotation_data", jsn);
  const blob = new Blob([jsn], { type: "application/json" });
  
  const imgFile = dataURItoFile(screenshotDataURI, "screenshot.png");
  const labelFile = new File([ blob ], "labels.json");

  console.log(imgFile, labelFile);

  // downloadFile(dataURI, "s.jpg");
  // downloadFile(JSONDataURI, "labels.json");

  var myHeaders = new Headers();
  console.log("SUBMIT EMAIL : ", email)
  myHeaders.append("email", String(email));
  
  var formdata = new FormData();
  formdata.append("label", labelFile);
  formdata.append("image", imgFile);
  logFormData(formdata)

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formdata,
    redirect: 'follow'
  };

  const pushToServerBtn = document.getElementById("pushToServerBtn");
  pushToServerBtn.classList.add("remark_fade");
  pushToServerBtn.innerText = "Saving ...";
  pushToServerBtn.removeEventListener("click", handlePushToServer)
  
  let res = await fetch(url, requestOptions);
  res = await res.text();
  
  console.log("res : ", res, typeof(res), res.includes("Submitted"));
  
  if(res && res.includes("Submitted")) {
    console.log("SUCCESSFUL SUBMISSION !");
    pushToServerBtn.classList.remove("remark_fade");
    pushToServerBtn.innerText = "Save Annotations";
    pushToServerBtn.addEventListener("click", handlePushToServer)
  } else {
    pushToServerBtn.classList.remove("remark_fade");
    pushToServerBtn.classList.add("remark_error");
    pushToServerBtn.innerText = "Some Error Occured";
    pushToServerBtn.addEventListener("click", handlePushToServer)
  }

}

async function handleSignout() {
  setDataToStorage("remark_email", null);
  setDataToStorage("remark_running", false);
  setDataToStorage("remark_screenshot_datauri", null);
  setDataToStorage("remark_annotation_data", null);

  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      location.reload();
    },
  });

  window.close();
}

async function handleScreenshot() {
  const tab = await getCurrentTab();
  const dataURI = await takeScreenShot(tab);
  console.log(dataURI);
  downloadFile(dataURI, "s.jpg");

  return dataURI;
}


// *************** Render functions ****************


function renderSignupForm() {
  const markup = `
    <span class="remark_header">
      <h2 class="remark_title">ReMark</h2>
    </span>
    <form id="userSignupForm">
      <div style="float:left; width: 100%; margin: 0rem 1rem 0rem 0rem;">
          <label for="email" class="remark_form_label">Email</label>
          <input type="email" id="email" name="email" class="remark_form_input" placeholder="Enter your email ID">
      </div>
      <button type="button" class="remark_standard_button" id="signupBtn">Register</button>
    </form>
  `;

  document
    .querySelector(".remark_popup_container")
    .insertAdjacentHTML("afterbegin", markup);
  const signupForm = document.getElementById("userSignupForm");
  const signupBtn = document.getElementById("signupBtn");

  if (signupForm) {
    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSignup(signupForm);
    });
  }
  return;
}

async function renderUserStats() {
  const url = `${BACKEND_URL}/scoreboard`;
  const data = await GET(url);
  const users = data["users"];
  let curUserEmail,
    curUserPos = -1,
    curUserCount;

  const storageData = await getDataFromStorage(null);
  const email = storageData["remark_email"];

  if(email == undefined || !email || email == "" || email == null) {
    renderSignupForm();
    return;
  } 

  let markup = `
    <span class="remark_user_info">
      <p>Signed in as</p>
      <h4 class="remark_user_email">${email}</h4>      
    </span>
    <table id="remark_scoreboard">
      <tr style="background-color: var(--remark-color-primary); color: var(--remark-color-white);">
        <th style="width: 10%">Pos.</th>
        <th style="width: 80%">Name</th>
        <th style="width: 10%">Points</th>
      </tr>
  `;

  for (let i = 0; i < users.length; i++) {
    if (users[i]["email"] === email) {
      curUserPos = i + 1;
      curUserEmail = users[i]["email"].split("@")[0].substring(0, 12);
      curUserCount = users[i]["count"];
    } 
  }
  for (let i = 0; i < 10; i++) {
    const em = users[i]["email"].split("@")[0].substring(0, 12);
    if(i == curUserPos - 1) {
      markup += `
        <tr style="background: var(--remark-color-warning); font-weight: bold;">
          <td>${i+1}</td>
          <td>${em}</td>
          <td>${users[i]["count"]}</td>
        </tr>
      `;
    } else {
      markup += `
        <tr>
          <td>${i+1}</td>
          <td>${em}</td>
          <td>${users[i]["count"]}</td>
        </tr>
      `;

    }
  }

  if (curUserPos > 10) {
    markup += `
      <tr>
        <td>...</td>
        <td>...</td>
        <td>...</td>
      </tr>
      <tr style="background: var(--remark-color-warning); font-weight: bold;">
        <td>${curUserPos}</td>
        <td>${curUserEmail}</td>
        <td>${curUserCount}</td>
      </tr>
    `;
  }

  markup += `
      </table>
      <span class="remark_button_container">
        <button type="button" class="remark_standard_button" id="pushToServerBtn">Save Annotations</button>
        <button type="button" class="remark_standard_button" id="remark_start">Start Annotation</button>
      </span>
      <button type="button" id="signoutBtn">Sign Out</button>
    `;
        
  document
    .querySelector(".remark_popup_container")
    .insertAdjacentHTML("beforeend", markup);

  const initBtn = document.getElementById("remark_start");
  if (initBtn) {
    initBtn.addEventListener("click", handleInit);
  }

  const pushToServerBtn = document.getElementById("pushToServerBtn");
  if(pushToServerBtn) {
    pushToServerBtn.addEventListener("click", handlePushToServer);
  } else {
    handleSignout();
  }

  const signoutBtn = document.getElementById("signoutBtn");
  signoutBtn.addEventListener("click", handleSignout);

  return;
}


// ****************** HTTP methods *****************


async function POST(url, data, contentType = "application/json") {
  try {
    let res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-type": contentType,
      },
      body: data,
    });

    res = await res.json();
    return res;
  } catch (e) {
    console.log("ERROR IN POST REQUEST : ", e.message);
  }
}

async function GET(url) {
  try {
    let res = await fetch(url);
    res = await res.json();
    return res;
  } catch (e) {
    console.log("ERROR IN GET REQUEST : ", e.message);
  }
}

// ****************** Chrome APIs ******************


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
      [key]: value,
    });
  } catch (e) {
    console.log("CHROME ERROR : ", e.message);
  }
}

function getDataFromStorage(key) {
  let k = null;
  if (key !== null) {
    k = [key];
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(k, function (res) {
      resolve(res);
    });
  });
}

function clearDataFromStorage(keys = [], all = true) {
  if (all === true) {
    chrome.storage.local.clear(function () {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
  } else {
    chrome.storage.local.remove(keys, function () {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
  }
}

// *************** Utility functions ***************

function logFormData(formData) {
  for (let e of Array.from(formData)) {
    console.log(e[0], " : ", e[1]);
  }
}

function validateForm(formData) {
  let pattern;
  for (let e of Array.from(formData)) {
    let k = e[0];
    let v = String(e[1]);

    if (v.length > 0) {
      v = v.toLowerCase();
      if (k === "username") {
        // Only letters and numbers
        pattern = /^[a-zA-Z0-9]+$/;
        return pattern.test(v);
      } else if (k === "password") {
        // Min 8 letter password, with at least a symbol, upper and lower case letters and a number
        pattern = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        return pattern.test(v);
      } else if (k === "email") {
        pattern =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(v);
      }
    } else {
      return false;
    }
  }
}

function removeHTMLElement(ele) {
  if (ele && ele.parentElement) {
    ele.parentElement.removeChild(ele);
  }
  return;
}

function downloadFile(dataURI, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = dataURI;
  downloadLink.download = fileName;
  downloadLink.click();
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
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

async function takeScreenShot(tab) {
  const windowId = tab.windowId;
  return new Promise((res) =>
    chrome.windows.get(windowId, { populate: true }, async function (window) {
      const width = window.tabs[0].width;
      const height = window.tabs[0].height;
      // set all position fixed => absolute, sticky => relative
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const els = Array.from(document.querySelectorAll("*"));
          const positionTo = { fixed: "absolute", sticky: "relative" };
          document.body.style.overflow = "hidden";
          const menu = document.getElementById("remarkMainMenu");
          if(menu) {
            removeHTMLElement(menu);
          }
          for (const el of els) {
            if (
              el.style["position"] &&
              ["fixed", "sticky"].includes(el.style["position"])
            ) {
              const position = el.style["position"];
              el.style.setProperty("position", positionTo[position], "important");
              el.setAttribute("data-position", position);
            } else {
              const styles = getComputedStyle(el);
              const position = styles.getPropertyValue("position");
              if (position && ["fixed", "sticky"].includes(position)) {
                el.style.setProperty("position", positionTo[position], "important");
                el.setAttribute("data-position", position);
              }
            }
            el.classList.remove("highlight_element_strong")
            el.classList.remove("highlight_element_light")
            el.classList.remove("highlight_element_selected");
            const id = el.dataset.annotation_id;
            console.log("reached 1 : ", id)
            if(id) {
              console.log("reached 2 : ", id)
              const hid = `${id}_highlight`;
              const ele = document.getElementById(hid);
              removeHTMLElement(ele);
            }
          }         
        },
      });

      console.log("window", width, height);

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.body.scrollHeight;
        },
      });

      const canvas = document.createElement("canvas");
      canvas.height = 0;
      const context = canvas.getContext("2d");
      const times = Math.ceil(result / height);
      const Sleep = (n) => new Promise((res, rej) => setInterval(res, n));
      const screenShots = [];
      for (let i = 0, top = 0; i < times; i++, top += height) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (top) => {
            // console.log("scrolltop", top);
            document.documentElement.scrollTop = top;
          },
          args: [top],
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
        });
      }

      const getDataImageDIM = async (src) => {
        const img = new Image();
        img.src = src;
        return new Promise(
          (res) =>
            (img.onload = () => {
              res([img.width, img.height]);
            })
        );
      };

      const [screenshotWidth, screenshotHeight] = await getDataImageDIM(
        screenShots[1]
      );
      const canvasHeight = (screenshotHeight * result) / height;

      canvas.height = canvasHeight;
      canvas.width = screenshotWidth;

      for (
        let i = 0, top = 0;
        i < screenShots.length;
        i++, top += screenshotHeight
      ) {
        const img = document.createElement("img");
        img.src = screenShots[i];

        if (i === screenShots.length - 1) top = canvasHeight - screenshotHeight;

        await new Promise((res) => {
          img.onload = () => {
            context.drawImage(img, 0, top);
            res(true);
          };
        });
      }
      const base64 = await res(canvas.toDataURL("image/jpeg"));

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const els = Array.from(document.querySelectorAll("[data-position]"));
          document.body.style.overflow = "auto";
          for (const el of els) {
            el.style["position"] = el.getAttribute("data-position");
            el.removeAttribute("data-position");
          }
        },
      });
      return base64;
    })
  );
}