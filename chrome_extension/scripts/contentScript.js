(async () => {

  window.annotations = [];

  console.log("loaded contentscript ...");
  
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("message : ", request, sender)

      if(request.from == "popup") {
        if(request.message == "remark_init") {
          console.log("ASD")
          renderMenu()
        }
      }

    }
  );



})();

// ***************** Global Variables ****************

// var BACKEND_URL = "https://data-science-theta.vercel.app/api";
var BACKEND_URL = "http://localhost:3000/api";

var REMARK_RUNNING = false;
var REMARK_GROUP_ACTIONS = false;
var REMARK_DOWNLOAD_LOCAL = false;

var POPUP_PORT, BACKGROUND_PORT;

REMARK_ADDITIONAL_STYLES = null;
annotationNodes = [];

var tempBuffer = [];
var curNode;
var DEBUG = true;

var dragging = false;


// ***************** Initialization ******************

async function remark_init() {
  const storageData = await getDataFromStorage("remark_running");
  const running = storageData["remark_running"];

  const temp = running + "," + String(location.href);
  setDataToStorage("remark_running", temp);

  REMARK_RUNNING = true;

  console.log("POPUP AND BACKGROUND CONNECTION CHECK : ");

  BACKGROUND_PORT = chrome.runtime.connect({ name: "injected" });

  // Listen for data from the background script
  BACKGROUND_PORT.onMessage.addListener(async function (message) {
    console.log("Received message from background script:", message);

    // Do something with the data
    if (message.result == "screenshotSuccess") {
      const storageData = await getDataFromStorage("remark_running");
      const running = storageData["remark_running"];
      const temp = running.replace(String(location.href), "");
      setDataToStorage("remark_running", temp);

      const messagePopupCheck = document.getElementById("messagePopup");
      if (messagePopupCheck) {
        removeHTMLElement(messagePopupCheck);
      }

      const markup = `
        <span class="remark_message_popup" id="messagePopup">
            <p class="remark_message_popup_content">Save Annotation : Success</p>
        </span>
      `;
      document.body.insertAdjacentHTML("beforeend", markup);

      const messagePopup = document.getElementById("messagePopup");
      removeHTMLElement(messagePopup)
      loadAllAnnotations()

    } else {
      const messagePopupCheck = document.getElementById("messagePopup");
      if (messagePopupCheck) {
        removeHTMLElement(messagePopupCheck);
      }

      const markup = `
        <span class="remark_message_popup" id="messagePopup">
            <p class="remark_message_popup_content" style="color: var(--remark-color-danger-darker);">Save Annotation : Failed</p>
        </span>
      `;

      document.body.insertAdjacentHTML("beforeend", markup);

      const messagePopup = document.getElementById("messagePopup");
      removeHTMLElement(messagePopup);

    }
  });

  // console.log("DOM AND DEBUG CHECK : ", document.body, DEBUG);
  const style = document.createElement("style");
  window.REMARK_ADDITIONAL_STYLES = style;
  document.body.appendChild(style);

  disableAllCickableElements();
  loadAllAnnotations();
  startAnnotationProcess();
}

async function remark_destroy() {
  const storageData = await getDataFromStorage("remark_running");
  const running = storageData["remark_running"];

  REMARK_RUNNING = false;

  console.log("goint to destroy ...", running.includes(String(location.href)), running)

  stopHighlightElements();
  stopAnnotationProcess();
}

function startAnnotationProcess() {
  document.body.addEventListener("click", clickListener, false);
  document.body.addEventListener("mouseover", mouseOverListener, false);
  document.body.addEventListener("mouseout", mouseOutListener, false);
  document.addEventListener("scroll", scrollListener, false);
}

function stopAnnotationProcess() {
  // document.body.removeEventListener("click", clickListener);
  // document.body.removeEventListener("mouseover", mouseOverListener);
  // document.body.removeEventListener("mouseout", mouseOutListener);
  // document.body.removeEventListener("scroll", scrollListener);
  document.addEventListener("click", () => {
    return false;
  });
  document.addEventListener("mouseover", () => {
    return false;
  });
  document.addEventListener("mouseout", () => {
    return false;
  });
  document.addEventListener("scroll", () => {
    return false;
  })

  return;
}

// ******************* Listeners ********************

