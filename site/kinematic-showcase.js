/* Matched cameras and source-time windows; only the selected task loads. */
(() => {
  const root = document.querySelector('#kinematic-showcase');
  if (!root) return;
  const make = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  fetch('kinematic-showcase.json?v=humotar-names-3', {cache: 'no-cache'}).then(r => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(data => {
    const controls = make('div', 'kinematic-showcase-controls');
    const label = make('label', '', 'Motion ');
    const select = make('select'); select.setAttribute('aria-label', 'Kinematic motion');
    data.clips.forEach((r, i) => {
      const option = make('option', '', `${r.title} · ${r.dataset.toUpperCase()}`);
      option.value = String(i); select.append(option);
    });
    label.append(select); controls.append(label);
    const play = make('button', '', 'Play robot comparison'); play.type = 'button';
    const pause = make('button', '', 'Pause'); pause.type = 'button';
    const restart = make('button', '', 'Restart'); restart.type = 'button';
    controls.append(play, pause, restart);
    const description = make('p', 'kinematic-closeup-description');
    const panels = make('div', 'kinematic-closeup-panels');
    root.prepend(controls, description, panels);
    let videos = [], generation = 0;
    const stop = () => videos.forEach(v => v.pause());
    async function start() {
      const current = generation;
      play.disabled = true;
      try {
        await Promise.all(videos.map(v => v.readyState >= 2 ? Promise.resolve() : new Promise((resolve, reject) => {
          v.addEventListener('loadeddata', resolve, {once: true});
          v.addEventListener('error', reject, {once: true}); v.load();
        })));
        if (current !== generation) return;
        const time = videos[0]?.currentTime || 0;
        videos.forEach(v => {v.currentTime = time;});
        await Promise.all(videos.map(v => v.play()));
      } catch (_) { stop(); description.textContent = 'The comparison could not load. Please try again.'; }
      finally { play.disabled = false; }
    }
    play.addEventListener('click', start);
    pause.addEventListener('click', stop);
    restart.addEventListener('click', () => {stop(); videos.forEach(v => {v.currentTime = 0;});});
    function show(index) {
      generation++; stop(); panels.querySelectorAll('video').forEach(v=>v.pause()); videos = []; panels.replaceChildren(); play.disabled = false;
      const row = data.clips[index];
      description.textContent = `${row.side === 'left' ? 'Left' : 'Right'} hand–object contact · ${row.interval_s[0].toFixed(1)}–${row.interval_s[1].toFixed(1)} s. Same camera and source interval for all three references. Kinematic replay; no physics simulation.`;
      panels.classList.toggle('with-human-reference',row.human?.status==='ready');
      if(row.human?.status==='ready'){
        const panel=make('div','kinematic-closeup-method source-human-reference');
        panel.append(make('h4','','Human reference · SMPL'));
        const v=make('video');Object.assign(v,{src:row.human.video,poster:row.human.poster,controls:true,muted:true,playsInline:true,preload:'none'});
        v.setAttribute('aria-label',row.title+': full human reference');
        if(document.documentElement.dataset.media==='off'){
          const image=make('img');Object.assign(image,{src:row.human.poster,alt:row.title+': human reference'});panel.append(image);
        }else panel.append(v);
        panel.append(make('p','kinematic-closeup-metric','Full source motion; robot panels show the indicated contact interval.'));
        panels.append(panel);
      }
      const best = Math.min(...row.methods.map(m => m.contact_gap_mm));
      for (const m of row.methods) {
        const panel = make('div', 'kinematic-closeup-method');
        panel.append(make('h4', '', m.label));
        if (m.poster) {
          if (document.documentElement.dataset.media === 'off' || m.status !== 'ready') {
            const image = make('img'); Object.assign(image, {src: m.poster, alt: row.title+': '+m.label}); panel.append(image);
          } else if (m.status === 'ready') {
            const v = make('video'); Object.assign(v, {src: m.video, poster: m.poster, muted: true, playsInline: true, controls: true, preload: 'none'});
            v.setAttribute('aria-label', `${row.title}: ${m.label}, contact close-up`);
            v.addEventListener('ended', stop); videos.push(v); panel.append(v);
          }
        }
        if (m.status !== 'ready') panel.append(make('p', 'media-pending', 'Preview frame · video queued'));
        const metric = make('p', 'kinematic-closeup-metric', 'Mean contact gap: ');
        metric.append(make(m.contact_gap_mm === best ? 'strong' : 'span', '', m.contact_gap_mm.toFixed(2)+' mm'));
        panel.append(metric); panels.append(panel);
      }
      if (document.documentElement.dataset.media === 'off') [play,pause,restart].forEach(b => {b.hidden = true;});
    }
    select.addEventListener('change', () => show(Number(select.value)));
    show(0);
  }).catch(e => root.append(make('p', '', `Kinematic comparisons could not load: ${e.message}`)));
})();
