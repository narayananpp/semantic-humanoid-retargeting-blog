"""Plot saved two-hour histories and separate-budget semantic endpoints."""
import bisect
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

OUT = Path(__file__).resolve().parents[1] / 'site/assets/analysis/results'
data = json.loads((OUT / 'codex-refinement-time.json').read_text())
curve = data['curve']
x, y = curve['minutes'], curve['mean_add_cm']
assert curve['tasks'] == len(set(data['cohort'])) == 40
assert x[0] == 0 and x[-1] == 120
assert all(a <= b for a, b in zip(x, x[1:]))
assert all(a >= b - 1e-8 for a, b in zip(y, y[1:]))
y30 = y[bisect.bisect_right(x, 30) - 1]
plt.rcParams.update({'font.family': 'DejaVu Sans', 'svg.fonttype': 'none',
                     'svg.hashsalt': 'codex-refinement', 'font.size': 11})

for mobile in (False, True):
    fig, ax = plt.subplots(figsize=(4.2, 5.2) if mobile else (10, 5.1), dpi=100)
    fig.patch.set_facecolor('#faf9f6')
    ax.set_facecolor('#faf9f6')
    fig.subplots_adjust(left=.17 if mobile else .09, right=.84 if mobile else .90,
                        bottom=.17, top=.72 if mobile else .77)
    semantic = ax.twinx()
    ax.step(x, y, where='post', color='#287b70', linewidth=2.3, zorder=3)
    for minute in (30, 120):
        ax.axvline(minute, linestyle=':', color='#6e7169', linewidth=1.5)
    ax.scatter([30, 120], [y30, y[-1]], color='#287b70', s=32, zorder=4, clip_on=False)
    ax.set(xlim=(0, 120), ylim=(0, 60), xlabel='Refinement time (minutes)',
           ylabel='Best-so-far mean ADD (cm)')
    ax.set_xticks([0, 30, 60, 90, 120])
    ax.set_yticks([0, 15, 30, 45, 60])
    semantic.set(ylim=(0, 100), ylabel='Semantic success (%)')
    semantic.set_yticks([0, 25, 50, 75, 100])
    ax.grid(axis='y', color='#d7d8ce', linewidth=.7)
    ax.set_axisbelow(True)
    for axis in (ax, semantic):
        axis.spines['top'].set_visible(False)
        for side in ('left', 'right', 'bottom'):
            axis.spines[side].set_color('#c4c8c0')
        axis.tick_params(length=0, labelsize=9 if mobile else 10, pad=6)
        axis.xaxis.label.set_size(10 if mobile else 11)
        axis.yaxis.label.set_size(10 if mobile else 11)
    for row in data['semantic']:
        minute = row['budget_minutes']
        value = 100 * row['passed'] / row['total']
        semantic.scatter(minute, value, marker='D', color='#80609b', edgecolor='white',
                         linewidth=1.2, s=65, zorder=5, clip_on=False)
        label = f"{value:g}% ({row['passed']}/{row['total']})"
        semantic.annotate(label, (minute, value),
                          xytext=(5, 24) if minute == 30 else (-5, 14),
                          textcoords='offset points', ha='left' if minute == 30 else 'right',
                          fontsize=9 if mobile else 11, color='#694986', weight='bold')
    ax.annotate(f'{y30:.2f} cm', (30, y30), xytext=(7, -24),
                textcoords='offset points', color='#21665d', fontsize=9 if mobile else 11)
    ax.annotate(f'{y[-1]:.2f} cm', (120, y[-1]), xytext=(-5, -20),
                textcoords='offset points', ha='right', color='#21665d', fontsize=9 if mobile else 11)
    ax.text(30, 58, '30 min', ha='center', va='top', fontsize=9, color='#6e7169',
            bbox={'facecolor': '#faf9f6', 'edgecolor': 'none', 'pad': 2})
    fig.text(.07 if mobile else .09, .95, 'Codex refinement', fontsize=14 if mobile else 18,
             weight='bold', color='#242620')
    handles = [Line2D([0], [0], color='#287b70', lw=2.3, label='Object tracking'),
               Line2D([0], [0], marker='D', color='#80609b', lw=0,
                      label='Semantic success')]
    fig.legend(handles=handles, loc='upper left', bbox_to_anchor=(.055 if mobile else .08, .91),
               frameon=False, fontsize=8.5 if mobile else 10, ncol=1)
    name = 'codex-refinement-time' + ('-mobile' if mobile else '')
    fig.savefig(OUT / f'{name}.svg', metadata={'Date': None})
    plt.close(fig)
