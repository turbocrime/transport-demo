# what 

demos extension providing backend and network transport to a message-passing transport on a webpage

content script at `src/content.ts` simply forwards messages from page to background, and sends responses back again. no state.

background service worker at `src/background.ts` creates a long-lived transport, listens for messages, and fires off requested api calls. response is recieved from api, and modified before return to page.

template from https://github.com/chibat/chrome-extension-typescript-starter

# how

```
pnpm install
pnpm build
```

make sure the demo-www server is running at http://localhost:3000. then,

```
pnpm start
```

if `web-ext` can't find your browser, you will see `Error code: ERR_LAUNCHER_NOT_INSTALLED`. specify your binary location with something like `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`

# dev

extension content script output appears in the page inspector. extension background inspector is available via:

toolbar → puzzle piece → manage extensions ✔︎ developer mode → service worker

using `pnpm watch` and then `pnpm start` in a second terminal, the browser will automatically load extension changes. you still have to refresh the page to re-initialize the extension context.
