"""Reuse archived swarm plots with terminology matching the current article.

SVG labels and legend spacing change. Data paths, scales and plotted values remain identical.
"""
import hashlib
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / 'site'
SOURCE = SITE / 'assets/analysis/results'
OUTPUT = SITE / 'assets/analysis/appendix'


def prepare():
    OUTPUT.mkdir(exist_ok=True)
    files = sorted({*SOURCE.glob('matched-time-add-*.svg'),
                    *SOURCE.glob('matched-time-semantic*.svg'), SOURCE / 'agent-hours.svg'})
    records = []
    for source in files:
        original = source.read_text()
        revised = original.replace('Codex', 'Single agent')
        if source.name.startswith('matched-time-add-') and 'mobile' not in source.name:
            start = revised.index('<g id="legend_1">')
            head, legend = revised[:start], revised[start:]
            groups = list(re.finditer(r'<g id="(?:line2d|text)_\d+">', legend))
            for match in reversed(groups[2:6]):
                legend = legend[:match.end()-1] + ' transform="translate(35 0)"' + legend[match.end()-1:]
            revised = head + legend
        (OUTPUT / source.name).write_text(revised)
        records.append(dict(file=source.name,
                            source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                            change='Codex label replaced with Single agent; legend spacing adjusted where needed; plotted data unchanged'))
    (OUTPUT / 'provenance.json').write_text(json.dumps(records, indent=2) + '\n')


if __name__ == '__main__':
    prepare()
