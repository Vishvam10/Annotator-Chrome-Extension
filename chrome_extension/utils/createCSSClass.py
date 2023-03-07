import re

"""
    createCSSClass(".remark_fade", `
        opacity: 0.5;
    `)
"""

s = '''
.remark_standard_minimodal_input {
  margin: 0.8rem 0rem 0rem 0rem;
  height: 1.2rem;
  width: 16rem;
  border-radius: 1rem;
  border: 1px solid var(--remark-color-grey-light-2);
  outline: none;
  padding: 1rem;
  color: var(--remark-color-grey-light-1);
}

.remark_standard_minimodal_button {
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
}

.remark_standard_minimodal_input_container {
  height: 100%;
  display: block;
  width: 100%;
  margin: 1rem 1rem 0rem 0rem;
}

.remark_standard_minimodal_label {
  font-size: 1rem;
  color: var(--remark-color-grey);
  margin: 0rem 0rem 1rem 0rem;
}

.remark_standard_minimodal {
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
}

.remark_standard_minimodal_body {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.remark_standard_minimodal_title {
  width: 7%;
  border-right: 1px solid var(--remark-color-grey-light-2);
  margin: 0rem 0rem 0rem 0rem;
  padding: 2.4rem;
  font-size: 1.2rem;
}

.remark_hide {
  display: none;
  opacity: 0;
  visibility: hidden;
}

.remark_show {
  display: flex;
  opacity: 1;
  visibility: visible;
}

.remark_standard_menu_container {
  height: 72rem;
  width: 24rem;
  border-radius: 1.2rem;
  background-color: var(--remark-color-white);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border: 1px solid var(--remark-color-grey-light-2);
}

.remark_main_heading {
  font-size: 1.6rem;
  color: var(--remark-color-grey-dark-2);
  text-align: center;
}

.remark_settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: -2rem 0rem 0rem 0rem;
}

.remark_standard_button {
  background-color: var(--remark-color-primary);
  font-size: 1.6rem;
  color: var(--remark-color-white);
  font-family: inherit;
  font-weight: 500;
  border: none;
  padding: 1.25rem 4.5rem;
  border-radius: 1.2rem;
  cursor: pointer;
  transition: all 0.1s;
  margin: 3rem 0rem 2rem 0rem;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.remark_settings_subgroup {
  height: auto;
  border: 1px solid var(--remark-color-grey-light-2);
  padding: 2rem;
  border-radius: 1.2rem;
  margin: 2rem 0rem 0rem 0rem;
}

.remark_settings_subgroup_title {
  color: var(--remark-color-grey-light-1);
  margin: 0rem 0rem 1.2em 0rem;
  font-weight: normal;
}

.setting_subgroup_item {
  margin: 0.8rem 0rem 0rem 0rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remark_toggle {
  cursor: pointer;
  display: inline-block;
  margin: 0.4rem 0rem;
}

.remark_toggle_switch {
  display: inline-block;
  background: #ccc;
  border-radius: 16px;
  width: 36px;
  height: 20px;
  position: relative;
  vertical-align: middle;
  transition: background 0.25s;
}
.remark_toggle_switch:before,
.remark_toggle_switch:after {
  content: "";
}
.remark_toggle_switch:before {
  display: block;
  background: linear-gradient(to bottom, #fff 0%, #eee 100%);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  position: absolute;
  top: 4px;
  left: 4px;
  transition: left 0.25s;
}

.remark_toggle_checkbox:checked + .remark_toggle_switch {
  background: var(--remark-color-primary);
}
.remark_toggle_checkbox:checked + .remark_toggle_switch:before {
  left: 20px;
}

.remark_toggle_checkbox {
  position: absolute;
  visibility: hidden;
}

.remark_toggle_label {
  margin-left: 5px;
  position: relative;
  top: 2px;
  font-size: 1.2rem;
  color: var(--remark-color-grey);
}

.remark_action_btn {
  width: 100%;
  margin: 0.2rem 1rem 0rem 0rem;
  height: 3.6rem;
  color: var(--remark-color-grey-dark-1);
  padding: 0.8rem;
  background-color: var(--remark-color-grey-light-3);
  border-radius: 1.2rem;
  border: 1px solid var(--remark-color-grey-light-2);;
}


input[type="number"] {
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
  color: var(--remark-color-grey-light-1);
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.remark_number_input {
  border: 1px solid var(--remark-color-grey-light-2);
  border-radius: 1rem;
  display: inline-flex;
}

.remark_number_input,
.remark_number_input * {
  box-sizing: border-box;
}

.remark_number_input button {
  outline:none;
  -webkit-appearance: none;
  background-color: transparent;
  border: none;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  cursor: pointer;
  margin: 0;
  position: relative;
}

.remark_number_input button:before,
.remark_number_input button:after {
  display: inline-block;
  position: absolute;
  content: '';
  width: 1rem;
  height: 2px;
  background-color: var(--remark-color-grey);
  transform: translate(-50%, -50%);
}
.remark_number_input button.plus:after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.remark_number_input input[type=number] {
  font-family: sans-serif;
  max-width: 5rem;
  padding: .5rem;
  border: solid #ddd;
  border-width: 0 2px;
  font-size: 1.6rem;
  height: 3rem;
  font-weight: bold;
  text-align: center;
}
'''

x = s.split("}")
res = []

for i in range(len(x) - 1) :    
    ele = x[i] + "}"
    pattern = r"\{([\s\S]*)\}"

    rule_name = ele.split("{")[0].replace("\n", "")
    try :
        rules = re.search(pattern, ele).group(1)
    except :
        print("")
    css_class = 'createCSSClass("{}", `{}`)'.format(rule_name, rules)

    print(css_class)

    res.append(css_class)

res = "\n\n".join(res)

f = open("p_styles.txt", "a")
f.write(res)