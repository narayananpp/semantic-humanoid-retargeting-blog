/* The selected agent’s evidence-backed refinement sequence. Copy and metrics live in walkthrough.json. */
(() => {
  const root = document.querySelector('[data-refinement-walkthrough]');
  if (!root) return;
  const get = name => root.querySelector(`[data-walkthrough-${name}]`);
  const video = get('video');
  const mediaEnabled = document.documentElement.dataset.media !== 'off';
  const svg = get('curve');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  const element = (name, attrs, text) => {
    const el = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text != null) el.textContent = text;
    return el;
  };
  let index = 0, touring = false, data, marker, cursor, progress, animation;
  const x = t => 52 + t / 30 * 345;
  let yMax = 20;
  const y = error => 230 - error / yMax * 192;
  const path = trials => {
    let best = Infinity;
    return trials.map((trial, i) => {
      best = Math.min(best, trial.add_cm);
      return `${i ? 'H' : 'M'}${x(trial.time_min)}${i ? 'V' : ','}${y(best)}`;
    }).join(' ');
  };
  function draw() {
    svg.replaceChildren();
    svg.append(element('title', {}, 'Refinement by the ensemble’s selected agent'));
    yMax = Math.max(20, Math.ceil(Math.max(...data.trials.map(t => t.add_cm)) / 20) * 20);
    Array.from({length: 6}, (_, i) => i * yMax / 5).forEach(value => {
      svg.append(element('line', {x1:52,y1:y(value),x2:397,y2:y(value),class:'walkthrough-grid'}));
      svg.append(element('text', {x:42,y:y(value)+4,'text-anchor':'end'}, value));
    });
    [0, 5, 10, 15, 20, 25, 30].forEach(value => svg.append(element('text', {x:x(value),y:251,'text-anchor':'middle'},value)));
    svg.append(element('text', {x:224,y:279,'text-anchor':'middle'}, 'Refinement time (min)'));
    svg.append(element('text', {x:52,y:19}, 'Mean ADD (cm)'));
    svg.append(element('path', {d:path(data.trials),class:'walkthrough-curve-context'}));
    progress = element('path', {class:'walkthrough-curve-progress'}); svg.append(progress);
    data.trials.forEach(trial => {
      const dot = element('circle', {cx:x(trial.time_min),cy:y(trial.add_cm),r:4,class:'walkthrough-trial'});
      dot.append(element('title', {}, `${trial.time_min.toFixed(1)} min · ${trial.add_cm.toFixed(2)} cm`));
      svg.append(dot);
    });
    cursor = element('line', {y1:38,y2:230,class:'walkthrough-cursor'});svg.append(cursor);
    marker = element('circle', {r:7,class:'walkthrough-current'});svg.append(marker);
    const tabs = root.querySelector('.walkthrough-stage-tabs');
    tabs.replaceChildren();
    tabs.style.setProperty('--stage-count',data.stages.length);
    data.stages.forEach((stage, i) => {
      const button = document.createElement('button');button.type='button';
      const thumbnail = document.createElement('img');
      thumbnail.src = stage.poster; thumbnail.alt = ''; thumbnail.loading = 'lazy';
      const label = document.createElement('span'); label.textContent = `${i+1}. ${stage.title}`;
      button.append(thumbnail, label);
      button.addEventListener('click', () => {stopTour();select(i);});
      tabs.append(button);
    });
  }
  function moveMarker(stage, animate) {
    cancelAnimationFrame(animation);
    const startX = Number(marker.getAttribute('cx') || x(stage.time_min));
    const startY = Number(marker.getAttribute('cy') || y(stage.add_cm));
    const start = performance.now();
    function frame(now) {
      const t = animate && !reduced.matches ? Math.min((now-start)/450,1) : 1;
      const ease = 1-Math.pow(1-t,3), px=startX+(x(stage.time_min)-startX)*ease;
      // The selected execution can differ from the numerical best-so-far.
      const py = startY + (y(stage.add_cm)-startY)*ease;
      marker.setAttribute('cx',px);marker.setAttribute('cy',py);
      cursor.setAttribute('x1',px);cursor.setAttribute('x2',px);
      if(t<1) animation=requestAnimationFrame(frame);
    }
    frame(start);
  }
  function select(i, play=false) {
    index=Math.max(0,Math.min(i,data.stages.length-1));const stage=data.stages[index];
    get('still').src=stage.poster;get('still').alt=stage.title;video.poster=stage.poster;
    video.pause();if(mediaEnabled) video.src=stage.video;video.setAttribute('aria-label',stage.title+': executed motion');if(mediaEnabled) video.load();
    get('step').textContent=`${index+1} / ${data.stages.length}`;
    get('title').textContent=stage.title;get('value').textContent=`${stage.add_cm.toFixed(2)} cm`;
    get('time').textContent=`${stage.time_min.toFixed(1)} min of refinement`;
    svg.setAttribute('aria-label', `Recorded refinement curve. Selected stage: ${stage.time_min.toFixed(1)} minutes, mean ADD ${stage.add_cm.toFixed(2)} centimetres.`);
    get('quote').textContent='“'+stage.quote+'”';get('description').textContent=stage.description;
    const tag=get('tag');tag.href='#'+stage.anchor;tag.textContent=stage.tag+' ↗';
    root.querySelectorAll('.walkthrough-stage-tabs button').forEach((b,j)=>b.setAttribute('aria-pressed',String(index===j)));
    get('prev').disabled=index===0;get('next').disabled=index===data.stages.length-1;
    progress.setAttribute('d',path(data.trials.filter(trial=>trial.time_min<=stage.time_min+1e-6)));
    moveMarker(stage,true);root.querySelector('.walkthrough-error').hidden=true;
    if(play && mediaEnabled) video.play().catch(stopTour);
  }
  function stopTour() {touring=false;get('tour').textContent='Play walkthrough';get('tour').setAttribute('aria-pressed','false');}
  get('prev').addEventListener('click',()=>{stopTour();select(index-1);});
  get('next').addEventListener('click',()=>{stopTour();select(index+1);});
  if(!mediaEnabled) get('tour').hidden=true;
  get('tour').addEventListener('click',()=>{
    if(touring){stopTour();video.pause();return;}
    touring=true;get('tour').textContent='Pause walkthrough';get('tour').setAttribute('aria-pressed','true');
    select(index===data.stages.length-1?0:index,true);
  });
  video.addEventListener('ended',()=>{if(touring){if(index<data.stages.length-1)select(index+1,true);else stopTour();}});
  video.addEventListener('error',()=>{stopTour();const e=root.querySelector('.walkthrough-error');e.textContent='This video is unavailable in this preview.';e.hidden=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){video.pause();stopTour();}});
  fetch('walkthrough.json?v=refinement-process-1').then(response=>{if(!response.ok)throw new Error(response.status);return response.json();})
    .then(result=>{data=result;draw();select(0);})
    .catch(()=>{root.querySelector('.walkthrough-error').textContent='The walkthrough data could not be loaded.';root.querySelector('.walkthrough-error').hidden=false;});
})();
