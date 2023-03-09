function removeEventListeners() {
  const elements = document.querySelectorAll("*");
  elements.forEach((element) => {
    const listeners = getEventListeners(element);
    for (let eventType in listeners) {
      listeners[eventType].forEach((listener) => {
        element.removeEventListener(eventType, listener.listener);
      });
    }
  });
}

function getEventListeners(element) {
  const listeners = {};
  const allEvents = getEventTypes();
  allEvents.forEach((eventType) => {
    const eventListeners = getEventListenersForEventType(element, eventType);
    if (eventListeners.length > 0) {
      listeners[eventType] = eventListeners;
    }
  });
  return listeners;
}

function getEventTypes() {
  // This list of events is not exhaustive - add more as needed
  return [
    "click",
    "dblclick",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseover",
    "mouseout",
    "contextmenu",
    "keydown",
    "keyup",
    "keypress",
    "submit",
    "change",
    "focus",
    "blur",
    "load",
    "unload",
    "resize",
    "scroll",
    "input",
    "paste",
    "cut",
    "copy",
    "dragstart",
    "dragenter",
    "dragover",
    "dragleave",
    "drag",
    "drop",
    "dragend",
    "animationstart",
    "animationend",
    "animationiteration",
    "transitionend",
    "play",
    "pause",
    "seeked",
    "volumechange",
    "timeupdate",
    "ended",
    "error",
  ];
}

function getEventListenersForEventType(element, eventType) {
  const listeners = [];
  const eventHandlers = element[eventType];
  if (eventHandlers != null) {
    if (typeof eventHandlers === "function") {
      listeners.push({
        type: "function",
        listener: eventHandlers,
        useCapture: false,
      });
    } else {
      for (let i = 0; i < eventHandlers.length; i++) {
        listeners.push({
          type: "listener",
          listener: eventHandlers[i],
          useCapture: false,
        });
      }
    }
  }
  return listeners;
}

removeEventListeners();
