import { createRouterTransport } from "@bufbuild/connect";
import { Message } from "@bufbuild/protobuf";
import type { JsonValue, PartialMessage } from "@bufbuild/protobuf";

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
	failure?: unknown;
	message: JsonValue;
	typeName: string;
};

export const createEventTransport = (s: typeof ElizaService) =>
	createRouterTransport(({ service }) => {
		type Responder = {
			resolve: (m: TransportMessageEventData) => void;
			reject: <T>(reason?: T) => void;
		};

		const pending = {
			sequence: 0,
			requests: new Map<number, Responder>(),
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
					) as Responder;
					if (failure)
						return pending.requests.delete(sequence) && reject(failure);
					else if (!stream || stream.end)
						return pending.requests.delete(sequence) && resolve(event.data);
					else if (stream) return resolve(event.data);
				}
			}
		};
		window.addEventListener("message", outputEventListener);

		const unaryPromiseI = (
			input: JsonValue,
			typeName: string,
		): Promise<TransportMessageEventData> => {
			const sequence = ++pending.sequence;
			const promiseResponse = new Promise<TransportMessageEventData>(
				(resolve, reject) => {
					// TODO: timeout according to transport options?
					pending.requests.set(sequence, { resolve, reject });
				},
			);
			const inputEvent: TransportMessageEventData = {
				type: "_BUF_TRANSPORT_I",
				sequence,
				message: input,
				typeName,
			};
			window.postMessage(inputEvent);
			return promiseResponse;
		};

		const serverStreamPromiseI = (
			input: JsonValue,
			typeName: string,
		): { next: () => Promise<TransportMessageEventData> } => {
			const sequence = ++pending.sequence;
			const queue: Array<TransportMessageEventData> = [];
			let resolver: (() => void) | null = null;

			const next = (): Promise<TransportMessageEventData> => {
				return new Promise((resolve) => {
					if (queue.length > 0) {
						resolve(queue.shift()!);
					} else {
						resolver = () => {
							resolve(queue.shift()!);
							resolver = null;
						};
					}
				});
			};

			pending.requests.set(sequence, {
				resolve: (m) => {
					queue.push(m);
					if (resolver) {
						resolver();
						resolver = null;
					}
				},
				reject: (error) => {
					// Handle the error as appropriate
				},
			});

			const inputEvent: TransportMessageEventData = {
				type: "_BUF_TRANSPORT_I",
				sequence,
				message: input,
				typeName,
			};
			window.postMessage(inputEvent);

			return { next };
		};

		const unaryEventClient = async <T>(request: Message): Promise<T> => {
			const unaryPromiseO = (await unaryPromiseI(
				request.toJson(),
				request.getType().typeName,
			)) as TransportMessageEventData;
			// TODO: coerce more specifically
			return unaryPromiseO.message as T;
		};

		async function* serverStreamEventClient<
			T,
		>(request: Message): AsyncGenerator<T> {
			const { next } = serverStreamPromiseI(
				request.toJson(),
				request.getType().typeName,
			);

			while (true) {
				const eventData = await next();

				if (eventData?.stream?.end) break;
				if (eventData?.failure) break;

				yield eventData.message as T;
			}
		}

		async function* clientStreamEventClient<T>(inputStream: AsyncIterable<T>) {
			yield { sentence: "TODO" } as T;
		}

		service(s, {
			// TODO converse bidi
			say: async (message: SayRequest) => {
				const out = unaryEventClient<SayResponse>(message);
				return new SayResponse(await out);
			},
			introduce: async function* (message) {
				for await (const part of serverStreamEventClient<IntroduceResponse>(
					message,
				)) {
					yield new IntroduceResponse(part);
				}
			},
			converse: async function* (
				messageStream: AsyncIterable<ConverseRequest>,
			) {
				for await (const part of clientStreamEventClient<ConverseResponse>(
					messageStream,
				)) {
					yield new ConverseResponse(part);
				}
			},
		});
	});
