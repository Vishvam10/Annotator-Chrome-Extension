window.onload = async function () {


  // Check if the user has logged in
  

  // If so, display the startStopBtn


  // Else, display the login form
  renderLoginForm()


  // const startStopBtn = document.getElementById("remark_start")
  // startStopBtn.addEventListener("click", handleInit);

}
  
async function handleInit(e) {
  e.preventDefault();
  e.stopPropagation();

  // TODO :  Check if already running

  e.target.innerText = "Stop Annotation";
  const tab = await getCurrentTab();
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/scripts/injectedScript.js"],
  });

  window.close();

}

async function handleScreenshot(e) {
  e.preventDefault();
  e.stopPropagation();

  const tab = await getCurrentTab();
  const dataURI = await takeScreenShot(tab);
  console.log(dataURI);
  
  chrome.tabs.sendMessage(tab.id, { dataURI: dataURI }, (res) => {
      console.log("response from content script in popup.js : ", res)
    }
  );
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
  return new Promise((resolve) => {
              chrome.storage.local.get([key], function(res) {
              resolve(res);
          })
      }
  )
}

function removeHTMLElement(ele) {
  if(ele && ele.parentElement) {
      ele.parentElement.removeChild(ele);
  }
  return;
}


function renderUserStats() {
  const markup = `
    <div class="remark_user_stats">
      <img src="./assets/sample.jpg" alt="Sample Face" class="remark_user_image">
      <span class="remark_user_info">
          <h4 class="remark_username">John Doe</h4>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="#ebaf09" d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935zM3.504 1c.007.517.026 1.006.056 1.469c.13 2.028.457 3.546.87 4.667C5.294 9.48 6.484 10 7 10a.5.5 0 0 1 .5.5v2.61a1 1 0 0 1-.757.97l-1.426.356a.5.5 0 0 0-.179.085L4.5 15h7l-.638-.479a.501.501 0 0 0-.18-.085l-1.425-.356a1 1 0 0 1-.757-.97V10.5A.5.5 0 0 1 9 10c.516 0 1.706-.52 2.57-2.864c.413-1.12.74-2.64.87-4.667c.03-.463.049-.952.056-1.469H3.504z"/></svg>
      </span>

      <span class="remark_field">
          <h4>Leaderboard Position</h4>
          <h4>2</h4>
      </span>
      <span class="remark_field">
          <h4>Current Status</h4>
          <h4>Supreme</h4>
      </span>
      <span class="remark_field">
          <h4>Number of websites annotated</h4>
          <h4>24</h4>
      </span>  
    </div>
  `

  document.querySelector(".remark_popup_container").insertAdjacentHTML("afterbegin", markup);
  return;

}


function renderLoginForm() {
  const markup = `
    <form id="userLoginForm">
      <div class="remark_field">
          <label for="username" class="remark_form_label">Username</label>
          <input type="text" name="username" class="remark_form_input">
      </div>
      <div class="remark_field">
          <label for="password" class="remark_form_label">Password</label>
          <input type="password" name="password" class="remark_form_input">
      </div>
      <button type="button" class="remark_standard_button" id="loginBtn">Login</button>
      <span style="font-size: 1.2rem;">
          Don't have an account ? 
          <span id="loginToSignupButton">Create One</span>
      </span>
    </form>
  `;

  document.querySelector(".remark_popup_container").insertAdjacentHTML("afterbegin", markup);
  const loginForm = document.getElementById("userLoginForm");
  const loginToSignupButton = document.getElementById("loginToSignupButton");
  const loginBtn = document.getElementById("loginBtn");

  if(loginForm) {
    if(loginToSignupButton) {
      loginToSignupButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        removeHTMLElement(loginForm);
        renderSignupForm();
        return;
      })
    }
  
    if(loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        const formData = new FormData(loginForm);
        logFormData(formData);
        const url = "127.0.0.1:8000/api/user"
        
        const res = POST(url, formData, "multipart/form");
        console.log(res, res.status, typeof(res.status))
        
        if(res.status === 200) {
          removeHTMLElement(loginForm);
          renderUserStats();
          return;
        }
  
      })
    }
  }
  return;
}

function renderSignupForm() {
  const markup =  `
    <form id="userSignupForm">
      <div class="remark_field">
          <label for="username" class="remark_form_label">Username</label>
          <input type="text" name="username" class="remark_form_input">
      </div>
      <div class="remark_field">
          <label for="email" class="remark_form_label">Email</label>
          <input type="email" name="email" class="remark_form_input" style="margin: 0rem -0.6rem 0rem 0rem;">
      </div>
      <div class="remark_field">
          <label for="password" class="remark_form_label">Password</label>
          <input type="password" name="password" class="remark_form_input">
      </div>
      <button type="button" class="remark_standard_button" id="signupBtn">Create Account</button>
      <span style="font-size: 1.2rem;">
          Already have an account ? 
          <span id="signupToLoginBtn">Login here</span>
      </span>
    </form>
  `

  document.querySelector(".remark_popup_container").insertAdjacentHTML("afterbegin", markup);
  const signupForm = document.getElementById("userSignupForm");
  const signupToLoginBtn = document.getElementById("signupToLoginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if(signupForm) {
    if(signupToLoginBtn) {
      signupToLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        removeHTMLElement(signupForm);
        renderLoginForm();
        return;
      })
    }
  
    if(signupBtn) {
      signupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        const formData = new FormData(signupForm);
        logFormData(formData);
        const url = "127.0.0.1:8000/api/user"

        const res = POST(url, formData, "multipart/form");
        
        if(res.status === 200) {
          removeHTMLElement(signupForm);
          renderLoginForm();
          return;
        }      
  
      })
    }
  }
  return;

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


function POST(url, data, contentType="application/json") {

  // try {
  //   let res = await fetch(url, {
  //     headers : {
  //       "Content-Type" : contentType
  //     },
  //     body : data
  //   })
  
  //   res = await res.json();
  //   return res;
  // } catch(e) {
  //   console.log("ERROR IN POST REQUEST : ", e.message)
  // }

  console.log(data)

  const res = {
    status: 200,
    message: "Success"
  }
  return res;

}

function logFormData(formData) {
  for(let e of Array.from(formData)) {
    console.log(e[0], " : ", e[1])
  }
}