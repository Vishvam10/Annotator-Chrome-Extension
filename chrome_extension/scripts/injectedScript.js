(async () => {
  const storageData = await getDataFromStorage("remark_running");
  const running = storageData["remark_running"];
  window.annotations = [];

  console.log("INIT ...", running);

  if (running && running.includes(String(location.href))) {
    console.log("reached : ", running, running.includes(String(location.href)));
    remark_destroy();
    return;
  } else {
    const temp = running + "," + String(location.href);
    setDataToStorage("remark_running", temp);

    const port = chrome.runtime.connect({ name: "injected" });
    remark_init(port);
  }
})();

// ***************** Global Variables ****************

var BACKEND_URL = "https://data-science-theta.vercel.app/api";
// var BACKEND_URL = "http://localhost:3000/api";

var REMARK_GROUP_ACTIONS = false;
var REMARK_DOWNLOAD_LOCAL = false;

var PORT;

REMARK_ADDITIONAL_STYLES = null;
annotationNodes = [];

var tempBuffer = [];
var curNode;
var DEBUG = true;

var dragging = false;


// ***************** Initialization ******************

function remark_init(port) {
  console.log("DOM AND DEBUG CHECK : ", document.body, DEBUG);
  const style = document.createElement("style");
  window.REMARK_ADDITIONAL_STYLES = style;
  document.body.appendChild(style);

  PORT = port;

  // Listen for data from the background script
  port.onMessage.addListener(async function (message) {
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

  disableAllCickableElements();
  renderMenu();
  loadAllAnnotations();
  startAnnotationProcess();
}

function remark_destroy() {
  removeAllExistingModals();
  stopHighlightElements();
  stopAnnotationProcess();
}

function startAnnotationProcess() {
  document.body.addEventListener("click", clickListener, false);
  document.body.addEventListener("mouseover", mouseOverListener, false);
  document.body.addEventListener("mouseout", mouseOutListener, false);
  document.addEventListener("scroll", scrollListener);
}

function stopAnnotationProcess() {
  document.addEventListener("click", () => {
    return false;
  });
  document.addEventListener("mouseover", () => {
    return false;
  });
  document.addEventListener("mouseout", () => {
    return false;
  });

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
    } else if (t.classList.contains("highlight_element_strong")) {
      // Select label
      prevNode = curNode;
      if (
        prevNode &&
        prevNode.className.includes("highlight_element_selected")
      ) {
        prevNode.classList.remove("highlight_element_selected");
      }

      curNode = t;
      curNode.classList.add("highlight_element_selected");
      const id = t.dataset.annotation_id;
      const ann = getAnnotationByID(id);
      setCurrentLabelAsOption(ann.tag);

      if (DEBUG) {
        console.log("click -> set current label : ", ann.tag);
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

  delete targetHTMLElement.dataset.annotation_id;

  setCurrentLabelAsOption("span");
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
  const pushToServerButton = document.getElementById("pushToServerButton");
  pushToServerButton.innerText = "Taking screenshot";
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

  console.log("email : ", email);
  console.log("labels : ", labels);

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

  if (REMARK_DOWNLOAD_LOCAL) {
    downloadAnnotations(labels);
    downloadScreenshot(screenshotDataURI);

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
  
  saveAllAnnotations();
  sendMessageToBackground(data);
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

async function renderMenu() {
  if (document.getElementById("remarkMainMenu")) {
    removeHTMLElement(document.getElementById("remarkMainMenu"));
  }
  let labelMarkup = "";
  const data = await GET(`${BACKEND_URL}/labels`);
  const labels = data["labels"];

  for (let i = 0; i < labels.length; i++) {
    const val = labels[i];
    labelMarkup += `
      <option value="${val}" class="remark_">${val}</option>
    `;
  }

  const markup = `
    <div class="remark_standard_menu_container" id="remarkMainMenu">
      <div class="remark_standard_menu_header">
          <p style="margin: 5px 0px 0px 0px; font-weight: bold; color: inherit; font-size: 16px;">ReMark</p>
          <div class="remark_standard_menu_actions">
            <span class="remark_close_btn" id="remark_standard_menu_close_btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="remark_close_btn">
                    <path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z" class="remark_"/>
                </svg>
            </span>
          </div>
      </div>
      <div class="remark_menu_body">
        <div class="remark_settings_subgroup"> 
          <label for="remark_tag_dropdown" class="remark_form_label" style="width: 160px; line-height: 20px;">Annotate from list</label>
            <input type="text" list="remark_tag_options" id="remark_tag_dropdown">
            <datalist id="remark_tag_options">
              ${labelMarkup}
              <option value="remove_label" class="remark_tag_option"></option>
            </datalist>

          <label class="remark_toggle" id="groupActionsBtn">
            <span class="remark_toggle_label">Annotate similar components?</span>
            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" name="groupAnnotationCheckbox">
            <div class="remark_toggle_switch"></div>
          </label>
          <label class="remark_toggle" id="downloadBtn">
            <span class="remark_toggle_label">Download locally?</span>
            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" name="downloadCheckbox">
            <div class="remark_toggle_switch"></div>
          </label>
          <button type="button" class="remark_standard_button" id="pushToServerButton">Save Annotations</button>
          <p style="font-size: 11px; margin: 30px 0px -10px 0px; color: var(--remark-color-grey-light-2); line-height: 16px;"><b>NOTE :</b> Elements will be grouped by their classname and their tagname</p>
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

  const menuCloseBtn = document.getElementById(
    "remark_standard_menu_close_btn"
  );
  menuCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const menuContainer = document.querySelector(
      ".remark_standard_menu_container"
    );
    const menuBody = document.querySelector(".remark_menu_body");
    menuBody.classList.toggle("remark_hide");
    menuContainer.classList.toggle("remark_menu_resize");
  });

  const dropdown = document.getElementById("remark_tag_dropdown");
  dropdown.addEventListener("input", checkValidity);
  dropdown.addEventListener("keypress", checkValidityOnKeypress);

  const dropdownOptions = document.getElementById("remark_tag_options");
  dropdownOptions.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() === 'option') {
      // Get the value of the clicked option tag
      const selectedValue = e.target.value;
      console.log(`Selected value: ${selectedValue}`);
    }
    console.log("option change : ", e.target)
  })

  const groupActionsBtn = document.getElementById("groupActionsBtn");
  groupActionsBtn.addEventListener("click", (e) => {
    const inp = document.getElementsByName("groupAnnotationCheckbox")[0];
    if (inp.checked === true) {
      inp.checked = false;
      REMARK_GROUP_ACTIONS = false;
    } else {
      inp.checked = true;
      REMARK_GROUP_ACTIONS = true;
    }
  });

  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.addEventListener("click", (e) => {
    const inp = document.getElementsByName("downloadCheckbox")[0];
    if (inp.checked === true) {
      inp.checked = false;
      REMARK_DOWNLOAD_LOCAL = false;
    } else {
      inp.checked = true;
      REMARK_DOWNLOAD_LOCAL = true;
    }
    console.log("LOCAL DOWNLOAD : ", REMARK_DOWNLOAD_LOCAL);
  });

  const pushToServerButton = document.getElementById("pushToServerButton");
  pushToServerButton.addEventListener("click", handlePushToServer);
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

function setCurrentLabelAsOption(val) {
  const dropdown = document.getElementById("remark_tag_dropdown");
  const n = dropdown.length;

  let ind = -2;

  for (let i = 0; i < n; i++) {
    if (dropdown[i].value == val) {
      ind = i;
      break;
    }
  }
  if (ind != -2) {
    dropdown.selectedIndex = String(ind);
  }
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

function removeAllExistingModals() {
  const menu_check = document.querySelector(".remark_standard_menu_container");
  if (menu_check) {
    removeHTMLElement(menu_check);
  }
}

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
  PORT.postMessage({ data: data });
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

