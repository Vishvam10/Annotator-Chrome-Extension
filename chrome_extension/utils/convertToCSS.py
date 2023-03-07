classes = """

    createCSSClass(".remark_fade", `
        opacity: 0.5;
    `)

    createCSSClass(".highlight_element_light", `
        cursor: crosshair;
        border-radius: 0.2rem;
        background: rgba(13, 109, 253, 0.269);
        transition: background-color 125ms ease-in-out 0s;
        z-index: 100000;
    `)
        
    createCSSClass(".highlight_element_strong", `
        outline: 1px solid #ff28009c !important; 
        background: transparent !important;
        border-radius: 0.2rem; 
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
        margin: 0rem 0rem 1rem 0rem;
    `)

    createCSSClass(".remark_standard_button:hover", `
        background-color: var(--remark-color-primary) !important;
        transform: scale(1.04);
    `)

    createCSSClass(".remark_standard_button:active", `
        transform: scale(1.0) !important;
    `)

    createCSSClass("#remarkStopBtn", `
        color: var(--remark-color-primary);
        background-color: var(--remark-color-white);
        border: 1px solid var(--remark-color-primary);
    `)

    createCSSClass("#remarkStopBtn:hover", `
        color: var(--remark-color-white);
    `)
        
    createCSSClass(".remark_standard_button:active", `
        color: var(--remark-color-white);
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
        height: 42rem;
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
        height: 23rem;
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
}
"""


res = ""

def gen() :


    for (i, s) in enumerate(classes.split("`)\n")[:-1]) :
        res = s.split("`")
        identifier = res[0].replace("\n", "").replace("\t", "").replace("\"", "").replace("createCSSClass(", "").replace(")", "")[:-2].strip()
        rules = "".join(res[1])

        cssrule = str("{} {{ {} \n }}".format(identifier, rules))
        
        print(i, cssrule)
        yield cssrule
    
    return

f = open("s.css", "a")
for x in gen() :
    f.write(x)

f.close()