"""Export the architecture's exact recording into the interactive trace explorer.

Checks source-event and replay hashes against the published architecture data.
Only visible messages, operation descriptions and inspected images are exported.
"""
import argparse
from datetime import datetime
import os
from pathlib import Path

from PIL import Image

from export_collaborative_trace import operation
from trace_assets import clean, digest, export_geometry, export_motion, read, write


def export(recording, recovered, replays, prepared, site):
    architecture = read(site / 'architecture-trace/trace.json')
    output = site / 'trace-explorer/architecture'
    output.mkdir(parents=True, exist_ok=True)
    event_file = recording / 'job/call/events.jsonl'
    assert digest(event_file) == architecture['source_sha256']
    import json
    entries = [json.loads(line) for line in event_file.read_text().splitlines()]
    start = datetime.fromisoformat(entries[0]['time'])
    minute = lambda stamp: (datetime.fromisoformat(stamp) - start).total_seconds() / 60
    trials = []
    for row in read(recording / 'trials.json'):
        if not row['id'].isdigit():
            continue
        folder = recording / 'job/workspace/trials' / row['id']
        manifest = read(folder / 'manifest.json')
        metrics = read(folder / 'object_score.json')['metrics']
        assert abs(metrics['add_error_m']['mean'] * 100 - row['add_cm']) < 1e-8
        trials.append(dict(id='final' if row['id'] == '023' else row['id'],
                           source_trial=row['id'], time_min=row['time_min'],
                           start_min=minute(manifest['started_at']), add_cm=row['add_cm'],
                           position_cm=metrics['position_error_m']['mean'] * 100,
                           orientation_deg=metrics['rotation_error_deg']['mean'],
                           score=metrics, call_ids=[], source_sha256=digest(folder / 'object_score.json')))
    initial = architecture['stages'][0]
    trials.insert(0, dict(id='initial', source_trial='initial', time_min=0,
                         start_min=0, add_cm=initial['add_cm'], position_cm=None,
                         orientation_deg=None, score={}, call_ids=[]))
    geoms = export_geometry(prepared / 'final', output)
    for stage in architecture['stages']:
        ident = stage['id']
        trial = next(t for t in trials if t['source_trial'] == ident)
        if ident == 'initial':
            bundle = prepared / 'initial'
        elif ident == '023':
            bundle = prepared / 'final'
        elif ident in ('003', '017'):
            bundle = replays / 'additional' / ident / 'bundle'
        else:
            bundle = recording / 'bundles' / ident
        assert read(bundle / 'scene.json')['source_motion_sha256'] == stage['provenance']['motion_sha256']
        trial['motion'] = export_motion(bundle, output, trial['id'], geoms)
        trial['motion']['provenance'] = ('Separate evaluation of the identical input reference.'
                                        if ident == 'initial' else
                                        'Verified replay used by the architecture diagram, with the identical source-motion hash.')
        trial['duration'] = trial['motion']['duration']
        assert abs(trial['add_cm'] - stage['add_cm']) < .001
        video = (site / 'architecture-trace' / stage['video'].split('?')[0]).resolve()
        trial['video'] = os.path.relpath(video, output)
        trial['paths'] = dict(actual_curve=stage['actual_path'], target_curve=stage['target_path'])
        trial['evidence_lines'] = sorted({stage['line'], stage['image_line'],
                                         *(q['line'] for q in stage['queries'])})

    events, starts = [], {}
    for line, entry in enumerate(entries, 1):
        message = entry.get('message', {})
        item = message.get('params', {}).get('item', {})
        kind = item.get('type')
        time = minute(entry['time'])
        if message.get('method') == 'item/started':
            starts[item.get('id')] = time
        if message.get('method') != 'item/completed' or kind not in ('agentMessage', 'commandExecution', 'imageView'):
            continue
        event = dict(id=len(events), line=line, time_min=time,
                     started_min=starts.get(item.get('id'), time))
        if kind == 'agentMessage':
            event.update(kind=kind, text=clean(item.get('text', '')))
        elif kind == 'imageView':
            event.update(kind=kind, title='Inspect an image')
            relative = item.get('path', '').split('/workspace/', 1)[-1]
            for root in (recovered / 'job/workspace', recording / 'job/workspace'):
                source = root / relative
                if source.is_file() and source.resolve().is_relative_to(root.resolve()):
                    dest = output / 'images' / f'{line}.webp'
                    dest.parent.mkdir(exist_ok=True)
                    with Image.open(source) as image:
                        image.thumbnail((1280, 1280))
                        image.convert('RGB').save(dest, quality=85)
                    event.update(image=str(dest.relative_to(output)), source_sha256=digest(source))
                    break
        else:
            linked = [t for t in trials if t['id'] != 'initial' and event['started_min'] <= t['start_min'] <= time]
            title, description = operation(item.get('command', ''), linked)
            event.update(kind='toolAction', title=title, description=description,
                         status='completed' if item.get('exitCode', 0) == 0 else 'failed')
            for trial in linked:
                trial['call_ids'].append(event['id'])
        events.append(event)
    write(output / 'agent-0.json', dict(id=0, selected=True, configuration='Astra with Refinement',
                                       events=events, trials=trials, source_sha256=digest(event_file)))
    write(output / 'index.json', dict(schema=1, selected_agent=0, show_all_trials=True,
          default_trial='initial', initial_label='Initial reference', agents=[dict(id=0, selected=True)],
          exchanges=[], stages=[dict(agent=0, trial='final' if s['id'] == '023' else s['id'],
                                    label=s['label'], time_min=s['time_min'], add_cm=s['add_cm'])
                                for s in architecture['stages']],
          provenance=dict(source_sha256=digest(event_file), architecture='../../architecture-trace/trace.json')))
    print(f'Exported {len(trials)} results, {len(events)} events and {len(architecture["stages"])} matching replays.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for name in ('recording', 'recovered', 'replays', 'prepared', 'site'):
        parser.add_argument('--' + name, type=Path, required=True)
    export(**vars(parser.parse_args()))
