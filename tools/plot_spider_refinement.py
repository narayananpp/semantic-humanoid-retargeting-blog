"""Export recorded SPIDER window errors and plot equal-task elapsed-time means.

Run with --source-root to refresh the public measurements from completed traces.
Without it, regenerate the figures from the exported JSON alone.
"""
import argparse
import hashlib
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'site/assets/analysis/results'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-root', type=Path)
args = parser.parse_args()
target = OUT / 'spider-refinement-time.json'

if args.source_root:
    tasks = []
    for marker in sorted(args.source_root.glob('*/*/trace-complete.json')):
        source = marker.with_name('optimization-trace.jsonl')
        raw = source.read_bytes()
        rows = [json.loads(line) for line in raw.splitlines()]
        measurements = [[r['elapsed_minutes'], r['incumbent']['window_mean_add_cm']]
                        for r in rows]
        values = np.asarray(measurements)
        assert np.isfinite(values).all() and (np.diff(values[:, 0]) >= 0).all()
        tasks.append(dict(task=marker.parent.name, dataset=marker.parent.parent.name,
                          source_sha256=hashlib.sha256(raw).hexdigest(),
                          windows=len({r['planning_step'] for r in rows}),
                          measurements=measurements))
    assert tasks
    bins = []
    for start in range(int(np.ceil(max(t['measurements'][-1][0] for t in tasks)))):
        means = []
        for task in tasks:
            samples = [error for minute, error in task['measurements']
                       if start <= minute < start + 1]
            if samples:
                means.append(float(np.mean(samples)))
        if means:
            bins.append(dict(start_minute=start, end_minute=start+1,
                             mean_add_cm=float(np.mean(means)), tasks=len(means)))
    data = dict(protocol=dict(
        metric='Current MPC-window mean ADD of the incumbent candidate, aligned by simulation time.',
        aggregation='Within each one-minute elapsed-time bin, average recorded errors per task, then average tasks equally. Only tasks with measurements in that bin contribute.',
        time='Recorded elapsed optimization time, including logging overhead.',
        scope='Completed traces only. No full-task error reconstruction, best-so-far envelope, zero-time imputation, or extrapolation after completion.',
        comparability='SPIDER window ADD and Codex full-task object-path-aligned ADD have different scopes and are not directly comparable.'),
        completed_tasks=len(tasks), windows=sum(t['windows'] for t in tasks),
        bins=bins, tasks=tasks)
    target.write_text(json.dumps(data, separators=(',', ':')) + '\n')
else:
    data = json.loads(target.read_text())

bins = data['bins']
x = [(r['start_minute'] + r['end_minute']) / 2 for r in bins]
y = [r['mean_add_cm'] for r in bins]
n = [r['tasks'] for r in bins]
plt.rcParams.update({'font.family': 'DejaVu Sans', 'svg.fonttype': 'none',
                     'svg.hashsalt': 'spider-refinement', 'font.size': 11})
for mobile in (False, True):
    fig, (ax, count) = plt.subplots(2, 1, sharex=True,
        figsize=(4.2, 4.5) if mobile else (10, 4.1), dpi=100,
        gridspec_kw={'height_ratios': [4, 1], 'hspace': .15})
    fig.patch.set_facecolor('#faf9f6')
    fig.subplots_adjust(left=.18 if mobile else .09, right=.95 if mobile else .90,
                        bottom=.15, top=.78)
    for axis in (ax, count):
        axis.set_facecolor('#faf9f6')
        axis.spines[['top', 'right']].set_visible(False)
        axis.spines[['left', 'bottom']].set_color('#c4c8c0')
        axis.tick_params(length=0, labelsize=9 if mobile else 10, pad=6)
        axis.grid(axis='y', color='#d7d8ce', linewidth=.7)
        axis.set_axisbelow(True)
    ax.plot(x, y, color='#b36333', linewidth=2.3)
    upper = 25 * np.ceil(max(y) / 25)
    ax.set(ylabel='Mean window ADD (cm)', ylim=(0, upper))
    ax.set_yticks(np.arange(0, upper + 1, 25))
    count.step(x, n, where='mid', color='#797e74', linewidth=1.3)
    count.set(ylabel='Tasks', ylim=(0, 40), xlim=(0, 35),
              xlabel='Optimization time (minutes)')
    count.set_yticks([0, 35])
    count.set_xticks([0, 10, 20, 30] if mobile else [0, 5, 10, 15, 20, 25, 30, 35])
    fig.text(.07 if mobile else .09, .94, 'SPIDER refinement',
             fontsize=14 if mobile else 18, weight='bold', color='#242620')
    fig.text(.07 if mobile else .09, .87, 'Object tracking within optimization windows',
             fontsize=9 if mobile else 11, color='#b36333')
    name = 'spider-refinement-time' + ('-mobile' if mobile else '')
    fig.savefig(OUT / f'{name}.svg', metadata={'Date': None})
    svg = OUT / f'{name}.svg'
    svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines()) + '\n')
    fig.savefig(f'/tmp/{name}.png', dpi=140)
    plt.close(fig)
