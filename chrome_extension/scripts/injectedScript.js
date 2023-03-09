(async () => {
  const storageData = await getDataFromStorage("remark_running");
  const running = storageData["remark_running"];

  console.log("INIT ...", running);

  if (running === false) {
    console.log("going to destroy ...")
    remark_destroy();
    return;
  } else {
    remark_init();
  }
})();

// ***************** Global Variables ****************

// var BACKEND_URL = "https://data-science-theta.vercel.app/api";
var BACKEND_URL = "http://localhost:3000/api";

var REMARK_GROUP_ACTIONS = false;
var REMARK_ADDITIONAL_STYLES = null;

window.annotations = [];
var tempBuffer = [];
var curNode;

var dragging = false;

var VALID_HTML_ELEMENTS = [
  "DIV",
  "SPAN",
  "BUTTON",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "IMG",
  "P",
  "PICTURE",
  "SVG",
  "NAV",
  "A",
  "TABLE",
  "INPUT",
  "LABEL",
  "FORM",
  "AUDIO",
  "VIDEO",
  "UL",
  "LI",
];

// ***************** Initialization ******************

function remark_init() {
  console.log("DOM CHECK : ", document.body);
  const style = document.createElement("style");
  REMARK_ADDITIONAL_STYLES = style;
  document.body.appendChild(style);
  disableAllCickableElements();
  renderMenu();
  loadAllAnnotations();
  startAnnotationProcess();
  setDataToStorage("remark_running", true);
}

function remark_destroy() {
  removeAllExistingModals();
  stopHighlightElements();
  stopAnnotationProcess();
}

function startAnnotationProcess() {
  // document.body.addEventListener("keydown", keyDownListener, false);

  document.body.addEventListener("click", clickListener, false);
  document.body.addEventListener("mouseover", mouseOverListener, false);
  document.body.addEventListener("mouseout", mouseOutListener, false);
}


function stopAnnotationProcess() {
  document.addEventListener("click", () => {
    return false
  });
  document.addEventListener("mouseover", () => {
    return false
  });
  document.addEventListener("mouseout", () => {
    return false
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

      // console.log("ADD ANNOTATIONS : ", annotations);
    } else if (t.classList.contains("highlight_element_strong")) {
      prevNode = curNode;
      if(prevNode && prevNode.className.includes("highlight_element_selected")) {
        prevNode.classList.remove("highlight_element_selected");
      }

      curNode = t;
      curNode.classList.add("highlight_element_selected");
      const id = t.dataset.annotation_id;
      const ann = getAnnotationByID(id);
      setCurrentLabelAsOption(ann.tag);
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
    if (VALID_HTML_ELEMENTS.includes(tag)) {
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
    }
  });
}

function mouseOutListener(e) {
  e.preventDefault();
  e.stopPropagation();

  tempBuffer.forEach((ele) => {
    const tag = ele.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
      if (ele.className) {
        if (
          ele.className.includes("remark_") ||
          ele.className.includes("highlight_element_strong")
        ) {
          return;
        }
      }
      ele.classList.remove("highlight_element_light");
    }
  });
  tempBuffer = [];
}

// ******************* Handlers ********************

