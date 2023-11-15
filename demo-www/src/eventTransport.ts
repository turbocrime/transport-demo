import { createRouterTransport } from "@connectrpc/connect";
import { Message, MethodKind } from "@bufbuild/protobuf";

import type { ServiceImpl } from "@connectrpc/connect";
import type { JsonValue, MethodInfo, ServiceType } from "@bufbuild/protobuf";

type TransportMessageEventData = {
	type: "_BUF_TRANSPORT_I" | "_BUF_TRANSPORT_O";
	sequence: number;
	stream?: { sequence: number; end?: true };
	failure?: Error;
	message: JsonValue;
	typeName: string;
};

type CreateAnyImplMethod = (
	method: MethodInfo & { localName: string; service: ServiceType },
	// rome-ignore lint/suspicious/noExplicitAny:
) => ((...args: any[]) => any) | null;

const makeAnyServiceImpl = (
	service: ServiceType,
	createMethod: CreateAnyImplMethod,
): ServiceImpl<typeof service> => {
	const impl: ServiceImpl<typeof service> = {};
	for (const [localName, methodInfo] of Object.entries(service.methods)) {
		const method = createMethod({
			...methodInfo,
			localName,
			service,
		});
		if (method) impl[localName] = method;
	}
	return impl;
};

export const createEventTransport = (s: ServiceType) =>
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

		const unaryIO = async (
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

		const serverStreamIO = async function* (
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
				reject: (m: TransportMessageEventData) => {
					queue.push(m);
					queueContent?.();
					queueContent = null;
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
				const { stream, failure, message, typeName } =
					queue.shift() as TransportMessageEventData;
				if (failure) throw failure;
				if (stream?.end) break;
				yield { output: message, typeName };
			}
		};

		const makeEventImplMethod: CreateAnyImplMethod = (method) => {
			switch (method.kind) {
				case MethodKind.Unary:
					return async function (request) {
						const { output, typeName } = await unaryIO(
							request.toJson(),
							request.getType().typeName,
						);
						// TODO: coerce properly
						return output;
					};
				case MethodKind.ServerStreaming:
					return async function* (request: Message) {
						const stream = serverStreamIO(
							request.toJson(),
							request.getType().typeName,
						);
						// TODO: coerce properly
						for await (const { output, typeName } of stream) yield output;
					};
				case MethodKind.ClientStreaming:
					return async function (request: AsyncIterable<Message>) {
						return Promise.resolve({ sentence: "TODO" });
					};
				case MethodKind.BiDiStreaming:
					return async function* (request: AsyncIterable<Message>) {
						yield { sentence: "TODO" };
					};
				default:
					return null;
			}
		};

		service(s, makeAnyServiceImpl(s, makeEventImplMethod));
	});