function clickListener(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();

  const t = e.target;
  if (t.tagName == "BUTTON") {
    return false;
  }

  if (e.altKey) {
    // Delete label
    if (t.classList.contains("highlight_element_strong")) {
      if (REMARK_GROUP_ACTIONS) {
        const className = String(
          e.target.className.replace("highlight_element_strong", "")
        );
        const elements = document.getElementsByClassName(className);
        handleBatchDelete(elements);
        for (let ele of elements) {
          ele.classList.remove("highlight_element_strong");
        }
      } else {
        handleDeleteLabel(t);
        t.classList.remove("highlight_element_strong");
      }
      if (DEBUG) {
        console.log("click -> delete annotation");
      }
    }
  } else {
    // Add label
    if (t.classList.contains("highlight_element_light")) {
      if (t.classList.contains("highlight_element_strong")) {
        return;
      }

      if (REMARK_GROUP_ACTIONS) {
        const className = String(
          e.target.className.replace("highlight_element_strong", "")
        );
        const nodes = document.getElementsByClassName(className);

        let elements = [];

        Array.from(nodes).forEach((ele) => {
          if (ele.tag == e.target.tag) {
            elements.push(ele);
          }
        });

        handleBatchCreate(elements);

        for (let ele of elements) {
          ele.classList.remove("highlight_element_light");
          ele.classList.add("highlight_element_strong");
        }
      } else {
        handleCreateLabel(t);
        t.classList.remove("highlight_element_light");
        t.classList.add("highlight_element_strong");
      }

      if (DEBUG) {
        console.log("click -> add annotation");
      }
    } 
  }
}

function mouseOverListener(e) {
  e.preventDefault();
  e.stopPropagation();

  const className = String(e.target.className);

  const elements = document.getElementsByClassName(className);
  Array.from(elements).forEach((ele) => {
    const tag = ele.tagName;
    if (ele.className) {
      if (
        ele.className.includes("remark_") ||
        ele.className.includes("highlight_element_strong")
      ) {
        return;
      }
    }
    if(tag == "IMG") {
      console.log("AFASDMAOSdj")
      ele.style.setProperty("display", "inline-block", "important");
    }
    tempBuffer.push(ele);
    ele.classList.add("highlight_element_light");
  });
}

function mouseOutListener(e) {
  e.preventDefault();
  e.stopPropagation();
  
  tempBuffer.forEach((ele) => {
    const tag = ele.tagName;
    
    if (ele.className) {
      if (
        ele.className.includes("remark_") ||
        ele.className.includes("highlight_element_strong")
        ) {
          return;
        }
      }
      if(tag == "IMG") {
        ele.style.setProperty("display", "", "important");
    }
    ele.classList.remove("highlight_element_light");
    
  });
  tempBuffer = [];
}

function scrollListener() {
  let ticking = false;
  // let lastScrollY = 0;
  if (!ticking) {
    // let currentScrollY = window.scrollY;
    // let direction;
    // if (currentScrollY > lastScrollY) {
    //   direction = "up";
    // } else {
    //   direction = "down";
    // }
    window.requestAnimationFrame(() => {
      updateTooltipPosition();
      ticking = false;
    });

    ticking = true;
  }
}

// ******************* Handlers ********************

function handleCreateLabel(targetHTMLElement) {
  const rect = targetHTMLElement.getBoundingClientRect();
  const x = Math.round(rect.x),
    y = Math.round(rect.y) + parseInt(window.scrollY),
    w = Math.round(rect.width),
    h = Math.round(rect.height);

  const className = targetHTMLElement.className.replace(
    "highlight_element_light",
    ""
  );

  const annotation = {
    id: Math.round(Math.random() * 10000),
    tag: targetHTMLElement.tagName.toLowerCase(),
    x: x,
    y: y,
    width: w,
    height: h,
    text: targetHTMLElement.innerText,
    parent: targetHTMLElement.parentNode.tagName.toLowerCase(),
    html_id: targetHTMLElement.id,
    html_class: className,
    html_xpath: getNodeXpath(targetHTMLElement).toLowerCase(),
    html_target: targetHTMLElement,
  };

  if (isValidAnnotation(annotation)) {
    window.annotations.push(annotation);

    const tooltipMarkup = createTagTooltipMarkup(annotation, "span");
    targetHTMLElement.insertAdjacentHTML("afterbegin", tooltipMarkup);
    annotationNodes.push([annotation["id"], annotation["y"]]);
    targetHTMLElement.dataset.annotation_id = annotation["id"];
    return;
  }

  return;
}

