classes = """
createCSSClass(".highlight_element_strong", `
    outline: 1px solid #ff28009c !important; 
    background: transparent !important;
    border-radius: 0.2rem; 
    cursor: crosshair;
    z-index: 100000;
`)
"""
    
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