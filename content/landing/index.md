---
title: Your own tools, as web pages
hero:
  eyebrow: Landing page example
  headline: The app you wanted could be a web page.
  lead: Describe the tool to Claude Code, keep the files in one folder, and let Netlify publish them. No app store, no server to run, and a link you can send to anyone.
  cta: Get started
how:
  title: Three steps from an idea to a link
  steps:
    - title: Describe it
      text: Say what the tool should do and who uses it. Claude Code writes the page, the styles and the script.
    - title: Keep it in a folder
      text: One repository, one www folder. The build script turns Markdown and templates into plain HTML.
    - title: Publish it
      text: Connect the repository to Netlify. Every push to main is live in under a minute.
features:
  title: What a static site gives you
  items:
    - title: Nothing to keep running
      text: Netlify serves files. There is no server of yours to patch or restart.
    - title: Fast everywhere
      text: Pages come from a CDN close to the reader, with long caching on every asset.
    - title: Readable by people and by LLMs
      text: Each page has a Markdown twin, served to any client that asks for text/markdown.
    - title: Yours to change
      text: The whole site is a folder of text files under version control.
  figure:
    value: "4"
    label: files to edit for a new page of copy, on this example
faq:
  - q: Do I need to know HTML?
    a: No. You describe what you want and read what comes back. Knowing where things live helps, and the repository is laid out so that it is easy to see.
  - q: What does Netlify cost for a site like this?
    a: A small static site fits in Netlify's free tier. Check their current limits for bandwidth and build minutes.
  - q: Can it have a form?
    a: Yes. The one at the bottom of this page is collected by Netlify Forms, from a plain HTML form, with no code of your own on a server.
  - q: Where does the copy on this page come from?
    a: From the front matter of content/landing/index.md, which is never published. Change the text there and rebuild.
form: signup
cta:
  title: Get the starter kit
  label: Or see the source on GitHub
  url: https://github.com/aigonai/site-netlifyexample
---

Leave your name and email and we send you the starter kit: this repository, and the prompt that builds a site like it. Or clone it yourself, point Claude Code at `content/landing/`, and ask for your own landing page in the same shape.
