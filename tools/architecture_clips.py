"""Prepare the animated architecture figure from the saved clothes-stand renders.

Reads site/architecture.json and writes the figure without its stills, one clip
and poster per panel, and the clips' entries in media-manifest.json. Each clip
crops a saved render at the still's scale and maps the grey studio backdrop to
white, so the page can multiply it onto the figure's panel colours.
Requires NumPy and ffmpeg.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np

SITE = Path(__file__).resolve().parents[1] / 'site'
# Edge fades as fractions of the clip size: left, right, top, bottom.
FEATHER = (.05, .05, .015, .06)


def ffmpeg(*args, **kwargs):
    return subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True, **kwargs)


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate', '-of', 'json', str(path)],
                         check=True, capture_output=True, text=True).stdout
    stream = json.loads(out)['streams'][0]
    num, den = map(int, stream['r_frame_rate'].split('/'))
    return stream['width'], stream['height'], num / den


def frames(path, size, start=None, end=None, step=1):
    width, height = size
    args = ['-ss', str(start), '-t', str(end - start)] if start is not None else []
    select = ['-vf', f'select=not(mod(n\\,{step}))', '-vsync', '0'] if step > 1 else []
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', *args, '-i', str(path), *select,
                             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    count = width * height * 3
    while chunk := proc.stdout.read(count):
        yield np.frombuffer(chunk, np.uint8).reshape(height, width, 3)
    if proc.wait():
        raise RuntimeError(f'Could not decode {path}')


def backdrop(path, size):
    """Fit the smooth studio backdrop behind the moving robot and object."""
    peak = None
    for frame in frames(path, size, step=2):
        peak = frame if peak is None else np.maximum(peak, frame)
    width, height = size
    ys, xs = np.mgrid[0:height, 0:width]
    x, y = xs / width, ys / height
    terms = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y, x ** 3, x * x * y, x * y * y,
                      y ** 3, x ** 4, y ** 4], -1)
    sample = terms[::8, ::8].reshape(-1, terms.shape[-1])
    fitted = np.empty((height, width, 3), np.float32)
    for channel in range(3):
        values = peak[::8, ::8, channel].reshape(-1).astype(np.float64)
        keep = np.ones(len(values), bool)
        # Shadows and objects that never leave a pixel fall outside the backdrop fit.
        for _ in range(4):
            coef = np.linalg.lstsq(sample[keep], values[keep], rcond=None)[0]
            residual = values - sample @ coef
            keep = np.abs(residual) < max(2.5 * residual[keep].std(), 1.5)
        fitted[..., channel] = terms @ coef
    return fitted


def feather(width, height):
    def ramp(n, a, b):
        t = np.arange(n) + .5
        return np.clip(np.minimum(t / (a * n), (n - t) / (b * n)), 0, 1) ** 2
    left, right, top, bottom = FEATHER
    return (ramp(height, top, bottom)[:, None] * ramp(width, left, right)[None, :])[..., None]


def crop_box(clip):
    x0, y0, x1, y1 = clip['rect']
    width, height = (x1 - x0) / clip['scale'], (y1 - y0) / clip['scale']
    cx, cy = clip['center']
    left, top = round(cx - width / 2), round(cy - height / 2)
    return left, top, left + round(width), top + round(height)


def render(name, clip, cache):
    source = SITE / clip['source']
    width, height, fps = probe(source)
    if source not in cache:
        cache[source] = backdrop(source, (width, height))
    left, top, right, bottom = crop_box(clip)
    pad = max(0, -left, -top, right - width, bottom - height)
    plate = np.pad(cache[source], ((pad, pad), (pad, pad), (0, 0)), constant_values=255)
    plate = plate[top + pad:bottom + pad, left + pad:right + pad]
    fade = feather(right - left, bottom - top)
    x0, y0, x1, y1 = clip['rect']
    # Even sizes for 4:2:0 video that stay sharp on 2x displays at the article's full width.
    out_w, out_h = (round((x1 - x0) * .21) * 2, round((y1 - y0) * .21) * 2)
    output = SITE / clip['src']
    output.parent.mkdir(parents=True, exist_ok=True)
    encoder = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
         '-s', f'{right - left}x{bottom - top}', '-r', f'{fps:g}', '-i', '-',
         '-vf', f'scale={out_w}:{out_h}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high',
         '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
         '-movflags', '+faststart', '-an', str(output)], stdin=subprocess.PIPE)
    last = None
    for frame in frames(source, (width, height), clip['start'], clip['end']):
        padded = np.pad(frame, ((pad, pad), (pad, pad), (0, 0)), constant_values=255)
        view = padded[top + pad:bottom + pad, left + pad:right + pad].astype(np.float32)
        # Lift the backdrop to white while keeping darker robot and object tones.
        lift = np.clip(view / plate, 0, 1) ** 3
        white = np.minimum(view + (258 - plate) * lift, 255)
        last = (255 - (255 - white) * fade).round().astype(np.uint8)
        encoder.stdin.write(last.tobytes())
    encoder.stdin.close()
    if encoder.wait() or last is None:
        raise RuntimeError(f'Could not encode {name}')
    # The poster is the final frame, which the figure holds between plays.
    ffmpeg('-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{right - left}x{bottom - top}', '-i', '-',
           '-vf', f'scale={out_w}:{out_h}:flags=lanczos', '-q:v', '3', str(SITE / clip['poster']),
           input=last.tobytes())
    return output


def base_figure(data):
    """Remove the stills so the clips do not show through their white areas."""
    width, height = data['size']
    still = SITE / data['still']
    image = next(frames(still, (width, height))).copy()
    for clip in data['clips'].values():
        x0, y0, x1, y1 = clip['erase']
        ring = np.concatenate([image[y0 - 4, x0:x1], image[y1 + 4, x0:x1],
                               image[y0:y1, x0 - 4], image[y0:y1, x1 + 4]])
        colours, counts = np.unique(ring, axis=0, return_counts=True)
        image[y0:y1 + 1, x0:x1 + 1] = colours[counts.argmax()]
    ffmpeg('-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{width}x{height}', '-i', '-',
           '-vf', f'scale={width // 2}:{height // 2}:flags=lanczos', '-pred', 'mixed',
           str(SITE / data['base']), input=image.tobytes())


def record(outputs):
    manifest_path = SITE / 'media-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    entries = {item['path']: item for item in manifest}
    for output in outputs:
        path = output.relative_to(SITE).as_posix()
        item = dict(path=path, bytes=output.stat().st_size,
                    sha256=hashlib.sha256(output.read_bytes()).hexdigest())
        if path in entries:
            entries[path].update(item)
        else:
            manifest.append(item)
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('clips', nargs='*', help='Clip names to regenerate; defaults to all')
    args = parser.parse_args()
    data = json.loads((SITE / 'architecture.json').read_text())
    names = args.clips or list(data['clips'])
    unknown = set(names) - set(data['clips'])
    if unknown:
        parser.error(f'Unknown clips: {", ".join(sorted(unknown))}')
    base_figure(data)
    cache = {}
    outputs = [render(name, data['clips'][name], cache) for name in names]
    record(outputs)
    for output in outputs:
        print(f'{output.relative_to(SITE)}: {output.stat().st_size / 1024:.0f} KiB')


if __name__ == '__main__':
    main()
