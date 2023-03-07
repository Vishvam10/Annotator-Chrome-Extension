window.onload = async function () {
  
  const storageData = await getDataFromStorage(null);
  const email = storageData["remark_email"];

  console.log("storage data  : ", storageData, email)

  // Check if the user has signed in
  if(email !== null) {
    renderUserStats();
  } else {
    renderSignupForm();
  }
  

}
  
async function handleInit() {

  setDataToStorage("remark_running", true);
  
  const tab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["/scripts/injectedScript.js"],
  });

  let dataURICheck = await getDataFromStorage("remark_screenshot_datauri");
  dataURICheck = dataURICheck["remark_screenshot_datauri"];

  if(!dataURICheck || dataURICheck === null) {
    const dataURI = await handleScreenshot();
    setDataToStorage("remark_screenshot_datauri", dataURI);
  } 


  window.close();

}

async function handleSignout() {  
  setDataToStorage("remark_email", null);
  setDataToStorage("remark_running", false);
  setDataToStorage("remark_screenshot_datauri", null);

 
  const tab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["/scripts/injectedScript.js"],
  });

  return;


}

async function handleScreenshot() {
  
  const tab = await getCurrentTab();
  const dataURI = await takeScreenShot(tab);
  console.log(dataURI);
  
  return dataURI;
}

async function takeScreenShot(tab) {
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


// *************** Render functions ****************


function renderSignupForm() {
  const markup =  `
    <form id="userSignupForm">
      <div class="remark_field">
          <label for="email" class="remark_form_label">Email</label>
          <input type="email" name="email" class="remark_form_input" style="margin: 0rem -0.6rem 0rem 0rem;">
      </div>
      <button type="button" class="remark_standard_button" id="signupBtn">Create Account</button>
    </form>
  `

  document.querySelector(".remark_popup_container").insertAdjacentHTML("afterbegin", markup);
  const signupForm = document.getElementById("userSignupForm");
  const signupBtn = document.getElementById("signupBtn");

  if(signupForm) {
    signupBtn.addEventListener("click", async(e) => {
      e.preventDefault();
      e.stopPropagation();

      const formData = new FormData(signupForm);
      logFormData(formData);
      
      const url = "http://localhost:3000/api/create-user"
      const data = JSON.stringify(Object.fromEntries(formData));

      // const res = await POST(url, data);
      // console.log("result : ", res)
      // if(res.status === 200 || res.msg === "This email is already registered.") {
      removeHTMLElement(signupForm);
      // setDataToStorage("remark_email", JSON.parse(data)["email"])
      setDataToStorage("remark_email", "sample@gmail.com");
      renderUserStats();
        // return;
      // }

    })
  }
  return;

}

async function renderUserStats(data) {

  
  const dummyData = {
    "users": [
      {
        "_id": "63fa3a398b9f0f6f3b27d574",
        "email": "ravi.lamkoti@contentstack.com",
        "count": 12,
        "files": [
          "6155b9a58f80c68fa8faace12",
          "f6b1f7c26677bf9e9b4762b00"
        ]
      },
      {
        "_id": "63fa3aaf8b9f0f6f3b27d575",
        "email": "ravi.lamkoti+1@contentstack.com",
        "count": 8
      },
      {
        "_id": "asdfasf",
        "email": "asdad@contentstack.com",
        "count": 4
      },
      {
        "_id": "af2f[df",
        "email": "manish@contentstack.com",
        "count": 2
      },
      {
        "_id": "asdfasf",
        "email": "asdad@contentstack.com",
        "count": 1
      },
      {
        "_id": "6404d19233a54271711f2eae",
        "username": "Test",
        "password": "sample1234",
        "email": "sample@gmail.com",
        "count": 0,
        "files": [
          "b8587c1ba43398ce3dbb0ce02"
        ]
      }
    ]
  }

  const users = dummyData["users"];
  let curUserEmail, curUserPos=-1, curUserCount;

  const storageData = await getDataFromStorage(null);
  const email = storageData["remark_email"];
  const running = storageData["remark_running"]


  let markup = `
    <span class="remark_user_info">
      Signed in as <b>${email}</b>      
    </span>
    <table id="remark_scoreboard">
      <tr style="background-color: var(--remark-color-primary); color: var(--remark-color-white);">
        <th style="width: 10%">Pos.</th>
        <th style="width: 80%">Name</th>
        <th style="width: 10%">Points</th>
      </tr>
  `

  for(let i=0; i<users.length; i++) {

    if(i < 3) {
      const em = users[i]["email"].split("@")[0].substring(0, 12)
      markup += `
        <tr>
          <td>${i}</td>
          <td>${em}</td>
          <td>${users[i]["count"]}</td>
        </tr>
      `
    }

    if(users[i]["email"] === email) {
      curUserPos = i+1;
      curUserEmail = users[i]["email"].split("@")[0].substring(0, 12);
      curUserCount = users[i]["count"];
    }

  }

  if(curUserPos > 3) {
    markup += `
      <tr>
        <td>...</td>
        <td>...</td>
        <td>...</td>
      </tr>
      <tr>
        <td>${curUserPos}</td>
        <td>${curUserEmail}</td>
        <td>${curUserCount}</td>
      </tr>
    `

  }

  markup += `
    </table>
    <button type="button" class="remark_standard_button" id="signoutBtn">Sign Out</button>
  `;
    
  console.log("in user stats : ", running, storageData)

  if(running !== true) {
    markup += `
      <button type="button" class="remark_standard_button" id="remark_start">Start Annotation</button>
    `
  } else {
    handleInit();
  }
  
  document.querySelector(".remark_popup_container").insertAdjacentHTML("beforeend", markup);

  const initBtn = document.getElementById("remark_start");
  if(initBtn) {
    initBtn.addEventListener("click", handleInit)
  }

  const signoutBtn = document.getElementById("signoutBtn");
  signoutBtn.addEventListener("click", handleSignout)

  return;

}

function renderErrorMessage(msg, pos, node) {
  const markup = `
    <p style="color: var(--remark-color-danger);">${msg}</p>
  `
  if(node) {
    node.insertAdjacentHTML(pos, markup);
  }
}


// ****************** HTTP methods *****************


async function POST(url, data, contentType) {

  try {
    let res = await fetch(url, {
      method: "POST",
      headers : {
        "Content-type" : contentType
      },
      body : data
    })
  
    res = await res.json();
    return res;
  } catch(e) {
    console.log("ERROR IN POST REQUEST : ", e.message);
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
        [key]: value 
    });
} catch(e) {
    console.log("chrome error : ", e.message)
}
}

