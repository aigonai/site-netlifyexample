# /// script
# requires-python = ">=3.11"
# dependencies = ["jinja2==3.1.6", "markdown==3.9", "pyyaml==6.0.3", "pillow==11.3.0", "qrcode==8.0"]
# ///
"""Build the site: content/ and static/ in, www/ out.

    uv run _generate/build.py

THREE FOLDERS, AND ONLY ONE OF THEM IS PUBLISHED.

  content/   the source: one folder per page holding index.md (YAML front matter,
             then Markdown) and the page's own files. NEVER published.
  static/    stylesheets, scripts, logos, favicons: copied to www/ as they are.
  www/       GENERATED, every file of it. The only folder Netlify publishes.

For each content/<path>/index.md the build writes two files to www/<path>/:

  index.html   the page, for people
  index.md     the page as clean Markdown, for LLMs: no YAML, nothing private.
               Served to any request with Accept: text/markdown
               (netlify/edge-functions/markdown-negotiation.ts), listed in llms.txt.

and copies the page's other files beside them (a post's image, its downloads), plus
a thumbnail of a post's image.

PRIVATE FIELDS. Front matter may carry a `private:` mapping: editorial notes, sources,
anything for the author only. It is read by nothing that writes to www/. As a guard,
the build then searches every file it wrote for every private value, and fails if one
turns up.

There is no build step on Netlify. www/ is committed, so a deploy is a plain copy.
"""

import hashlib
import json
import re
import shutil
import sys
from datetime import date, datetime, timezone
from email.utils import format_datetime
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from PIL import Image
import qrcode
from qrcode.constants import ERROR_CORRECT_M

GENERATE = Path(__file__).resolve().parent
ROOT = GENERATE.parent
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
WWW = ROOT / "www"
# The build writes here, and swaps it in for www/ only once everything succeeded:
# a failed build leaves the last good www/ untouched.
STAGING = ROOT / ".www-build"
TEMPLATES = GENERATE / "templates"
TOKENS = GENERATE / "brand" / "topaze-tokens.json"

# A thumbnail's width in pixels; the height follows the image's own proportions.
THUMB_WIDTH = 640
# How many hex digits of an asset's md5 go into its cache buster: enough to change
# whenever the file does, short enough to read in the HTML.
CACHE_BUSTER_DIGITS = 10
# The blog's front page lists this many posts, newest first.
RECENT_POSTS = 10
# The fields a blog post's front matter may hold. The four public ones are required.
POST_FIELDS = {"title", "date", "summary", "image"}
PRIVATE = "private"

FRONT_MATTER = re.compile(r"\A---\n(.*?)\n---\n?(.*)\Z", re.S)
# A src or href in HTML that is neither absolute, root-relative, an anchor nor a scheme.
RELATIVE_HTML_URL = re.compile(r'(src|href)="(?![a-z]+:|/|#)([^"]+)"')
# The same in Markdown: the target of [text](target) or ![alt](target).
RELATIVE_MD_URL = re.compile(r"(\]\()(?![a-z]+:|/|#)([^)\s]+)")
# attr_list syntax, which means something to the HTML build only.
ATTR_LIST = re.compile(r"\s*\{:[^}]*\}")


