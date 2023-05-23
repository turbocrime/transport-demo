# what

proof of concept for a message-passing bufbuild transport. includes a demo web page using ElizaService from the buf registry, and demo web extension using manifest v3.

# how

```
pnpm install
pnpm run -C demo-ext build
pnpm run -r start
```

for `start` you may need to specify your chromium binary location with an env var like `CHROME_PATH=/Applications/Chromium.app/Contents/MacOS/Chromium`