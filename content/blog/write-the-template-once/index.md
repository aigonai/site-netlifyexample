---
title: Write the template once
date: 2026-11-17
summary: One skeleton, two shared partials, a layout per kind of page. Nothing is written twice.
image: hero.png
---

A site with ten pages has one header. If the header is in ten files, it is wrong in nine of them by next month.

## Three levels

1. **The skeleton**, `base.html.j2`: the head, the fonts, the stylesheet and script links, the favicons.
2. **Shared partials**: the top menu and the footer, included by the skeleton.
3. **Layouts**, one per kind of page: the landing page, an ordinary page, the blog's front page, a post, the about page. Each extends the skeleton and fills in the middle.

| Kind of page | Layout |
|---|---|
| Landing page | `landing.html.j2` |
| Website page | `page.html.j2` |
| Blog front page | `blog_index.html.j2` |
| Blog post | `post.html.j2` |
| About page | `about.html.j2` |

## No inline styles, no inline scripts

Every stylesheet and script is a file, linked with a cache buster made from its content. Change the file, and its address changes with it.
