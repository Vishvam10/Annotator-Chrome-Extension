(async() => {    

    const storageData = await getDataFromStorage("remark_running");
    const running = storageData["remark_running"];
    
    console.log("from foreground : init . . .", running);

    if(running === false) {
        console.log("reached running");
        remark_destroy();
        return;
    } else {
        remark_init();
    }


})();

// ***************** Global Variables ****************

var REMARK_GROUP_ACTIONS = false;

var annotations = []


var eleColors = {
    "div" : "highlight_blue", 
    "span" : "highlight_green", 
    "button" : "highlight_yellow", 
    "main" : "highlight_teal", 
    "section" : "highlight_teal", 
    "nav" : "highlight_red", 
    "input" : "highlight_purple", 
    "image" : "highlight_violet", 
    "video" : "highlight_violet", 
    "a" : "highlight_pink"
}

var VALID_HTML_ELEMENTS = [
    "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", 
    "P", "PICTURE", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", 
    "AUDIO", "VIDEO", "UL", "LI"
]

var tempBuffer = []

// ***************** Initialization ******************


function remark_init() {
    console.log("DOM check and Settings check : ", document.body);
    renderMenu();
    loadAllAnnotations();
    startAnnotationProcess();
    setDataToStorage("remark_running", true);
    
}

function remark_destroy() {
    console.log("in stop");
    
    removeAllExistingModals();
    saveAllAnnotations();
    stopHighlightElements();
    stopAnnotationProcess();
    
    setDataToStorage("remark_running", false);

}

function startAnnotationProcess() {
    document.body.addEventListener("keypress", keyPressListener)
    document.body.addEventListener("click", clickListener);
    document.body.addEventListener("mouseover", mouseOverListener);
    document.body.addEventListener("mouseout", mouseOutListener);    
}

function stopAnnotationProcess() {
    document.body.removeEventListener("click", clickListener);
    document.body.removeEventListener("mouseover", mouseOverListener);
    document.body.removeEventListener("mouseout", mouseOutListener);
    return;
}

// ******************* Listeners ********************

function clickListener(e) {
    
    e.preventDefault();
    e.stopPropagation();
    
    const t = e.target;
    console.log("CLICKED : ", t)

    if(e.altKey) {

        // Delete label
        if(t.classList.contains("highlight_element_strong")) {
            if(REMARK_GROUP_ACTIONS) {
                const className = String(e.target.className.replace("highlight_element_strong", ""));
                const elements = document.getElementsByClassName(className);
                handleBatchDelete(elements);
                for(let ele of elements) {
                    ele.classList.remove("highlight_element_strong");
                }
                
            } else {
                handleDeleteLabel(t);
                console.log("reached")
                t.classList.remove("highlight_element_strong");
            }
        }
        
        console.log("delete annotations : ", annotations);
        
    } else {

        // Add label
        if(t.classList.contains("highlight_element_light")) {
            if(t.classList.contains("highlight_element_strong")) {
                console.log("REACHED STRONG")
                return;
            }

            if(REMARK_GROUP_ACTIONS) {
                handleBatchCreate(tempBuffer);
                for(let t of tempBuffer) {
                    t.classList.remove("highlight_element_light");
                    t.classList.add("highlight_element_strong");
                }
            } else {
                handleCreateLabel(t);
                t.classList.remove("highlight_element_light");
                t.classList.add("highlight_element_strong");
            }
            
            console.log("add annotations : ", annotations);

        } else if(t.classList.contains("highlight_element_strong")) {

            const id = t.dataset.annotation_id;
            const curAnnotation = getAnnotationByID(id, annotations);
            let sideBar = SIDEBAR(curAnnotation);

            const check = document.getElementById("remark_annotations_sidebar");    
            
            if (check) {
                removeHTMLElement(check);
            }
            
            document.body.insertAdjacentHTML("afterbegin", sideBar);

            const editBtn = document.getElementById("remark_edit_annotation_button");
            const sidebarCloseBtn = document.getElementById("remark_standard_sidebar_close_btn");

            if(sidebarCloseBtn) {
                sidebarCloseBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const sidebarBody = document.querySelector(".remark_standard_modal_body");
                    sidebarBody.classList.toggle("remark_hide");

                    document.getElementById("remark_annotations_sidebar").classList.toggle("remark_annotations_sidebar_resize");
                    document.querySelector(".remark_sidebar_modal_header").classList.toggle("remark_sidebar_modal_header_resize");
                    
                })
            }

            editBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditLabel(t, annotations)
            })
        }

    }
}

