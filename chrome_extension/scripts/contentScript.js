(() => {
    console.log("from foreground");
   
    remark_init()

    chrome.runtime.onMessage.addListener(function(response, sendResponse) {
        console.log("from foreground : ", response);
    });
})();


function remark_init() {
    startAnnotationProcess();  
}



function startAnnotationProcess() {

    let annotations = []
    
    createCSSClass(".remark_highlight_element_light", "outline: dashed 1px #ff28009c; border-radius: 0.4rem; padding: 0.4rem; cursor: crosshair;")
    createCSSClass(".remark_highlight_element_strong", "outline: solid 1px #ff28009c; border-radius: 0.4rem; padding: 0.4rem; cursor: crosshair;")
    
    document.body.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("clicked : ");

        // Add label

        const t = e.target;
        if(t.classList.contains("remark_highlight_element_light")) {
            if(t.classList.contains("remark_highlight_element_strong")) {
                return;
            }
            const rect = t.getBoundingClientRect();;
            const x = Math.round(rect.x, 2), y = Math.round(rect.y, 2), w = Math.round(rect.width, 2), h = Math.round(rect.height, 2);
            console.log(x,y,w,h);

            annotations.push({
                "id" : Math.random() * 10000,
                "type" : t.tagName.toLowerCase(),
                "coordinates" : [x, y, w, h],
                "text" : t.innerText,
                "parent" : t.parentNode.tagName.toLocaleLowerCase()
            })

            console.log("annotations : ", annotations);

            t.classList.remove("remark_highlight_element_light");
            t.classList.add("remark_highlight_element_strong");
        }

    });
    
    document.body.addEventListener("mouseover", mouseOverListener);
    document.body.addEventListener("mouseout", mouseOutListener);
    
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
        targetHTMLElement.classList.toggle("remark_highlight_element_light");
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
        targetHTMLElement.classList.toggle("remark_highlight_element_light");
    }
}