function handleEditLabel(targetHTMLElement, newTag) {
  if (targetHTMLElement) {
    if (targetHTMLElement.classList.contains("highlight_element_strong")) {
      const annotation_id = Number(targetHTMLElement.dataset.annotation_id);
      for (let ele of window.annotations) {
        if (ele["id"] == annotation_id) {
          ele["tag"] = newTag;
          updateTooltip(annotation_id, newTag);
          if (DEBUG) {
            console.log("edit : window.annotations : ", ele);
          }
          break;
        }
      }
    }
    return;
  }
  return;
}

function handleDeleteLabel(targetHTMLElement) {
  const annotation_id = Number(targetHTMLElement.dataset.annotation_id);

  let ind1, ind2;

  for (let i = 0; i < window.annotations.length; i++) {
    if (window.annotations[i]["id"] == annotation_id) {
      ind1 = i;
      break;
    }
  }

  for (let i = 0; i < annotationNodes.length; i++) {
    if (annotationNodes[i][0] == annotation_id) {
      ind2 = i;
      break;
    }
  }

  window.annotations.splice(ind1, 1);
  annotationNodes.splice(ind2, 1);

  removeTooltip(annotation_id);
  targetHTMLElement.classList.remove("highlight_element_selected");
  targetHTMLElement.classList.remove("highlight_element_strong");

  delete targetHTMLElement.dataset.annotation_id;

  if (DEBUG) {
    console.log("delete : window.annotations : ", annotationNodes);
  }
}

function handleBatchCreate(targetHTMLElements) {
  for (let i = 0; i < targetHTMLElements.length; i++) {
    const ele = targetHTMLElements[i];
    handleCreateLabel(ele);
  }
}

function handleBatchDelete(targetHTMLElements) {
  for (let i = 0; i < targetHTMLElements.length; i++) {
    const ele = targetHTMLElements[i];
    handleDeleteLabel(ele);
  }
}

function handleBatchEdit(targetHTMLElements, val) {
  console.log("batch edit : ", targetHTMLElements, val);
  for (let i = 0; i < targetHTMLElements.length; i++) {
    const ele = targetHTMLElements[i];
    handleEditLabel(ele, val);
  }
}

async function handleCreateTag(value) {
  console.log("creating tag : ", value)
  const val = value.trim().toLowerCase();
  if (val && val.length > 0) {
    const data = {
      title: val,
    };
    const res = await POST(`${BACKEND_URL}/labels`, data);
    if (res.msg == "Label created successfully!") {
      if (DEBUG) {
        console.log("add : labels : ", res);
      }
      renderMenu();
      return;
    } else {
      console.log(res);
    }
  }
}

function createTagTooltipMarkup(annotation, tag) {
  console.log("reached", annotation, tag)
  const top = parseInt(annotation["y"] - window.scrollY) + "px";
  const left = annotation["x"] + "px";

  const markup = `
    <span class="remark_tag_tooltip" style="top:${top}; left:${left}" id="${annotation["id"]}_tooltip">
      <p class="remark_tag_tooltip_info">${tag}</p>
    </span>
  `;
  

  return markup;
}

function updateTooltip(annotation_id, tag) {
  const id = `${annotation_id}_tooltip`;
  const ele = document.getElementById(id).children[0];

  if (ele) {
    ele.innerText = tag;
  }
}

function removeTooltip(annotation_id) {
  const id = `${annotation_id}_tooltip`;
  const ele = document.getElementById(id);

  if (ele) {
    removeHTMLElement(ele);
  }
}

function updateTooltipPosition() {
  // Can be optimized with the IntersectionObserverAPI

  for (let i = 0; i < annotationNodes.length; i++) {
    const id = `${annotationNodes[i][0]}_tooltip`;
    const top = annotationNodes[i][1];
    const tooltip = document.getElementById(id);
    if (tooltip) {
      const tooltipTop = top - parseInt(window.scrollY);
      tooltip.style.top = `${tooltipTop}px`;
    }
  }
}

async function handleScreenshot() {
  const dataURI = await takeScreenShot();
  // console.log("reached data uri : ", dataURI)
  return dataURI;
}

