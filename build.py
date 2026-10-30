"""Build the standalone blog, including its locally stored videos."""

import argparse
import json
import re
import shutil
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from markdown_it import MarkdownIt

BLOG = Path(__file__).resolve().parent / "site"
CONTENT = BLOG / "content"
TEMPLATES = BLOG / "templates"
DIRECTIVE = re.compile(r"^::: (component|video|anchor) ([a-z0-9_-]+)\s*$", re.M)


def read_json(path):
    return json.loads(path.read_text())


def local_file(root, name):
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Path must stay inside {root}: {name}")
    return path


def video_html(name, media):
    if name not in media:
        raise ValueError(f"Unknown video '{name}'; add it to content/media.json")
    item = media[name]
    views = item.get("views") or [item]
    panels = []
    for view in views:
        src = view["src"]
        url = urlsplit(src)
        if url.scheme not in ("", "https") or url.netloc and not url.scheme:
            raise ValueError(f"Use a relative path or HTTPS video URL: {src}")
        if not url.scheme and (src.startswith("/") or ".." in Path(src).parts):
            raise ValueError(f"Video path must be relative to the blog: {src}")
        label = escape(view.get("label", item["label"]))
        outcome = view.get("outcome")
        badge = ""
        if outcome in {"failure", "success"}:
            status, symbol = ("Failed execution", "✕") if outcome == "failure" else ("Successful execution", "✓")
            badge = f'<span class="execution-{outcome}" role="img" aria-label="{status}">{symbol}</span>'
        panels.append(
            f'<div class="execution-panel"><p>{label}</p>{badge}<video controls muted playsinline '
            f'preload="none" aria-label="{label}" '
            f'poster="{escape(view.get("poster", ""), quote=True)}" src="{escape(src, quote=True)}"></video></div>'
        )
    caption = escape(item.get("caption", ""))
    return (
        f'<figure class="authored-video" data-media-id="{escape(name)}">'
        f'<div class="authored-video-views">{"".join(panels)}</div>'
        f"<figcaption>{caption}</figcaption></figure>"
    )


def render_markdown(text, components, media, section_id=""):
    slots = []

    def insert(match):
        kind, name = match.groups()
        if kind == "component":
            if name not in components:
                raise ValueError(f"Unknown component '{name}'")
            html = components[name]
        elif kind == "video":
            html = video_html(name, media)
        else:
            html = f'<span id="{name}" class="section-anchor"></span>'
        slots.append(html)
        return f"\n\n<!-- blog-slot-{len(slots) - 1} -->\n\n"

    md = MarkdownIt("commonmark", {"html": True}).enable("table")

    def directive_rule(state, start, end, silent):
        if state.sCount[start] - state.blkIndent >= 4:
            return False
        line = state.src[state.bMarks[start] + state.tShift[start] : state.eMarks[start]]
        if not line.startswith(":::"):
            return False
        match = DIRECTIVE.fullmatch(line)
        if not match:
            raise ValueError("Unrecognized directive; use ::: component NAME or ::: video NAME")
        if not silent:
            token = state.push("html_block", "", 0)
            token.content = insert(match)
            token.map = [start, start + 1]
            state.line = start + 1
        return True

    md.block.ruler.before("fence", "blog_directive", directive_rule)
    tokens = md.parse(text)
    headings = []
    for i, token in enumerate(tokens):
        if token.type == "heading_open":
            inline = tokens[i + 1]
            suffix = re.search(r"\s+\{#([a-z0-9_-]+)\}$", inline.content)
            if suffix:
                anchor = suffix[1]
                inline.content = inline.content[: suffix.start()]
                inline.children = md.parseInline(inline.content)[0].children
            else:
                anchor = re.sub(r"[^a-z0-9]+", "-", inline.content.lower()).strip("-")
            token.attrSet("id", anchor)
            label = re.sub(r"[*`=]", "", inline.content)
            level = int(token.tag[1])
            headings.append((level, section_id if level == 2 and section_id else anchor, label))
        # Yellow emphasis remains ordinary editable Markdown: ==important words==.
        for child in token.children or []:
            if child.type == "text" and "==" in child.content:
                marked, count = re.subn(r"==(.+?)==", r"<mark>\1</mark>", escape(child.content))
                if count:
                    child.type = "html_inline"
                    child.content = marked
    html = md.renderer.render(tokens, md.options, {})
    html = html.replace("<table>", '<div class="table-wrap"><table>').replace(
        "</table>", "</table></div>"
    )
    for i, slot in enumerate(slots):
        html = html.replace(f"<!-- blog-slot-{i} -->", slot)
    return html, headings


