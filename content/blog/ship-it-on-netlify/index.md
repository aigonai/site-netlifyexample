---
title: Ship it on Netlify
date: 2026-11-24
summary: Connect the repository, and every push to main is live in under a minute.
image: hero.png
private:
  notes: Check Netlify's free-tier limits again before this goes out.
  reviewer: Ask the editor to read the edge functions section.
---

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

The list we use is a download: [launch-checklist.txt](launch-checklist.txt).