function mouseOverListener(e) {
    e.preventDefault();
    e.stopPropagation();
   
    const menu = document.querySelector(".remark_standard_menu_container");
    const className = String(e.target.className);
    
    const elements = document.getElementsByClassName(className);
    Array.from(elements).forEach((ele) => { 
        console.log("tag : ", ele.tagName)
       
        const tag = ele.tagName;
        if (VALID_HTML_ELEMENTS.includes(tag)) {
            if(ele.className) {
                if (ele.className.includes("remark_") || ele.className.includes("highlight_element_strong")) {
                    return;
                }
            }
            if(menu.contains(ele)) {
                console.log("REACHED DESCENDANT");
                return;
            }
            tempBuffer.push(ele)
            ele.classList.add("highlight_element_light");
        }

    })
}

function mouseOutListener(e) {
    e.preventDefault();
    e.stopPropagation();

    const menu = document.querySelector(".remark_standard_menu_container");

    tempBuffer.forEach((ele) => { 
        const tag = ele.tagName;
        if (VALID_HTML_ELEMENTS.includes(tag)) {
            if(ele.className) {
                if (ele.className.includes("remark_") || ele.className.includes("highlight_element_strong")) {
                    return;
                }
            }
            if(menu.contains(ele)) {
                console.log("REACHED DESCENDANT");
                return;
            }
            ele.classList.remove("highlight_element_light");
        }
    })
    tempBuffer = [];
}

function keyPressListener(e) {
    if(e.key === "Escape") {
        removeAllExistingModals();
    }
}

function attachListeners() {

    const undoBtn = document.getElementById("remarkUndoBtn");
    undoBtn.addEventListener("click", handleUndo);

    const redoBtn = document.getElementById("remarkRedoBtn");
    redoBtn.addEventListener("click", handleRedo);

    const remarkBatchCreateBtn = document.getElementById("remarkBatchCreateBtn");
    remarkBatchCreateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBatchAction("batchCreate")
    });
    
    // const remarkBatchUpdateBtn = document.getElementById("remarkBatchUpdateBtn");
    // remarkBatchUpdateBtn.addEventListener("click", handleBatchUpdate);
    
    const remarkBatchDeleteBtn = document.getElementById("remarkBatchDeleteBtn");
    remarkBatchDeleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBatchAction("batchDelete")
    });

}

// ******************* Handlers ********************

function handleCreateLabel(targetHTMLElement) {
    const rect = targetHTMLElement.getBoundingClientRect();
    const x = Math.round(rect.x), y = Math.round(rect.y), w = Math.round(rect.width), h = Math.round(rect.height);

    const className = targetHTMLElement.className.replace("highlight_element_light", "");

    const d = {
        "id" : Math.round(Math.random() * 10000),
        "tag" : targetHTMLElement.tagName.toLowerCase(),
        "x" : x,
        "y" : y,
        "width" : w,
        "height" : h,
        "text" : targetHTMLElement.innerText,
        "parent" : targetHTMLElement.parentNode.tagName.toLowerCase(),
        "html_id" : targetHTMLElement.id,
        "html_class" : className,
        "html_xpath" : getNodeXpath(targetHTMLElement).toLowerCase(),
        "html_target" : targetHTMLElement
    }

    annotations.push(d);
    targetHTMLElement.dataset.annotation_id = d["id"];
    console.log("added : ", annotations);
}

