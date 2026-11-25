# Ship it on Netlify

24 November 2026 · Connect the repository, and every push to main is live in under a minute.

![Ship it on Netlify](/blog/ship-it-on-netlify/hero.png)

Netlify's job here is small: copy `www/` to its servers and answer requests. There is no build command, so there is nothing to break.

## Connect the repository

In Netlify, add a site from the Git repository and choose the `main` branch. `netlify.toml` already sets the publish directory to `www` and the build command to nothing.

## What netlify.toml does

- Publishes `www/` as it is.
- Sends security headers on every response.
- Caches `/assets/` for a year, which is safe because every link to it carries a cache buster.
- Serves `.md` files as Markdown, and `llms.txt` as text.

## Edge functions

Two small functions run on Netlify's edge, in `netlify/edge-functions/`. One turns `/s/<slug>` into a redirect, for short links. The other answers a request for Markdown with the page's `index.md`.

## Before you push

The list we use is a download: [launch-checklist.txt](/blog/ship-it-on-netlify/launch-checklist.txt).
