# what

demo extension providing service to the event transport

content script at `src/content.ts` simply passes events between the page context and extension context.  background service worker at `src/background.ts` creates a listener and proxies a remote endpoint.

# how

```sh
$ pnpm install
$ pnpm start
```

if `ERR_LAUNCHER_NOT_INSTALLED` perhaps `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`

# dev

webpack will watch and hot-reload.

you still have to refresh the page to re-initialize the extension context.

content script inspectable with the normal page inspector. extension background inspector is available via:

toolbar → puzzle piece → manage extensions ✔︎ developer mode → service worker
