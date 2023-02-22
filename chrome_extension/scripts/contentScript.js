(() => {    
    chrome.runtime.onMessage.addListener(function(res, sendResponse) {
        console.log("from foreground : ", res.msg, res.dataURI);
    });
    remark_init();
})();


function remark_init() {
    removeAllExistingModals();
    addStyleSheet();
    addAllClasses();
    startAnnotationProcess();  
}


function startAnnotationProcess() {

    let annotations = []

 

    document.body.addEventListener("keypress", (e) => {
        if(e.key === "Escape") {
            removeAllExistingModals();
        }
    })

    document.body.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      
        const t = e.target;

        if(e.ctrlKey) {
            // Delete label
            if(t.classList.contains("highlight_element_strong")) {
                annotations = deleteLabel(t, annotations);
            }

            console.log("delete annotations : ", annotations);
            t.classList.add("highlight_element_light");
            t.classList.remove("highlight_element_strong");
            
        } else if(e.shiftKey) {
            // Edit label
            
            if(t.classList.contains("highlight_element_strong")) {
                curAnnotation = getAnnotationByID(t.dataset.annotation_id, annotations);
                let editAnnotationModal = EDIT_ANNOTATION_MODAL(curAnnotation);
                document.body.insertAdjacentHTML("afterbegin", editAnnotationModal);

                const editButton = document.getElementById("remark_edit_annotation_button");
                editButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const annotation_id = Number(document.getElementById("editAnnotationForm").dataset.annotation_id);
                    const newType = document.querySelector("input[name='annotation_type']").value;
                    const newText = document.querySelector("input[name='annotation_text']").value;
                    const newCoordinates = document.querySelector("input[name='annotation_coordinates']").value;

                    console.log(newText, newCoordinates, annotation_id, newType);

                    for(let ele of annotations) {
                        if(ele["id"] == annotation_id) {
                            ele["text"] = newText;
                            ele["type"] = newType;
                            ele["coordinates"] = newCoordinates;
                        }
                    }
                    
                    const edit_modal_check = document.getElementById("remark_edit_annotation_modal");
                    if(edit_modal_check) {
                        removeHTMLElement(edit_modal_check);
                    }

                });


            }

            console.log("edit annotations : ", annotations);

        } else {
             // Add label
             if(t.classList.contains("highlight_element_light")) {
                if(t.classList.contains("highlight_element_strong")) {
                    return;
                }
    
                annotations = addLabel(t, annotations);
                
                console.log("add annotations : ", annotations);
    
                t.classList.remove("highlight_element_light");
                t.classList.add("highlight_element_strong");
            }

        }


    });
    
    document.body.addEventListener("mouseover", mouseOverListener);
    document.body.addEventListener("mouseout", mouseOutListener);    
}


// ******************* Listeners *******************

function mouseOverListener(e) {
    e.preventDefault();
    e.stopPropagation();
    const VALID_HTML_ELEMENTS = [
        "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", "AUDIO", "VIDEO"
    ]
    const className = e.target.className;
    if (className.includes("remark_") || className.includes("highlight_element_strong")) {
        return;
    }
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
}

function mouseOutListener(e) {
    e.preventDefault();
    e.stopPropagation();
    const VALID_HTML_ELEMENTS = [
        "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", "AUDIO", "VIDEO"
    ]
    const className = e.target.className;
    if (className.includes("remark_") || className.includes("highlight_element_strong")) {
        return;
    }
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
}

function removeHTMLElement(ele) {
    ele.parentElement.removeChild(ele);
    return;
}


// ******************* Handlers ********************

function addLabel(t, annotations) {
    const rect = t.getBoundingClientRect();;
    const x = Math.round(rect.x), y = Math.round(rect.y), w = Math.round(rect.width), h = Math.round(rect.height);
    console.log(x,y,w,h);

    const d = {
        "id" : Math.round(Math.random() * 10000),
        "type" : t.tagName.toLowerCase(),
        "coordinates" : [x, y, w, h],
        "text" : t.innerText,
        "parent" : t.parentNode.tagName.toLocaleLowerCase()
    }

    annotations.push(d);
    t.dataset.annotation_id = d["id"]

    return annotations
}