def die(message: str) -> None:
    print(f"build: {message}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------- pages


class Page:
    """One content/<path>/index.md: where it is served, its public fields, its body."""

    def __init__(self, md_path: Path, sections: dict):
        self.source = md_path.parent
        rel = self.source.relative_to(CONTENT).as_posix()
        self.rel = "" if rel == "." else rel
        self.url = "/" if not self.rel else f"/{self.rel}/"
        self.section_key = self.rel.split("/")[0] if self.rel else "root"
        if self.section_key not in sections:
            die(f"{md_path}: no section '{self.section_key}' in site.yaml")
        self.section = sections[self.section_key]

        match = FRONT_MATTER.match(md_path.read_text(encoding="utf-8"))
        if not match:
            die(f"{md_path}: no YAML front matter")
        front = yaml.safe_load(match.group(1)) or {}
        # The private fields are split off here and never handed to a template.
        self.private = front.pop(PRIVATE, {}) or {}
        self.meta = front
        if "title" not in self.meta:
            die(f"{md_path}: front matter has no title")
        self.title = self.meta["title"]
        self.layout = self.meta.get("layout") or self.section.get("default_layout") or die(
            f"{md_path}: no layout, and section '{self.section_key}' has no default_layout"
        )
        if self.is_post:
            extra, missing = set(self.meta) - POST_FIELDS, POST_FIELDS - set(self.meta)
            if extra or missing:
                die(f"{md_path}: a post's front matter is {sorted(POST_FIELDS)} (+ private); "
                    f"extra {sorted(extra)}, missing {sorted(missing)}")

        # The body, with links to the page's own files made root-relative, so it reads
        # the same at /blog/post/ and /blog/post, and in the published index.md.
        self.markdown = RELATIVE_MD_URL.sub(lambda m: f"{m.group(1)}{self.url}{m.group(2)}", match.group(2)).strip()
        html = markdown.markdown(self.markdown, extensions=["tables", "fenced_code", "attr_list", "sane_lists"])
        self.body = RELATIVE_HTML_URL.sub(lambda m: f'{m.group(1)}="{self.url}{m.group(2)}"', html)
        # The published Markdown drops HTML-only syntax: {: .class width="…" } attributes.
        self.markdown = ATTR_LIST.sub("", self.markdown)

    @property
    def description(self) -> str:
        """One line about the page: a post's summary, else a page's lead, else nothing."""
        return self.meta.get("summary") or self.meta.get("lead") or ""

    @property
    def is_post(self) -> bool:
        return self.layout == "post"

    def file_url(self, name: str) -> str:
        """A file in this page's own folder, as a URL."""
        return self.url + name


def private_values(value) -> list[str]:
    """Every string inside a private mapping, however deeply nested."""
    if isinstance(value, dict):
        return [s for v in value.values() for s in private_values(v)]
    if isinstance(value, list):
        return [s for v in value for s in private_values(v)]
    return [str(value)] if value not in (None, "") else []


# --------------------------------------------------------------------------- assets


def asset(path: str) -> str:
    """The URL of a file in the built site, with a cache buster from its content.

    Every reference to /assets/ goes through this, which is what lets netlify.toml
    cache /assets/* for a year: a changed file is a changed URL.
    """
    file = STAGING / path.lstrip("/")
    if not file.is_file():
        die(f"asset not found: {path}")
    digest = hashlib.md5(file.read_bytes()).hexdigest()[:CACHE_BUSTER_DIGITS]
    return f"/{path.lstrip('/')}?v={digest}"


def write_tokens_css() -> None:
    """The brand's design tokens as CSS variables, light and dark."""
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    colours = {t["name"]: t["value"] for t in tokens["color"]["tokens"]}

    def resolve(value: str) -> str:
        return f"var(--{value[1:-1]})" if value.startswith("{") else value

    light, dark = [], []
    for name, value in colours.items():
        if isinstance(value, dict):
            light.append(f"  --{name}: {resolve(value['light'])};")
            dark.append(f"  --{name}: {resolve(value['dark'])};")
        else:
            light.append(f"  --{name}: {value};")
    for group in ("spacing", "radius"):
        for t in tokens[group]["tokens"]:
            light.append(f"  --{t['name']}: {t['value']};")
    for t in tokens["shadow"]["tokens"]:
        light.append(f"  --{t['name']}: {t['value']['light']};")
        dark.append(f"  --{t['name']}: {t['value']['dark']};")
    for key, family in tokens["type"]["families"].items():
        light.append(f"  --font-{key}: {family};")

    css = (
        "/* GENERATED by _generate/build.py from _generate/brand/topaze-tokens.json. Do not edit. */\n"
        ":root {\n" + "\n".join(light) + "\n}\n"
        "@media (prefers-color-scheme: dark) {\n  :root {\n"
        + "\n".join("  " + line for line in dark)
        + "\n  }\n}\n"
        # A section can be dark whatever the reader's setting: theme: dark in site.yaml.
        ".theme-dark {\n" + "\n".join(dark) + "\n  color-scheme: dark;\n}\n"
    )
    target = STAGING / "assets" / "css" / "tokens.css"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(css, encoding="utf-8")


# A QR code's module size and quiet zone, in pixels and modules.
QR_BOX = 12
QR_BORDER = 4


def write_qr_codes(site: dict) -> None:
    """Each qr_codes entry in site.yaml, drawn in graphite on white."""
    for entry in site.get("qr_codes", []):
        qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=QR_BOX, border=QR_BORDER)
        qr.add_data(site["base_url"] + entry["path"])
        target = STAGING / entry["file"]
        target.parent.mkdir(parents=True, exist_ok=True)
        qr.make_image(fill_color="#272b31", back_color="#ffffff").save(target)


