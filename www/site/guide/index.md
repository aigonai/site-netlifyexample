# Guide

How to change this site, from the copy on a page to its look.

## Change the words

Open the page's `index.md` under `content/` and edit the Markdown below the front matter. Headings, lists, tables, links and images all work. Rebuild, and the page in `www/` changes.

## Change the look

Styles live in `static/assets/css/`, published as `/assets/css/`:

- `tokens.css` holds the brand's colours, spacing, radii and fonts as CSS variables. The build generates it from `_generate/brand/topaze-tokens.json`, so change the JSON.
- `site.css` holds the rules that use them.

Every stylesheet and script is linked with a cache buster: a short hash of its content in the URL, such as `site.css?v=3f9a…`. A changed file gets a new URL, so readers never see a stale copy, and the files can be cached for a year.

## Change the layout of every page

The page skeleton is `_generate/templates/base.html.j2`. The header and footer are `partials/header.html.j2` and `partials/footer.html.j2`. Change one of them and every page changes with the next build.

> Nothing is written twice. If you find yourself copying a block from one template to another, it belongs in a partial.
