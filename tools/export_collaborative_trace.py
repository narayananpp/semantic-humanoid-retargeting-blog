"""Export a collaborative recording for the reader-facing trace explorer.

Raw archives stay private. Public data includes messages, named operations,
measured results and inspected images, with source lines and hashes for audit.
No shell commands, generated code, credentials or internal reasoning are exported.
"""
import argparse
from datetime import datetime
import json
import re
from pathlib import Path
import numpy as np
from PIL import Image
from trace_assets import clean, digest, export_geometry, export_motion, read, write

TOOLS = {
    'publish_findings': ('Share findings', 'Sends findings and attached artifacts to all other agents.'),
    'message_peer': ('Message an agent', 'Sends a direct message to another agent.'),
    'read_peer_updates': ('Read agent updates', 'Retrieves messages shared by the other agents.'),
    'list_peers': ('Check collaborators', 'Lists the other agents in this run.'),
}


def operation(command, linked):
    if linked:
        return 'Run physics simulation', 'Executes a candidate motion and controller in MuJoCo and records object-tracking errors.'
    if re.search(r'score_scene_objects|object_path|score.*object|evaluate.*motion', command):
        return 'Evaluate object motion', 'Computes object-tracking measurements from recorded motion.'
    if re.search(r'render|screenshot|savefig|plot\(', command, re.I):
        return 'Prepare a visual inspection', 'Produces views or plots for inspecting the motion.'
    if 'peer_files' in command:
        return 'Inspect shared artifacts', 'Reads or uses artifacts received from another agent.'
    if re.search(r'write_text|write_bytes|cat\s*>|apply_patch|np.save', command):
        return 'Revise motion or control', 'Updates a local motion, controller or analysis file.'
    return 'Workspace operation', 'Runs a recorded operation in the agent’s workspace.'


