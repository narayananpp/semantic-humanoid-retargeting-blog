"""Check a standalone build's local assets, video hashes and publication size."""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

class Links(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.urls = []; self.ids = set(); self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.add(attrs['id'])
        self.urls.extend(attrs[k] for k in ('src', 'href', 'poster') if attrs.get(k))

def strings(value):
    if isinstance(value, str): yield value
    elif isinstance(value, dict):
        for child in value.values(): yield from strings(child)
    elif isinstance(value, list):
        for child in value: yield from strings(child)

def validate(root):
    root = root.resolve(); failures = []; total = 0
    pages = {p.name: Links(p.read_text()) for p in root.glob('*.html')}
    def check(source, url):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            if parts.hostname in {'localhost', '127.0.0.1'}: failures.append(f'{source}: local preview URL {url}')
            return
        if parts.path.startswith('/'): failures.append(f'{source}: absolute URL {url}'); return
        target = (source.parent / unquote(parts.path)).resolve() if parts.path else source
        if not target.is_relative_to(root): failures.append(f'{source}: path escapes site {url}'); return
        if not target.exists(): failures.append(f'{source.relative_to(root)}: missing {url}')
        if parts.fragment and target.name in pages and parts.fragment not in pages[target.name].ids:
            # The contents menu forwards these anchors into the experience iframe.
            frame_anchor = parts.fragment.removeprefix('experience-')
            forwarded = parts.fragment.startswith('experience-') and frame_anchor in pages.get('experience.html', Links('')).ids
            if not forwarded: failures.append(f'{source.relative_to(root)}: missing anchor {url}')
    for source in root.rglob('*'):
        if source.is_symlink(): failures.append(f'Symlink: {source}'); continue
        if not source.is_file(): continue
        size = source.stat().st_size; total += size
        if size >= 100 * 2**20: failures.append(f'File exceeds GitHub limit: {source}')
        if source.suffix not in {'.html','.css','.js','.json','.svg','.txt','.csv'}: continue
        text = source.read_text()
        if re.search(r'/(?:data\d*|scratch|home|tmp)/', text): failures.append(f'Private machine path: {source.relative_to(root)}')
        if source.suffix == '.html':
            for url in Links(text).urls: check(source, url)
        if source.suffix == '.css':
            for url in re.findall(r'url\([\s\'"]*([^\)\s\'"]+)', text): check(source,url)
        if source.suffix == '.json':
            for url in strings(json.loads(text)):
                if re.match(r'^(?:assets/|[a-z-]*media/)',url): check(source,url)
    videos = json.loads((root/'media-manifest.json').read_text())
    for video in videos:
        source=root/video['path']
        if not source.is_file(): failures.append(f"Missing video: {video['path']}"); continue
        if source.stat().st_size != video['bytes'] or hashlib.sha256(source.read_bytes()).hexdigest() != video['sha256']:
            failures.append(f"Video checksum mismatch: {video['path']}")
    if total >= 10**9: failures.append('Site exceeds 1 GB GitHub Pages limit')
    if failures: raise SystemExit('\n'.join(failures))
    print(f'Validated {len(pages)} pages and {len(videos)} videos; {total / 2**20:.1f} MiB total.')

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('directory',type=Path,nargs='?',default=Path('_site'))
    validate(parser.parse_args().directory)
