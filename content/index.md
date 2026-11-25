---
title: Three sites and an app on Netlify
eyebrow: Worked examples
lead: A landing page, a multi-page website, a blog and a web app. One repository, plain files on Netlify. Pick the one closest to what you need and copy its folder.
examples:
  - title: Landing page
    url: /landing/
    icon: rocket
    text: One page that says what a thing does and asks for one action. Copy, steps, features and questions, all in front matter.
  - title: Website
    url: /site/
    icon: layout
    text: A handful of pages under one menu. Each page is a folder holding an index.md.
  - title: Blog
    url: /blog/
    icon: file-text
    text: Posts as page bundles, a front page of recent posts, an about page and an RSS feed.
  - title: Web app
    url: /clock/
    icon: clock
    text: The Topaze Clock. Runs in the browser, installs as an app, works offline, shares by link or QR code. MIT licensed.
---

## How this repository works

The three sites are built from three folders, and only one of them is published:

- `content/` holds the source: one folder per page, each with an `index.md` (YAML front matter, then Markdown) and the page's own files. It is never published.
- `static/` holds the stylesheets, scripts, logos and downloads, copied as they are.
- `www/` is generated, every file of it, and is the only folder Netlify publishes.

For every page the build writes an `index.html` for people and a clean `index.md` for LLMs: no YAML, and nothing from the source's `private:` fields.

```
uv run _generate/build.py
```

The templates live in `_generate/templates/`. `base.html.j2` holds the page skeleton: head, fonts, styles, favicons. The top menu and the footer are shared partials. Each kind of page has its own layout on top: the landing page, an ordinary page, the blog's front page, a post, the about page.

Netlify does not build anything. It publishes `www/` as it is, so the generated HTML is committed with its source.

The web app is different: the Topaze Clock is plain files in `static/clock/`, with no build at all. Its own README explains it.

Every page also answers in Markdown. Ask for it with `Accept: text/markdown` and you get its `index.md`. The list of all of them is [llms.txt](/llms.txt).
