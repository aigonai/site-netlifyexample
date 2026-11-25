# site-netlifyexample

Worked examples for Netlify, styled with the Topaze brand kit: three small static
sites, each with its own look and built with Jinja2 and Python, and a web app, the
Topaze Clock, which needs no build at all.

| Example | Source | Live |
|---|---|---|
| Landing page: dark, with a sign-up form | `content/landing/` | `/landing/` |
| Multi-page website: sidebar, contact form, business card | `content/site/` | `/site/` |
| Blog: editorial list, page bundles, RSS | `content/blog/` | `/blog/` |
| Web app: the Topaze Clock (MIT licensed) | `static/clock/` | `/clock/` |

The root page (`content/index.md`) is a hub: four tiles linking the four examples, with
no site header.

Live at <https://cosmic-zuccutto-c132f5.netlify.app/>.

Built for the post *This app could have been a web app: How to use Claude Code to
quickly create functionality that you need*, on Stefan Loesch's Substack,
<https://stefanloesch.substack.com>. The post is published on **1 December 2026** at
<https://stefanloesch.substack.com/p/how-to-create-blog-landingpage-website-blog-webapp-using-claude-ai>
(until then that address is a 404).

The site links the post already (`substack` in `_generate/site.yaml`).

## The repository

| Folder | What it holds | Published? |
|---|---|---|
| `content/` | The source of the three sites: one folder per page, holding `index.md` (YAML front matter, then Markdown) and the page's own files | **Never** |
| `static/` | Copied as it is: stylesheets, scripts, logos, favicons, downloads, and the clock | via `www/` |
| `_generate/` | The build: `build.py`, `site.yaml`, the templates, the brand tokens, the clock's helper scripts | Never |
| `netlify/edge-functions/` | Short links, and Markdown for LLMs | Runs on Netlify |
| `www/` | **Generated, every file of it.** The only folder Netlify publishes | Yes |

## The build

    uv run _generate/build.py

The script carries its own dependencies (PEP 723), so `uv run` is all it takes. It
builds into `.www-build/` and swaps that in for `www/` only when everything succeeded,
so a failed build leaves the last good site in place.

It copies `static/` into `www/`, then writes:

- for each `content/<path>/index.md`, in `www/<path>/`:
  - `index.html`, the page for people;
  - `index.md`, **the same page as clean Markdown for LLMs**: no YAML, no HTML-only
    syntax, nothing private;
  - the page's own files, and a thumbnail of a post's image;
- `/assets/css/tokens.css`, from the brand tokens;
- the QR codes listed under `qr_codes` in `_generate/site.yaml`;
- `404.html`, `blog/feed.xml` (RSS), `llms.txt` and `sitemap.xml`.

**Netlify does not build anything.** `netlify.toml` publishes `www/` as it is, with
an empty build command. `www/` is committed, so a deploy is a plain copy.

**Markdown for LLMs.** A request with `Accept: text/markdown` gets a page's
`index.md` (`netlify/edge-functions/markdown-negotiation.ts`), and `/llms.txt` lists
them all. Each layout has its own Markdown template in `_generate/templates/markdown/`.

**Private fields.** Front matter may carry a `private:` mapping, such as notes for the
author or a reviewer's name. The build splits it off before any template sees the
page, then searches every file it wrote for every private value and **fails if one
turns up**. `content/blog/ship-it-on-netlify/` and `content/site/contact/` show it.

## Templates

`_generate/templates/`, written once and shared:

| File | What it is |
|---|---|
| `base.html.j2` | The page skeleton: head, fonts, stylesheet and script links, favicons, header and footer |
| `partials/header.html.j2` | The top menu: logo lockup, up to four items, one button (or a text link, with `button_style: link`) |
| `partials/footer.html.j2` | The footer |
| `partials/form.html.j2` | A Netlify form, from its definition under `forms:` in `site.yaml` |
| `partials/lucide.html.j2` | Lucide icons at a 1.5px stroke, inline SVG |
| `partials/post_card.html.j2` | One post in the blog's list |
| `layouts/home.html.j2` | The root hub: no header, four tiles |
| `layouts/landing.html.j2` | The landing page; its copy is front matter |
| `layouts/page.html.j2` | A page of the website: tinted title band, sidebar, optional form |
| `layouts/thanks.html.j2` | The page a form sends people to |
| `layouts/blog_index.html.j2` | The blog's front page: masthead, one post per row |
| `layouts/post.html.j2` | A blog post |
| `layouts/about.html.j2` | The blog's about page |
| `layouts/404.html.j2` | `www/404.html` |
| `markdown/*.md.j2` | The published `index.md` of each layout; `page.md.j2` is the default |
| `feed.xml.j2`, `llms.txt.j2`, `sitemap.xml.j2` | The blog's RSS feed, and the two indexes |