function handleEditLabel(targetHTMLElement) {
    if(targetHTMLElement.classList.contains("highlight_element_strong")) {
            
        const annotation_id = Number(targetHTMLElement.dataset.annotation_id);
        const newTag = document.querySelector("input[name='annotation_tag']").value;
        const newText = document.querySelector("input[name='annotation_text']").value;
        let newCoordinates = document.querySelector("input[name='annotation_coordinates']").value;

        if(newCoordinates.length > 0) {
            newCoordinates = newCoordinates.split(",")
        }

        for(let ele of annotations) {
            if(ele["id"] == annotation_id) {
                ele["text"] = newText;
                ele["tag"] = newTag;
                ele["x"] = Number(newCoordinates[0]);
                ele["y"] = Number(newCoordinates[1]);
                ele["width"] = Number(newCoordinates[2]);
                ele["height"] = Number(newCoordinates[3]);
                
                console.log("changed : ", ele)
            }
        }
        
        const edit_modal_check = document.getElementById("remark_edit_annotation_modal");
        if(edit_modal_check) {
            removeHTMLElement(edit_modal_check);
        }

    }

    // console.log("edit annotations : ", annotations);
}

function handleDeleteLabel(targetHTMLElement) {
    const annotation_id = Number(targetHTMLElement.dataset.annotation_id);

    let ind, annotation;

    for(let i=0; i<annotations.length; i++) {
        if(annotations[i]["id"] == annotation_id) {
            ind = i;
            annotation = annotations[i];
            break;
        }
    }
    
    annotations.splice(ind, 1);

    delete targetHTMLElement.dataset.annotation_id;
}

function handleBatchCreate(targetHTMLElements) {
    for(let i=0; i<targetHTMLElements.length; i++) {
        const ele = targetHTMLElements[i];
        handleCreateLabel(ele, annotations)
    }
}        

function handleBatchDelete(targetHTMLElements) {
    
    for(let i=0; i<targetHTMLElements.length; i++) {
        const ele = targetHTMLElements[i];
        handleDeleteLabel(ele);
    }

}


function handleBatchUpdate() {
    // console.log("clicked : handleBatchUpdate")
    return;
}

async function handlePushToServer() {
    const storageData = await getDataFromStorage("remark_screenshot_datauri");
    const dataURI = storageData["remark_screenshot_datauri"];
    const email = storageData["remark_email"];
    // console.log("in injected script : ", dataURI);

    const imgBlob = dataURIToBlob(dataURI)
    const labels = getAllAnnotations()

    const formData = new FormData()
    formData.append("image", imgBlob)
    formData.append("label", JSON.stringify(labels));

    logFormData(formData)

    const url = "http://localhost:3000/api/submit"

    try {

        let res = await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers : {
            "Content-type" : "multipart/form-data; boundary=---011000010111000001101001",
            "email": email
          },
          body : formData
        })
      
        res = await res.json();
        console.log("POST RESULT : ", res)

    } catch(e) {
        console.log("ERROR IN POST REQUEST : ", e.message);
    }
}

function handleUndo() {
    // console.log("clicked : handleUndo")
    return;
}

function handleRedo() {
    // console.log("clicked : handleRedo")
    return;
}

// *************** Render functions ***************


function renderAllAnnotations(annotations) {
    for(let i=0; i<annotations.length; i++) {
        const ele = annotations[i];
        const node = getElementByXpath(ele["html_xpath"]);
        console.log(node)
        if(node) {
            if(node.className.includes("remark_") || node.className.includes("highlight_element_strong")) {
                continue;
            } else {
                node.classList.remove("highlight_element_light");
                // const colClass = eleColors[ele["tag"]];
                // node.classList.add(colClass);
                node.classList.add("highlight_element_strong");

            }
        }
    }
}