def thumbnail_name(image: str) -> str:
    return f"thumb-{image}"


def copy_page_files(page: Page, out: Path) -> None:
    """The page's own files (everything but index.md), and a post's thumbnail."""
    for file in page.source.iterdir():
        if file.is_file() and file.name != "index.md" and not file.name.startswith("."):
            shutil.copy2(file, out / file.name)
    image = page.meta.get("image")
    if image:
        if not (page.source / image).is_file():
            die(f"{page.source}/index.md: image '{image}' is not in the page's folder")
        with Image.open(page.source / image) as img:
            height = round(img.height * THUMB_WIDTH / img.width)
            img.resize((THUMB_WIDTH, height), Image.LANCZOS).save(out / thumbnail_name(image), optimize=True)


# ---------------------------------------------------------------------------- build


def long_date(value: date) -> str:
    """30 October 2026, the brand's date style."""
    return f"{value.day} {value:%B %Y}"


def rfc822(value: date) -> str:
    return format_datetime(datetime(value.year, value.month, value.day, tzinfo=timezone.utc))


def environment(site: dict, sections: dict, autoescape: bool) -> Environment:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        undefined=StrictUndefined,
        autoescape=autoescape,
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
    )
    env.globals.update(asset=asset, site=site, sections=sections, thumbnail_name=thumbnail_name)
    env.filters.update(long_date=long_date, rfc822=rfc822)
    return env


def check_no_private_leaks(pages: list[Page]) -> None:
    """Fail if any private value appears in any file written to the site."""
    secrets = {(p.source / "index.md", v) for p in pages for v in private_values(p.private)}
    if not secrets:
        return
    for file in STAGING.rglob("*"):
        if not file.is_file() or file.suffix not in {".html", ".md", ".txt", ".xml"}:
            continue
        text = file.read_text(encoding="utf-8", errors="ignore")
        for source, value in secrets:
            if value in text:
                die(f"PRIVATE field of {source} leaked into {file.relative_to(STAGING)}: {value[:40]!r}")


def build() -> None:
    site = yaml.safe_load((GENERATE / "site.yaml").read_text(encoding="utf-8"))
    sections = site["sections"]
    # The post is linked whenever its URL is set, even ahead of post_date (owner's call).
    site["substack"]["live_url"] = site["substack"].get("post_url")

    if STAGING.exists():
        shutil.rmtree(STAGING)
    shutil.copytree(STATIC, STAGING)
    write_tokens_css()
    write_qr_codes(site)

    # Section front pages first, then the rest by address.
    pages = sorted(
        (Page(p, sections) for p in CONTENT.rglob("index.md")),
        key=lambda p: (p.url != p.section["path"], p.url),
    )
    posts = sorted((p for p in pages if p.is_post), key=lambda p: p.meta["date"], reverse=True)

    html_env = environment(site, sections, autoescape=True)
    text_env = environment(site, sections, autoescape=False)

    for page in pages:
        out = STAGING / page.rel
        out.mkdir(parents=True, exist_ok=True)
        copy_page_files(page, out)
        context = dict(page=page, section=page.section, posts=posts[:RECENT_POSTS], all_posts=posts)
        html = html_env.get_template(f"layouts/{page.layout}.html.j2").render(context)
        (out / "index.html").write_text(html, encoding="utf-8")
        md_template = f"markdown/{page.layout}.md.j2"
        if not (TEMPLATES / md_template).is_file():
            md_template = "markdown/page.md.j2"
        (out / "index.md").write_text(text_env.get_template(md_template).render(context), encoding="utf-8")

    not_found = html_env.get_template("layouts/404.html.j2")
    (STAGING / "404.html").write_text(not_found.render(section=sections["root"]), encoding="utf-8")
    feed = html_env.get_template("feed.xml.j2").render(section=sections["blog"], posts=posts)
    (STAGING / "blog" / "feed.xml").write_text(feed, encoding="utf-8")
    (STAGING / "llms.txt").write_text(text_env.get_template("llms.txt.j2").render(pages=pages), encoding="utf-8")
    sitemap = html_env.get_template("sitemap.xml.j2").render(pages=pages)
    (STAGING / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    check_no_private_leaks(pages)

    if WWW.exists():
        shutil.rmtree(WWW)
    STAGING.rename(WWW)
    hidden = sum(len(private_values(p.private)) for p in pages)
    print(f"build: {len(pages)} pages, {len(posts)} posts, {hidden} private values kept out of www/")


if __name__ == "__main__":
    build()