async function handlePushToServer() {
  const pushToServerButton = document.getElementById("pushToServerButton");
  pushToServerButton.classList.add("remark_fade");
  pushToServerButton.removeEventListener("click", handlePushToServer);

  const emailStorageData = await getDataFromStorage("remark_email");
  const email = emailStorageData["remark_email"];

  pushToServerButton.innerText = "Getting annotations";

  const messagePopupCheck = document.getElementById("messagePopup");
  if (messagePopupCheck) {
    removeHTMLElement(messagePopupCheck);
  }

  const messagePopup = document.getElementById("messagePopup");
  if (messagePopup) {
    messagePopup.children[0].innerText = "Getting annotations ...";
  } else {
    const markup = `
      <span class="remark_message_popup" id="messagePopup">
          <p class="remark_message_popup_content">Getting annotation ...</p>
      </span>
    `;
    document.body.insertAdjacentHTML("beforeend", markup);
  }

  let labels = [];

  const temp = window.annotations;

  temp.forEach((ele) => {
    labels.push([ele["tag"], ele["x"], ele["y"], ele["width"], ele["height"]]);
  });

  labels = labels.join("\n");

  if(DEBUG) {
    console.log("email : ", email);
    console.log("labels : ", labels);
  }

  const screenshotDataURI = await handleScreenshot();

  if (messagePopup) {
    messagePopup.children[0].innerText = "Taking screenshot ...";
  } else {
    const markup = `
      <span class="remark_message_popup" id="messagePopup">
          <p class="remark_message_popup_content">Taking screenshot ...</p>
      </span>
    `;
    document.body.insertAdjacentHTML("beforeend", markup);
  }

  const data = {
    action: "pushToServer",
    email: email,
    labels: labels,
    screenshotDataURI: screenshotDataURI,
  };

  saveAllAnnotations();
  sendMessageToBackground(data);
}

async function handleLocalDownload() {
  const temp = window.annotations;
  let labels = [];
  
  temp.forEach((ele) => {
    labels.push([ele["tag"], ele["x"], ele["y"], ele["width"], ele["height"]]);
  });

  labels = labels.join("\n");

  if(DEBUG) {
    console.log("labels : ", labels);
  }
  
  const screenshotDataURI = await handleScreenshot();

  downloadAnnotations(labels);
  downloadScreenshot(screenshotDataURI);

  const messagePopup = document.getElementById("messagePopup");
  if (messagePopup) {
    messagePopup.children[0].innerText = "Downloading locally ...";
  } else {
    const markup = `
      <span class="remark_message_popup" id="messagePopup">
          <p class="remark_message_popup_content">Downloading locally ...</p>
      </span>
    `;
    document.body.insertAdjacentHTML("beforeend", markup);
    const messagePopup = document.getElementById("messagePopup");
    setTimeout(() => {
      if(messagePopup) {
        removeHTMLElement(messagePopup);
      }
    }, 1500)
  }
}



// *************** Render functions ***************

function renderAllAnnotations(annotations) {
  for (let i = 0; i < annotations.length; i++) {
    const ele = annotations[i];
    const node = getElementByXpath(ele["html_xpath"]);
    if (node) {
      if (
        node.className.includes("remark_") ||
        node.className.includes("highlight_element_strong")
      ) {
        continue;
      } else {
        node.classList.remove("highlight_element_light");
        node.classList.add("highlight_element_strong");
        
        window.annotations.push(ele);
        const tooltipMarkup = createTagTooltipMarkup(ele, ele["tag"]);
        node.insertAdjacentHTML("afterbegin", tooltipMarkup);
        annotationNodes.push([ele["id"], ele["y"]]);
        node.dataset.annotation_id = ele["id"];
      }
    }
  }
}


  // let labelMarkup = "";
  // const data = await GET(`${BACKEND_URL}/labels`);
  // const labels = data["labels"];

  // for (let i = 0; i < labels.length; i++) {
  //   const val = labels[i];
  //   labelMarkup += `
  //     <option value="${val}" class="remark_">${val}</option>
  //   `;
  // }

  // const dropdown = document.getElementById("remark_tag_dropdown");
  // dropdown.addEventListener("input", checkValidity);
  // dropdown.addEventListener("keypress", checkValidityOnKeypress);

  // const dropdownOptions = document.getElementById("remark_tag_options");
  // dropdownOptions.addEventListener("click", (e) => {
  //   if (e.target.tagName.toLowerCase() === 'option') {
  //     // Get the value of the clicked option tag
  //     const selectedValue = e.target.value;
  //     console.log(`Selected value: ${selectedValue}`);
  //   }
  //   console.log("option change : ", e.target)
  // })

