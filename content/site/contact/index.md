---
title: Contact
lead: How to reach the people behind this example.
form: contact
private:
  owner: The person who answers the issues
  todo: Read the form submissions in the Netlify UI every Monday.
---

## Business card

![QR code for the business card](/downloads/cards/qr-skl.png){: .qr width="200" height="200" }

Scan the code, or [download the card](/downloads/cards/stefanloesch.vcf): Stefan Loesch, CEO, Aigon.

The code holds a short link, `/skl`, not the file's own address, `/downloads/cards/stefanloesch.vcf`. A shorter address makes a smaller code that scans more easily, and the link can be pointed somewhere else later without reprinting it. `/stefan`, `/s/skl` and `/s/stefan` go to the same card; the short links live in `netlify/edge-functions/shortcut.ts`.

## Write to us

Questions about the examples, corrections, ideas: the form goes straight to the people who built them. You can also open an issue on [the repository](https://github.com/aigonai/site-netlifyexample/issues).

The form is plain HTML with `data-netlify="true"`. Netlify finds it when the site is published and collects what is sent, so there is no server and no script of our own. Its fields are listed once, in `_generate/site.yaml`.
