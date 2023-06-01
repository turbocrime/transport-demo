# what

demo extension providing service to the event transport

content script at `src/content.ts` simply passes events between the page context and extension context

background service worker at `src/background.ts` creates a listener and proxies a remote endpoint.

# how

```sh
$ pnpm install
$ pnpm build
```

make sure demo-www is running at <http://localhost:3000>. then,

```sh
$ pnpm start
```

if `ERR_LAUNCHER_NOT_INSTALLED` perhaps `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`

# dev

content script inspectable with the normal page inspector. extension background inspector is available via:

toolbar → puzzle piece → manage extensions ✔︎ developer mode → service worker

using `pnpm watch` and then `pnpm start` in a second terminal, webpack and the browser will automatically rebuild and load changes. you still have to refresh the page to re-initialize the extension context.