async function renderMenu() {

  if (document.getElementById("remarkMainMenu")) {
    removeHTMLElement(document.getElementById("remarkMainMenu"));
  }

  const defaulMenuOptionsMarkup = `
    <div class="remark_menu_option" title="Start annotation" id="startAnnotationBtn">
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><line x1="256" y1="96" x2="256" y2="56" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px"/><line x1="256" y1="456" x2="256" y2="416" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px"/><path d="M256,112A144,144,0,1,0,400,256,144,144,0,0,0,256,112Z" style="fill:none;stroke:#000;stroke-miterlimit:10;stroke-width:32px"/><line x1="416" y1="256" x2="456" y2="256" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px"/><line x1="56" y1="256" x2="96" y2="256" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px"/></svg>
    </div>
    <div class="remark_menu_option" title="Take screenshot and upload/download the data" id="screenshotBtn">
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><path d="M350.54,148.68l-26.62-42.06C318.31,100.08,310.62,96,302,96H210c-8.62,0-16.31,4.08-21.92,10.62l-26.62,42.06C155.85,155.23,148.62,160,140,160H80a32,32,0,0,0-32,32V384a32,32,0,0,0,32,32H432a32,32,0,0,0,32-32V192a32,32,0,0,0-32-32H373C364.35,160,356.15,155.23,350.54,148.68Z" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><circle cx="256" cy="272" r="80" style="fill:none;stroke:#000;stroke-miterlimit:10;stroke-width:32px"/><polyline points="124 158 124 136 100 136 100 158" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg>
    </div>
    <div class="remark_menu_option" title="Tag similar components" id="groupActionsBtn" data-groupactions="false">
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><rect x="48" y="48" width="176" height="176" rx="20" ry="20" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><rect x="288" y="48" width="176" height="176" rx="20" ry="20" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><rect x="48" y="288" width="176" height="176" rx="20" ry="20" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><rect x="288" y="288" width="176" height="176" rx="20" ry="20" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg>
    </div>
  `

  const markup = `
    <div class="remark_standard_menu_container" id="remarkMainMenu">
      <div class="remark_standard_menu_header">
          <p class="remark_main_heading">ReMark</p>
          <!-- <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><polyline points="328 112 184 256 328 400" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:48px"/></svg> -->
      </div>
      <div class="remark_menu_body"> 
          <div class="remark_menu_options">
              ${defaulMenuOptionsMarkup}
          </div>
      </div>
    </div> 
  `;

  document.body.insertAdjacentHTML("afterbegin", markup);

  // ************************ DRAGGING ************************

  const menu = document.getElementById("remarkMainMenu");
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  menu.addEventListener("mousedown", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TOGGLE" ||
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "SELECT" ||
      e.target.tagName === "LABEL"
    ) {
      return;
    }
    isDragging = true;
    dragOffset.x = e.offsetX;
    dragOffset.y = e.offsetY;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      menu.style.left = e.clientX - dragOffset.x + "px";
      menu.style.top = e.clientY - dragOffset.y + "px";
    }
  });

  document.addEventListener("mouseup", (e) => {
    isDragging = false;
  });

  // ****************** BUTTON EVENT LISTENERS *****************

  const groupActionsBtn = document.getElementById("groupActionsBtn");
  groupActionsBtn.addEventListener("click", (e) => {
    groupActionsBtn.style.backgroundColor = "var(--remark-color-primary);"
    groupActionsBtn.children[0].style.stroke = "var(--remark-color-white);"

    const check = groupActionsBtn.dataset.groupactions;

    console.log("click : group actions : ", check, typeof(check), REMARK_GROUP_ACTIONS)
    if (check === "true") {
      groupActionsBtn.classList.remove("remark_option_check");
      REMARK_GROUP_ACTIONS = false;
      groupActionsBtn.dataset.groupactions = "false";
    } else {
      groupActionsBtn.classList.add("remark_option_check");
      REMARK_GROUP_ACTIONS = true;
      groupActionsBtn.dataset.groupactions = "true";
    }
  });

  const startAnnotationBtn = document.getElementById("startAnnotationBtn");
  startAnnotationBtn.addEventListener("click", (e) => {
    console.log("click : start annotation : ", REMARK_RUNNING)
    if(REMARK_RUNNING) {
      console.log("reached : ", REMARK_RUNNING);
      remark_destroy();
    } else {
      remark_init();
    }
  })

  const screenshotBtn = document.getElementById("screenshotBtn");
  screenshotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const menu_options = document.querySelector(".remark_menu_options");
    Array.from(menu_options.children).forEach((ele) => {
      removeHTMLElement(ele);
    })

    const uploadDownloadMarkup = `
      <span style="font-size: 12px" id="menuBackBtn">Back</span>
      <div class="remark_menu_option" title="Upload to server" id="uploadToServerBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><path d="M320,367.79h76c55,0,100-29.21,100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69,0-113.44,45.79-128,91.2-60,5.7-112,43.88-112,106.4s54,106.4,120,106.4h56" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><polyline points="320 255.79 256 191.79 192 255.79" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><line x1="256" y1="448.21" x2="256" y2="207.79" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg>
      </div>
      <div class="remark_menu_option" title="Download locally" id="localDownloadBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" class="ionicon" viewBox="0 0 512 512"><path d="M320,336h76c55,0,100-21.21,100-75.6s-53-73.47-96-75.6C391.11,99.74,329,48,256,48c-69,0-113.44,45.79-128,91.2-60,5.7-112,35.88-112,98.4S70,336,136,336h56" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><polyline points="192 400.1 256 464 320 400.1" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><line x1="256" y1="224" x2="256" y2="448.03" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg>
      </div>
    `

    menu_options.insertAdjacentHTML("afterbegin", uploadDownloadMarkup);

    const menuBackBtn = document.getElementById("menuBackBtn");
    menuBackBtn.addEventListener("click", (e) => {
      console.log("click : back");
      Array.from(menu_options.children).forEach((ele) => {
        removeHTMLElement(ele);
      })
      renderMenu();
      
    })

    const uploadToServerBtn = document.getElementById("uploadToServerBtn");
    uploadToServerBtn.addEventListener("click", (e) => {
      console.log("click : upload");
    })

    const localDownloadBtn = document.getElementById("localDownloadBtn");
    localDownloadBtn.addEventListener("click", (e) => {
      console.log("click : download locally");
      handleLocalDownload()
    })

  })

}

