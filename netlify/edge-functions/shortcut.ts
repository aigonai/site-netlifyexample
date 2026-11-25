// Short links at /s/<slug>, and at /<slug> for the slugs in BARE: a 302 to the target
// in SHORTCUTS.
//
// The same pattern topaze.xyz and aigon.ai run, without their hit logging: that posts to
// logging.aigon.ai with a bearer token, which belongs in this file only once the site
// is meant to log. Add a slug -> target entry below; the target may be a site-relative
// path or an absolute URL.
//
// A SLUG THAT IS PRINTED IS FIXED. Once a slug is on a QR code or a sheet, change its
// target here if the page moves — never the slug.
const SHORTCUTS: Record<string, string> = {
  // The home page — also the slug to test the shortcut system with.
  home: "/",
  // Stefan Loesch's business card. The QR code on /site/contact/ points at /skl.
  skl: "/downloads/cards/stefanloesch.vcf",
  stefan: "/downloads/cards/stefanloesch.vcf",
};

// Slugs that also answer at the top level, without /s/: /skl as well as /s/skl. Each
// must be listed in config.path below too — that list is what Netlify routes by.
const BARE = ["skl", "stefan"];

export default async function handler(request: Request, context: any) {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/(s\/)?/, "").replace(/\/$/, "");
  const target = SHORTCUTS[slug];

  // An unknown slug falls through to the site, which answers with its own 404.html.
  if (!target) return context.next();

  return Response.redirect(new URL(target, url.origin).toString(), 302);
}

export const config = {
  path: ["/s/*", ...BARE.map((slug) => `/${slug}`)],
};
