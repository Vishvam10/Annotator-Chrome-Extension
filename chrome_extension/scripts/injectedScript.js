(async() => {    

    console.log("from foreground : init . . .");

    const settings = {
        appearance: {
            highlightUsingSameColor: true,
            highlightThickness: 2,
            highlightBorderRadius: 12
        },
        configuration: {
            probeDepth: 24,
            includeXPath: false,
            includeStyles: false,
            showToolTip: false            
        }
    }
    
    remark_init(settings);

})();

// ***************** Global Variables ****************

var REMARK_SETTINGS;
var annotations = []

var eleColors = {
    "div" : "highlight_blue", 
    "span" : "highlight_green", 
    "button" : "highlight_yellow", 
    "main" : "highlight_teal", 
    "section" : "highlight_teal", 
    "nav" : "highlight_red", 
    "input" : "highlight_purple", 
    "input" : "highlight_purple", 
    "image" : "highlight_violet", 
    "video" : "highlight_violet", 
    "a" : "highlight_pink"
}

var VALID_HTML_ELEMENTS = [
    "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", "AUDIO", "VIDEO", "UL", "LI"
]

// ***************** Initialization ******************


function remark_init(settings) {
    REMARK_SETTINGS = settings;
    console.log("DOM check and Settings check : ", document.body, REMARK_SETTINGS);
    
    addAllClasses();    
    renderMenu();
    attachListeners()
    startAnnotationProcess();

}

function startAnnotationProcess() {
    document.body.addEventListener("keypress", keyPressListener)
    document.body.addEventListener("click", clickListener);
    document.body.addEventListener("mouseover", mouseOverListener);
    document.body.addEventListener("mouseout", mouseOutListener);    
}

function stopAnnotationProcess() {
    stopHighlightElements();
    document.removeEventListener("click", clickListener);
    document.removeEventListener("mouseover", mouseOverListener);
    document.removeEventListener("mouseout", mouseOutListener);
    return;
}

// ******************* Listeners ********************