function renderMenu() {
    if(document.querySelector(".remark_standard_menu_container")) {
        return;
    }
    
    const markup = `
        <div class="remark_standard_menu_container">
            <div class="remark_standard_menu_header">
                <h3 class="remark_standard_sidebar_title">MENU</h3>
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
                        <h5 class="remark_settings_subgroup_title">ACTIONS (TODO)</h5>      
                        <span class="remark_setting_subgroup_item" style="width: 13rem">
                            <button class="remark_action_btn" id="remarkUndoBtn" name="actions">
                                UNDO
                            </button>
                            <button class="remark_action_btn" id="remarkRedoBtn" name="actions">
                                REDO
                            </button>
                        </span>     
                    </div>  
                    <div class="remark_settings_subgroup">
                        <h5 class="remark_settings_subgroup_title">BATCH ACTIONS</h5>      
                        <label for="groupActionsBtn" class="remark_form_field">Group Actions</label>  
                        <input type="checkbox" id="groupActionsBtn" name="groupActionsBtn" checked>
                    </div>  
                    <button type="button" class="remark_standard_button" id="remarkStopBtn">Stop Annotation</button>
                    <button type="button" class="remark_standard_button" id="pushToServerBtn">Push To Server</button>
                </div>
            </div>
    `
    document.body.insertAdjacentHTML("afterbegin", markup);

    const menuCloseBtn = document.getElementById("remark_standard_menu_close_btn");
    menuCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const menuContainer = document.querySelector(".remark_standard_menu_container");
        const menuBody = document.querySelector(".remark_menu_body");
        menuBody.classList.toggle("remark_hide");
        menuContainer.classList.toggle("remark_menu_resize");
    });

    const pushToServerBtn = document.getElementById("pushToServerBtn");
    pushToServerBtn.addEventListener("click", handlePushToServer);

    const remarkStopBtn = document.getElementById("remarkStopBtn");
    remarkStopBtn.addEventListener("click", remark_destroy)

}

function removeHighlight(annotation) {
    const t = annotation["html_target"];
    if(t && t.className.includes("highlight_element_strong")) {
        t.classList.remove("highlight_element_strong");
    }
}


// ************** Component functions **************


var BATCH_ACTION_MODAL = (action) => {

    let title = "";

    if(action == "batchCreate") {
        title = "BATCH CREATE"
    } else if(action == "batchDelete") {
        title = "BATCH DELETE"
    }

    const markup = `
        <div class="remark_standard_minimodal">
            <h4 class="remark_standard_minimodal_title">${title}</h4>
            <div class="remark_standard_minimodal_body">
                <span class="remark_standard_minimodal_input_container">
                    <label for="batchInputTagName" class="remark_standard_minimodal_label">TAGNAME</label>
                    <br>
                    <input id="batchInputTagName" class="remark_standard_minimodal_input" type="text">
                </span>
                <span class="remark_standard_minimodal_input_container">
                    <label for="batchInputClassName" class="remark_standard_minimodal_label">CLASSNAME</label>
                    <br>
                    <input id="batchInputClassName" class="remark_standard_minimodal_input" type="text">
                </span>
            </div>
            <span class="remark_" style="height: 100%; border-left: 1px solid var(--remark-color-grey-light-2); margin: 0rem 0rem 0rem -2rem">
                <button class="remark_standard_minimodal_button" id="remark_standard_minimodal_button">GO</button>
            </span>
        </div>
    `
    return markup;
}

var SIDEBAR = (curAnnotation) => {
    
    let text = curAnnotation['text'].substr(0, 60) + "...";
    let coordinates = curAnnotation["x"] + "," + curAnnotation["y"] + "," + curAnnotation["width"] + "," + curAnnotation["height"];

    const markup =
    `
        <div class="remark_standard_sidebar" id="remark_annotations_sidebar">
            <div class="remark_sidebar_modal_header">
                <h3 class="remark_standard_sidebar_title">ANNOTATION DATA</h3>
                <div class="remark_standard_sidebar_actions">
                <span class="remark_close_btn" id="remark_standard_sidebar_close_btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="remark_close_btn">
                        <path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z" class="remark_"/>
                    </svg>
                </span>
                </div>
            </div>
            <div class="remark_standard_modal_body remark_standard_sidebar_body_full" id="remark_sidebar_body">
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">ID</label>
                    <input type="text" name="annotation_id" class="remark_form_input remark_fade" value="${curAnnotation['id']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_parent" class="remark_form_label">PARENT</label>
                    <input type="text" name="annotation_parent" class="remark_form_input remark_fade" value="${curAnnotation['parent']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_html_class" class="remark_form_label">CLASSNAME</label>
                    <input type="text" name="annotation_html_class" class="remark_form_input" value=${curAnnotation['html_class']} readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_tag" class="remark_form_label">TYPE</label>
                    <input type="text" name="annotation_tag" class="remark_form_input" value=${curAnnotation['tag']}>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_text" class="remark_form_label">TEXT</label>
                    <input type="text" name="annotation_text" class="remark_form_input" value=${text}>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_coordinates" class="remark_form_label">COORDINATES (x,y,w,h)</label>
                    <input type="text" name="annotation_coordinates" class="remark_form_input" value="${coordinates}">
                </div>
                <div class="remark_form_fields">
                    <button type="button" class="remark_standard_button" id="remark_edit_annotation_button">Edit</button>
                </div>
            </div>
        </div>
    `

    return markup;

}

