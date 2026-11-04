"""Render the published final results; intermediate SPIDER runs are separate."""
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assets/analysis/results'
DATA = json.loads((OUT / 'final-comparison.json').read_text())
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 13,
                     'svg.fonttype': 'none', 'svg.hashsalt': 'final-results'})

for dataset, data in DATA.items():
    for metric in ('tracking', 'semantic'):
        fig, ax = plt.subplots(figsize=(8, 3.9), dpi=100)
        fig.patch.set_facecolor('#faf9f6')
        ax.set_facecolor('#faf9f6')
        fig.subplots_adjust(left=.29, right=.80, top=.79, bottom=.20)
        semantic = metric == 'semantic'
        methods = data['methods']
        values = [100*m['passed']/data['total'] if semantic else m['add_cm'] for m in methods]
        ax.barh(range(3), values, height=.45,
                color=['#7a8693', '#be9250', '#287b70'], zorder=3)
        labels = [m['name'].replace(' + ', ' +\n').replace(', ', '\n') for m in methods]
        if not semantic:
            labels = [label + (f"\n(n = {m['tracking_n']})" if m['tracking_n'] != data['total'] else '')
                      for label, m in zip(labels, methods)]
        ax.set_yticks(range(3), labels)
        ax.set_ylim(2.55, -.55)
        ax.set_xlim(0, 100 if semantic else 80)
        ax.set_xticks(range(0, 101 if semantic else 81, 20))
        ax.set_xlabel('Semantic success (%)' if semantic else 'Mean object-tracking error, ADD (cm)', labelpad=12)
        ax.xaxis.label.set_fontsize(11)
        ax.grid(axis='x', color='#d7d8ce', linewidth=.8, zorder=0)
        ax.tick_params(axis='both', length=0, pad=9, labelsize=11, colors='#242620')
        for spine in ax.spines.values():
            spine.set_visible(False)
        for i, (value, m) in enumerate(zip(values, methods)):
            label = f"{value:.0f}%  ({m['passed']}/{data['total']})" if semantic else f'{value:.2f}'
            ax.text(value + 2, i, label, va='center', fontsize=12,
                    color='#242620', fontweight='bold' if i == 2 else 'normal')
            if value == 0:
                ax.plot(0, i, '|', color='#be9250', markersize=16, clip_on=False)
        fig.text(.055, .92, data['label'], fontsize=17, weight='bold', color='#242620')
        fig.text(.945, .92, 'Higher is better' if semantic else 'Lower is better',
                 ha='right', fontsize=11, color='#6e7169')
        fig.savefig(OUT / f'final-{dataset}-{metric}.svg', metadata={'Date': None})
        plt.close(fig)

# A separate layout keeps labels readable on narrow screens.
for dataset, data in DATA.items():
    for metric in ('tracking', 'semantic'):
        semantic = metric == 'semantic'
        fig, ax = plt.subplots(figsize=(3.5, 4.2), dpi=100)
        fig.patch.set_facecolor('#faf9f6')
        ax.set_facecolor('#faf9f6')
        fig.subplots_adjust(left=.07, right=.93, top=.76, bottom=.17)
        methods = data['methods']
        limit = 100 if semantic else 80
        values = [100*m['passed']/data['total'] if semantic else m['add_cm'] for m in methods]
        ax.barh(range(3), values, height=.28, color=['#7a8693', '#be9250', '#287b70'], zorder=3)
        ax.set_ylim(2.45, -.55)
        ax.set_xlim(0, limit)
        ax.set_yticks([])
        ax.set_xticks(range(0, limit+1, 20))
        ax.grid(axis='x', color='#d7d8ce', linewidth=.7, zorder=0)
        ax.tick_params(axis='x', length=0, pad=8, labelsize=10, colors='#242620')
        for spine in ax.spines.values():
            spine.set_visible(False)
        for i, (m, value) in enumerate(zip(methods, values)):
            label = m['name']
            if not semantic and m['tracking_n'] != data['total']:
                label += f" (n = {m['tracking_n']})"
            ax.text(0, i-.26, label, va='bottom', fontsize=10.5, color='#242620')
            val = f"{value:.0f}% ({m['passed']}/{data['total']})" if semantic else f'{value:.2f}'
            ax.text(limit, i-.26, val, ha='right', va='bottom', fontsize=11,
                    fontweight='bold' if i==2 else 'normal', color='#242620')
            if value == 0:
                ax.plot(0, i, '|', color='#be9250', markersize=14, clip_on=False)
        ax.set_xlabel('Semantic success (%)' if semantic else 'Mean ADD (cm)', fontsize=11, labelpad=12)
        fig.text(.07, .94, data['label'], fontsize=15, weight='bold', color='#242620')
        fig.text(.07, .88, 'Higher is better' if semantic else 'Object tracking — lower is better', fontsize=10, color='#6e7169')
        fig.savefig(OUT / f'final-{dataset}-{metric}-mobile.svg', metadata={'Date': None})
        plt.close(fig)
