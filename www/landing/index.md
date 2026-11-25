# The app you wanted could be a web page.

Describe the tool to Claude Code, keep the files in one folder, and let Netlify publish them. No app store, no server to run, and a link you can send to anyone.

## Three steps from an idea to a link

1. **Describe it.** Say what the tool should do and who uses it. Claude Code writes the page, the styles and the script.
2. **Keep it in a folder.** One repository, one www folder. The build script turns Markdown and templates into plain HTML.
3. **Publish it.** Connect the repository to Netlify. Every push to main is live in under a minute.

## What a static site gives you

- **Nothing to keep running.** Netlify serves files. There is no server of yours to patch or restart.
- **Fast everywhere.** Pages come from a CDN close to the reader, with long caching on every asset.
- **Readable by people and by LLMs.** Each page has a Markdown twin, served to any client that asks for text/markdown.
- **Yours to change.** The whole site is a folder of text files under version control.

4 files to edit for a new page of copy, on this example.

## Questions people ask

### Do I need to know HTML?

No. You describe what you want and read what comes back. Knowing where things live helps, and the repository is laid out so that it is easy to see.

### What does Netlify cost for a site like this?

A small static site fits in Netlify's free tier. Check their current limits for bandwidth and build minutes.

### Can it have a form?

Yes. The one at the bottom of this page is collected by Netlify Forms, from a plain HTML form, with no code of your own on a server.

### Where does the copy on this page come from?

From the front matter of content/landing/index.md, which is never published. Change the text there and rebuild.

## Get the starter kit

Leave your name and email and we send you the starter kit: this repository, and the prompt that builds a site like it. Or clone it yourself, point Claude Code at `content/landing/`, and ask for your own landing page in the same shape.

Or see the source on GitHub: https://github.com/aigonai/site-netlifyexample
