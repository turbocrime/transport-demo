window.addEventListener("message", ({ data, source }) => {
	console.log("Content received message from www", data, source);
	if (data?.type === "_BUF_TRANSPORT_I") chrome.runtime.sendMessage(data);
});

chrome.runtime.onMessage.addListener((message, sender) => {
	console.log("Content received message from ext", message, sender);
	if (message.type === "_BUF_TRANSPORT_O") window.postMessage(message);
});
