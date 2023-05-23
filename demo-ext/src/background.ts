import { createConnectTransport } from "@bufbuild/connect-web";
import { createPromiseClient } from "@bufbuild/connect";
import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";
import { SayResponse } from "@buf/bufbuild_eliza.bufbuild_es/buf/connect/demo/eliza/v1/eliza_pb";
import { JsonValue } from "@bufbuild/protobuf";

chrome.runtime.onInstalled.addListener(() =>
	console.log("Background installed"),
);
chrome.tabs.onCreated.addListener((tab) =>
	console.log("Background detected tab creation", tab),
);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
	console.log("Background detected tab update", tabId, changeInfo, tab),
);

const client = createPromiseClient(
	ElizaService,
	createConnectTransport({ baseUrl: "https://demo.connect.build" }),
);

type TransportMessageEvent = {
	type: string;
	sequence: number;
	request?: JsonValue;
	response?: JsonValue;
	typeName: string;
};

chrome.runtime.onMessage.addListener(
	async <M extends TransportMessageEvent>(
		message: M,
		sender: chrome.runtime.MessageSender,
	) => {
		console.log("Background onMessage", message, sender);
		if (message.type === "BUF_TRANSPORT_REQUEST") {
			const { sequence, request, typeName } = message;
			// TODO: select request by typeName, type response appropriately
			const response = await client.say(request as { sentence: string });
			const modifiedResponse = new SayResponse({
				sentence: [...response.sentence].reverse().join(""),
			});
			const responseMessage = {
				success: true,
				type: "BUF_TRANSPORT_RESPONSE",
				sequence,
				response: modifiedResponse.toJson(),
				typeName: modifiedResponse.getType().typeName,
			};
			console.log("Background response", responseMessage);
			chrome.tabs.sendMessage(sender?.tab?.id as number, responseMessage);
		} else {
			console.warn("Background unknown message type", message);
		}
	},
);