function handleCreateLabel(targetHTMLElement) {
  const rect = targetHTMLElement.getBoundingClientRect();
  const x = Math.round(rect.x),
    y = Math.round(rect.y),
    w = Math.round(rect.width),
    h = Math.round(rect.height);

  const className = targetHTMLElement.className.replace(
    "highlight_element_light",
    ""
  );
  
  // let c = getDOMClassName(targetHTMLElement);

  // REMARK_ADDITIONAL_STYLES.innerHTML = `
  //     ${c} {
  //         position: relative;
  //     }

  //     ${c}::before {
  //         content: "${targetHTMLElement.tagName.toLowerCase()}";
  //         position: absolute;
  //         top: 0;
  //         left: 0;
  //         width: 100%;
  //         height: 100%;
  //         z-index: 999999;
  //         pointer-events: none;
  //     }
  // `;

  const d = {
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

  if (isValidAnnotation(d)) {
    annotations.push(d);
    targetHTMLElement.dataset.annotation_id = d["id"];
    return;
  }

  return;
}

function handleEditLabel(targetHTMLElement, newTag) {
  if (targetHTMLElement) {
    if (targetHTMLElement.classList.contains("highlight_element_strong")) {
      const annotation_id = Number(targetHTMLElement.dataset.annotation_id);
      for (let ele of annotations) {
        if (ele["id"] == annotation_id) {
          ele["tag"] = newTag;
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

  let ind, annotation;

  for (let i = 0; i < annotations.length; i++) {
    if (annotations[i]["id"] == annotation_id) {
      ind = i;
      annotation = annotations[i];
      break;
    }
  }

  annotations.splice(ind, 1);
  delete targetHTMLElement.dataset.annotation_id;
  setCurrentLabelAsOption("span");
  // console.log("DELETE ANNOTATIONS : ", annotations);
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
  for (let i = 0; i < targetHTMLElements.length; i++) {
    const ele = targetHTMLElements[i];
    handleEditLabel(ele, val);
  }
}

async function handleCreateNewTag() {
  const inp = document.getElementById("createNewTag");
  const val = inp.value.trim().toLowerCase();
  if (val && val.length > 0) {
    const data = {
      title: val,
    };
    const res = await POST(`${BACKEND_URL}/labels`, data);
    if (res.msg == "Label created successfully!") {
      renderMenu();
      return;
    } else {
      console.log(res);
    }
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
          <p style="margin: 0.5rem 0rem 0rem 0rem; font-weight: bold;">ReMark</p>
          <div class="remark_standard_sidebar_actions">
            <span class="remark_close_btn" id="remark_standard_menu_close_btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="remark_close_btn">
                    <path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z" class="remark_"/>
                </svg>
            </span>
          </div>
      </div>
      <div class="remark_menu_body">
          <div class="remark_settings">
              <div class="remark_settings_subgroup">
                  <label for="labelType" class="remark_form_label" style="width: 10rem;">Select Tag For Component From The List</label>
                  <select name="labelType" id="labelTypeBtn" class="remark_">
                      ${labelMarkup}
                      <option value="remove_label" class="remark_">Remove Label</option>
                  </select>
                  <h4 style="margin: 1rem 0rem 0.2rem 0rem; color: var(--remark-color-grey-light-1);">OR</h4>
                  <div style="float:left; width: 100%; margin: 0.1rem 0rem -0.4rem 0rem;">
                      <label for="createNewTag" class="remark_form_label">Create New Tag</label>
                      <input type="text" name="createNewTag" id="createNewTag" class="remark_form_input" placeholder="Enter a new tag">
                  </div>
                  <button type="button" class="remark_standard_button" id="createNewTagBtn">Create New Tag</button>
                  <label class="remark_toggle" id="groupActionsBtn">
                    <span class="remark_toggle_label">Tag All Similar Components ?</span>
                    <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" name="groupAnnotationCheckbox">
                    <div class="remark_toggle_switch"></div>
                  </label>
                  <p style="font-size: 0.7rem; margin: 2rem 0rem 2rem 0rem;"><b>NOTE :</b> Elements will be grouped by their classname and their tagname )</p>
              </div>  
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

  // **********************************************************

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

  const labelTypeBtn = document.getElementById("labelTypeBtn");
  labelTypeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = String(e.target.value);
    if (val != "remove_label") {
      if (REMARK_GROUP_ACTIONS) {
        const className = String(
          curNode.className.replace("highlight_element_strong", "")
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
  });

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

  const createNewTagBtn = document.getElementById("createNewTagBtn");
  createNewTagBtn.addEventListener("click", handleCreateNewTag);

}

function removeHighlight(annotation) {
  const t = annotation["html_target"];
  if (t && t.className.includes("highlight_element_strong")) {
    t.classList.remove("highlight_element_strong");
  }
}

// *************** Annotations Utils ***************

function getAnnotationByID(annotation_id) {
  for (let ele of annotations) {
    if (Number(annotation_id) === ele["id"]) {
      return ele;
    }
  }
  return;
}

function getAllAnnotations() {
  let res = {};
  res["item"] = [];
  for (let a of annotations) {
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
  for (let i = 0; i < annotations.length; i++) {
    const ele = annotations[i];
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
  const labelTypeBtn = document.getElementById("labelTypeBtn");
  const n = labelTypeBtn.length;

  let ind = -2;

  for (let i = 0; i < n; i++) {
    if (labelTypeBtn[i].value == val) {
      ind = i;
      break;
    }
  }
  if (ind != -2) {
    labelTypeBtn.selectedIndex = String(ind);
  }
}

// ***************** Load and Save *****************

async function loadAllAnnotations() {
  try {
    const storageData = await getDataFromStorage("remark_annotations");
    const data = storageData["remark_annotations"];
    annotations = JSON.parse(data)["data"];
    renderAllAnnotations(annotations);
    setDataToStorage("remark_annotations", null);
  } catch (e) {
    console.log("No annotations to load");
  }

  return;
}

function saveAllAnnotations() {
  const d = JSON.stringify({ data: annotations });
  setDataToStorage("remark_annotations", d);
  return;
}


// **************** DOM Operations *****************

function removeAllExistingModals() {
  const menu_check = document.querySelector(".remark_standard_menu_container");
  if (menu_check) {
    removeHTMLElement(menu_check);
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

// ****************** Other utils ******************


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
