"""Export a two-hour-budget recording, without rerunning or reconstructing physics.

Only user-visible agent messages, tool summaries and inspected images are public.
Intermediate trial scores are retained even when their full motions were not saved.
"""
import argparse,json,re
from pathlib import Path
from datetime import datetime
import numpy as np
from PIL import Image
from trace_assets import clean,digest,write,read,export_geometry,export_motion
from export_collaborative_trace import operation

def export(source, rendered, history, output):
    output.mkdir(parents=True,exist_ok=True)
    summary=read(source/'result/summary.json')
    record=next(r for r in read(history)['records'] if r['clip']=='sub10_clothesstand_002')
    event_files=[source/'job/call/events.jsonl',source/'job/resume_001/events.jsonl']
    sessions=[[json.loads(l) for l in f.read_text().splitlines()] for f in event_files]
    stamp=lambda s:datetime.fromisoformat(s).timestamp()
    first_span=(stamp(sessions[0][-1]['time'])-stamp(sessions[0][0]['time']))/60
    resume_start=stamp(sessions[1][0]['time'])
    minute=lambda s:first_span+(stamp(s)-resume_start)/60
    source_trials={r['rollout'].split('/workspace/',1)[-1]:r for r in summary['intermediate_results']}
    trials=[]
    for i,row in enumerate(record['trials'],1):
        folder=row['rollout'];path=source/folder;manifest=read(path/'manifest.json')
        assert abs(minute(manifest['finished_at'])-row['minute'])<.1,(folder,minute(manifest['finished_at']),row['minute'])
        is_final=folder.endswith('/final')
        trial=dict(id='final' if is_final else f'{i:03}',folder=folder,time_min=row['minute'],start_min=minute(manifest['started_at']),add_cm=row['mean_add_cm'],position_cm=row['position_cm'],orientation_deg=row['orientation_deg'],duration=float(source_trials[folder.split('/workspace/',1)[-1]]['duration_s']),score={},call_ids=[],source_sha256=digest(path/'manifest.json'))
        # Saved path-analysis traces, not reconstructed agent views.
        for f in [path/'score_traces.npz',path/'object_traces.npz']:
            if not f.exists():continue
            with np.load(f) as a:
                if all(k in a for k in ('actual_curve','target_curve')):trial['paths']={k:a[k][:,:3].round(5).tolist() for k in ('actual_curve','target_curve')}
        trials.append(trial)
    final=next(t for t in trials if t['id']=='final')
    assert abs(final['add_cm']-summary['metrics']['mean_add_m']*100)<1e-6
    geoms=export_geometry(rendered/'bundle',output)
    final['motion']=export_motion(rendered/'bundle',output,'final',geoms)
    final['motion']['provenance']='Original saved final execution from the two-hour-budget run. Forward kinematics for browser playback; no new physics simulation.'
    final['duration']=final['motion']['duration']
    final['video']='../../results-showcase-media/sub10_clothesstand_002/codex120.mp4?v=05c519502c'
    # Initial reference is explicitly kinematic, with no execution score.
    from retargeting.visualization.blender_export import export as bundle
    init_spec=source/'initial-artifact.json';write(init_spec,dict(kind='kinematic_reference',scene='job/inputs/scene.mjb',motion='job/inputs/reference.npz'))
    init_bundle=source/'initial-bundle'
    if not init_bundle.exists():bundle(init_spec,init_bundle)
    init=dict(id='initial',folder='job/inputs',time_min=0,start_min=0,add_cm=None,position_cm=None,orientation_deg=None,call_ids=[],score={},duration=0)
    init['motion']=export_motion(init_bundle,output,'initial',geoms);init['duration']=init['motion']['duration']
    init['motion']['provenance']='Supplied kinematic reference shown with forward kinematics. This is not a physics execution and has no execution score.'
    trials.insert(0,init)
    events=[]
    for session_idx,(entries,event_file) in enumerate(zip(sessions,event_files)):
        start=stamp(entries[0]['time']);offset=0 if session_idx==0 else first_span;starts={}
        for line,entry in enumerate(entries,1):
            m=entry.get('message',{});item=m.get('params',{}).get('item',{});kind=item.get('type');time=offset+(stamp(entry['time'])-start)/60
            if m.get('method')=='item/started':starts[item.get('id')]=time
            if m.get('method')!='item/completed' or kind not in ['agentMessage','commandExecution','imageView','dynamicToolCall']:continue
            event=dict(id=len(events),line=line,session=session_idx,time_min=time,started_min=starts.get(item.get('id'),time))
            if kind=='agentMessage':event.update(kind=kind,text=clean(item.get('text','')))
            elif kind=='imageView':
                event.update(kind=kind,title='Inspect an image');rel=item.get('path','').split('/workspace/',1)[-1];path=source/'job/workspace'/rel
                if path.is_file() and path.resolve().is_relative_to((source/'job/workspace').resolve()):
                    dest=output/'images'/f'{session_idx}-{line}.webp';dest.parent.mkdir(exist_ok=True)
                    with Image.open(path) as im:im.thumbnail((1280,1280));im.convert('RGB').save(dest,quality=85)
                    event.update(image=str(dest.relative_to(output)),source_sha256=digest(path))
            else:
                linked=[t for t in trials if t['id']!='initial' and event['started_min']<=t['start_min']<=time]
                command=item.get('command','');title,description=operation(command,linked)
                if kind=='dynamicToolCall':title='Call a recorded tool';description='Invokes '+item.get('tool','a task tool')+'.'
                event.update(kind='toolAction',title=title,description=description,status='completed' if item.get('exitCode',0)==0 else 'failed')
                for t in linked:t['call_ids'].append(event['id'])
            events.append(event)
    write(output/'agent-0.json',dict(id=0,selected=True,configuration='Astra with refinement (two-hour budget)',events=events,trials=trials,source_sha256=[digest(f) for f in event_files]))
    featured=[init,trials[1],trials[5],trials[min(20,len(trials)-2)],final]
    write(output/'index.json',dict(schema=1,selected_agent=0,show_all_trials=True,default_trial='final',budget_minutes=120,active_session_minutes=round(first_span+(stamp(sessions[-1][-1]['time'])-resume_start)/60,3),clock='Active session time; the interruption between sessions is excluded.',stages=[dict(agent=0,trial=t['id'],label='Initial reference' if t['id']=='initial' else 'Final execution' if t['id']=='final' else 'Trial '+t['id'],time_min=t['time_min'],add_cm=t['add_cm']) for t in featured],exchanges=[],agents=[dict(id=0,selected=True)],provenance=dict(archive_sha256='dccb5e7fe01129e6a570e39bfd37036f4349bc55bb5b5351816293692d5f08bc',executed_motion_sha256=digest(source/'result/executed_motion.npz')),availability='Initial reference and final execution have 3D playback. Intermediate trials retain scores, messages and inspected images; full intermediate motions were not retained.'))
    print(f'Exported {len(trials)-1} scored trials, {len(events)} events, {sum(e.get("kind")=="imageView" for e in events)} image inspections.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--rendered',type=Path,required=True);p.add_argument('--history',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();export(a.source,a.rendered,a.history,a.output)
