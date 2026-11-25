---
title: Questions
lead: The things people ask about a site built this way.
---

### Why commit the generated HTML?

So that Netlify has nothing to build. It copies `www/` and is done. A deploy cannot fail on a missing package or a changed Python version.

### Why is the source not published?

Because not everything in it is for readers. Front matter is build instructions, and a `private:` field holds notes for the author. The build publishes what readers need: the page, and the page again as clean Markdown for any client that asks for it.

### Can I use another brand?

Yes. Replace the tokens file and the logos, and the whole site follows. Nothing in the templates names a colour.

### Do I need JavaScript?

These pages use one small script, for the menu on narrow screens. Everything else is HTML and CSS.
