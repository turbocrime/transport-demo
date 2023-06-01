# transport-demo

## what

this repo contains a proof-of-concept **[event transport](https://github.com/turbocrime/transport-demo/blob/main/demo-www/src/eventTransport.ts)** for [@bufbuild/connect](https://github.com/bufbuild/connect-es/tree/main/packages/connect) that uses dom [`Event`](https://developer.mozilla.org/en-US/docs/Web/API/Event)s instead of the network to transmit messages.

this enables inter-document communication within the browser, using any client package or server stubs from the [buf schema registry](https://buf.build/product/bsr), a repository of [protobuf](https://protobuf.dev/) specifications and generated packages.

work in progress.

### demo-www

web client to [ElizaService](https://buf.build/bufbuild/eliza), buf's demo service which allows you to talk to ELIZA, the first AI to pass the Turing test. the client uses the normal buf registry package, with an **[event transport](https://github.com/turbocrime/transport-demo/blob/main/demo-www/src/eventTransport.ts)** that is the focus of this repository.

### demo-ext

chrome extension providing service via appropriate response events

## why

1. a webapp, extension, worker, or page may use dom events for inter-document communication.

2. [you ought to specify your interface](https://buf.build/blog/api-design-is-stuck-in-the-past) so it is documented and easy to consume.

### so

3. i explore the possibility of a browser extension that provides an event service to page scripts that use buf's generated client packages.

## and how

### chrome manifest v3

dom events are one of the few methods of communication between a web page and a web extension generally permitted by [mv3](https://developer.chrome.com/docs/extensions/mv3/), currently required by google's extension repository.

### buf schema registry

buf provides tooling and infrastructure to create, maintain, and consume protobuf-specified interfaces. they run the buf schema registry, a source of versioned specifications and corresponding generated packages, including an [npm-compatible repository](https://buf.build/docs/bsr/remote-packages/npm/) of clients and server stubs.

this makes it possible to eliminate a whole field of busywork and boilerplate, across many environments, by simply documenting your interface and posting your spec to the registry.

then anyone can just grab a package

```sh
$ echo "@buf:registry=https://buf.build/gen/npm/v1/" >> ./.npmrc
$ pnpm install @buf/bufbuild_eliza.bufbuild_connect-es
```

this event transport can be used with generated client packages from the registry. typically, you might instantiate and use a client like this

```js
import { createConnectTransport } from "@bufbuild/connect-web";
import { createPromiseClient } from "@bufbuild/connect";
import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";

const client = createPromiseClient(ElizaService, createConnectTransport({ baseUrl: "https://demo.connect.build" }));
const elizaResponse = await client.say({ sentence: "all computers are bad" });
console.log(elizaResponse) // { sentence: "Are you really talking about me?" }
```

[@bufbuild/connect](https://www.npmjs.com/package/@bufbuild/connect) and [@bufbuild/connect-web](https://www.npmjs.com/package/@bufbuild/connect-web) provide a few different `Transport` implementations suitable for different environments and endpoints. a transport performs serialization to the rpc protocol required by the endpoint, and handles connections using the available network api, such as browser `Fetch` or node's `require('http')`. thus, client implementations remain agnostic.

json or binary serialization, authentication, timeout, &cetera are configurable parts of buf's stock transports, but they all ultimately talk over the network.

### now like

this event transport makes no network connection, but instead emits dom events. somewhere else, listen and respond, or forward the requests to another endpoint. the generated client package is unchanged.

```js
const client = createPromiseClient(ElizaService, createEventTransport(ElizaService));
const elizaResponse = await client.say({ sentence: "im gay" });
console.log(elizaResponse) // { sentence: "Why do you tell me you're gay?" }
```

currently this event transport supports unary and server-streaming requests.

the frontend is generic, but right now the backend listener is specific to the demo packages for ElizaService.

this transport does not yet support all the features of the stock transports, such as configurable serialization, interceptors, and abortable requests.

this is a proof of concept and an experiment. it may eventually be more appropriate to implement this capability at another location, such as the `UniversalClientFn` type within `connect-es`.

## run it

demo-www uses esbuild to serve a demo from [buf's integration examples](https://github.com/bufbuild/connect-es-integration/tree/main/plain)

demo-ext uses webpack and web-ext to compile and load a web extension

from this git root, with pnpm

```sh
$ pnpm install
$ pnpm build
$ pnpm start
```

you should see a fresh chrome profile load the extension and navigate to the demo on localhost. talk to ELIZA by typing in the box.

if `web-ext` can't find your browser, you may see `ERR_LAUNCHER_NOT_INSTALLED`. in that case specify your binary location with something like `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`
