// Markdown for LLMs: a page asked for as Markdown gets its index.md.
//
// The same function topaze.xyz and aigon.ai run. An LLM's fetch tool often sends
// `Accept: text/markdown`, or `text/plain` with no text/html; a browser always sends
// text/html, so it gets the page. A path with no index.md falls through to the page.
export default async function handler(request: Request, context: any) {
  const accept = request.headers.get("accept") || "";
  const wantsMarkdown = accept.includes("text/markdown") ||
    (accept.includes("text/plain") && !accept.includes("text/html"));
  const url = new URL(request.url);
  const isPage = url.pathname.endsWith("/") || !url.pathname.split("/").pop()!.includes(".");

  if (wantsMarkdown && isPage) {
    const mdPath = url.pathname.endsWith("/") ? url.pathname + "index.md" : url.pathname + "/index.md";
    const md = await context.rewrite(mdPath);
    if (md.status === 200) {
      const res = new Response(md.body, md);
      res.headers.set("Content-Type", "text/markdown; charset=utf-8");
      res.headers.set("Vary", "Accept");
      return res;
    }
  }

  const res = await context.next();
  if (!isPage) return res;
  // The same URL answers HTML or Markdown, so caches must key on Accept.
  const out = new Response(res.body, res);
  out.headers.set("Vary", "Accept");
  return out;
}

export const config = { path: "/*", excludedPath: ["/s/*", "/skl", "/stefan"] };
