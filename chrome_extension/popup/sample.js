const dropdown = document.getElementById("my-dropdown");
dropdown.addEventListener("input", checkValidity);

dropdown.addEventListener("select", get)

function checkValidity() {
    var input = document.getElementById("my-dropdown");
    var list = document.getElementById("my-options");
    var optionExists = false;
    for (var i = 0; i < list.options.length; i++) {
        if (input.value.toLowerCase() === list.options[i].value.toLowerCase()) {
        optionExists = true;
        break;
        }
    }
    if (!optionExists) {
        var newOption = document.createElement("option");
        newOption.value = input.value;
        list.appendChild(newOption);
    }
}