var CONFIRM_GROUPING_MARKUP = () => {
    const markup = `
        <span class="remark_confirm_grouping">
            <span class="remark_grouping_options">Yes</span>
            <span class="remark_grouping_options">No</span>
        </span>
    `;
    return markup;
}

// *************** Utility functions *************** 


// --------------- Annotations utils ----------------


function getAnnotationByID(annotation_id) {
    for(let ele of annotations) {
        if(Number(annotation_id) === ele["id"]) {
            return ele;
        }
    }
    return;
}

function getAllAnnotations() {
    let res = {};
    res["item"] = [];
    for(let a of annotations) {
        res["item"].push({
            x: a["x"],
            y: a["y"],
            width: a["width"],
            height: a["height"],
            tag: a["tag"],
            text: a["text"]
        })
    }
    return res;
}

// ----------------- Load and Save ------------------


async function loadAllAnnotations() {
    try {
        const storageData = await getDataFromStorage("remark_annotations");
        const data = storageData["remark_annotations"];
        // console.log("LOAD DATA : ", data, JSON.parse(data)["data"])
        annotations = JSON.parse(data)["data"];
        renderAllAnnotations(annotations)
        setDataToStorage("remark_annotations", null);
    } catch(e) {
        console.log("No annotations to load");
    }


    return;
}

function saveAllAnnotations() {
    const d = JSON.stringify({data: annotations});
    console.log("SAVE DATA : ", d)
    setDataToStorage("remark_annotations", d);
    return;
}

function dataURIToBlob(dataURI) {
    const splitDataURI = dataURI.split(',')
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

    const ia = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
}


// ---------------- DOM Operations -----------------


function removeAllExistingModals() {
    const menu_check = document.querySelector(".remark_standard_menu_container");
    const sidebar_check = document.getElementById("remark_annotations_sidebar");

    const grouping_modal = document.querySelector(".remark_confirm_grouping");

    if(menu_check) {
        removeHTMLElement(menu_check);
    }

    if(sidebar_check) {
        removeHTMLElement(sidebar_check);
    }

    if(grouping_modal) {
        removeHTMLElement(grouping_modal);
    }

}

function stopHighlightElements() {
    const elements = document.getElementsByClassName("highlight_element_strong");
    while (elements.length) {
        elements[0].classList.remove("highlight_element_strong");
    }
}

function getNodeXpath(node) {
    let comp, comps = [];
    let parent = null;
    let xpath = "";
    let getPos = function(node) {
        let position = 1, curNode;
        if (node.nodeType == Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName == node.nodeName) {
                ++position;
            }
        }
        return position;
     }

    if (node instanceof Document) {
        return "/";
    }

    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
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
        ele = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (error) {
        return;
    }
    return ele;
}

function removeHTMLElement(ele) {
    if(ele && ele.parentElement) {
        ele.parentElement.removeChild(ele);
    }
    return;
}


// ****************** Chrome APIs ****************** 


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

function sendMessage(message) {
    chrome.runtime.sendMessage(message, (response) => {
        console.log("received  data", response);
    });
}

function logFormData(formData) {
    for(let e of Array.from(formData)) {
      console.log(e[0], " : ", e[1])
    }
}
  
// ---------------------- CSS ----------------------


// function createCSSClass(name,rules){
//     var style = document.createElement("style");
//     style.type = "text/css";
//     document.getElementsByTagName("head")[0].appendChild(style);
//     if(!(style.sheet||{}).insertRule) 
//     (style.styleSheet || style.sheet).addRule(name, rules);
//     else
//     style.sheet.insertRule(name+"{"+rules+"}",0);
// }
