import { createPromiseClient } from "@bufbuild/connect";
//import { IntroduceRequest } from "@buf/bufbuild_eliza.bufbuild_es/buf/connect/demo/eliza/v1/eliza_pb";
import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";
import { createEventTransport } from "./eventTransport";

let introFinished = false;

// Make the Eliza extension client
const client = createPromiseClient(
	ElizaService,
	createEventTransport(ElizaService),
);

/*
// Make the Eliza Service client
const client = createPromiseClient(
  ElizaService,
  createConnectTransport({
    baseUrl: "https://demo.connect.build",
  })
);
*/

// Query for the common elements and cache them.
const containerEl = document.getElementById(
	"conversation-container",
) as HTMLDivElement;
const inputEl = document.getElementById("user-input") as HTMLInputElement;

// Add an event listener to the input so that the user can hit enter and click the Send button
document.getElementById("user-input")?.addEventListener("keyup", (event) => {
	event.preventDefault();
	if (event.key === "Enter") document.getElementById("send-button")?.click();
});

// Adds a node to the DOM representing the conversation with Eliza
function addNode(text: string, sender: string): void {
	const divEl = document.createElement("div");
	const pEl = document.createElement("p");

	const respContainerEl = containerEl.appendChild(divEl);
	respContainerEl.className = `${sender}-resp-container`;

	const respTextEl = respContainerEl.appendChild(pEl);
	respTextEl.className = "resp-text";
	respTextEl.innerText = text;
}

async function send() {
	const sentence = inputEl?.value ?? "";

	addNode(sentence, "user");

	inputEl.value = "";

	if (introFinished) {
		const response = await client.say({ sentence });
		addNode(response.sentence, "eliza");
	} else {
		for await (const response of client.introduce({ name: sentence })) {
			addNode(response.sentence, "eliza");
		}
		introFinished = true;
	}
}

export function handleSend() {
	send();
}
