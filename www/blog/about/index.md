# About this blog

By The example's authors. Writing about small tools on the web.

This blog is one of four examples in [aigonai/site-netlifyexample](https://github.com/aigonai/site-netlifyexample).

## How a post is stored

Each post is a folder under `content/blog/`, in the page-bundle style Hugo uses. The folder holds everything the post needs:

```
content/blog/ship-it-on-netlify/
  index.md              the post: front matter, then Markdown
  hero.png              its image
  launch-checklist.txt  a file to download
```

The front matter is four fields:

```yaml
---
title: Ship it on Netlify
date: 2026-11-24
summary: Connect the repository, and every push to main is live.
image: hero.png
---
```

`image` is a file name in the post's own folder. The build copies the folder's files to `www/blog/ship-it-on-netlify/`, makes a thumbnail beside the image, renders the post, and adds it to the front page and the [RSS feed](/blog/feed.xml).

## Private fields

A post can also carry notes for its author only, under `private:`:

```yaml
private:
  notes: Check the limits again before this goes out.
```

They stay in `content/`. The build never hands them to a template, so they appear neither in the page nor in its published `index.md`, and it fails if one turns up anywhere in `www/` all the same.

## Writing a new post

1. Make a folder under `content/blog/`. Its name is the post's address.
2. Put `index.md` and the image in it.
3. Run `uv run _generate/build.py`, then commit and push.
