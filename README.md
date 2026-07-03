# WARP WireGuard Config Generator

A static, client-side WireGuard config generator for Cloudflare WARP. No account, no backend, no install — everything runs in your browser.

**Not affiliated with, endorsed by, or sponsored by Cloudflare, Inc.** This is an independent, unofficial, community-built tool. "Cloudflare," "WARP," and "WireGuard" are trademarks of their respective owners, used here only to describe compatibility.

## What it does

1. Generates a WireGuard keypair entirely in your browser (`crypto.getRandomValues`, official WireGuard X25519 implementation).
2. Registers the public key with Cloudflare's WARP device-registration API (via a CORS proxy, since that endpoint blocks direct browser requests).
3. Builds a ready-to-import `warp.conf` file and QR code from the response.

Your **private key never leaves the browser** — only the public key, device type, and locale are sent over the network.

## Features

- No account, no cookies, no analytics, no tracking scripts
- Advanced options: DNS provider, MTU, Allowed IPs, persistent keepalive, device type, locale
- QR code for one-scan import on mobile
- Download or copy the generated `.conf` directly
- "Clear from screen" wipes the key/config from memory and the DOM on demand
- Built-in usage counter for the shared CORS-proxy monthly quota, so users can see when it's getting close to the limit
- In-page setup guide for installing WireGuard and importing the config
- Strict CSP, no external trackers, `noindex`/no-cache headers by default

## Deploying

Works on any static host — GitHub Pages, Cloudflare Pages, Netlify, Vercel, [Statichost](https://statichost.eu), or a plain web server. Just upload `index.html` and `wireguard.js`.

**Recommended:** set the following as real HTTP response headers at your host (some of these are already set via `<meta>` tags in `index.html` as a fallback, but a few — like `X-Frame-Options` / `frame-ancestors` — only take effect as actual headers, not `<meta>`):

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.bunny.net; font-src https://fonts.bunny.net; connect-src https://proxy.cors.sh; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
```

## Configuration

If you fork this and run your own CORS proxy / API key, update these two lines near the top of the `<script>` block in `index.html`:

```js
const CORS_PROXY = 'https://proxy.cors.sh/';
const WARP_API = 'https://api.cloudflareclient.com/v0a737/reg';
```

and the `x-cors-api-key` header value inside `registerWithWarp()`. The proxy key used in this project is scoped to specific allowed domains at the proxy provider level — don't reuse a key that isn't scoped to your own domain.

## Security notes

- Private keys are generated and stay in-browser; never sent to any server this project controls.
- No `localStorage`/`sessionStorage`/cookies are used for keys or generated configs. A single non-identifying counter (monthly proxy-usage count) is stored in `localStorage` for the quota display.
- `qrcode.min.js` is loaded from jsDelivr and pinned to a specific version (not `@latest`) to avoid the served file changing unexpectedly.
- `fonts.bunny.net` intentionally has no Subresource Integrity hash — font CSS services like this return different content per browser, so a single SRI hash would break fonts in most browsers.
- See the in-app **Privacy Policy** and **Terms of Use** sections for the full breakdown of what is and isn't sent, and to whom.

If you find a security issue, please open an issue or reach out privately rather than filing a public exploit writeup.

## Disclaimer

Provided "as is," with no warranty of any kind. This tool depends on an unofficial, undocumented Cloudflare API and a third-party CORS proxy, neither of which are guaranteed to remain available or unchanged. See the in-app Terms of Use for the full disclaimer.

## Notice of Non-Affiliation
We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Cloudflare, or any of its subsidiaries or its affiliates. The official Cloudflare website can be found at https://www.cloudflare.com/.

The names Cloudflare Warp and Cloudflare as well as related names, marks, emblems and images are registered trademarks of their respective owners.

## Credits

- [WireGuard](https://www.wireguard.com/) — protocol, and the vendored `wireguard.js` X25519 keypair implementation (GPL-2.0, © Jason A. Donenfeld)
- [Cloudflare WARP](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/) — the registration API this tool talks to
- [WGCF (ViRb3)](https://github.com/ViRb3/wgcf) — CLI-Tool
- [lanrat (github.com/lanrat)](https://github.com/lanrat/wireguard-warp-generator) — The project is forked from lanrat
- [qrcode.js](https://github.com/soldair/node-qrcode) — QR code rendering

## License

The vendored `wireguard.js` is GPL-2.0, © Jason A. Donenfeld. See the license header in that file.