function getDataFromStorage(key) {
  let k = null;
  if(key !== null) {
    k = [key]
  }
  return new Promise((resolve) => {
      chrome.storage.local.get(k, function(res) {
      resolve(res);
    })
  }
)
}

function clearDataFromStorage(keys=[], all=true) {

  if(all === true) {
    chrome.storage.local.clear(function() {
      console.log("ASDASD")
      var error = chrome.runtime.lastError;
      if (error) {
          console.error(error);
      }
    });
  } else {
    chrome.storage.local.remove(keys,function(){
      var error = chrome.runtime.lastError;
         if (error) {
             console.error(error);
         }
     })
  }


}


// *************** Utility functions *************** 


function logFormData(formData) {
  for(let e of Array.from(formData)) {
    console.log(e[0], " : ", e[1])
  }
}

function validateForm(formData) {
  let pattern;
  for(let e of Array.from(formData)) {
    let k = e[0];
    let v = String(e[1]);
    
    if(v.length > 0) {
      v = v.toLowerCase();
      if(k === "username") {
  
        // Only letters and numbers
        pattern = /^[a-zA-Z0-9]+$/;
        return pattern.test(v);
  
      } else if(k === "password") {
        
        // Min 8 letter password, with at least a symbol, upper and lower case letters and a number
        pattern = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/
        return pattern.test(v);
  
      } else if(k === "email") {
  
        pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return pattern.test(v);
  
      }
    } else {
      return false;
    }


  }

}

function removeHTMLElement(ele) {
  if(ele && ele.parentElement) {
      ele.parentElement.removeChild(ele);
  }
  return;
}