A page's layout is `layout:` in its front matter, or else its section's
`default_layout` in `_generate/site.yaml`. `site.yaml` also holds each section's menu
and theme (`theme: dark` makes the landing site dark whatever the reader's setting),
the forms and the QR codes.

No CSS or JS is inlined. Every file under `/assets/` is linked through `asset()`,
which appends a cache buster from the file's content (`site.css?v=3f9a…`), and
`netlify.toml` caches `/assets/*` for a year.

## The blog: page bundles

Each post is a folder, Hugo style, holding everything it needs:

    content/blog/ship-it-on-netlify/
      index.md              front matter, then Markdown
      hero.png              the post's image
      launch-checklist.txt  a file to download

The build copies the folder's files to `www/blog/ship-it-on-netlify/` and adds
`thumb-hero.png`, `index.html` and the clean `index.md` beside them.

The front matter is four public fields, and optionally `private:`; `image` is a file
name in the post's folder:

    ---
    title: Ship it on Netlify
    date: 2026-11-24
    summary: Connect the repository, and every push to main is live in under a minute.
    image: hero.png
    private:
      notes: Check Netlify's free-tier limits again before this goes out.
    ---

## Forms

Two Netlify Forms, defined once under `forms:` in `_generate/site.yaml` and rendered by
`partials/form.html.j2`. A page shows one with `form: <name>` in its front matter.

| Form | On | Sends people to |
|---|---|---|
| `signup` (name, email) | `/landing/` | `/landing/thanks/` |
| `contact` (name, email, topic, message) | `/site/contact/` | `/site/contact/thanks/` |

They are plain HTML with `data-netlify="true"` and a honeypot field against bots.
There is no server and no script of our own. **Netlify collects submissions only
once form detection is switched on** (in the Netlify UI: Forms); they then appear
there.

## Short links and the business card

`netlify/edge-functions/shortcut.ts` turns `/s/<slug>` into a 302, and also bare
`/<slug>` for the slugs listed in `BARE`:

| Address | Goes to |
|---|---|
| `/s/home` | `/` |
| `/skl`, `/stefan`, `/s/skl`, `/s/stefan` | `/downloads/cards/stefanloesch.vcf` |

The card is `static/downloads/cards/stefanloesch.vcf`, served as `text/vcard`. The
build draws the QR code for `/skl` (`qr_codes` in `_generate/site.yaml`), and
`/site/contact/` offers both.

## The Topaze Clock: a web app

`static/clock/` is a different kind of example: a **web app** rather than a site. It is a
world clock that runs entirely in the browser, with no build step and no Jinja2. It
installs as a PWA on iOS and Android, works offline, and keeps its data in browser
storage, moving it between devices by URL, by copy and paste, or as a QR code.

| | |
|---|---|
| Source | [`static/clock/`](static/clock/), with its own [README](static/clock/README.md) |
| Live here | `/clock/` |
| Running original | <https://topaze.xyz/clock/>; the two copies can drift |
| Helper scripts | `_generate/clock/clock_icon.py` (the icons), `_generate/clock/verify_clock_qr.py` (checks the QR codes decode) |
| Licence | **MIT**, Copyright (c) 2026 Stefan Loesch: [`static/clock/LICENSE`](static/clock/LICENSE). It covers the clock and `_generate/clock/`, not the rest of this repository |

The build copies it to `www/clock/` unchanged, like everything in `static/`.
`netlify.toml` gives it the headers a PWA needs: a service worker that is never cached,
and a manifest served as `application/manifest+json`.

## Brand

The Topaze brand kit: Montserrat (Bold headlines, Regular body) and IBM Plex Mono for
figures, from Google Fonts; the topaz palette with one imperial accent per view; sharp
corners, hairline borders, no gradients. The tokens are
`_generate/brand/topaze-tokens.json`, and the build generates `/assets/css/tokens.css`
from it. Logos in `static/assets/img/` are the brand's own SVG files, unaltered.

## Edge functions

| File | What it does |
|---|---|
| `netlify/edge-functions/shortcut.ts` | `/s/<slug>`, and `/<slug>` for the slugs in `BARE` → 302 |
| `netlify/edge-functions/markdown-negotiation.ts` | A page asked for as Markdown gets its `index.md` |

They run only on Netlify (or under `netlify dev`).

## Local preview

    uv run _generate/build.py
    uv run python -m http.server -d www 8000

Then open <http://localhost:8000/>. The edge functions (short links, Markdown on
request) and the forms need Netlify; everything else works here, the clock's offline
mode included.

## Deploy

Run the build, commit `www/` with its source, and push to `main`. Netlify publishes
`www/`.
