import { createRouterTransport } from "@bufbuild/connect";
import { Message } from "@bufbuild/protobuf";
import type { JsonValue } from "@bufbuild/protobuf";

import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";
import {
	SayRequest,
	SayResponse,
	IntroduceRequest,
	IntroduceResponse,
	ConverseRequest,
	ConverseResponse,
} from "@buf/bufbuild_eliza.bufbuild_es/buf/connect/demo/eliza/v1/eliza_pb";

type TransportMessageEventData = {
	type: "_BUF_TRANSPORT_I" | "_BUF_TRANSPORT_O";
	sequence: number;
	stream?: { sequence: number; end?: true };
	failure?: Error;
	message: JsonValue;
	typeName: string;
};

export const createEventTransport = (s: typeof ElizaService) =>
	createRouterTransport(({ service }) => {
		type IRequestRecord = {
			resolve: (m: TransportMessageEventData) => void;
			reject: (e?: Error | TransportMessageEventData) => void;
		};

		const pending = {
			sequence: 0,
			requests: new Map<number, IRequestRecord>(),
		};

		const outputEventListener = (event: MessageEvent) => {
			if (event.source !== window)
				return console.info("client ignoring source", event.source);
			if (event.data?.type === "_BUF_TRANSPORT_O") {
				console.log("client accepted", event.data);
				const { sequence, stream, failure } =
					event.data as TransportMessageEventData;
				if (pending.requests.has(sequence)) {
					const { resolve, reject } = pending.requests.get(
						sequence,
					) as IRequestRecord;
					if (failure)
						return pending.requests.delete(sequence) && reject(event.data);
					else if (!stream || stream.end)
						return pending.requests.delete(sequence) && resolve(event.data);
					else if (stream) return resolve(event.data);
				}
			}
		};
		window.addEventListener("message", outputEventListener);

		const unaryI = async (
			input: JsonValue,
			typeName: string,
		): Promise<{ output: JsonValue; typeName: string }> => {
			const sequence = ++pending.sequence;
			const promiseResponse = new Promise<TransportMessageEventData>(
				(resolve, reject) => {
					// TODO: timeout according to transport options?
					pending.requests.set(sequence, { resolve, reject });
				},
			);
			window.postMessage({
				type: "_BUF_TRANSPORT_I",
				sequence,
				message: input,
				typeName,
			} as TransportMessageEventData);
			const response = await promiseResponse;
			return { output: response.message, typeName: response.typeName };
		};

		const unaryEventClient = async <I extends Message, O extends Message>(
			request: I,
		): Promise<O> => {
			const { output, typeName } = await unaryI(
				request.toJson(),
				request.getType().typeName,
			);
			return output as unknown as O; // TODO: coerce properly
		};

		const serverStreamI = async function* (
			input: JsonValue,
			typeName: string,
		): AsyncGenerator<{ output: JsonValue; typeName: string }> {
			const sequence = ++pending.sequence;
			const queue = new Array<TransportMessageEventData>();

			let queueContent: ((value?: unknown) => void) | null;
			pending.requests.set(sequence, {
				resolve: (m: TransportMessageEventData) => {
					queue.push(m);
					queueContent?.();
					queueContent = null;
				},
				reject: (e?: Error) => {
					throw e; // TODO?
				},
			} as IRequestRecord);

			window.postMessage({
				type: "_BUF_TRANSPORT_I",
				sequence,
				message: input,
				typeName,
			} as TransportMessageEventData);

			while (true) {
				if (!queue.length)
					await new Promise((resolve) => {
						queueContent = resolve;
					});
				const partial = queue.shift();
				if (partial instanceof Error) throw partial;
				const { stream, failure, message, typeName } =
					partial as TransportMessageEventData;
				if (stream?.end || failure) break;
				yield { output: message, typeName };
			}
		};

		async function* serverStreamEventClient<
			I extends Message,
			O extends Message,
		>(request: I): AsyncGenerator<O> {
			const stream = serverStreamI(
				request.toJson(),
				request.getType().typeName,
			);
			for await (const { output, typeName } of stream) {
				yield output as unknown as O; // TODO: coerce properly
			}
		}

		async function* clientStreamEventClient<
			I extends Message,
			O extends Message,
		>(inputStream: AsyncIterable<I>): AsyncGenerator<O> {
			yield { sentence: "TODO" } as unknown as O; // TODO
		}

		service(s, {
			say: async function (message: SayRequest) {
				const out = unaryEventClient<SayRequest, SayResponse>(message);
				return new SayResponse(await out);
			},
			introduce: async function* (message) {
				const out = serverStreamEventClient<
					IntroduceRequest,
					IntroduceResponse
				>(message);
				for await (const part of out) {
					yield new IntroduceResponse(part);
				}
			},
			converse: async function* (
				messageStream: AsyncIterable<ConverseRequest>,
			) {
				const out = clientStreamEventClient<ConverseRequest, ConverseResponse>(
					messageStream,
				);
				for await (const part of out) {
					yield new ConverseResponse(part);
				}
			},
		});
	});