// ****************** Tag utils *******************

function selectTagHandler(value) {
  const val = String(value);
  if (val != "remove_label") {
    if (REMARK_GROUP_ACTIONS) {
      const className = String(
        curNode.className
          .replace("highlight_element_strong", "")
          .replace("highlight_element_selected", "")
          .replace("highlight_element_light", "")
      );
      const elements = document.getElementsByClassName(className);
      handleBatchEdit(elements, val);
    } else {
      handleEditLabel(curNode, val);
    }
  } else {
    if (REMARK_GROUP_ACTIONS) {
      const className = String(
        curNode.className.replace("highlight_element_strong", "")
      );
      const elements = document.getElementsByClassName(className);
      handleBatchDelete(elements);
      for (let ele of elements) {
        ele.classList.remove("highlight_element_strong");
      }
    } else {
      handleDeleteLabel(curNode);
      curNode.classList.remove("highlight_element_strong");
    }
  }
}

var tempNewOption = "";

function checkValidity() {
  let input = document.getElementById("remark_tag_dropdown");
  let list = document.getElementById("remark_tag_options");
  let optionExists = false;
  // let check = false;
  for (let i = 0; i < list.options.length; i++) {
    if (input.value.toLowerCase() === list.options[i].value.toLowerCase() && input.value.trim().length > 0) {
      optionExists = true;
      console.log("valid option : ", input.value);
      selectTagHandler(input.value)
      break;
    }
  }

  // for (let i = 0; i < list.options.length; i++) {
  //   if(list.options[i].innerText == "To create, press enter" ) {
  //     check = true;
  //     break;
  //   }
  // }

  if(optionExists) {
    tempNewOption = "";
    return;
  } 

  // if(!check) {
  //   const option = document.createElement("option");
  //   option.id = "remark_create_tag_temp"
  //   option.innerText = "To create, press enter"
  //   list.appendChild(option)
  // }


  tempNewOption = input.value.trim();
}

