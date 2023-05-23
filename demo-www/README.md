# what

demos page-side client code that uses `createRouterTransport` to construct a buf client that makes requests via message-passing to a browser extension

check out the main event in `src/webExtTransport.ts`

currently the `IntroduceRequest` call is disabled, so speak twice to see a real response. no streaming or bidi support yet.

template from https://github.com/bufbuild/connect-es-integration/plain

# how

```
pnpm install
pnpm start
```

make sure the demo-ext extension is installed in your browser. then, open http://localhost:3000

or use `pnpm start` from the demo-ext directory

# dev

server will watch and hot-reload.
