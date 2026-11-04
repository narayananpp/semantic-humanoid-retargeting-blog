/* A recorded single-Codex loop. No inference or simulation runs in the browser. */
(() => {
  const figure = document.querySelector('[data-architecture]');
  if (!figure) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = (name, attrs = {}) => {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
    return node;
  };
  fetch('architecture-trace/trace.json?v=2').then(r => {
    if (!r.ok) throw new Error('Trace unavailable');
    return r.json();
  }).then(build).catch(() => {});

  function build(data) {
    const base = new URL("architecture-trace/trace.json", document.baseURI);
    data.stages.forEach(stage => { for (const key of ["image", "video", "poster", "hand_image"]) if(stage[key]) stage[key] = new URL(stage[key], base).href; });
    const ui = document.createElement('div');
    ui.className = 'refinement-loop-ui';
    ui.innerHTML = `
      <div class="loop-heading"><div><span class="loop-eyebrow">One Codex session</span><h3>Motion refinement through simulation feedback</h3></div><span class="loop-task">Clothes-stand interaction</span></div>
      <div class="loop-toolbar"><div class="loop-trials" role="group" aria-label="Selected recorded trials"></div><div class="loop-playback"><span class="loop-phase" aria-live="polite">Recorded trial</span><button type="button" data-loop-play>▶ Play loop</button></div></div>
      <div class="loop-canvas">
        <svg class="loop-connectors" aria-hidden="true"><defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs><g></g></svg>
        <div class="loop-forward">
          <div class="loop-inputs">
            <div class="loop-input" data-loop-node="human"><h4>Human demonstration <span>SMPL</span></h4><video data-architecture-clip="human" muted loop playsinline preload="none" poster="architecture-media/human.jpg" src="architecture-media/human.mp4" aria-label="Human clothes-stand demonstration"></video></div>
            <div class="loop-retarget">↓ <span>Kinematic retargeting<br><b>HOI-Retarget</b></span></div>
            <div class="loop-input" data-loop-node="initial"><h4>Humanoid reference</h4><video data-architecture-clip="initial" muted loop playsinline preload="none" poster="architecture-media/kinematic.jpg" src="architecture-media/kinematic.mp4" aria-label="Initial kinematic humanoid reference"></video></div>
          </div>
          <div class="loop-agent loop-box" data-loop-node="agent"><h4>Astra</h4></div>
          <div class="loop-reference loop-box" data-loop-node="reference"><h4>References</h4><span class="loop-detail">Body · wrists · fingers</span></div>
          <div class="loop-ik-block loop-box" data-loop-node="ik"><h4>IK</h4><span class="loop-detail">Wrist poses</span></div>
          <div class="loop-targets loop-box" data-loop-node="targets"><h4>Joint targets</h4></div>
          <div class="loop-control loop-box" data-loop-node="control"><div><h4>SONIC</h4></div><div class="loop-joint-control"><h4>Joint impedance</h4></div></div>
          <div class="loop-rollout loop-box" data-loop-node="rollout"><div class="loop-rollout-heading"><h4>MuJoCo rollout</h4><span data-loop-trial></span></div><video data-architecture-clip="rollout" data-loop-rollout muted playsinline controls preload="metadata" aria-label="Recorded single-Codex execution"></video><div class="loop-score"><span>Mean object-tracking error</span><strong data-loop-add></strong></div></div>
        </div>
        <div class="loop-feedback" data-loop-node="feedback">
          <div class="loop-feedback-heading"><h4>Simulation feedback</h4><span data-loop-feedback-context></span></div>
          <div class="loop-feedback-grid">
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Object-tracking error</h5><div class="loop-chart-tabs" role="group" aria-label="Object tracking measurements"><button type="button" data-loop-chart="error" aria-pressed="true">Mean ADD</button><button type="button" data-loop-chart="path" aria-pressed="false">Object path</button></div></div><button type="button" class="loop-chart-button" data-loop-open="object" aria-label="Enlarge object-tracking measurements"><span data-loop-object-chart></span></button><div class="loop-chart-legend" data-loop-object-legend></div></div>
            <div class="loop-evidence loop-query-card"><div class="loop-evidence-heading"><h5 data-loop-query-title></h5><span data-loop-query-phase></span></div><div class="loop-query-values" data-loop-query-values></div><button type="button" class="loop-evidence-link" data-loop-open="query" data-loop-query-source></button></div>
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Inspected images</h5><span data-loop-image-line></span></div><div class="loop-inspections"><button type="button" class="loop-image-button" data-loop-open="image" aria-label="Enlarge the image inspected by the agent"><img data-loop-image alt="" loading="lazy"></button><button type="button" class="loop-hand-button" data-loop-open="image" aria-label="View the original image for this hand-detail crop"><span data-loop-hand></span><small>Hand detail · crop</small></button></div><div class="loop-image-caption" data-loop-image-label></div></div>
          </div>
        </div>
      </div>
      <div class="loop-record"><span class="loop-record-label">Recorded agent log</span><blockquote data-loop-excerpt></blockquote><button type="button" class="loop-evidence-link" data-loop-source></button></div>
      <dialog class="loop-dialog" aria-label="Recorded evidence"><div class="loop-dialog-header"><h4></h4><button type="button" data-loop-close aria-label="Close evidence">✕</button></div><div class="loop-dialog-content"></div></dialog>`;
    const caption = figure.querySelector('figcaption');
    figure.querySelector('.refinement-pipeline').hidden = true;
    figure.insertBefore(ui, caption);
    figure.classList.add('live-loop-figure');
    const $ = s => ui.querySelector(s);
    const rollout = $('[data-loop-rollout]');
    const trialButtons = [];
    const dialog = $('.loop-dialog');
    let current = 0, chartMode = 'error', playing = false, visible = false, timer, phase = 'recorded';
    const colors = {error:'#b35931',target:'#76878a',actual:'#167c77',robot:'#167c77',support:'#ac7628'};
    const phases = ['execute','inspect','revise'];
    const dataBounds = data.stages.flatMap(s => [...s.target_path,...s.actual_path]);
    const bounds = {xmin:Math.min(...dataBounds.map(p=>p[0])),xmax:Math.max(...dataBounds.map(p=>p[0])),ymin:Math.min(...dataBounds.map(p=>p[1])),ymax:Math.max(...dataBounds.map(p=>p[1]))};
    const maxError = Math.ceil(Math.max(...data.history.map(s=>s.add_cm))/25)*25;

    function chart(series, {xmin=0,xmax=1,ymin=0,ymax=1,xlabel='',ylabel='',title=''}) {
      const w=380,h=180,left=48,right=14,top=24,bottom=35;
      const root=svg('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title});
      const titleNode=svg('title'); titleNode.textContent=title;root.append(titleNode);
      const x=v=>left+(v-xmin)/(xmax-xmin||1)*(w-left-right),y=v=>h-bottom-(v-ymin)/(ymax-ymin||1)*(h-top-bottom);
      const label=(tx,ty,t,anchor='middle')=>{const node=svg('text',{x:tx,y:ty,'text-anchor':anchor});node.textContent=t;root.append(node);};
      for(let i=0;i<3;i++) {const value=ymin+(ymax-ymin)*i/2;root.append(svg('path',{d:`M ${left} ${y(value)} H ${w-right}`,class:'loop-gridline'}));label(left-7,y(value)+4,Math.abs(value)<.01?'0':Number(value.toFixed(1)),'end');}
      for(let i=0;i<3;i++){const value=xmin+(xmax-xmin)*i/2;label(x(value),h-bottom+17,Number(value.toFixed(1)));}
      series.forEach(s=>{
        if(s.dots) s.points.forEach(p=>{const dot=svg('circle',{cx:x(p[0]),cy:y(p[1]),r:s.selected?5:2.6,fill:s.color,opacity:s.selected?1:.45,stroke:s.selected?'var(--background)':'none','stroke-width':2});const title=svg('title');title.textContent=`${p[0].toFixed(2)} min · ${p[1].toFixed(2)} cm`;dot.append(title);root.append(dot);});
        else root.append(svg('path',{d:s.points.map((p,i)=>`${i?'L':'M'} ${x(p[0]).toFixed(2)} ${y(p[1]).toFixed(2)}`).join(' '),fill:'none',stroke:s.color,'stroke-width':2.3,'stroke-dasharray':s.dashed?'5 4':'none','stroke-linejoin':'round'}));
      });
      label(left,13,ylabel,'start');label((left+w-right)/2,h-2,xlabel);
      return root;
    }
    function objectChart(stage) {
      if(chartMode==='path') return chart([{points:stage.target_path,color:colors.target,dashed:true},{points:stage.actual_path,color:colors.actual}],{...bounds,xlabel:'Object position X (m)',ylabel:'Object position Y (m)',title:'Target and executed object paths (top view)'});
      let best=Infinity;const steps=[];
      data.history.forEach(t=>{if(Number.isFinite(best))steps.push([t.time_min,best]);best=Math.min(best,t.add_cm);steps.push([t.time_min,best]);});
      steps.push([30,best]);
      return chart([{points:steps,color:colors.actual},{points:data.history.map(t=>[t.time_min,t.add_cm]),color:colors.target,dots:true},{points:[[stage.time_min,stage.add_cm]],color:colors.error,dots:true,selected:true}],{xmax:30,ymax:maxError,xlabel:'Refinement time (min)',ylabel:'Mean ADD (cm)',title:'Mean object-tracking error across the recorded refinement history'});
    }
    function drawCharts(){
      const stage=data.stages[current];
      $('[data-loop-object-chart]').replaceChildren(objectChart(stage));
      $('[data-loop-object-legend]').innerHTML=chartMode==='path'?'<span class="loop-key target">Target</span><span class="loop-key robot">Executed</span>':'<span class="loop-key robot">Best so far</span><span>● Trials</span><span class="loop-selected-key">● Selected</span>';
    }
    data.stages.forEach((stage,index)=>{
      if(stage.id==='025'){const gap=document.createElement('span');gap.textContent='…';gap.className='loop-omitted';$('.loop-trials').append(gap);}
      const button=document.createElement('button');button.type='button';button.textContent=stage.label;button.title=stage.id==='025'?'Iteration 25 · last tested candidate':stage.id==='023'?'Retained result · iteration 23':stage.label;button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{stop();show(index);if(visible)rollout.play().catch(()=>{});});
      $('.loop-trials').append(button);trialButtons.push(button);
    });
    function show(index){
      current=index;const stage=data.stages[index];
      trialButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      rollout.pause();rollout.poster=stage.poster;rollout.src=stage.video;
      $('[data-loop-trial]').textContent=stage.label;
      $('[data-loop-add]').textContent=stage.add_cm.toFixed(2)+' cm';
      const query=stage.queries[0];
      $('[data-loop-query-title]').textContent=query.label;
      $('[data-loop-query-phase]').textContent=query.phase;
      $('[data-loop-query-values]').replaceChildren(...query.values.map(value=>{const item=document.createElement('div');item.textContent=value;return item;}));
      $('[data-loop-query-source]').textContent=`Recorded query · event ${query.line} ↗`;
      $('[data-loop-feedback-context]').textContent=stage.id==='initial'?'Input inspection':stage.id==='023'?'Final verification':`Iteration ${Number(stage.id)}`;
      const hand=$('.loop-hand-button');hand.hidden=!stage.hand_image;
      if(stage.hand_image){const [x,y,w,h]=stage.hand_crop;const crop=$('[data-loop-hand]');crop.style.backgroundImage=`url("${stage.hand_image}")`;crop.style.backgroundSize=`${100/w}% ${100/h}%`;crop.style.backgroundPosition=`${100*x/(1-w)}% ${100*y/(1-h)}%`;}

      $('[data-loop-excerpt]').textContent='“'+stage.quote+'”';
      $('[data-loop-source]').textContent=`Event ${stage.line} ↗`;
      $('[data-loop-image]').src=stage.image;$('[data-loop-image]').alt=stage.image_label;
      $('[data-loop-image-label]').textContent=stage.image_label;
      $('[data-loop-image-line]').textContent=`Event ${stage.image_line}`;
      drawCharts();setPhase('recorded');requestAnimationFrame(connect);
    }
    function setPhase(value){
      phase=value;ui.dataset.phase=value;
      $('.loop-phase').textContent={recorded:'Selected recorded trials',revise:'Revise the next candidate',execute:'Execute in simulation',inspect:'Inspect feedback'}[value];
    }
    function stop(){playing=false;clearTimeout(timer);$('[data-loop-play]').textContent='▶ Play loop';ui.classList.remove('loop-playing');setPhase('recorded');}
    function advance(){
      clearTimeout(timer);
      if(!playing||!visible||document.hidden||dialog.open)return;
      const next=phases.indexOf(phase)+1;
      if(current===data.stages.length-1 && next>=2){stop();return;}
      if(next>=phases.length){
        if(current===data.stages.length-1){stop();return;}
        show(current+1);setPhase('execute');
      } else setPhase(phases[Math.max(next,0)]);
      if(phase==='execute'){rollout.currentTime=0;rollout.play().catch(()=>{});}
      const duration=phase==='execute' ? (Number.isFinite(rollout.duration)?rollout.duration*1000:14000):phase==='inspect'?6500:2400;
      timer=setTimeout(advance,duration);
    }
    $('[data-loop-play]').addEventListener('click',()=>{
      if(playing){stop();rollout.pause();return;}
      if(current===data.stages.length-1)show(0);
      playing=true;ui.classList.add('loop-playing');$('[data-loop-play]').textContent='Ⅱ Pause loop';setPhase('recorded');advance();
    });
    ui.querySelectorAll('[data-loop-chart]').forEach(button=>button.addEventListener('click',()=>{
      chartMode=button.dataset.loopChart;ui.querySelectorAll('[data-loop-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawCharts();
    }));
    function openEvidence(kind){
      const stage=data.stages[current],content=$('.loop-dialog-content');content.replaceChildren();
      let title,description;
      if(kind==='image'){title=stage.image_label;const im=new Image();im.src=stage.image;im.alt=title;content.append(im);description=`Original inspected image · event ${stage.image_line}.`;}
      else if(kind==='log'){title=`${stage.label} · recorded agent message`;const quote=document.createElement('blockquote');quote.textContent=stage.full_message;content.append(quote);description=`Original event ${stage.line} · single Codex session.`;}
      else if(kind==='query'){const q=stage.queries[0];title=q.label;const text=document.createElement('p');text.textContent=q.detail;content.append(text);const pre=document.createElement('pre');pre.textContent=q.raw;content.append(pre);description=`${q.phase} · original event ${q.line}`+(q.extra_source?` and ${q.extra_source}`:'')+'.';}
      else{title='Object tracking';content.append(objectChart(stage));description=data.chart_notes[chartMode];}
      const note=document.createElement('p');note.textContent=description;content.append(note);
      const attribution=document.createElement('a');attribution.href='architecture-trace/DATA-NOTICE.txt';attribution.textContent='Sources and attribution';attribution.className='loop-evidence-link';content.append(attribution);
      $('.loop-dialog-header h4').textContent=title;dialog.showModal();clearTimeout(timer);rollout.pause();
    }
    ui.querySelectorAll('[data-loop-open]').forEach(button=>button.addEventListener('click',()=>openEvidence(button.dataset.loopOpen)));
    $('[data-loop-source]').addEventListener('click',()=>openEvidence('log'));
    $('[data-loop-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{if(playing)advance();});

    function connect(){
      const canvas=$('.loop-canvas'),root=$('.loop-connectors'),g=root.querySelector('g'),base=canvas.getBoundingClientRect();
      root.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);g.replaceChildren();
      if(innerWidth<1100)return;
      const box=name=>{const r=ui.querySelector(`[data-loop-node="${name}"]`).getBoundingClientRect();return {l:r.left-base.left,r:r.right-base.left,t:r.top-base.top,b:r.bottom-base.top,x:r.left-base.left+r.width/2,y:r.top-base.top+r.height/2};};
      function path(d,kind){g.append(svg('path',{d,class:`loop-edge ${kind}`,'marker-end':'url(#loop-arrow)'}));}
      function join(from,to,kind='forward',offset=0) {const a=box(from),b=box(to),mid=(a.r+b.l)/2;path(`M ${a.r+2} ${a.y} H ${mid} V ${b.y+offset} H ${b.l-5}`,kind);}
      join('human','agent','forward',-12);join('initial','agent','forward',12);join('agent','reference');join('reference','ik');join('ik','targets');join('targets','control');join('control','rollout');
      const ref=box('reference'),targets=box('targets'),via=Math.min(ref.t,targets.t,box('ik').t)-24;
      path(`M ${ref.x} ${ref.t-2} V ${via} H ${targets.x} V ${targets.t-5}`,'forward');
      const bypass=svg('text',{x:(ref.x+targets.x)/2,y:via-6,'text-anchor':'middle'});bypass.textContent='Body + fingers';g.append(bypass);
      const a=box('rollout'),f=box('feedback'),agent=box('agent');
      path(`M ${a.x} ${a.b+3} V ${f.t-5}`,'feedback-out');
      path(`M ${agent.x} ${f.t-3} V ${agent.b+5}`,'feedback-return');
    }
    new ResizeObserver(connect).observe($('.loop-canvas'));
    const inputs=Array.from(ui.querySelectorAll('.loop-input video'));
    new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      if(visible&&!document.hidden){inputs.forEach(v=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)v.play().catch(()=>{});});if(playing)advance();}
      else{clearTimeout(timer);[rollout,...inputs].forEach(v=>v.pause());}
    },{threshold:.15}).observe(ui);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);[rollout,...inputs].forEach(v=>v.pause());}else if(visible&&playing)advance();});
    show(0);
  }
})();
