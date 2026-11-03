"""Packing and redaction helpers for the public recorded-motion explorer."""
import hashlib
import json
import os
import re
from pathlib import Path
import numpy as np

def read(path):
    return json.loads(path.read_text())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def clean(text):
    text = text or ''
    # Keep filenames and workspace-relative paths useful for following the code.
    text = re.sub(r'/(?:scratch|data\d*|home|tmp)/[^\s\'"<>]*?/job/', 'job/', text)
    text = re.sub(r'/(?:scratch|data\d*|home|tmp)/[^\s\'"<>]*', '[local-path]', text)
    text = re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[account]', text)
    text = re.sub(r'\b[a-zA-Z]+-\d+-\d+\b', '[host]', text)
    user = os.environ.get('USER', '')
    if user:
        text = re.sub(r'\b' + re.escape(user) + r'\b', '[account]', text)
    return text

def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(',', ':'), allow_nan=False))

def export_geometry(bundle, output):
    spec = read(bundle / 'scene.json')
    arrays = np.load(bundle / 'geometry.npz')
    # Render visible meshes, not the simplified collision proxies.
    visual_bodies = {g['body'] for g in spec['geoms'] if g['group'] == 1}
    geoms = [g for g in spec['geoms'] if g['id'] and g['group'] != 3 and not g['static_fixture']
             and not (g['group'] == 0 and g['body'] in visual_bodies)]
    chunks, offset = [], 0
    for geom in geoms:
        gid = geom['id']
        v = np.asarray(arrays[f'geom_{gid}_vertices'], dtype='<f4').reshape(-1)
        f = np.asarray(arrays[f'geom_{gid}_faces'], dtype='<u4').reshape(-1)
        geom['vertices'] = dict(offset=offset, count=len(v))
        chunks.append(v.tobytes()); offset += v.nbytes
        geom['indices'] = dict(offset=offset, count=len(f))
        chunks.append(f.tobytes()); offset += f.nbytes
    (output / 'geometry.bin').write_bytes(b''.join(chunks))
    write(output / 'scene.json', dict(geoms=geoms, units='metres', up_axis='Z'))
    return geoms

def export_motion(bundle, output, name, geoms, contact_path=None):
    spec = read(bundle / 'scene.json')
    for geom in geoms:
        assert spec['geoms'][geom['id']]['body'] == geom['body'], 'Playback geometry differs from the scene'
    arrays = np.load(bundle / 'animation.npz')
    times = arrays['timestamps']
    assert len(times) > 1 and np.all(np.diff(times) > 0)
    ids = [g['id'] for g in geoms]
    # Packed frames: one timestamp followed by each geom's xyz + wxyz.
    poses = np.concatenate([arrays['positions'][:, ids], arrays['quaternions_wxyz'][:, ids]], axis=-1)
    packed = np.column_stack([times, poses.reshape(len(times), -1)]).astype('<f4')
    assert np.isfinite(packed).all()
    (output / f'{name}.bin').write_bytes(packed.tobytes())
    info = dict(file=f'{name}.bin', frames=len(times), stride=packed.shape[1], duration=float(times[-1]),
                source_motion_sha256=read(bundle / 'scene.json')['source_motion_sha256'])
    if contact_path and contact_path.exists():
        with np.load(contact_path) as archive:
            contacts = {key: archive[key] for key in archive.files}
        spec = read(bundle / 'scene.json')
        object_ids = {g['id'] for g in spec['geoms'] if 'source_runtime_object' in g['body']}
        frames = []
        for i in range(len(times)):
            lo, hi = contacts['offsets'][i:i+2]
            points = []
            for j in range(lo, hi):
                a, b = contacts['geom_ids'][j]
                force = float(contacts['wrench_contact'][j, 0])
                if (a in object_ids or b in object_ids) and force > .01:
                    points.append([*contacts['point_world'][j].round(5).tolist(), round(force, 3)])
            frames.append(points)
        write(output / f'{name}-contacts.json', frames)
        info['contacts'] = f'{name}-contacts.json'
    return info
