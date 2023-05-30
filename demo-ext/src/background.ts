import { createConnectTransport } from "@bufbuild/connect-web";
import { createPromiseClient } from "@bufbuild/connect";
import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";
import { SayResponse } from "@buf/bufbuild_eliza.bufbuild_es/buf/connect/demo/eliza/v1/eliza_pb";
import { createRegistry, Any } from "@bufbuild/protobuf";
import type { JsonValue } from "@bufbuild/protobuf";

chrome.runtime.onInstalled.addListener(() =>
	console.log("Background installed"),
);

chrome.tabs.onCreated.addListener((tab) =>
	console.log("Background detected tab creation", tab),
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
	console.log("Background detected tab update", tabId, changeInfo, tab),
);

// TODO: per connected page
const proxiedClient = createPromiseClient(
	ElizaService,
	createConnectTransport({ baseUrl: "https://demo.connect.build" }),
);

type TransportMessageEvent = {
	type: "_BUF_TRANSPORT_I" | "_BUF_TRANSPORT_O";
	sequence: number;
	stream?: { sequence: number; end?: true };
	message: JsonValue;
	typeName: string;
};

// TODO: use Any.pack() and registry to unpack instead of json and string matching
const registry = createRegistry(ElizaService);
console.log("Background elizaTypes", registry);

const counterpart = (typeName: string) =>
	typeName.replace(/Request$/, "Response") ||
	typeName.replace(/Response$/, "Request");

chrome.runtime.onMessage.addListener(
	async (
		messageEvent: TransportMessageEvent,
		sender: chrome.runtime.MessageSender,
	) => {
		if (messageEvent.type !== "_BUF_TRANSPORT_I") return;
		const { sequence, stream, message, typeName } = messageEvent;
		const inputMessage = registry.findMessage(typeName)!;
		const outputMessage = registry.findMessage(counterpart(typeName))!;
		console.log("Background identified type pair", inputMessage, outputMessage);
		if (inputMessage.typeName === "buf.connect.demo.eliza.v1.SayRequest") {
			const response = await proxiedClient.say(message as { sentence: string });
			// modify response
			const esnopser = new outputMessage({
				sentence: [...response.sentence].reverse().join(""),
			});
			const responseMessage: TransportMessageEvent = {
				type: "_BUF_TRANSPORT_O",
				sequence,
				message: esnopser.toJson(),
				typeName: esnopser.getType().typeName,
			};
			chrome.tabs.sendMessage(sender?.tab?.id as number, responseMessage);
		}
		if (
			inputMessage.typeName === "buf.connect.demo.eliza.v1.IntroduceRequest"
		) {
			// modify request
			const mEsSaGe = {
				name: Array.from((message as { name: string }).name)
					.map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
					.join(""),
			};
			const stream = await proxiedClient.introduce(mEsSaGe);
			let streamIdx = 0;
			for await (const partial of stream) {
				const partialMessage: TransportMessageEvent = {
					type: "_BUF_TRANSPORT_O",
					sequence,
					stream: { sequence: streamIdx++ },
					message: partial.toJson(),
					typeName: partial.getType().typeName,
				};
				chrome.tabs.sendMessage(sender?.tab?.id as number, partialMessage);
			}
			chrome.tabs.sendMessage(sender?.tab?.id as number, {
				type: "_BUF_TRANSPORT_O",
				sequence,
				stream: { sequence: streamIdx, end: true },
				typeName: outputMessage.typeName,
			});
		}
	},
);