function checkValidityOnKeypress(e) {
  if(e.key === "Enter" || e.keyCode === 13) {
    const dropdown = document.getElementById("remark_tag_dropdown");
    if(document.activeElement === dropdown && tempNewOption.trim().length > 1) {
      handleCreateTag(tempNewOption)
    }
    // console.log("ENTER : ", e.key, document.activeElement === dropdown, tempNewOption);
  }
}

const debouncedHandleCreateTag = debounce(handleCreateTag, 1000)


// *************** Annotation utils ***************


function getAnnotationByID(annotation_id) {
  for (let ele of window.annotations) {
    if (Number(annotation_id) === ele["id"]) {
      return ele;
    }
  }
  return;
}

function getAllAnnotations() {
  let res = {};
  res["item"] = [];
  for (let a of window.annotations) {
    res["item"].push({
      x: a["x"],
      y: a["y"],
      width: a["width"],
      height: a["height"],
      tag: a["tag"],
      text: a["text"],
    });
  }
  return res;
}

function isValidAnnotation(curAnnotation) {
  if (!window.annotations || window.annotations == undefined) {
    window.annotations = [];
    return true;
  }
  for (let i = 0; i < window.annotations.length; i++) {
    const ele = window.annotations[i];
    if (
      curAnnotation["x"] == ele["x"] &&
      curAnnotation["y"] == ele["y"] &&
      curAnnotation["width"] == ele["width"] &&
      curAnnotation["height"] == ele["height"]
    ) {
      return false;
    }
  }

  return true;
}


// ***************** Load and Save *****************

async function loadAllAnnotations() {
  console.log("in load annotations")
  try {
    const storageData = await getDataFromStorage("remark_annotation_data");
    const data = storageData["remark_annotation_data"];
    annotations = JSON.parse(data)["data"];
    renderAllAnnotations(annotations);
  } catch (e) {
    console.log("No annotations to load");
  } finally {
    return;
  }
}

async function saveAllAnnotations() {
  const id = String(location.href);
  const d = JSON.stringify({ 
    id: id,
    data: window.annotations 
  });

  setDataToStorage("remark_annotation_data", d);

  window.annotations = [];
  annotationNodes = [];
  return;
}

// **************** DOM Operations *****************


function removeHighlight(annotation) {
  const t = annotation["html_target"];
  if (t && t.className.includes("highlight_element_strong")) {
    t.classList.remove("highlight_element_strong");
  }
}

function stopHighlightElements() {
  const elements = document.getElementsByClassName("highlight_element_strong");
  while (elements.length) {
    elements[0].classList.remove("highlight_element_strong");
  }
}

function getNodeXpath(node) {
  let comp,
    comps = [];
  let parent = null;
  let xpath = "";
  let getPos = function (node) {
    let position = 1,
      currentNode;
    if (node.nodeType == Node.ATTRIBUTE_NODE) {
      return null;
    }
    for (
      currentNode = node.previousSibling;
      currentNode;
      currentNode = currentNode.previousSibling
    ) {
      if (currentNode.nodeName == node.nodeName) {
        ++position;
      }
    }
    return position;
  };

  if (node instanceof Document) {
    return "/";
  }

  for (
    ;
    node && !(node instanceof Document);
    node =
      node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode
  ) {
    comp = comps[comps.length] = {};
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        comp.name = "text()";
        break;
      case Node.ATTRIBUTE_NODE:
        comp.name = "@" + node.nodeName;
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        comp.name = "processing-instruction()";
        break;
      case Node.COMMENT_NODE:
        comp.name = "comment()";
        break;
      case Node.ELEMENT_NODE:
        comp.name = node.nodeName;
        break;
    }
    comp.position = getPos(node);
  }

  for (var i = comps.length - 1; i >= 0; i--) {
    comp = comps[i];
    xpath += "/" + comp.name;
    if (comp.position != null) {
      xpath += "[" + comp.position + "]";
    }
  }
  return xpath;
}