class PageLinks(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.images = set(), [], []
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if anchor := attrs.get("id"):
            if anchor in self.ids:
                raise ValueError(f"Duplicate HTML id: {anchor}")
            self.ids.add(anchor)
        if tag == "a" and not attrs.get("data-experience-anchor"):
            self.links.append(attrs.get("href", ""))
        if tag == "img" and attrs.get("src"):
            self.images.append(attrs["src"])


def refinement_panel():
    """Render evidence-backed stills; editable copy and callouts live in content/."""
    data = read_json(CONTENT / "refinement-panel.json")
    pipeline = data.get("pipeline")
    pipeline_html = ""
    if pipeline:
        local_file(BLOG / "assets", pipeline["image"].removeprefix("assets/"))
        pipeline_html = (
            f'<a class="refinement-pipeline" id="refinement-pipeline" href="{escape(pipeline["image"])}" '
            'aria-label="Enlarge the refinement pipeline">'
            f'<img src="{escape(pipeline["image"])}" alt="{escape(pipeline["alt"])}" '
            f'width="{pipeline["width"]}" height="{pipeline["height"]}" loading="lazy"></a>'
        )
    cards = []
    for number, card in enumerate(data["cards"], 1):
        letter = chr(ord("a") + number - 1)
        src = card["image"]
        local_file(BLOG / "assets", src.removeprefix("assets/"))
        cx, cy, rx, ry = card["ellipse"]
        tx, ty = card["tag"]
        # Normalized SVG coordinates preserve pointers at every viewport size.
        cards.append(
            f'<article class="consideration-card" id="refinement-5{letter}">'
            f'<div class="consideration-label"><span>({letter})</span> '
            f'{escape(card["consideration"])}</div>'
            f'<a class="consideration-image" href="{escape(src)}" '
            f'aria-label="Enlarge: {escape(card["alt"])}">'
            f'<img src="{escape(src)}" alt="{escape(card["alt"])}" '
            'width="1440" height="1080" loading="lazy">'
            '<svg viewBox="0 0 100 75" aria-hidden="true">'
            f'<ellipse cx="{cx}" cy="{cy*.75}" rx="{rx}" ry="{ry*.75}"/>'
            f'<path d="M {tx} {ty*.75} L {cx} {cy*.75}"/>'
            f'<circle cx="{tx}" cy="{ty*.75}" r="3.2"/>'
            f'<text x="{tx}" y="{ty*.75}">{letter}</text></svg></a>'
            f'<h4>{escape(card.get("title", card.get("question", "")))}</h4>'
            f'<p class="consideration-decision">{escape(card["decision"])}</p>'
            '</article>'
        )
    return (
        '<figure class="refinement-panel" id="refinement-figure-5">'
        f'{pipeline_html}'
        f'<h3 class="refinement-examples-heading">{escape(data.get("heading", "Refining contact, support and motion"))}</h3>'
        f'<div class="consideration-grid">{"".join(cards)}</div>'
        f'<figcaption><strong>Figure 6.</strong> {escape(data["caption"])}</figcaption></figure>'
    )


def render_pages():
    config = read_json(CONTENT / "site.json")
    media = read_json(CONTENT / "media.json")
    components = dict(
        re.findall(
            r"<!-- component: ([a-z0-9_-]+) -->\s*(.*?)\s*<!-- /component -->",
            (TEMPLATES / "components.html").read_text(),
            re.S,
        )
    )
    components["refinement-considerations"] = refinement_panel()
    parts, headings, introductions = {}, {}, {}
    for page, spec in config["pages"].items():
        parts[page], headings[page] = [], []
        for section in spec["sections"]:
            source = local_file(CONTENT, section["file"])
            try:
                text=source.read_text()
                offset=section.get("heading_offset",0)
                if offset:
                    text=re.sub(r"^(#{1,5}) ",lambda m: "#"*min(6,len(m[1])+offset)+" ",text,flags=re.M)
                body, titles = render_markdown(
                    text, components, media, section.get("id", "")
                )
            except ValueError as error:
                raise ValueError(f"{source.relative_to(BLOG)}: {error}") from error
            tag = section.get("tag", "section")
            if tag not in {"section", "article", "header"}:
                raise ValueError(f"Invalid section tag: {tag}")
            attrs = "".join(
                f' {key}="{escape(str(value), quote=True)}"'
                for key, value in section.items()
                if key in {"id", "class", "data-example"}
            )
            if section.get("class") == "experience-intro":
                introductions[page] = f'<header class="experience-intro">{body}</header>'
            else:
                parts[page].append(f"<{tag}{attrs}>\n{body}</{tag}>")
            headings[page].extend(titles)
    toc = []
    for level, anchor, label in headings["index.html"]:
        if level not in {2, 3}:
            continue
        cls = ' class="subsection"' if level == 3 else ""
        toc.append(f'<a{cls} href="#{anchor}">{escape(label)}</a>')
    pages = {}
    for page, spec in config["pages"].items():
        template = local_file(TEMPLATES, spec["template"]).read_text()
        fields = {
            key: escape(str(config.get(key, "")))
            for key in ("title", "description", "subtitle", "date")
        }
        fields.update(
            content="\n".join(parts[page]),
            contents="\n".join(toc),
            intro=introductions.get(page, ""),
            cover=components["cover-motion"],
        )
        pages[page] = re.sub(r"\{\{([a-z]+)\}\}", lambda m: fields[m[1]], template)
        pages[page] = pages[page].replace(
            "<!doctype html>",
            "<!doctype html>\n<!-- Generated by build.py. Edit content/*.md and content/site.json; see README.md. -->",
            1,
        )
    parsed = {name: PageLinks(html) for name, html in pages.items()}
    for name, info in parsed.items():
        for href in info.links:
            target = urlsplit(href)
            if target.scheme or target.netloc or not target.fragment:
                continue
            target_page = target.path or name
            if target_page in parsed and target.fragment not in parsed[target_page].ids:
                raise ValueError(f"{name}: broken section link {href}")
    return pages


def write_pages():
    for name, html in render_pages().items():
        (BLOG / name).write_text(html)


def build(output):
    pages = render_pages()
    output = output.resolve()
    if output == BLOG.resolve() or BLOG.resolve().is_relative_to(output):
        raise ValueError("Build outside the source tree")
    if output.exists() and any(output.iterdir()):
        raise ValueError(f"Choose an empty output directory: {output}")
    output.mkdir(parents=True, exist_ok=True)
    for source in BLOG.iterdir():
        if source.name in {"content", "templates", "index.html", "experience.html"}:
            continue
        target = output / source.name
        if source.is_symlink():
            raise ValueError(f"Local storage links cannot be published: {source.name}")
        if source.is_dir():
            shutil.copytree(source, target)
        else:
            shutil.copyfile(source, target)
    for name, html in pages.items():
        (output / name).write_text(html)
    (output / ".nojekyll").touch()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("_site"))
    args = parser.parse_args()
    build(args.output)
    print(f"Built the blog with videos in {args.output}")
