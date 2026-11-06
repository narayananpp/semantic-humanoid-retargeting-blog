"""Recover input-video timing from identical object poses in saved references."""
import argparse
from pathlib import Path

import numpy as np

from trace_assets import digest, read, write


def export(recording, replays, site):
    source = recording / 'job/inputs/reference.npz'
    original = np.load(source)
    result = dict(source_reference_sha256=digest(source), stages={})
    for stage in read(site / 'architecture-trace/trace.json')['stages']:
        ident = stage['id']
        folder = (recording / 'job/inputs' if ident == 'initial' else
                  replays / 'final-verified' if ident == '023' else
                  replays / 'additional' / ident if ident in ('003', '017') else
                  recording / 'replays' / ident)
        path = folder / 'reference.npz'
        assert digest(path) == stage['reference_visualization']['reference_sha256']
        candidate = np.load(path)
        distances = np.linalg.norm(candidate['qpos'][:, None, -7:] - original['qpos'][None, :, -7:], axis=2)
        indices = distances.argmin(axis=1)
        assert np.max(distances.min(axis=1)) < 1e-10
        assert np.all(np.diff(indices) >= 0)
        times = candidate['timestamps']
        source_times = original['timestamps'][indices]
        slopes = np.diff(source_times) / np.diff(times)
        keep = np.r_[0, np.flatnonzero(np.abs(np.diff(slopes)) > 1e-6) + 1, len(times) - 1]
        knots = np.column_stack((times[keep], source_times[keep]))
        assert np.max(np.abs(np.interp(times, knots[:, 0], knots[:, 1]) - source_times)) < 1e-8
        result['stages'][ident] = dict(reference_sha256=digest(path),
            source_duration_s=float(original['timestamps'][-1]), knots=knots.round(8).tolist())
    write(site / 'architecture-trace/input-timing.json', result)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for name in ('recording', 'replays', 'site'):
        parser.add_argument('--' + name, type=Path, required=True)
    export(**vars(parser.parse_args()))