function getElementByXpath(path) {
  let ele = null;
  try {
    ele = document.evaluate(
      path,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  } catch (error) {
    return;
  }
  return ele;
}

function removeHTMLElement(ele) {
  if (ele && ele.parentElement) {
    ele.parentElement.removeChild(ele);
  }
  return;
}

function getDOMClassName(dom) {
  let classes = dom.getAttribute("class");
  classes = classes
    .replace("highlight_element_light", "")
    .replace("highlight_element_strong", "");
  classes = classes ? classes.split(" ").slice(0, -1) : [];
  classes.unshift(dom.tagName.toLowerCase());
  return classes.join(".");
}

function disableAllCickableElements() {
  const links = document.getElementsByTagName("a");
  const buttons = document.getElementsByTagName("button");
  const images = document.getElementsByTagName("images");
  const videos = document.getElementsByTagName("video");
  const iframes = document.getElementsByTagName("iframe");
  const forms = document.getElementsByTagName("form");

  for (let i = 0; i < links.length; i++) {
    links[i].href = "#";
    links[i].onclick = "return false";
  }

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = "return false";
  }

  for (let i = 0; i < images.length; i++) {
    images[i].onclick = "return false";
  }

  for (let i = 0; i < videos.length; i++) {
    videos[i].onclick = "return false";
  }

  for (let i = 0; i < iframes.length; i++) {
    iframes[i].onclick = "return false";
  }

  for (let i = 0; i < forms.length; i++) {
    forms[i].disabled = true;
  }

  return;
}

// ****************** HTTP methods *****************

async function GET(url) {
  try {
    let res = await fetch(url);
    res = await res.json();
    return res;
  } catch (e) {
    console.log("ERROR IN GET REQUEST : ", e.message);
  }
}

async function POST(url, data, contentType = "application/json") {
  try {
    let d, h;
    if (contentType == "application/json") {
      d = JSON.stringify(data);
    } else {
      d = data;
    }
    let res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-type": contentType,
      },
      body: d,
    });

    res = await res.json();
    return res;
  } catch (e) {
    console.log("ERROR IN POST REQUEST : ", e.message);
  }
}

// ****************** Chrome APIs ******************

// async function getCurrentTab() {
//   let queryOptions = { active: true };
//   let [tab] = await chrome.tabs.query(queryOptions);
//   return tab;
// }

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
  return new Promise((resolve) => {
    chrome.storage.local.get([key], function (res) {
      resolve(res);
    });
  });
}

function sendMessageToBackground(data) {
  BACKGROUND_PORT.postMessage({ data: data });
}

// **************** Conversion utils*****************

function logFormData(formData) {
  for (let e of Array.from(formData)) {
    console.log(e[0], " : ", e[1]);
  }
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
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// ***************** Download Utils *****************


function downloadAnnotations(annotations) {
  const labelBlob = new Blob([annotations], { type: "text/plain" });
  const labelDataURI = window.URL.createObjectURL(labelBlob);

  downloadFile(labelDataURI, "labels.txt");
  return;
}

function downloadScreenshot(screenshotDataURI) {
  downloadFile(screenshotDataURI, "screenshot.jpg");
}

function downloadFile(dataURI, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = dataURI;
  downloadLink.download = fileName;
  downloadLink.click();
  downloadLink.remove();
}

async function takeScreenShot() {
  // Scroll to top
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollTop = document.documentElement.scrollHeight;
  document.documentElement.scrollTop = 0;

  // Remove ReMark elements
  const els = Array.from(document.querySelectorAll("*"));
  const menu = document.getElementById("remarkMainMenu");
  if (menu) {
    removeHTMLElement(menu);
  }
  for (const el of els) {
    el.classList.remove("highlight_element_strong");
    el.classList.remove("highlight_element_light");
    el.classList.remove("highlight_element_selected");
    const id = el.dataset.annotation_id;

    if (id) {
      console.log("reached 2 : ", id);
      const hid = `${id}_tooltip`;
      const ele = document.getElementById(hid);
      removeHTMLElement(ele);
    }
  }

  // Take screenshot
  const uri = await html2canvas(document.documentElement, {
    allowTaint: true,
    useCORS: true,
  }).then(function (canvas) {
    const dataURI = canvas.toDataURL("image/jpeg", 0.7);
    return dataURI;
  });

  renderMenu();

  console.log("return val : ", uri);
  return uri;
}

