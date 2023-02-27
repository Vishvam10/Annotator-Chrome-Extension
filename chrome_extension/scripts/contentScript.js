(async() => {    
    console.log("from foreground : init . . .");

    var settings = {
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



// function attachListeners() {

//     const inps = document.querySelectorAll(".remark_settings_input");
//     Array.from(inps).forEach((ele) => {
//         ele.addEventListener("click", updateRemarkGlobalSettings.bind(ele))
//     })

//     const undoBtn = document.getElementById("remarkUndoBtn");
//     undoBtn.addEventListener("click", handleUndo);

//     const redoBtn = document.getElementById("remarkRedoBtn");
//     redoBtn.addEventListener("click", handleRedo);

//     const remarkBatchCreateBtn = document.getElementById("remarkBatchCreateBtn");
//     remarkBatchCreateBtn.addEventListener("click", handleBatchCreate);
    
//     const remarkBatchUpdateBtn = document.getElementById("remarkBatchUpdateBtn");
//     remarkBatchUpdateBtn.addEventListener("click", handleBatchUpdate);
    
//     const remarkBatchDeleteBtn = document.getElementById("remarkBatchDeleteBtn");
//     remarkBatchDeleteBtn.addEventListener("click", handleBatchDelete);

// }

// function handleBatchCreate() {
//     console.log("clicked : handleBatchCreate");

//     const markup = BATCH_ACTION_MODAL("batchCreate");
//     document.body.insertAdjacentHTML("afterbegin", markup);

//     const goBtn = document.getElementById("remark_standard_minimodal_button");
//     goBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         e.stopPropagation();

//         const className = document.getElementById("batchInputClassName").value;
//         const tagName = document.getElementById("batchInputTagName").value;

//     })

//     return;
// }
// function handleBatchUpdate() {
//     console.log("clicked : handleBatchUpdate")
//     return;
// }
// function handleBatchDelete() {
//     console.log("clicked : handleBatchDelete")
//     return;
// }
// function handleUndo() {
//     console.log("clicked : handleUndo")
//     return;
// }
// function handleRedo() {
//     console.log("clicked : handleRedo")
//     return;
// }

// const BATCH_ACTION_MODAL = (action) => {

//     let title = "";

//     if(action == "batchCreate") {
//         title = "BATCH CREATE"
//     } else if(action == "batchDelete") {
//         title = "BATCH DELETE"
//     }

//     const markup = `
//         <div class="remark_standard_minimodal">
//             <h4 class="remark_standard_minimodal_title">${title}</h4>
//             <div class="remark_standard_minimodal_body">
//                 <span class="remark_standard_minimodal_input_container">
//                     <label for="batchInputTagName" class="remark_standard_minimodal_label">TAGNAME</label>
//                     <br>
//                     <input id="batchInputTagName" class="remark_standard_minimodal_input" type="text">
//                 </span>
//                 <span class="remark_standard_minimodal_input_container">
//                     <label for="batchInputClassName" class="remark_standard_minimodal_label">CLASSNAME</label>
//                     <br>
//                     <input id="batchInputClassName" class="remark_standard_minimodal_input" type="text">
//                 </span>
//             </div>
//             <span style="height: 100%; border-left: 1px solid var(--remark-color-grey-light-2); margin: 0rem 0rem 0rem -2rem">
//                 <button class="remark_standard_minimodal_button" id="remark_standard_minimodal_button">GO</button>
//             </span>
//         </div>
//     `
//     return markup;
// }

// function updateRemarkGlobalSettings(e) {
//     const t = e.target;
//     console.log("clicked : ", t, t.id, t.value, t.checked, t.name, typeof(t.checked));

//     if(typeof(t.checked) == "boolean") {
//         settings[t.name][t.id] = t.checked;
//     } 

// }

// attachListeners()

var REMARK_SETTINGS;
var annotations = []

function remark_init(settings) {
    REMARK_SETTINGS = settings;
    console.log("DOM check and Settings check : ", document.body, REMARK_SETTINGS);
    
    addAllClasses();    

    const markup = `
        <div class="remark_init_container">
            <span class="remark_init_text">REMARK</span>
            <button type="button" class="remark_standard_button remark_init_button" id="remark_start">Start Annotation</button>
        </div>
    `
    document.body.insertAdjacentHTML("afterbegin", markup);


    document.getElementById("remark_start").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if(e.target.innerText == "Start Annotation") {
            document.querySelector(".remark_init_container").classList.add("remark_init_container_resize");
            e.target.innerText = "Stop Annotation";

            const markup = MENU();
            document.body.insertAdjacentHTML("afterbegin", markup);
            removeAllExistingModals();
            startAnnotationProcess();
        }
        else if(e.target.innerText == "Stop Annotation") {
            e.target.innerText = "Start Annotation";
            stopAnnotationProcess();
            document.querySelector(".remark_init_container").classList.remove("remark_init_container_resize");
            return;
        } else {
            return;
        }
    })

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

// ******************* Listeners *******************

function clickListener(e) {
    
    e.preventDefault();
    e.stopPropagation();
    
    const t = e.target;

    if(e.altKey) {
        // Delete label
        if(t.classList.contains("highlight_element_strong")) {
            annotations = handleDeleteLabel(t, annotations);
        }
        
        if(t.classList.contains("highlight_element_light")) {
            t.classList.remove("highlight_element_light");
        }
        console.log("delete annotations : ", annotations);
        t.classList.remove("highlight_element_light");
        t.classList.remove("highlight_element_strong");
        
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
                                    annotations = handleCreateLabel(ele, annotations);
                                    ele.classList.remove("highlight_element_light");
                                    ele.classList.add("highlight_element_strong");
                                });
                                
                                if(cgm) {
                                    console.log("REACHED DEL 1")
                                    removeHTMLElement(cgm);
                                }
                                
                            } else {
                                console.log("clicked no : ", cgm)
                                annotations = handleCreateLabel(t, annotations);
                                
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
                    annotations = handleCreateLabel(t, annotations);
                    t.classList.remove("highlight_element_light");
                    t.classList.add("highlight_element_strong");
                }

            } else {
                console.log("REACHED 2")

                annotations = handleCreateLabel(t, annotations);
                
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
            const modalCloseBtn = document.getElementById("remark_standard_modal_close_btn");

            if(modalCloseBtn) {
                modalCloseBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const ele = document.getElementById("remark_annotations_sidebar");
                    removeHTMLElement(ele);
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

function removeHTMLElement(ele) {
    if(ele && ele.parentElement) {
        ele.parentElement.removeChild(ele);
    }
    return;
}

function repositionStart() {
    const ele = document.querySelector(".remark_init_container");
    ele.classList.add("remark_init_container_resize");
}

// ******************* Handlers ********************

function handleCreateLabel(targetHTMLElement, annotations) {
    const rect = targetHTMLElement.getBoundingClientRect();;
    const x = Math.round(rect.x), y = Math.round(rect.y), w = Math.round(rect.width), h = Math.round(rect.height);
    console.log(x,y,w,h);

    const d = {
        "id" : Math.round(Math.random() * 10000),
        "type" : targetHTMLElement.tagName.toLowerCase(),
        "coordinates" : [x, y, w, h],
        "text" : targetHTMLElement.innerText,
        "parent" : targetHTMLElement.parentNode.tagName.toLocaleLowerCase(),
        "html_id" : targetHTMLElement.id,
        "html_class" : targetHTMLElement.className,
        "html_xpath" : getNodeXpath(targetHTMLElement)
    }

    annotations.push(d);
    targetHTMLElement.dataset.annotation_id = d["id"]

    return annotations
}

function handleEditLabel(targetHTMLElement, annotations) {
    if(targetHTMLElement.classList.contains("highlight_element_strong")) {
            
        const annotation_id = Number(targetHTMLElement.dataset.annotation_id);
        const newType = document.querySelector("input[name='annotation_type']").value;
        const newText = document.querySelector("input[name='annotation_text']").value;
        const newCoordinates = document.querySelector("input[name='annotation_coordinates']").value;

        for(let ele of annotations) {
            if(ele["id"] == annotation_id) {
                ele["text"] = newText;
                ele["type"] = newType;
                ele["coordinates"] = newCoordinates;
                console.log("changed : ", ele)
            }
        }
        
        const edit_modal_check = document.getElementById("remark_edit_annotation_modal");
        if(edit_modal_check) {
            removeHTMLElement(edit_modal_check);
        }

    }

    console.log("edit annotations : ", annotations);
}

function handleDeleteLabel(targetHTMLElement, annotations) {

    const annotation_id = Number(targetHTMLElement.dataset.annotation_id);

    annotations = annotations.filter(function(ele) {
        return ele.id != annotation_id;
    });
    
    delete targetHTMLElement.dataset.annotation_id;

    return annotations;
}

function handleBatchAction(action) {
    const ele = document.querySelector(".remark_standard_minimodal");
    if(ele) {
        removeHTMLElement(ele);
    }
    if(action == "batchCreate") {

        console.log("clicked : handleBatchCreate");
        
        const markup = BATCH_ACTION_MODAL("batchCreate");
        document.body.insertAdjacentHTML("afterbegin", markup);
        
        const ele = document.querySelector(".remark_standard_minimodal");
        
        const goBtn = document.getElementById("remark_standard_minimodal_button");
        goBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
        
            const className = document.getElementById("batchInputClassName").value;
            const tagName = document.getElementById("batchInputTagName").value;
        
            console.log("tagname, classname : ", tagName, className);
        
            // batchCreateLabels(className, tagName);
        
            removeHTMLElement(ele)
        
        });
        
    } else if(action == "batchDelete") {
        
        console.log("clicked : handleBatchDelete");
        
        const markup = BATCH_ACTION_MODAL("batchDelete");
        document.body.insertAdjacentHTML("afterbegin", markup);
        
        const ele = document.querySelector(".remark_standard_minimodal");
        
        const goBtn = document.getElementById("remark_standard_minimodal_button");
        goBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
        
            const className = document.getElementById("batchInputClassName").value;
            const tagName = document.getElementById("batchInputTagName").value;
        
            console.log("tagname, classname : ", tagName, className);
        
            // batchCreateLabels(className, tagName);
        
            removeHTMLElement(ele)
        
        });


    }
}

