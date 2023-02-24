(async() => {    
    console.log("from foreground : init . . .");
    let settings = await getDataFromStorage("remark_settings");
    settings = settings["remark_settings"];
    console.log("outside storage : ", settings);
    remark_init(settings);
})();


var REMARK_SETTINGS;
var annotations = []

function remark_init(settings) {
    REMARK_SETTINGS = settings;
    console.log("DOM check and Settings check : ", document.body, REMARK_SETTINGS)
    removeAllExistingModals();
    addAllClasses();
    startAnnotationProcess();  
}


function startAnnotationProcess() {

    document.body.addEventListener("keypress", keyPressListener)

    document.body.addEventListener("click", clickListener);
    document.body.addEventListener("mouseover", mouseOverListener);
    document.body.addEventListener("mouseout", mouseOutListener);    
}


// ******************* Listeners *******************

function clickListener(e) {
    
    e.preventDefault();
    e.stopPropagation();
    
    const t = e.target;

    if(e.altKey) {
        // Delete label
        if(t.classList.contains("highlight_element_strong")) {
            annotations = deleteLabel(t, annotations);
        }
        
        if(t.classList.contains("highlight_element_light")) {
            t.classList.remove("highlight_element_light");
        }
        console.log("delete annotations : ", annotations);
        t.classList.remove("highlight_element_light");
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

            if(REMARK_SETTINGS["groupByClassName"]) {
                console.log("REACHED")
                if(REMARK_SETTINGS["confirmBeforeGrouping"]) {
                    let cgm = CONFIRM_GROUPING_MARKUP();
                    t.insertAdjacentHTML("afterbegin", cgm);
                    cgm = document.querySelector(".remark_confirm_grouping");

                    Array.from(document.querySelectorAll(".remark_grouping_options")).forEach((ele) => {
                        console.log("REACHED 3")
                        ele.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const val = e.target.innerText;
                            console.log("VAL : ", val)
                            if(val == "Yes") {
                                
                                const className = t.className.split(" ")[0];
                                const nodes = document.querySelectorAll(`.${className}`);
                                
                                Array.from(nodes).forEach((ele) => {
                                    annotations = addLabel(ele, annotations);
                                    ele.classList.remove("highlight_element_light");
                                    ele.classList.add("highlight_element_strong");
                                });
                                
                                if(cgm) {
                                    console.log("REACHED DEL 1")
                                    removeHTMLElement(cgm);
                                }
                                
                            } else {
                                console.log("clicked no : ", cgm)
                                annotations = addLabel(t, annotations);
                                
                                t.classList.remove("highlight_element_light");
                                t.classList.add("highlight_element_strong");
                                if(cgm) {
                                    console.log("REACHED DEL 2")
                                    removeHTMLElement(cgm);
                                }
                            } 
    
                        });
                    })
                    
                } else {
                    console.log("REACHED 1")
                    annotations = addLabel(t, annotations);
                    t.classList.remove("highlight_element_light");
                    t.classList.add("highlight_element_strong");
                }

            } else {
                console.log("REACHED 2")

                annotations = addLabel(t, annotations);
                
                t.classList.remove("highlight_element_light");
                t.classList.add("highlight_element_strong");
            }
            
            console.log("add annotations : ", annotations);
        } else if(t.classList.contains("highlight_element_strong")) {
            const id = t.dataset.annotation_id;
            const curAnnotation = getAnnotationByID(id, annotations);
            let sideBar = SIDEBAR(curAnnotation);

            console.log("in strong")
            const check = document.getElementById("remark_annotations_sidebar");    
            if (check) {
                removeHTMLElement(check);
            }

            document.body.insertAdjacentHTML("afterbegin", sideBar);

            const modalCloseBtn = document.getElementById("remark_standard_modal_close_btn");
            if(modalCloseBtn) {
                modalCloseBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const ele = document.getElementById("remark_annotations_sidebar");
                    removeHTMLElement(ele);
                })
            }
        }

    }
}

function mouseOverListener(e) {
    e.preventDefault();
    e.stopPropagation();
    const VALID_HTML_ELEMENTS = [
        "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", "AUDIO", "VIDEO"
    ]
    const className = e.target.className;
    if(className) {
        if (className.includes("remark_") || className.includes("highlight_element_strong")) {
            return;
        }
    }
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        let tooltipMarkup = TOOLTIP(e.target);
        targetHTMLElement.insertAdjacentHTML("afterbegin", tooltipMarkup);
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
    if(className) {
        if (className.includes("remark_") || className.includes("highlight_element_strong")) {
            return;
        }
    }
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        const tooltipNode = document.getElementById("remark_tooltip");
        removeHTMLElement(tooltipNode);
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
}

function keyPressListener(e) {
    if(e.key === "Escape") {
        removeAllExistingModals();
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


let SIDEBAR = (curAnnotation) => {
    
    let text = curAnnotation['text'];
    if(text.length > 60) {
        text = text.substr(0, 60) + ". . ."
    }

    const markup =
    `
        <div class="remark_standard_sidebar" id="remark_annotations_sidebar">
            <div class="remark_sidebar_modal_header">
                <h3 class="remark_standard_sidebar_title">ANNOTATION DATA</h3>
                <div class="remark_standard_sidebar_actions">
                    <span class="remark_close_btn" id="remark_standard_modal_close_btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="remark_close_btn"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z" class="remark_"/></svg>
                    </span>
                </div>
            </div>
            <div class="remark_standard_modal_body remark_standard_sidebar_body remark_standard_sidebar_body_full" id="remark_sidebar_body">
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">ID</label>
                    <input type="text" name="annotation_id" class="remark_form_input" value="${curAnnotation['id']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">TYPE</label>
                    <input type="text" name="annotation_id" class="remark_form_input" value="${curAnnotation['type']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">COORDINATES</label>
                    <input type="text" name="annotation_id" class="remark_form_input" value="${curAnnotation['coordinates']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">PARENT</label>
                    <input type="text" name="annotation_id" class="remark_form_input" value="${curAnnotation['parent']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_id" class="remark_form_label">TEXT</label>
                    <input type="text" name="annotation_id" class="remark_form_input" value="${text}" readonly disabled>
                </div>
            </div>
        </div>
    `

    return markup;

}


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
        cursor: crosshair;
        border-radius: 0.4rem;
        padding: 0.4rem;
        background: rgba(13, 109, 253, 0.269);
        transition: background-color 125ms ease-in-out 0s;
        z-index: 100000;
    `)
        
    createCSSClass(".highlight_element_strong", `
        outline: solid 1px #ff28009c; 
        border-radius: 0.4rem; 
        padding: 0.4rem; 
        cursor: crosshair;
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
        border: 1px solid var(--remark-color-grey-light-1);
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
        top: 0px;
        right: 0px;
        width: 20rem;
        background-color: var(--remark-color-white);
        color: var(--remark-color-grey-dark-1);
        border-radius: 1rem;
        z-index: 100000000;
        height: 100vh;
        animation: 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) 0s 1 normal forwards running remark_sidebar_animation;
        display: flex;
        overflow: hidden;
        flex-direction: column;
        padding: 2rem;
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
        margin: 0rem -1rem 2rem 3rem;
        width: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
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
        color: var(--remark-color-grey-light-2);  
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