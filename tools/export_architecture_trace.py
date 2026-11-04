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


def export(recording, recovered, renders, final_replay, additional, initial, site):
    output = site / 'architecture-trace'
    output.mkdir(exist_ok=True)
    target = np.load(recording / 'job/inputs/object_target.npz')
    messages = {m['line']: m for m in json.loads((recording / 'messages.json').read_text())}
    trials = {t['id']: t for t in json.loads((recording / 'trials.json').read_text())}
    stages = [
        ('001', 432, 'The first rollout kept the robot upright, but the grasp failed: the hand pushed the stand over instead of lifting it.', 'inspection/initial_side.png', 'Before execution', 233),
        ('002', 661, 'The revised grasp lifted the stand briefly and reduced mean ADD to 0.353 m, but it slipped and lost rotational control.', 'trials/002/montage.png', 'After execution', 675),
        ('003', 917, 'The two-hand initial state now passes the checks: no active penetrations, no joint-limit violations, and the object pose and zero velocity are unchanged.', 'inspection/valid_front.png', 'Before execution', 845),
        ('006', 1035, 'A firmer single-hand grip performed much better: mean ADD is 0.096 m, position error 0.074 m, and orientation error 11.6°.', 'trials/006/montage.png', 'Execution images', 1064),
        ('013', 1142, 'Holding the final body posture reduced mean ADD further to 0.088 m.', 'trials/006/montage.png', 'Earlier inspection · Iter. 6', 1064),
        ('017', 1142, 'Releasing the fingers on a fixed timer destabilized the stand, so I’m testing a placement phase that releases only after floor support, low object velocity, and near-upright orientation are measured.', 'trials/006/montage.png', 'Earlier inspection · Iter. 6', 1064),
        ('023', 1260, 'The hand loses contact around 10 seconds, and the stand remains independently supported through the 14-second finish.', 'inspection/final_initial.png', 'Starting grasp · final execution', 1268),
    ]
    queries = {
        '001': [dict(label='Contact sequence', phase='After execution', line=436, detail='Object poses, finger closure, arm joints and contact forces sampled through the first two seconds.', values=['0.0 N at the sampled times'], raw='0.1 s: f 0.0\n0.3 s: f 0.0\n0.5 s: f 0.0\n0.7 s: f 0.0\n1.0 s: f 0.0\n1.5 s: f 0.0\n2.0 s: f 0.0')],
        '002': [dict(label='Fingertip–object clearances', phase='Before execution', line=477, detail='Geometry-distance checks during the revised grasp fit.', values=['Three fingertip gaps ≈ 0.50 mm', 'No active contacts'], raw='contacts []\ngrasp distances (m): 0.0004997371744308731, 0.0004998794746273444, 0.0004998384408542301')],
        '003': [dict(label='Two-hand pose checks', phase='Before execution', line=839, detail='Contact and joint-limit checks on the proposed two-hand starting pose.', values=['No active contacts', 'No joint-limit violations', 'Object pose unchanged'], raw="contacts: []\nobject_pose_unchanged: True\njoint_limit_violations: []")],
        '006': [dict(label='Floor contact and object velocity', phase='After execution', line=1054, detail='The agent queries floor support and object speed late in the rollout, after inspecting the execution images.', values=['No floor support at the finish', 'Object speed: 5.17 cm/s'], raw='9.75 object scene force 0.0 object speed 0.051710161814914925 angvel 0.06452703808762421')],
        '013': [dict(label='Object-tracking error at the finish', phase='After execution', line=1060, detail='The agent scores its feedback and final-posture experiments, including the error at the endpoint.', values=['Mean ADD: 8.76 cm', 'Final object error: 15.63 cm'], raw='013 0.08757564611159989 0.07007718366119856 11.374478418075288 end 0.15631957989215278')],
        '017': [dict(label='Support and object tilt', phase='After execution', line=1163, detail='The agent queries floor and hand contact, object velocity and final tilt before testing placement changes.', values=['Floor support: 5.10 N', 'Tilt: 1.74° · hand still in contact'], raw='017 tilt 1.74245544262984 floor 5.098968927434467', extra_source=1158)],
        '023': [dict(label='Verify independent support', phase='Final verification', line=1283, detail='End-of-rollout checks of floor support, robot contact and object velocity.', values=['Floor support: 4.91 N', 'Robot contact: 0 N', 'Final object velocity ≈ 0'], raw='object_scene_contact_force_n 4.90499999999997 4.90303274608924 4.942154793077563\nobject_robot_contact_force_n 0.0 0.0 0.0\nfinal object velocity [-1.688e-14 -7.479e-15 2.515e-14 -2.418e-14 -2.260e-14 1.597e-14]')],
    }
    events = [json.loads(line) for line in (recording/'job/call/events.jsonl').read_text().splitlines()]
    # Check the quoted numeric evidence against the original tool output.
    for line, snippets in {90:['-0.036140079959423185','-0.007477653725577847'], 436:['0.1 obj','f 0.0'], 477:['0.0004997371744308731','contacts []'], 839:["'object_pose_unchanged': True","'joint_limit_violations': []"], 1283:['4.90499999999997','object_robot_contact_force_n 0.0 0.0 0.0'], 1287:['0.06584344308261679','0.06720405216782217']}.items():
        output_text=events[line-1]['message']['params']['item']['aggregatedOutput']
        assert all(snippet in output_text for snippet in snippets), line
    data = dict(task='Lift, carry and place a clothes stand', method='Single Codex agent', model='GPT-6 Astra',
                protocol='Recorded iterations from one Codex session. Initial is a separate evaluation of the identical input reference. Final is the selected execution from iteration 23. Query excerpts and images are attributed to their original events.',
                source_sha256=digest(recording/'job/call/events.jsonl'),
                history=[{k:t[k] for k in ('id','time_min','add_cm')} for t in trials.values() if t['id'].isdigit()],
                chart_notes={'error':'Mean ADD for every recorded candidate versus refinement time. The line retains the lowest error so far; dots include unsuccessful revisions. Initial is a separate evaluation of the identical input reference.',
                             'path':'Object-center paths in the world XY plane. Height and orientation also contribute to ADD.'}, stages=[])
    for ident, line, quote, image, image_label, image_line in stages:
        assert quote in messages[line]['text']
        replay = final_replay if ident == '023' else (additional/ident if ident in ('003','017') else recording/'replays'/ident)
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
        sample_indices=np.unique(np.r_[np.arange(0,len(motion['timestamps']),3),len(motion['timestamps'])-1]).astype(int)
        feedback=dict(seconds=np.round(motion['timestamps'][sample_indices],4).tolist(),
            robot_force=np.round(motion['object_robot_contact_force_n'][sample_indices],4).tolist(),
            floor_force=np.round(motion['object_scene_contact_force_n'][sample_indices],4).tolist(),
            speed_cm_s=np.round(np.linalg.norm(motion['qvel'][sample_indices,-6:-3],axis=1)*100,4).tolist(),
            add_cm=np.round(trace['add_error_m']*100,4).tolist(),
            focus={'001':'forces','002':'checks','003':'checks','006':'forces','013':'error','017':'forces','023':'forces'}[ident])
        data['stages'].append(dict(feedback=feedback,id=ident,label='Final' if ident=='023' else f'Iter. {int(ident)}',time_min=trials[ident]['time_min'],add_cm=actual,
            quote=quote,full_message=messages[line]['text'].strip(),line=line,queries=queries[ident],video=video_url,poster=poster,
            image=f'{ident}-inspection.webp',image_label=image_label,image_line=image_line,
            hand_image=None if ident in ('002','006','013','017') else f'{ident}-inspection.webp', hand_crop=[.49,.28,.21,.23] if ident=='001' else ([.38,.33,.22,.24] if ident=='003' else [.52,.32,.16,.20]),
            target_path=np.round(trace['target_curve'][:,:3],5).tolist(),actual_path=np.round(trace['actual_curve'][:,:3],5).tolist(),
            provenance=dict(log_line=line,image_log_line=image_line,image_sha256=digest(src_image),motion_sha256=digest(motion_path),original_add_cm=trials[ident]['add_cm'],replay_difference_cm=actual-trials[ident]['add_cm'])))
    initial_motion = np.load(initial/'rollout/motion.npz')
    initial_metrics, initial_trace = object_path(initial_motion['qpos'][:,-7:],target['poses'],target['object_points'])
    for name in ('reference.npz','initial_state.npz','object_target.npz'):
        original=np.load(recording/'job/inputs'/name); baseline=np.load(initial/name)
        assert set(original.files)==set(baseline.files)
        assert all(np.array_equal(original[k],baseline[k]) for k in original.files)
    initial_score=initial_metrics['add_error_m']['mean']*100
    first=dict(id='initial',label='Initial',time_min=0,add_cm=initial_score,
        video='../trace-explorer/collaborative/videos/initial.mp4',poster='../architecture-media/kinematic.jpg',
        quote=messages[203]['text'].strip(), full_message=messages[203]['text'].strip(),line=203,
        image='001-inspection.webp',image_label='Before the first candidate',image_line=233,
        hand_image='001-inspection.webp',hand_crop=[.49,.28,.21,.23],
        queries=[dict(label='Inspect the input pose',phase='Before refinement',line=90,
            detail='The agent reports the initial geometric checks before running its first candidate. The displayed rollout and ADD are a separate evaluation of the identical input arrays.',
            values=['Foot below floor: ≈ 3.6 cm','Hand–object overlap: ≈ 7.5 mm'],raw='source_floor contact distance (m): -0.036140079959423185\nobject contact distance (m): -0.007477653725577847')],
        target_path=np.round(initial_trace['target_curve'][:,:3],5).tolist(),actual_path=np.round(initial_trace['actual_curve'][:,:3],5).tolist(),
        provenance=dict(motion_sha256=digest(initial/'rollout/motion.npz'), input_arrays_verified_identical=True, separate_initial_evaluation=True))
    idx=np.unique(np.r_[np.arange(0,len(initial_motion['timestamps']),3),len(initial_motion['timestamps'])-1]).astype(int)
    first['feedback']=dict(seconds=np.round(initial_motion['timestamps'][idx],4).tolist(),robot_force=np.round(initial_motion['object_robot_contact_force_n'][idx],4).tolist(),floor_force=np.round(initial_motion['object_scene_contact_force_n'][idx],4).tolist(),speed_cm_s=np.round(np.linalg.norm(initial_motion['qvel'][idx,-6:-3],axis=1)*100,4).tolist(),add_cm=np.round(initial_trace['add_error_m']*100,4).tolist(),focus='checks')
    data['stages'].insert(0,first)
    data['history'].insert(0,dict(id='initial',time_min=0,add_cm=initial_score))
    (output/'trace.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    manifest_path=site/'media-manifest.json';manifest=json.loads(manifest_path.read_text())
    for video in output.glob('*.mp4'):
        entry=dict(path=str(video.relative_to(site)),bytes=video.stat().st_size,sha256=digest(video))
        manifest=[e for e in manifest if e['path']!=entry['path']]+[entry]
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print('Exported eight verified stages with recorded simulation feedback.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('recording','recovered','renders','final-replay','additional','initial','site'): parser.add_argument('--'+name,type=Path,required=True)
    export(**vars(parser.parse_args()))
