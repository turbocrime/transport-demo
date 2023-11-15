import "jasmine";
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { ElizaService } from "@buf/connectrpc_eliza.connectrpc_es/connectrpc/eliza/v1/eliza_connect"
import { IntroduceRequest } from "@buf/connectrpc_eliza.bufbuild_es/connectrpc/eliza/v1/eliza_pb"

it("imports ElizaService correctly", () => {
	expect(ElizaService).toBeDefined();
});
it("imports messages correctly", () => {
	expect(IntroduceRequest).toBeDefined();
});

it("creates a promise client", () => {
	const client = createPromiseClient(
		ElizaService,
		createConnectTransport({
			baseUrl: "https://demo.connect.build",
		}),
	);
	expect(client.say).toBeDefined();
	expect(client.introduce).toBeDefined();
});
