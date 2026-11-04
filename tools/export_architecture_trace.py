"""Export the single-agent architecture example from verified recorded trials.

Requires the research environment (MuJoCo, NumPy, Pillow, retargeting).
Only measured arrays, selected verbatim excerpts, images and hashes are published.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image
from retargeting.evaluation.metrics.object_path import object_path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export(recording, recovered, renders, final_replay, site):
    output = site / 'architecture-trace'
    output.mkdir(exist_ok=True)
    target = np.load(recording / 'job/inputs/object_target.npz')
    messages = {m['line']: m for m in json.loads((recording / 'messages.json').read_text())}
    trials = {t['id']: t for t in json.loads((recording / 'trials.json').read_text())}
    stages = [
        ('001', 432, 'The first rollout kept the robot upright, but the grasp failed: the hand pushed the stand over instead of lifting it.', 'Adjust palm placement and finger closure', 'inspection/initial_side.png', 'Initial grasp inspected before trial 001', 233),
        ('002', 661, 'The revised grasp lifted the stand briefly and reduced mean ADD to 0.353 m, but it slipped and lost rotational control.', 'Test a second hand to resist rotation', 'trials/002/montage.png', 'Execution images inspected after trial 002', 675),
        ('006', 1035, 'I’m checking the endpoint and testing small feedback corrections to reduce the remaining tracking error.', 'Test object-pose feedback and placement', 'trials/006/montage.png', 'Execution images inspected after trial 006', 1064),
        ('023', 1260, 'The hand loses contact around 10 seconds, and the stand remains independently supported through the 14-second finish.', 'Verify placement and save the reference', 'inspection/final_initial.png', 'Initial pose inspected before final submission', 1268),
    ]
    data = dict(task='Lift, carry and place a clothes stand', method='Single Codex agent', model='GPT-6 Astra',
                protocol='Selected trials from one recorded 30-minute Codex session. Curves are reconstructed from score-verified replays. Images and excerpts are from the original agent trace.',
                source_sha256=digest(recording/'job/call/events.jsonl'),
                chart_notes={'error':'ADD at aligned object poses, in path order. The object target stays fixed.',
                             'path':'Object-center paths in the world XY plane. Height and orientation also contribute to ADD.',
                             'contact':'Recorded object contact forces during execution. Robot contact and floor support are separate measurements.'}, stages=[])
    for ident, line, quote, revision, image, image_label, image_line in stages:
        assert quote in messages[line]['text']
        replay = final_replay if ident == '023' else recording/'replays'/ident
        motion_path = replay/'execution/motion.npz'
        motion = np.load(motion_path)
        metrics, trace = object_path(motion['qpos'][:, -7:], target['poses'], target['object_points'])
        actual = metrics['add_error_m']['mean']*100
        assert abs(actual-trials[ident]['add_cm']) < .001, (ident,actual,trials[ident]['add_cm'])
        src_image = recovered/'job/workspace'/image
        im = Image.open(src_image).convert('RGB'); im.thumbnail((1280, 640)); im.save(output/f'{ident}-inspection.webp',quality=85)
        if ident != '023':
            video = renders/ident/'full/video.mp4'
            assert (video.parent/'video_validation.json').exists()
            shutil.copy2(video,output/f'{ident}.mp4')
            subprocess.run(['ffmpeg','-v','error','-y','-ss','0.2','-i',str(video),'-frames:v','1','-q:v','3',str(output/f'{ident}.jpg')],check=True)
            video_url=f'{ident}.mp4'; poster=f'{ident}.jpg'
        else:
            video_url='../baseline-showcase-media/sub10_clothesstand_002/codex.mp4?v=1d39f02558'
            poster='023.jpg'
            subprocess.run(['ffmpeg','-v','error','-y','-ss','0.2','-i',str(site/'baseline-showcase-media/sub10_clothesstand_002/codex.mp4'),'-frames:v','1','-q:v','3',str(output/poster)],check=True)
        indices=np.arange(len(motion['timestamps']))
        force=lambda name: np.round(motion[name][indices],3).tolist()
        data['stages'].append(dict(id=ident,label='Final' if ident=='023' else f'Trial {ident}',time_min=trials[ident]['time_min'],add_cm=actual,
            quote=quote,full_message=messages[line]['text'].strip(),line=line,revision=revision,video=video_url,poster=poster,
            image=f'{ident}-inspection.webp',image_label=image_label,image_line=image_line,
            measured_add_cm=np.round(trace['add_error_m']*100,4).tolist(),
            target_path=np.round(trace['target_curve'][:,:3],5).tolist(),actual_path=np.round(trace['actual_curve'][:,:3],5).tolist(),
            seconds=np.round(motion['timestamps'][indices],3).tolist(),robot_force=force('object_robot_contact_force_n'),support_force=force('object_scene_contact_force_n'),
            provenance=dict(log_line=line,image_log_line=image_line,image_sha256=digest(src_image),motion_sha256=digest(motion_path),original_add_cm=trials[ident]['add_cm'],replay_difference_cm=actual-trials[ident]['add_cm'])))
    (output/'trace.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    manifest_path=site/'media-manifest.json';manifest=json.loads(manifest_path.read_text())
    for video in output.glob('*.mp4'):
        entry=dict(path=str(video.relative_to(site)),bytes=video.stat().st_size,sha256=digest(video))
        manifest=[e for e in manifest if e['path']!=entry['path']]+[entry]
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print('Exported four score-verified single-agent stages.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('recording','recovered','renders','final-replay','site'): parser.add_argument('--'+name,type=Path,required=True)
    export(**vars(parser.parse_args()))
