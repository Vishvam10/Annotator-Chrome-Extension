import re

"""
  createCSSClass(".remark_fade", `
    opacity: 0.5;
  `)
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
"""

s = """
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
"""


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

f = open("styles.txt", "a")
f.write(res)