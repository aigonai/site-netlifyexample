# Start with one folder

10 November 2026 · A website is a folder of files. Keep it that way, and everything after is easy.

![Start with one folder](/blog/start-with-one-folder/hero.png)

The first decision is the one that makes the others easy: the whole site is one folder, and everything a reader sees is a file in it.

## One page, one folder

Every page here is a folder holding an `index.md`. The folder's path is the page's address, so `content/blog/start-with-one-folder/` becomes the address you are reading.

That rule has no exceptions, which is why it works. You never have to ask where a page is defined.

## Source in, site out

The source lives in `content/` and is never published. The build writes the site to `www/`: an `index.html` for each page, and an `index.md` that is the same page as clean Markdown. Both folders are committed, so you can open the output and see exactly what a reader gets.

![The facet motif, the brand's one decorative device](/blog/start-with-one-folder/hero.png)

## What goes in the folder

Whatever the page needs: its image, a thumbnail, a file to download. When a post is deleted, its folder goes, and nothing is left behind elsewhere.
