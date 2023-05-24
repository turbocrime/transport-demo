# what

proof of concept for a message-passing bufbuild transport. includes a demo web page using ElizaService from the buf registry, and demo web extension using manifest v3.

# how

from this git root

```
pnpm install
pnpm build
pnpm start
```

if `web-ext` can't find your browser, you will see `Error code: ERR_LAUNCHER_NOT_INSTALLED`. specify your binary location with something like `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`