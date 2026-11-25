---
title: A small website in five pages
lead: The multi-page example. A home page, a guide, questions, an about page and a contact page, under one menu.
---

This is the shape most small sites need: a few pages that people move between, each with a clear job.

## How the pages are made

Each page is a folder under `content/site/` holding an `index.md`. The folder name is the address: `content/site/guide/index.md` is served at [/site/guide/](/site/guide/).

| Page | Source | Layout |
|---|---|---|
| Home | `content/site/index.md` | `page` |
| Guide | `content/site/guide/index.md` | `page` |
| FAQ | `content/site/faq/index.md` | `page` |
| About | `content/site/about/index.md` | `page` |
| Contact | `content/site/contact/index.md` | `page` |

The menu is not in any page. It is listed once, in `_generate/site.yaml`, and the shared header renders it on every page of the section.

## Adding a page

1. Make a folder: `content/site/pricing/`.
2. Write `index.md` in it, with a `title` in the front matter.
3. Add it to the menu in `site.yaml` if it belongs there. The brand allows four items at most.
4. Run `uv run _generate/build.py` and commit.