def export(archive, bundles, initial_result, output):
    output.mkdir(parents=True, exist_ok=True)
    job = archive / 'job'
    selection = read(job / 'selection.json')
    selected = int(selection['selected'].split('/')[-1])
    start = read(job / 'communication/manifest.json')['started_at']
    minute = lambda stamp: (datetime.fromisoformat(stamp).timestamp() - start) / 60
    agents, exchanges = [], []
    for worker in range(4):
        root = job / f'candidates/{worker:02}'
        workspace = root / 'workspace'
        summary = read(root / 'result/summary.json')
        trials, used = [], set()
        for result in summary['intermediate_results']:
            folder = result['rollout'].split('/workspace/', 1)[-1]
            if folder in used or result.get('mean_add_m') is None or result.get('physics_status') != 'complete':
                continue
            used.add(folder)
            path = workspace / folder
            manifest = read(path / 'manifest.json')
            score = read(path / 'object_metrics.json') if (path / 'object_metrics.json').exists() else {}
            trials.append(dict(folder=folder, time_min=minute(manifest['finished_at']), start_min=minute(manifest['started_at']),
                               add_cm=float(result['mean_add_m']) * 100, position_cm=float(result['position_mean_m']) * 100,
                               orientation_deg=float(result['orientation_mean_deg']), duration=float(result['duration_s']),
                               score=score, call_ids=[], source_sha256=digest(path / 'manifest.json')))
        trials.sort(key=lambda t: t['time_min'])
        for index, trial in enumerate(trials, 1):
            trial['id'] = 'final' if trial['folder'] == 'final_replay' else f'{index:03}'
            traces = workspace / trial['folder'] / 'object_traces.npz'
            if traces.exists():
                with np.load(traces) as arrays:
                    if all(k in arrays for k in ('actual_curve', 'target_curve')):
                        trial['paths'] = {k: arrays[k][:, :3].round(5).tolist() for k in ('actual_curve', 'target_curve')}
        events, starts = [], {}
        for line, raw in enumerate((root / 'call/events.jsonl').read_text().splitlines(), 1):
            entry = json.loads(raw); message = entry.get('message', {}); item = message.get('params', {}).get('item', {})
            method, kind = message.get('method'), item.get('type')
            if method == 'item/started':
                starts[item.get('id')] = minute(entry['time'])
            if method != 'item/completed' or kind not in ('agentMessage', 'commandExecution', 'imageView', 'dynamicToolCall'):
                continue
            event = dict(id=len(events), line=line, time_min=minute(entry['time']),
                         started_min=starts.get(item.get('id'), minute(entry['time'])))
            if kind == 'agentMessage':
                event.update(kind=kind, text=clean(item.get('text', '')))
            elif kind == 'commandExecution':
                linked = [t for t in trials if event['started_min'] <= t['start_min'] <= event['time_min']]
                title, description = operation(item.get('command', ''), linked)
                event.update(kind='toolAction', title=title, description=description,
                             status='completed' if item.get('exitCode') == 0 else 'failed', duration_ms=item.get('durationMs'))
                for trial in linked:
                    trial['call_ids'].append(event['id'])
            elif kind == 'imageView':
                event.update(kind=kind, title='Inspect an image')
                path = item.get('path', ''); rel = path.split('/workspace/', 1)[-1]
                source = workspace / rel
                if source.is_file() and source.resolve().is_relative_to(workspace.resolve()):
                    dest = output / 'images' / f'agent-{worker}-{line}.webp'; dest.parent.mkdir(exist_ok=True)
                    with Image.open(source) as image:
                        image.thumbnail((1280, 1280)); image.convert('RGB').save(dest, quality=83)
                    event.update(image=str(dest.relative_to(output)), source_sha256=digest(source))
            else:
                tool = item.get('tool', ''); args = item.get('arguments', {})
                title, description = TOOLS.get(tool, (tool.replace('_', ' ').capitalize(), 'A recorded agent tool call.'))
                event.update(kind='exchange' if tool in ('publish_findings', 'message_peer') else 'toolAction',
                             tool=tool, title=title, description=description, status='completed' if item.get('success') else 'failed')
                if event['kind'] == 'exchange':
                    event.update(text=clean(args.get('message', '')), sender=worker,
                                 recipient=int(args['recipient']) if args.get('recipient') is not None else None,
                                 attachments=[Path(x).name for x in args.get('artifacts', [])])
                    exchanges.append(dict(event, agent=worker))
                elif tool == 'read_peer_updates':
                    for content in item.get('contentItems', []):
                        try: result = json.loads(content.get('text', ''))
                        except (ValueError, TypeError): continue
                        if isinstance(result, dict):
                            event['message_count'] = len(result.get('messages', []))
            events.append(event)
        agents.append(dict(id=worker, selected=worker == selected, configuration='collaborative',
                           events=events, trials=trials, source_sha256=digest(root / 'call/events.jsonl')))

    geoms = export_geometry(bundles / 'final', output)
    initial = read(initial_result)
    init_motion = export_motion(bundles / 'initial', output, 'initial', geoms)
    init_motion['provenance'] = 'Measured execution of the unmodified initial reference with frozen SONIC. Prepared separately from the agent run.'
    metrics = initial['metrics']
    for agent in agents:
        agent['trials'].insert(0, dict(id='initial', folder='', time_min=0, start_min=0,
            add_cm=metrics['add_error_m']['mean'] * 100, position_cm=metrics['position_error_m']['mean'] * 100,
            orientation_deg=metrics['rotation_error_deg']['mean'], duration=init_motion['duration'], score=metrics,
            call_ids=[], source_sha256=digest(initial_result), motion=init_motion))
    stages = [dict(agent=selected, trial='initial', label='Initial reference')]
    for worker, folder in [(0, 'baseline'), (0, 'grasp_cart02'), (0, 'ramp55'), (0, 'gain11final')]:
        trial = next(t for t in agents[worker]['trials'] if t['folder'] == 'trials/' + folder)
        key = f'{worker:02}--{folder}'
        verification = read(bundles.parent / 'replays' / key / 'verification.json')
        assert abs(verification['replayed_add_cm'] - trial['add_cm']) < .01
        trial['motion'] = export_motion(bundles / key, output, key, geoms,
                                      bundles.parent / 'replays' / key / 'execution/contacts.npz')
        trial['motion']['provenance'] = 'Replay of the saved controller and reference, verified against the original mean ADD (within 0.01 cm).'
        stages.append(dict(agent=worker, trial=trial['id'], label=f"Trial {trial['id']}"))
    final = next(t for t in agents[selected]['trials'] if t['id'] == 'final')
    final['motion'] = export_motion(bundles / 'final', output, 'final', geoms)
    final['motion']['provenance'] = 'Original saved final validation motion selected by the collaborative run.'
    stages.append(dict(agent=selected, trial='final', label='Final execution'))
    for agent in agents:
        if agent['id'] == selected: continue
        last = next(t for t in agent['trials'] if t['id'] == 'final')
        last['motion'] = export_motion(bundles / f"final-{agent['id']}", output, f"final-{agent['id']}", geoms)
        last['motion']['provenance'] = 'Original saved final validation motion from this agent.'
    for stage in stages:
        trial = next(t for t in agents[stage['agent']]['trials'] if t['id'] == stage['trial'])
        stage.update(add_cm=trial['add_cm'], time_min=trial['time_min'])
        key = 'initial' if trial['id'] == 'initial' else 'final' if trial['id'] == 'final' else f"{stage['agent']:02}--{Path(trial['folder']).name}"
        if (output / 'videos' / (key + '.mp4')).exists(): trial['video'] = 'videos/' + key + '.mp4'
    for agent in agents:
        write(output / f"agent-{agent['id']}.json", agent)
    write(output / 'index.json', dict(selected_agent=selected, stages=stages,
          exchanges=sorted(exchanges, key=lambda e: e['time_min']),
          agents=[dict(id=a['id'], selected=a['selected'], trials=len(a['trials']), events=len(a['events']), final_add_cm=next(t['add_cm'] for t in a['trials'] if t['id']=='final')) for a in agents],
          protocol='Six replay stages from the selected agent: the initial reference, trials 001 and 004, an improved trial (055), a later regression (090), and the selected final execution. The displayed trials are not consecutive. All four event histories and trial scores remain available. Operation labels are descriptions of recorded calls, not additional agent messages.'))
    print('Exported', len(stages), 'stages,', len(exchanges), 'exchanges,', sum(len(a['events']) for a in agents), 'events')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('archive', 'bundles', 'initial-result', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args(); export(args.archive, args.bundles, args.initial_result, args.output)
