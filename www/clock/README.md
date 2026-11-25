# Topaze Clock

A world clock as a web app: the time where you are, and where the people you work with
are. Pick the cities, and each one shows its time, its day and night, and how far it is
from yours.

- **The original runs at <https://topaze.xyz/clock/>.** That is the app as Topaze
  ships it.
- **This folder is a copy of it**, published with this repository's example site at
  <https://cosmic-zuccutto-c132f5.netlify.app/clock/>, so that you can read it, run it
  and build your own from it. The two copies can drift apart over time; when in doubt,
  topaze.xyz/clock/ is the running original.

It is the worked example for the post *This app could have been a web app*, on
<https://stefanloesch.substack.com>, published on 1 December 2026 at
<https://stefanloesch.substack.com/p/how-to-create-blog-landingpage-website-blog-webapp-using-claude-ai>.

MIT licensed: see [LICENSE](LICENSE). The licence covers this folder and the helper
scripts in `_generate/clock/`, not the rest of the repository.

## What it is made of

Plain files, written by hand. There is no framework, no bundler, no build step and no
server of its own: Jinja2 and the rest of this repository's build play no part in it.

| File | What it does |
|---|---|
| `index.html` | The page |
| `clock.js` | The app: the city list, the times, sharing, the views |
| `dials.js` | The clock faces and the day/night dial |
| `qr.js` | A QR code encoder, so codes are drawn in the browser |
| `clock.css` | The styles |
| `sw.js` | The service worker, which makes it work offline |
| `manifest.webmanifest` | What makes it installable as an app |
| `*.png` | Icons, and the gem the dials are cut from |

## How it behaves

**Fully client side.** Everything runs in the browser. There is no account, no
database and no API.

**Installs as an app on iOS and Android.** It is a progressive web app (PWA). On an
iPhone, open it in Safari and choose *Share → Add to Home Screen*. On Android, Chrome
offers *Install app*. It then opens full screen, with its own icon.

**Works offline.** After the first visit the service worker keeps a copy of the app,
so it opens on a plane. It answers from that copy at once and fetches a fresh one in the
background, so a new version arrives on the next open after it was published.

**Your data stays in the browser.** The city list is kept in `localStorage` on the
device. Nothing about you is sent anywhere. That also means there is no sync, so a list
moves from one device to another in one of three ways:

- **by URL**: the list rides in the address, as `?cities=…`; open that address on the
  other device;
- **by copy and paste**: copy the list as text and paste it into the clock elsewhere;
- **as a QR code**: the clock draws one, and the other device scans it.

**One thing it does load from elsewhere: its fonts.** Montserrat and IBM Plex Mono come
from Google Fonts. No data about you goes with that request. If you want an app that
loads nothing from anywhere else, download the two fonts, put them in this folder and
point the `<link>` in `index.html` at them.

## Run it locally

From the repository root:

    uv run python -m http.server -d static 8000

Then open <http://localhost:8000/clock/>. Service workers only run on `https://` or on
`localhost`, so offline mode works here too. Any static file server will do; `uv` is
just the one this repository uses.

## Build and deploy

There is nothing to build: the files are the app. To deploy, put this folder on any
static host.

**In this repository** the site build copies `static/` into `www/`, which Netlify
publishes:

    uv run _generate/build.py
    git add -A && git commit -m "…" && git push

**On a site of your own**, copy the folder, then set the HTTP headers that
`netlify.toml` sets for `/clock/`:

- `sw.js` served with `Cache-Control: no-cache` and `Service-Worker-Allowed: /clock/`;
- `index.html`, the `.js` and the `.css` always revalidated;
- `manifest.webmanifest` served as `application/manifest+json`.

## Making it your own

- **Where shared links and QR codes point.** `CANONICAL` in `clock.js` is
  `https://topaze.xyz/clock/`, so a code drawn by this copy opens the original. Change it
  to your own address, along with the addresses in `index.html`'s `<head>`.
- **New version.** When you change a file, bump `VERSION` in `sw.js`, so that installed
  copies drop the old cache.
- **Icons.** `_generate/clock/clock_icon.py` draws the PNG icons:
  `uv run --with pillow python _generate/clock/clock_icon.py`.
- **QR check.** `_generate/clock/verify_clock_qr.py` runs `qr.js` under Node, then
  decodes what it draws, to prove a phone can read it.
