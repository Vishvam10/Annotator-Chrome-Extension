(() => {
    console.log("from foreground");
   
    remark_init()

    chrome.runtime.onMessage.addListener(function(response, sendResponse) {
        console.log("from foreground : ", response);
    });
})();


function remark_init() {
    // registerScripts();
    startAnnotationProcess();
       
}


function startAnnotationProcess() {
    
    createCSSClass(".highlight_element_light", "outline: solid 1px #ff28009c; border-radius: 0.4rem; padding: 0.4rem; cursor: crosshair;")
    
    document.body.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("clicked : ");
    });
    
    document.body.addEventListener("mouseover", mouseOverListener)
    document.body.addEventListener("mouseout", mouseOutListener)
    
}

function createCSSClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
    (style.styleSheet || style.sheet).addRule(name, rules);
    else
    style.sheet.insertRule(name+"{"+rules+"}",0);
}

function mouseOverListener(e) {
    e.preventDefault();
    e.stopPropagation();
    const VALID_HTML_ELEMENTS = [
        "DIV", "SPAN", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "IMG", "SVG", "NAV", "A", "TABLE", "INPUT", "LABEL", "FORM", "AUDIO", "VIDEO"
    ]
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
    const tag = e.target.tagName;
    if (VALID_HTML_ELEMENTS.includes(tag)) {
        const targetHTMLElement = e.target;
        targetHTMLElement.classList.toggle("highlight_element_light");
    }
}