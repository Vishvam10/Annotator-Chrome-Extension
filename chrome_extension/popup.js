const app = document.getElementById("root");
const login = document.getElementById("login");
const loginForm = document.getElementById("login-form");

onload = async function () {
  const isRegistered = await getDataFromStorage("email");
  if (
    typeof isRegistered === "object" &&
    Object.keys(isRegistered).length === 0
  ) {
    app.style.display = "none";
    login.style.display = "block";

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const email = data.get("email");
      await setDataToStorage("email", email);
      app.style.display = "block";
      login.style.display = "none";
    });
  }
};


document.getElementById("remark_start").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if(e.target.innerText == "Start Annotation") {
        document.querySelector(".remark_init_container").classList.add("remark_init_container_resize");
        e.target.innerText = "Stop Annotation";

        renderMenu();
        
        removeAllExistingModals();
        attachListeners()
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

const screenShotBtn = document.getElementById("remarkTakeScreenShot");
screenShotBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const tab = await getCurrentTab();
    const labels = await getLabels(tab);
  
    const labelFile = new File([labels], 'label.txt', { type: 'text/plain' })
    //DISABLE: LABELING CSS WHILE SCREENSHOT
    // await chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   func: () => {
    //     const style = document.createElement('style');
    //     style.setAttribute('id', 'remark-styles');
    //     style.innerHTML = `
    //       [data-remark-annotation]:after { display: none; }
    //     `
    //     document.head.appendChild(style);
    //   }
    // })
    const dataSrc = await Screenshot(tab);
    
    // await chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   func: () => {
    //     const style = document.getElementById('remark-styles');
    //     style.parentElement.removeChild(style);
    //   }
    // })
    console.log('labels', labelFile, dataSrc);

})

function sendMessage(message) {
chrome.runtime.sendMessage(message, (response) => {
    console.log("received  data", response);
});
}