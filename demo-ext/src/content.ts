const onPageRequest = async (event: MessageEvent) => {
  // TODO: confirmation of sender
  if (event.data?.type === "BUF_TRANSPORT_REQUEST") {
    console.log("Content onPageRequest", event);
    chrome.runtime.sendMessage(event.data);
  }
};
window.addEventListener("message", onPageRequest);

type MessageSender = chrome.runtime.MessageSender;
const onExtensionResponse = async (message: any, sender: MessageSender) => {
  // TODO: confirmation of sender
  if (message.type === "BUF_TRANSPORT_RESPONSE") {
    console.log("Content onExtensionResponse", message, sender);
    window.postMessage(message);
  }
};
chrome.runtime.onMessage.addListener(onExtensionResponse);
