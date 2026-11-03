/* The architecture figure steps through the refinement loop with recorded clothes-stand executions.
   Layout, clips and copy live in architecture.json; tools/architecture_clips.py prepares the media. */
(() => {
  const figure = document.querySelector('[data-architecture]');
  if (!figure || document.documentElement.dataset.media === 'off') return;
  const ns = 'http://www.w3.org/2000/svg';
  const element = (name, attrs) => {
    const el = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  // Without the data the static figure remains.
  fetch('architecture.json?v=1').then(response => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }).then(build).catch(() => {});

  function build(data) {
    const [width, height] = data.size;
    const link = figure.querySelector('.refinement-pipeline');
    const image = link.querySelector('img');
    const layer = document.createElement('div');
    layer.className = 'architecture-layer';
    layer.setAttribute('aria-hidden', 'true');
    const clips = {};
    for (const [name, clip] of Object.entries(data.clips)) {
      const [x0, y0, x1, y1] = clip.rect;
      const video = document.createElement('video');
      video.muted = video.defaultMuted = true;
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.preload = 'none';
      video.poster = clip.poster;
      video.src = clip.src;
      video.dataset.architectureClip = name;
      video.addEventListener('error', restore, {once: true});
      Object.assign(video.style, {left: `${x0 / width * 100}%`, top: `${y0 / height * 100}%`,
        width: `${(x1 - x0) / width * 100}%`, height: `${(y1 - y0) / height * 100}%`});
      clips[name] = video;
      layer.append(video);
    }
    const overlay = element('svg', {viewBox: `0 0 ${width} ${height}`});
    for (const [name, {rect: [x0, y0, x1, y1], rx}] of Object.entries(data.nodes))
      overlay.append(element('rect', {'data-node': name, x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx}));
    for (const [name, {d, color}] of Object.entries(data.edges))
      overlay.append(element('path', {'data-edge': name, d, stroke: color}));
    layer.append(overlay);

    const label = figure.querySelector('figcaption strong')?.textContent.replace(/\.$/, '') || 'the architecture figure';
    const controls = document.createElement('div');
    controls.className = 'architecture-controls';
    controls.innerHTML = `<div class="step-description" aria-atomic="true"><h5></h5><p></p></div>
      <div class="step-controls"><button type="button" data-step="previous" aria-label="Previous step in ${label}">←</button>
      <span class="step-count"></span><button type="button" data-playback></button><button type="button" data-step="next"></button></div>`;
    const description = controls.querySelector('.step-description');
    const playback = controls.querySelector('[data-playback]');
    const next = controls.querySelector('[data-step="next"]');
    const stages = data.stages;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0, playing = !reduced.matches, visible = false, timer;
    const running = () => playing && visible && !document.hidden && layer.isConnected;
    const duration = stage => stage.clips.length
      ? Math.max(...stage.clips.map(name => data.clips[name].end - data.clips[name].start)) * 1000 + 900
      : 3200;

    function show(index, play) {
      current = (index + stages.length) % stages.length;
      const stage = stages[current];
      overlay.querySelectorAll('[data-node]').forEach(el => el.classList.toggle('is-active', stage.nodes.includes(el.dataset.node)));
      overlay.querySelectorAll('[data-edge]').forEach(el => el.classList.toggle('is-active', stage.edges.includes(el.dataset.edge)));
      for (const [name, video] of Object.entries(clips)) {
        if (stage.clips.includes(name)) {
          video.currentTime = 0;
          if (play) video.play().catch(() => {});
          continue;
        }
        video.pause();
        // Skipped clips show their outcome, as the static figure does.
        if (video.readyState && !video.ended) video.currentTime = video.duration;
      }
      controls.querySelector('.step-count').textContent = `${current + 1} / ${stages.length}`;
      description.querySelector('h5').textContent = stage.title;
      description.querySelector('p').textContent = stage.text;
      controls.querySelector('[data-step="previous"]').disabled = current === 0;
      next.textContent = current === stages.length - 1 ? 'Replay steps ↺' : 'Step through →';
      next.setAttribute('aria-label', `${next.textContent} in ${label}`);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (running()) timer = setTimeout(() => show(current + 1, true), duration(stages[current]));
    }
    function update() {
      playback.textContent = playing ? 'Pause' : 'Play';
      playback.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} automatic flow in ${label}`);
      description.setAttribute('aria-live', playing ? 'off' : 'polite');
      figure.classList.toggle('is-playing', running());
      const active = stages[current].clips.map(name => clips[name]);
      if (running()) active.forEach(video => { if (!video.ended) video.play().catch(() => {}); });
      else if (!visible || document.hidden) Object.values(clips).forEach(video => video.pause());
      schedule();
    }
    function restore() {
      clearTimeout(timer);
      layer.remove();
      controls.remove();
      figure.classList.remove('architecture-figure', 'is-playing');
      image.src = data.still;
    }

    playback.addEventListener('click', () => {
      playing = !playing;
      if (!playing) Object.values(clips).forEach(video => video.pause());
      update();
    });
    controls.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
      playing = false;
      update();
      show(button.dataset.step === 'next' ? current + 1 : current - 1, true);
    }));
    reduced.addEventListener('change', () => { playing = !reduced.matches; update(); });
    document.addEventListener('visibilitychange', update);
    // Fetch the short clips before the figure scrolls into view.
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      Object.values(clips).forEach(video => {
        video.preload = 'auto';
        if (video.paused && !video.readyState) video.load();
      });
    }, {rootMargin: '600px 0px'}).observe(figure);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, {threshold: .2}).observe(link);

    image.src = data.base;
    link.append(layer);
    figure.querySelector('figcaption').before(controls);
    figure.classList.add('architecture-figure');
    show(0, false);
    update();
  }
})();
