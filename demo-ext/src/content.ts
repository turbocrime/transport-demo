window.addEventListener("message", ({ data, source }) => {
	if (data?.type === "BUF_TRANSPORT_REQUEST") chrome.runtime.sendMessage(data);
});

chrome.runtime.onMessage.addListener((message, sender) => {
	if (message.type === "BUF_TRANSPORT_RESPONSE") window.postMessage(message);
});