function deleteLabel(t, annotations) {

    const annotation_id = Number(t.dataset.annotation_id);

    annotations = annotations.filter(function(ele) {
        return ele.id != annotation_id;
    });
    
    delete t.dataset.annotation_id;

    return annotations;
}


// ************** Component functions **************


let EDIT_ANNOTATION_MODAL = (curAnnotation) => {
    const markup = `
        <div class="remark_standard_modal" id="remark_edit_annotation_modal">
            <h3 class="remark_standard_modal_title">Edit Annotation</h3>
            <div class="remark_standard_modal_body">
                <form id="editAnnotationForm" class="remark_form" data-annotation_id="${curAnnotation['id']}">
                    <div class="remark_form_fields">
                        <label for="annotation_id" class="remark_form_label">ID</label>
                        <input type="text" name="annotation_id" class="remark_form_input" value="${curAnnotation['id']}" readonly disabled>
                    </div>
                    <div class="remark_form_fields">
                        <label for="annotation_type" class="remark_form_label">TYPE</label>
                        <input type="text" name="annotation_type" class="remark_form_input" value=${curAnnotation['type']}>
                    </div>
                    <div class="remark_form_fields">
                        <label for="annotation_text" class="remark_form_label">TEXT</label>
                        <input type="text" name="annotation_text" class="remark_form_input" value=${curAnnotation['text']}>
                    </div>
                    <div class="remark_form_fields">
                        <label for="annotation_coordinates" class="remark_form_label">COORDINATES</label>
                        <input type="text" name="annotation_coordinates" class="remark_form_input" value="${curAnnotation['coordinates']}">
                    </div>
                    <div class="remark_form_fields">
                        <label for="annotation_parent" class="remark_form_label">PARENT</label>
                        <input type="text" name="annotation_parent" class="remark_form_input" value="${curAnnotation['parent']}" readonly disabled>
                    </div>
                    <div class="remark_form_fields">
                        <button type="button" class="remark_standard_button" id="remark_edit_annotation_button">Edit</button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    `
    return markup;
}


// *************** Utility functions *************** 


function addStyleSheet(){
    var link = document.createElement("link");
    link.href = chrome.runtime.getURL("remark.css");
    link.type = "text/css";
    link.rel = "stylesheet";
    document.documentElement.appendChild(link);
}
  
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

    createCSSClass(".highlight_element_light", `
        padding: 0.4rem;
        cursor: crosshair;
        border-radius: 0.4rem;
        align-items: center;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: rgb(255 255 255 / 10%) 0px 1px inset;
        transition: background-color 125ms ease-in-out 0s;
        z-index: 100000;
        `)
        
    createCSSClass(".highlight_element_strong", `
        outline: solid 1px #ff28009c; 
        border-radius: 0.4rem; 
        padding: 0.4rem; 
        cursor: crosshair;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: rgb(255 255 255 / 10%) 0px 1px inset;
        z-index: 100000;
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
        margin: 0.4rem 0rem 1.4rem 0rem;
        transition: border 0.2s ease-in 0s;
        border: 0.5px solid var(--remark-color-grey);
        font-size: 1rem;
        color: var(--remark-color-grey);
        outline: 0px !important;
    `);

    createCSSClass(".remark_standard_button", `
        background-color: var(--remark-color-primary);
        font-size: 1rem;
        color: var(--remark-color-white);
        font-family: inherit;
        font-weight: 500;
        border: none;
        padding: 1.25rem 4.5rem;
        border-radius: 0.8rem;
        cursor: pointer;
        transition: all 0.1s ease 0s;
        margin: 1rem 0rem 0rem;
        width: 100%;
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