function clickListener(e) {
    
    e.preventDefault();
    e.stopPropagation();
    
    const t = e.target;

    if(e.altKey) {
        // Delete label
        if(t.classList.contains("highlight_element_strong")) {
            annotations = handleDeleteLabel(t, annotations);
        }
        
        console.log("delete annotations : ", annotations);
        
    } else {
        // Add label
        if(t.classList.contains("highlight_element_light")) {
            if(t.classList.contains("highlight_element_strong")) {
                return;
            }

            annotations = handleCreateLabel(t, annotations);
            
            t.classList.remove("highlight_element_light");
            t.classList.add("highlight_element_strong");
            
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
   
    const className = String(e.target.className);
    
    if(className) {
        if (className.includes("remark_") || className.includes("highlight_element_strong")) {
            return;
        }
    }
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        if(REMARK_SETTINGS["configuration"]["showToolTip"]) {
            let tooltipMarkup = TOOLTIP(e.target);
            targetHTMLElement.insertAdjacentHTML("afterbegin", tooltipMarkup);
        }
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
}

function mouseOutListener(e) {
    e.preventDefault();
    e.stopPropagation();

    const className = String(e.target.className);
    if(className) {
        if (className.includes("remark_") || className.includes("highlight_element_strong")) {
            return;
        }
    }
    const tag = e.target.tagName;
    const targetHTMLElement = e.target;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        if(REMARK_SETTINGS["configuration"]["showToolTip"]) {
            const tooltipNode = document.getElementById("remark_tooltip");
            removeHTMLElement(tooltipNode);
        }
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
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

function handleCreateLabel(targetHTMLElement, annotations) {
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
    console.log("added : ", annotations)
    renderAllAnnotations(annotations);

    return annotations;
}

function handleEditLabel(targetHTMLElement, annotations) {
    if(targetHTMLElement.classList.contains("highlight_element_strong")) {
            
        const annotation_id = Number(targetHTMLElement.dataset.annotation_id);
        const newType = document.querySelector("input[name='annotation_type']").value;
        const newText = document.querySelector("input[name='annotation_text']").value;
        let newCoordinates = document.querySelector("input[name='annotation_coordinates']").value;

        if(newCoordinates.length > 0) {
            newCoordinates = newCoordinates.split(",")
        }

        for(let ele of annotations) {
            if(ele["id"] == annotation_id) {
                ele["text"] = newText;
                ele["tag"] = newType;
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

function handleDeleteLabel(targetHTMLElement, annotations) {
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
    removeHighlight(annotation);

    delete targetHTMLElement.dataset.annotation_id;

    return annotations;
}

function handleBatchAction(action) {
    const ele = document.querySelector(".remark_standard_minimodal");
    if(ele) {
        removeHTMLElement(ele);
    }
    if(action == "batchCreate") {
        
        const markup = BATCH_ACTION_MODAL("batchCreate");
        document.body.insertAdjacentHTML("afterbegin", markup);
        
        const ele = document.querySelector(".remark_standard_minimodal");
        
        const goBtn = document.getElementById("remark_standard_minimodal_button");
        goBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
        
            let className = document.getElementById("batchInputClassName").value;
            let tagName = document.getElementById("batchInputTagName").value.toLocaleLowerCase();
        
            const elements = document.getElementsByClassName(className);


            for(let i=0; i<elements.length; i++) {
                const ele = elements[i];
                if(ele.tagName.toLowerCase() == tagName) {
                    if(ele.className.includes("remark_") || ele.className.includes("highlight_element_strong")) {
                        continue;
                    } else {
                        handleCreateLabel(ele, annotations)
                    }
                }

            }
        
            removeHTMLElement(ele);
        
        });
        
    } else if(action == "batchDelete") {
                
        const markup = BATCH_ACTION_MODAL("batchDelete");
        document.body.insertAdjacentHTML("afterbegin", markup);
        
        const ele = document.querySelector(".remark_standard_minimodal");
        
        const goBtn = document.getElementById("remark_standard_minimodal_button");
        goBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
        
            const className = document.getElementById("batchInputClassName").value;
            const tagName = document.getElementById("batchInputTagName").value;
                
            const elements = document.getElementsByClassName(className);

            for(let i=0; i<elements.length; i++) {
                const ele = elements[i];
                if(ele.tagName.toLowerCase() == tagName) {
                    if(ele.className.includes("remark_") || ele.className.includes("highlight_element_light")) {
                        continue;
                    } else {
                        handleDeleteLabel(ele, annotations);
                    }
                }    
            }
            
            removeHTMLElement(ele);
        
        });

    }
}

function handleBatchUpdate() {
    // console.log("clicked : handleBatchUpdate")
    return;
}

function handleUndo() {
    // console.log("clicked : handleUndo")
    return;
}

function handleRedo() {
    // console.log("clicked : handleRedo")
    return;
}

// *************** Render functions ****************


function renderAllAnnotations(annotations) {
    for(let i=0; i<annotations.length; i++) {
        const ele = annotations[i];
        if(ele["html_target"]) {
            if(ele["html_target"].className.includes("remark_") || ele["html_target"].className.includes("highlight_element_strong")) {
                continue;
            } else {
                ele["html_target"].classList.remove("highlight_element_light");

                const colClass = eleColors[ele["tag"]];
                ele["html_target"].classList.add(colClass);
                ele["html_target"].classList.add("highlight_element_strong");

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
                        <span class="remark_setting_subgroup_item">
                            <button class="remark_action_btn" id="remarkBatchCreateBtn" name="batchActions">
                                CREATE
                            </button>
                            <button class="remark_action_btn" id="remarkBatchUpdateBtn" name="batchActions">
                                UPDATE
                            </button>
                            <button class="remark_action_btn" id="remarkBatchDeleteBtn" name="batchActions">
                                DELETE
                            </button>
                        </span>       
                    </div>  
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


}

function removeHighlight(annotation) {
    const t = annotation["html_target"];
    const col = eleColors[annotation["tag"]]
    if(t && t.className.includes("highlight_element_strong")) {
        t.classList.remove(col);
        t.classList.remove("highlight_element_strong");
        t.classList.add("highlight_element_light");
    }
}


// ************** Component functions **************


let BATCH_ACTION_MODAL = (action) => {

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

let SIDEBAR = (curAnnotation) => {
    
    let text = curAnnotation['text'];
    let coordinates = curAnnotation["x"] + "," + curAnnotation["y"] + "," + curAnnotation["width"] + "," + curAnnotation["height"];
    console.log(coordinates)
    if(text.length > 60) {
        text = text.substr(0, 60) + ". . ."
    }

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
                    <label for="annotation_type" class="remark_form_label">TYPE</label>
                    <input type="text" name="annotation_type" class="remark_form_input" value=${curAnnotation['tag']}>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_text" class="remark_form_label">TEXT</label>
                    <input type="text" name="annotation_text" class="remark_form_input" value=${curAnnotation['text']}>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_coordinates" class="remark_form_label">COORDINATES (x,y,w,h)</label>
                    <input type="text" name="annotation_coordinates" class="remark_form_input" value="${coordinates}">
                </div>
                <div class="remark_form_fields">
                    <button type="button" class="remark_standard_button" id="remark_edit_annotation_button" style="position: absolute;
                    bottom: 1.6rem; width: 16rem;">Edit</button>
                </div>
            </div>
        </div>
    `

    return markup;

}

let TOOLTIP = (ele) => {
    const rect = ele.getBoundingClientRect();;
    const x = Math.round(rect.x), y = Math.round(rect.y), w = Math.round(rect.width), h = Math.round(rect.height);
    const markup = `
        <div id="remark_tooltip">
            <h4>${ele.tagName}</h4>
            <p style="margin: 0.1rem 0rem 0rem 0rem;">(${w} x ${h})</p>
        </div>
    
    `;
    return markup;
}

let CONFIRM_GROUPING_MARKUP = () => {
    const markup = `
        <span class="remark_confirm_grouping">
            <span class="remark_grouping_options">Yes</span>
            <span class="remark_grouping_options">No</span>
        </span>
    `;
    return markup;
}

// *************** Utility functions *************** 


function createCSSClass(name,rules){
    var style = document.createElement("style");
    style.type = "text/css";
    document.getElementsByTagName("head")[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
    (style.styleSheet || style.sheet).addRule(name, rules);
    else
    style.sheet.insertRule(name+"{"+rules+"}",0);
}

function addAllClasses() {

    try {

        createCSSClass(":root", `
            --remark-color-primary: #0d6efd;
            --remark-color-primary-lighter: #5498ff;
            --remark-color-primary-darker: #0b5dd7;
            --remark-color-success: #5ec576;
            --remark-color-success-darker: #399e66;
            --remark-color-warning: #ffcb03;
            --remark-color-warning-darker: #eaac00;
            
            --remark-color-danger: #ff585f;
            --remark-color-danger-darker: #fd424b;
            --remark-color-grey-light-3: #f2f2f2;
            --remark-color-grey-light-2: #d0d0d0;
            --remark-color-grey-light-1: #9c9c9c;
            --remark-color-grey: #808080;
            --remark-color-grey-dark-1: #6c6c6c;
            --remark-color-grey-dark-2: #444444;
            --remark-color-grey-dark-3: #2d2c2c;
            --remark-color-grey-dark-4: #141313;
            --remark-color-black: #000000;
            --remark-color-white: #FFFFFF;
            --remark-color-danger-opacity: #ff58602d;
            --gradient-primary: linear-gradient(to top left, #39b385, #9be15d);
            --gradient-secondary: linear-gradient(to top left, #ffb003, #ffcb03);
            --remark-default-box-shadow-light: rgba(120, 123, 127, 0.2) 0px 8px 16px;
            --remark-default-box-shadow: rgba(75, 77, 80, 0.2) 0px 8px 24px;
            --remark-default-sanserif-font: Arial, Helvetica, sans-serif;
        `)
    
        createCSSClass(".remark_fade", `
            opacity: 0.5;
        `)
    
        createCSSClass(".highlight_element_light", `
            cursor: crosshair;
            border-radius: 0.2rem;
            padding: 0.2rem;
            background: rgba(13, 109, 253, 0.269);
            transition: background-color 125ms ease-in-out 0s;
            z-index: 100000;
        `)
            
        createCSSClass(".highlight_element_strong", `
            background: #ff28009c !important; 
            border-radius: 0.2rem; 
            padding: 0.2rem; 
            cursor: crosshair;
            z-index: 100000;
        `)

        createCSSClass(".highlight_red", `
            background: #ff45454d !important;
        `)
    
        createCSSClass(".highlight_yellow", `
            background: #ffcd454d !important;
        `)
    
        createCSSClass(".highlight_green", `
            background: #64ff454d !important;
        `)
        
        createCSSClass(".highlight_teal", `
            background: #45ffc74d !important;
        `)
        
        createCSSClass(".highlight_blue", `
            background: #45e0ff4d !important;
        `)

        createCSSClass(".highlight_purple", `
            background: #6445ff4d !important;
        `)

        createCSSClass(".highlight_violet", `
            background: #8f45ff4d !important;
        `)

        createCSSClass(".highlight_pink", `
            background: #ff45964d !important;
        `)
    
        createCSSClass(".remark_standard_modal", `
            display: flex;
            flex-direction: column;
            background: white;
            color: black;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            border-radius: 1.2rem;
            width: 22rem;
            height: auto;
            position: absolute;
            top: 14%;
            left: 40%;
            box-shadow: rgb(149 157 165 / 20%) 0px 8px 24px;
            z-index: 1000000;
        `)
    
        createCSSClass(".remark_form_input", `        
            padding: 1rem 2rem 1.2rem 1rem;
            font-family: var(--remark-default-sanserif-font);
            appearance: none;
            height: 2.8rem;
            width: 100%;
            border-radius: 0.6rem;
            background-color: var(--remark-color-white);
            margin: 0.2rem 0rem 1rem 0rem;
            transition: border 0.2s ease-in 0s;
            border: 1px solid var(--remark-color-grey-light-1);
            font-size: 0.8rem;
            color: var(--remark-color-grey);
            outline: 0px !important;        
        `);
    
        createCSSClass(".remark_standard_button", `
            background-color: var(--remark-color-primary);
            font-size: 0.8rem;
            color: var(--remark-color-white);
            font-family: inherit;
            font-weight: 500;
            border: none;
            padding: 1rem;
            border-radius: 0.8rem;
            cursor: pointer;
            transition: all 0.1s ease 0s;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            height: 3.2rem;
        `)
    
        createCSSClass(".remark_standard_button:hover", `
            background-color: var(--remark-color-primary) !important;
            transform: scale(1.04);
        `)
    
        createCSSClass(".remark_standard_button:active", `
            transform: scale(1.0) !important;
        `)
    
        createCSSClass(".remark_standard_button:focus", `
            background-color: var(--remark-color-primary) !important
            transform: scale(1.0);
        `)
    
        createCSSClass(".remark_standard_modal_title", `
            display: flex;
            flex-direction: row;
            justify-content: start;
            overflow-wrap: break-word;
            padding: 0rem;
            margin: 1rem 0rem 2rem 0rem;
            font-size: 1.1rem;
            height: inherit;
            line-height: 0rem;
            font-weight: bold;
        `)
    
        createCSSClass(".remark_form_label", `
            font-family: var(--remark-default-sanserif-font);
            font-size: 12px;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass("#remark_tooltip", `
            display: flex;
            flex-direction: row;
            padding: 1rem;
            position: fixed;
            top: 2rem;
            left: 2rem;
            border-radius: 0.8rem;
            margin: 0rem 0rem 2rem;
            background-color: var(--remark-color-black);
            color: var(--remark-color-white);
            width: 10rem;
            height: 3.2rem;
            gap: 0.8rem;
            z-index: 10000;
        `);
            
        createCSSClass(".remark_confirm_grouping", `
            display: flex;
            flex-direction: row;
            gap: 1.2rem;
            padding: 1rem;
            position: inherit;
            top: 0rem;
            right: 0rem;
            border-radius: 0.8rem;
            margin: 0rem 0rem 0rem;
            background-color: #000000;
            color: var(--remark-color-white);
            width: 9rem;
            height: 3.2rem;
            z-index: 10000;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: all 125ms ease-in-out 0s;
        `);
    
        createCSSClass(".remark_confirm_grouping:hover", `
            transform: scale(1.05);
        `);
    
        createCSSClass(".remark_confirm_grouping:active", `
            transform: scale(1.0);
        `);
    
        createCSSClass(".remark_grouping_options", `
            background: var(--remark-color-grey-dark-4);
            padding: 1rem;
            height: 1rem;
            width: 10rem;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 0.5rem;
            transition: all 125ms ease-in-out 0s;
            cursor: pointer;
        `)
    
        createCSSClass(".remark_grouping_options:hover", `
            transform: scale(1.05);
        `)
    
        createCSSClass(".remark_grouping_options", `
            transform: scale(1.0);
        `)
    
        createCSSClass(".remark_standard_sidebar", `
            position: fixed;
            top: 2.2rem;
            right: 2rem;
            width: 20rem;
            background-color: var(--remark-color-white);
            border-radius: 1.2rem;
            z-index: 100000000;
            height: 36rem;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
            display: flex;
            overflow: hidden;
            flex-direction: column;
            padding: 2rem;
        `)

        createCSSClass(".remark_annotations_sidebar_resize", `
            height: 3.2rem;
            padding: 0rem;
        `)
    
        createCSSClass("@keyframes remark_sidebar_animation", `
            from {
                width: 0px;
            }
            to {
                width: 20rem;
            }
        `)
    
        createCSSClass(".remark_sidebar_modal_header", `
            padding: 1rem;
            height: 2rem;
            margin: -1.2rem 0rem 1rem -1rem;
            width: 18.2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `)

        createCSSClass(".remark_sidebar_modal_header_resize", `
            margin: 0.4rem 1rem 0rem 1rem;
        `)
          
        createCSSClass(".remark_standard_sidebar_actions", `
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 10%;
        `)
    
        createCSSClass(".remark_standard_sidebar_title", `
            display: flex;
            flex-direction: row;
            justify-content: start;
            overflow-wrap: break-word;
            margin: 0.4rem 0rem 0rem;
            font-size: 0.8rem;
            font-weight: bold;
        `)
    
        createCSSClass(".remark_close_btn", `
            margin: 0.4rem 0rem 0rem 0rem;
            cursor: pointer;
        `) 
        
        createCSSClass(".remark_standard_sidebar_body", `
            height: 80%;
            overflow-x: hidden;
            overflow-y: scroll;
            scrollbar-width: none;    
        `)
    
        createCSSClass(".remark_standard_sidebar_body_full", `
            height: 100%;
            overflow: hidden;
        `)
    
        createCSSClass(".remark_form_fields", `
            margin: 0rem 0rem 0rem 0rem;
        `)
    
        createCSSClass(".remark_form_input:focus", `
            border: 0.5px solid var(--remark-color-primary);
        `)
    
        createCSSClass(".remark_form_label", `
            font-family: var(--remark-default-sanserif-font);
            font-size: 0.8rem;
            color: var(--remark-color-grey-light-1);
            font-weight: normal;
        `);
    
        createCSSClass("#remark_standard_modal_close_btn", `
            transition: all 0.1s ease 0s;
        `)
    
        createCSSClass("#remark_standard_modal_close_btn:hover", `
            transform: scale(1.1);
        `)
        
        createCSSClass("#remark_standard_modal_close_btn:active", `
            transform: scale(1.0);
        `)
    
        createCSSClass(".remark_init_container", `
            width: 20rem;
            background: var(--remark-color-white);
            padding: 1rem;
            height: 4rem;
            border-radius: 1.2rem;
            position: fixed;
            z-index: 10000000;
            bottom: 3rem;
            left: 36%;
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            align-content: center;
            box-shadow: var(--remark-default-box-shadow);
            transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        `)
    
        createCSSClass(".remark_init_container_resize", `
            left: 1.6%;
            width: 16rem;
            bottom: 2.6%;
        `)

        createCSSClass(".remark_init_container_resize > .remark_init_button", `
            font-size: 0.8rem;
        `)
    
        createCSSClass(".remark_init_button", `
            color: var(--remark-color-white);
            width: 60%;
            font-size: 0.9rem;
            padding: 1rem;
            background-color: var(--remark-color-primary);
            height: 3rem;
            margin: -0.5rem -0.4rem 0rem 2rem;
        `)
    
        createCSSClass(".remark_init_text", `
            width: 30%;
            font-size: 1rem;
            font-weight: 500;
            color: var(--remark-color-grey-dark-1);
            display: flex;
            align-items: center;
            justify-content: center;
        `)

        createCSSClass(".remark_standard_minimodal ", `
            width: 50rem;
            height: 6rem;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            background-color: var(--remark-color-white);
            color: var(--remark-color-grey-light-1);
            border: 1px solid var(--remark-color-grey-light-2);
            border-radius: 1.2rem;
            z-index: 10000000;
            position: fixed;
            bottom: 1rem;
            left: 24%;
        `)

        createCSSClass("#remarkRedoBtn, #remarkUndoBtn", `
            width: 6rem;
        `)
    
        createCSSClass(".remark_standard_minimodal_input ", `
            margin: 0.2rem 0rem 0rem 0rem;
            height: 2.6rem;
            width: 15rem;
            border-radius: 0.8rem;
            border: 1px solid var(--remark-color-grey-light-2);
            outline: none;
            padding: 1rem;
            color: var(--remark-color-grey-light-1);
            background: var(--remark-color-white);
        `)
    
        createCSSClass(".remark_standard_minimodal_button ", `
            width: 6rem;
            height: 2.4rem;
            border-radius: 0.8rem;
            background-color: var(--remark-color-grey-light-3);
            color: var(--remark-color-grey);
            font-size: 1.2rem;
            padding: 0rem;
            margin: 2rem 1rem 0rem 1rem;
            border: 1px solid var(--remark-color-grey-light-2);
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
        `)

        createCSSClass(".remark_standard_minimodal_button:hover ", `
            transform: scale(1.1)
        `)

        createCSSClass(".remark_standard_minimodal_button:active ", `
            transform: scale(1.0)
        `)
    
        createCSSClass(".remark_standard_minimodal_input_container ", `
            height: 100%;
            display: block;
            width: 100%;
            margin: 1rem 1rem 0rem 0rem;
        `)
    
        createCSSClass(".remark_standard_minimodal_label ", `
            font-size: 0.7rem;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass(".remark_standard_minimodal_body ", `
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            height: 100%;
        `)
    
        createCSSClass(".remark_standard_minimodal_title ", `
            height: 100%;
            border-right: 1px solid var(--remark-color-grey-light-2);
            margin: 0rem 0rem 0rem 0rem;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            text-align: center;
            width: 13%;
            padding: 1rem;
            font-size: 0.8rem;
        `)
    
        createCSSClass(".remark_hide ", `
            display: none;
            opacity: 0;
            visibility: hidden;
        `)
    
        createCSSClass(".remark_show ", `
            display: flex;
            opacity: 1;
            visibility: visible;
        `)
        
        createCSSClass(".remark_standard_menu_container ", `
            height: 15rem;
            width: 16rem;
            border-radius: 1.2rem;
            background-color: var(--remark-color-white);
            display: flex;
            flex-direction: column;
            padding: 1.6rem;
            border: 1px solid var(--remark-color-grey-light-2);
            z-index: 10000000;
            position: fixed;
            top: 2rem;
            left: 1.4rem;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
        `)

        createCSSClass(".remark_menu_body", `
            height: 100%;
            width: 100%;
        `)
        
        createCSSClass(".remark_menu_resize", `
            height: 3.2rem;
        `)

        
        createCSSClass(".remark_standard_menu_header", `
            padding: 0rem;
            height: 2rem;
            margin: -1.2rem 0rem 1rem 0rem;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `)
    
        createCSSClass(".remark_main_heading ", `
            font-size: 1.6rem;
            color: var(--remark-color-grey-dark-2);
            text-align: center;
        `)
    
        createCSSClass(".remark_settings ", `
            height: 100%;
            display: flex;
            flex-direction: column;
            margin: -1rem 0rem -3rem 0rem;
        `)
    
        createCSSClass(".remark_settings_subgroup ", `
            padding: 1rem;
            margin: 0rem 0rem 0rem -1rem;
        `)
    
        createCSSClass(".remark_settings_subgroup_title ", `
            margin: 0.2rem 0rem 0.2rem 0rem;
            font-size: 0.7rem;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass(".remark_setting_subgroup_item ", `
            margin: 0.4rem 0rem 0rem;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `)
    
        createCSSClass(".remark_toggle ", `
            cursor: pointer;
            display: inline-block;
            margin: 0.4rem 0rem;
        `)
    
        createCSSClass(".remark_toggle_switch ", `
            display: inline-block;
            background: #ccc;
            border-radius: 16px;
            width: 36px;
            height: 20px;
            position: relative;
            vertical-align: middle;
            transition: background 0.25s;
        `)
    
        createCSSClass(".remark_toggle_switch:before, .remark_toggle_switch:after", `
            content: "";
        `)
    
        createCSSClass(".remark_toggle_switch:before", `
            display: block;
            background: linear-gradient(to bottom, #fff 0%, #eee 100%);
            border-radius: 50%;
            width: 12px;
            height: 12px;
            position: absolute;
            top: 4px;
            left: 4px;
            transition: left 0.25s;
        `)
    
        createCSSClass(".remark_toggle_checkbox:checked + .remark_toggle_switch ", `
            background: var(--remark-color-primary);
        `)
    
        createCSSClass(".remark_toggle_checkbox:checked + .remark_toggle_switch:before ", `
         left: 20px;
        `)
    
        createCSSClass(".remark_toggle_checkbox ", `
            position: absolute;
            visibility: hidden;
        `)
    
        createCSSClass(".remark_toggle_label ", `
            margin: 0rem 0rem 0rem 1rem;
            position: relative;
            top: 1px;
            font-size: 0.7rem;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass(".remark_action_btn ", `
            width: 100%;
            margin: 0.2rem 1rem 0rem 0rem;
            height: 2rem;
            color: var(--remark-color-grey-dark-1);
            padding: 0.3rem;
            background-color: var(--remark-color-grey-light-3);
            border-radius: 0.6rem;
            border: 1px solid var(--remark-color-grey-light-2);
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
            font-size: 0.8rem;
        `)

        createCSSClass(".remark_action_btn:hover ", `
            transform: scale(1.1)
        `)
        createCSSClass(".remark_action_btn:active ", `
            transform: scale(1.0)
        `)

    
        createCSSClass("input[type='number'] ", `
            -webkit-appearance: textfield;
            -moz-appearance: textfield;
            appearance: textfield;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass("input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button ", `
            -webkit-appearance: none;
        `)
    
        createCSSClass(".remark_number_input ", `
            border: 1px solid var(--remark-color-grey-light-2);
            border-radius: 0.4rem;
            height: 1.6rem; 
            display: inline-flex;
        `)
    
        createCSSClass(".remark_number_input,.remark_number_input * ", `
            box-sizing: border-box;
        `)
    
        createCSSClass(".remark_number_input button ", `
            outline: none;
            appearance: none;
            background-color: transparent;
            border: none;
            align-items: center;
            justify-content: center;
            width: 1rem;
            height: 1.6rem;
            cursor: pointer;
            margin: 0px;
            position: relative;
        `)
    
        createCSSClass(".remark_number_input button:before,.remark_number_input button:after ", `
            display: inline-block;
            position: absolute;
            content: "";
            width: 0.7rem;
            height: 1.7px;
            background-color: var(--remark-color-grey-light-2);
            transform: translate(-50%, -50%);
            border-radius: 1rem;
        `)
    
        createCSSClass(".remark_number_input button.plus:after ", `
            transform: translate(-50%, -50%) rotate(90deg);
        `)
    
        createCSSClass(".remark_number_input input[type=number] ", `
            font-family: sans-serif;
            max-width: 2.4rem;
            font-size: 0.8rem;
            height: 1.6rem;
            text-align: center;
            background: var(--remark-color-white);
            border: 1px solid var(--remark-color-grey-light-2);
            box-shadow: none;
            outline: none;
        `)
    } catch(e) {
        console.log("CSS error : ", e)
    }


}

function getAnnotationByID(annotation_id, annotations) {
    for(let ele of annotations) {
        if(Number(annotation_id) === ele["id"]) {
            return ele;
        }
    }
    return;
}

function removeAllExistingModals() {
    // const create_modal_check = document.getElementById("remark_create_annotation_modal");
    const edit_modal_check = document.getElementById("remark_edit_annotation_modal");
    // const delete_modal_check = document.getElementById("remark_delete_annotation_modal");

    // if (create_modal_check) {
    //     removeHTMLElement(create_modal_check);
    // }
    if (edit_modal_check) {
        removeHTMLElement(edit_modal_check);
    }
    // if (delete_modal_check) {
    //     removeHTMLElement(delete_modal_check);
    // }
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