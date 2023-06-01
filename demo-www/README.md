# what

demo page using a buf client and `createRouterTransport` to connect to a service implemented in a browser extension, via dom events

check out the main event in [`src/eventTransport.ts`](https://github.com/turbocrime/transport-demo/blob/main/demo-www/src/eventTransport.ts)

no client streaming or bidi support yet.

# how

```sh
$ pnpm install
$ pnpm start
```

make sure demo-ext is installed in your browser. then, open <http://localhost:3000>

# dev

esbuild will watch and hot-reload.