// ************** Component functions **************

let MENU = () => {

    const markup = `
        <div class="remark_standard_menu_container">
            <div class="remark_standard_menu_header">
                <h3 class="remark_standard_sidebar_title">MENU</h3>
                <div class="remark_standard_sidebar_actions">
                    <span class="remark_close_btn" id="remark_standard_menu_close_btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="remark_close_btn"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z" class="remark_"/></svg>
                    </span>
                </div>
            </div>
            <div class="remark_settings">
                <div class="remark_settings_subgroup">
                    <h5 class="remark_settings_subgroup_title">ACTIONS </h5>      
                    <span class="remark_setting_subgroup_item">
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
                <div class="remark_settings_subgroup">
                    <h5 class="remark_settings_subgroup_title">APPEARANCE</h5>      
                    <span class="remark_setting_subgroup_item">
                        <label class="remark_toggle" for="highlightUsingSameColor">
                            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" id="highlightUsingSameColor" name="appearance">
                            <div class="remark_toggle_switch"></div>
                            <span class="remark_toggle_label">UNIFORM COLOR</span>
                        </label>
                    </span>     
        
                    <span class="remark_setting_subgroup_item">
                        <label for="highlightThickness" class="remark_">
                            <div class="remark_number_input">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="remark_remark_settings_input"></button>
                                <input id="highlightThickness" min="1" value="8" type="number" name="appearance">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="plus remark_remark_settings_input" ></button>
                            </div>       
                            <span class="remark_toggle_label">THICKNESS</span>
                        </label>
                    </span>
                    <span class="remark_setting_subgroup_item">
                        <label for="highlightBorderRadius" class="remark_">
                            <div class="remark_number_input">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="remark_remark_settings_input"></button>
                                <input id="highlightBorderRadius" class="remark_remark_settings_input" min="0" value="24" type="number" name="appearance">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="plus remark_remark_settings_input"></button>
                            </div>       
                            <span class="remark_toggle_label">RADIUS</span>
                        </label>
                    </span>
                </div>
                <div class="remark_settings_subgroup">
                    <h5 class="remark_settings_subgroup_title">CONFIGURATION</h5>      
                    <span class="remark_setting_subgroup_item">
                        <label for="probeDepth" class="remark_">
                            <div class="remark_number_input">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="remark_remark_settings_input"></button>
                                <input id="probeDepth" min="4" max="50" value="20" type="number" name="configuration">
                                <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="plus remark_remark_settings_input"></button>
                            </div>       
                            <span class="remark_toggle_label">PRODE DEPTH</span>
                        </label>
                    </span>
                    <span class="remark_setting_subgroup_item">
                        <label class="remark_toggle" for="includeXPath">
                            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" id="includeXPath" name="configuration">
                            <div class="remark_toggle_switch"></div>
                            <span class="remark_toggle_label">INCLUDE XPATH</span>
                        </label>
                    </span>     
                    <span class="remark_setting_subgroup_item">
                        <label class="remark_toggle" for="includeStyles">
                            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" id="includeStyles" name="configuration">
                            <div class="remark_toggle_switch"></div>
                            <span class="remark_toggle_label">INCLUDE CSS STYLES</span>
                        </label>
                    </span>     
                    <span class="remark_setting_subgroup_item">
                        <label class="remark_toggle" for="showToolTip">
                            <input class="remark_toggle_checkbox remark_remark_settings_input" type="checkbox" id="showToolTip" name="configuration">
                            <div class="remark_toggle_switch"></div>
                            <span class="remark_toggle_label">SHOW TOOLTIP</span>
                        </label>
                    </span>     
                </div>
            </div>
            <button class="remark_standard_button" id="remarkPushToServer">
                PUSH TO SERVER
            </button>
        </div>
    `

    return markup;
}

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
                    <input type="text" name="annotation_id" class="remark_form_input remark_fade" value="${curAnnotation['id']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_parent" class="remark_form_label">PARENT</label>
                    <input type="text" name="annotation_parent" class="remark_form_input remark_fade" value="${curAnnotation['parent']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_parent" class="remark_form_label">HTML CLASS</label>
                    <input type="text" name="annotation_parent" class="remark_form_input remark_fade" value="${curAnnotation['html_class']}" readonly disabled>
                </div>
                <div class="remark_form_fields">
                    <label for="annotation_parent" class="remark_form_label">HTML XPATH</label>
                    <input type="text" name="annotation_parent" class="remark_form_input remark_fade" value="${curAnnotation['html_xpath']}" readonly disabled>
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
            margin: 0.2rem 0rem 1rem 0rem;
            transition: border 0.2s ease-in 0s;
            border: 1px solid var(--remark-color-grey-light-1);
            font-size: 0.8rem;
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
            border-radius: 1.2rem 0rem 0rem 1.2rem;
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
            left: 8%;
            width: 20rem;
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
            width: 64rem;
            height: 8rem;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            background-color: var(--remark-color-white);
            color: var(--remark-color-grey-light-1);
            border: 1px solid var(--remark-color-grey-light-2);
            border-radius: 1.2rem;
            z-index: 10000000;
        `)
    
        createCSSClass(".remark_standard_minimodal_input ", `
            margin: 0.8rem 0rem 0rem 0rem;
            height: 1.2rem;
            width: 16rem;
            border-radius: 1rem;
            border: 1px solid var(--remark-color-grey-light-2);
            outline: none;
            padding: 1rem;
            color: var(--remark-color-grey-light-1);
        `)
    
        createCSSClass(".remark_standard_minimodal_button ", `
            width: 8rem;
            height: 3.2rem;
            border-radius: 1rem;
            background-color: var(--remark-color-grey-light-3);
            color: var(--remark-color-grey);
            border-left: 1px solid var(--remark-color-grey-light-2);
            font-size: 1.2rem;
            padding: 1rem;
            margin: 2.4rem 1rem 0rem 1rem;
            border: none;
        `)
    
        createCSSClass(".remark_standard_minimodal_input_container ", `
            height: 100%;
            display: block;
            width: 100%;
            margin: 1rem 1rem 0rem 0rem;
        `)
    
        createCSSClass(".remark_standard_minimodal_label ", `
            font-size: 1rem;
            color: var(--remark-color-grey);
            margin: 0rem 0rem 1rem 0rem;
        `)
    
        createCSSClass(".remark_standard_minimodal_body ", `
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            height: 100%;
        `)
    
        createCSSClass(".remark_standard_minimodal_title ", `
            width: 7%;
            border-right: 1px solid var(--remark-color-grey-light-2);
            margin: 0rem 0rem 0rem 0rem;
            padding: 2.4rem;
            font-size: 1.2rem;
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
            height: 53rem;
            width: 20rem;
            border-radius: 1.2rem;
            background-color: var(--remark-color-white);
            display: flex;
            flex-direction: column;
            padding: 2rem;
            border: 1px solid var(--remark-color-grey-light-2);
            z-index: 10000000;
            position: fixed;
        `)

        
        createCSSClass(".remark_standard_menu_header", `
            padding: 0rem;
            height: 2rem;
            margin: 0rem 0rem 0rem 0rem;
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
            margin: -2rem 0rem 0rem 0rem;
        `)
    
        createCSSClass(".remark_settings_subgroup ", `
            height: auto;
            border: 1px solid var(--remark-color-grey-light-2);
            padding: 1rem;
            border-radius: 1.2rem;
            margin: 3rem 0rem -2rem 0rem;
        `)
    
        createCSSClass(".remark_settings_subgroup_title ", `
            color: var(--remark-color-grey-light-1);
            margin: 0rem 0rem 1.2em 0rem;
            font-weight: normal;
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
    
        createCSSClass(".remark_toggle_switch:before,.remark_toggle_switch:after ", `
            content: "";
        `)
    
        createCSSClass(".remark_toggle_switch:before ", `
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
            padding: 0rem;
            background-color: var(--remark-color-grey-light-3);
            border-radius: 0.6rem;
            border: 1px solid var(--remark-color-grey-light-2);
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
    let xpath = '';
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
        return '/';
    }

    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
    }

    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        xpath += '/' + comp.name;
        if (comp.position != null) {
            xpath += '[' + comp.position + ']';
        }
    }
    return xpath;
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