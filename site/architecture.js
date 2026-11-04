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
  fetch('architecture-trace/trace.json?v=1').then(r => {
    if (!r.ok) throw new Error('Trace unavailable');
    return r.json();
  }).then(build).catch(() => {});

  function build(data) {
    const base = new URL("architecture-trace/trace.json", document.baseURI);
    data.stages.forEach(stage => { for (const key of ["image", "video", "poster"]) stage[key] = new URL(stage[key], base).href; });
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
          <div class="loop-agent loop-box" data-loop-node="agent"><span class="loop-eyebrow">LLM agent</span><h4>GPT-6 Astra</h4><p>Writes and revises<br>motion + control code</p><div class="loop-decision"><span>After this trial</span><strong data-loop-revision></strong></div><button class="loop-evidence-link" type="button" data-loop-quote>Read agent log ↗</button></div>
          <div class="loop-reference loop-box" data-loop-node="reference"><span class="loop-eyebrow">Generated references</span><div data-loop-node="body"><h4>Body motion</h4><span class="loop-detail">Whole-body reference</span></div><div class="loop-ik" data-loop-node="ik"><h4>Wrist poses</h4><span class="loop-down">↓</span><strong>Inverse kinematics</strong><span class="loop-detail">Arm joint targets</span></div><div data-loop-node="fingers"><h4>Finger targets</h4></div></div>
          <div class="loop-control loop-box" data-loop-node="control"><span class="loop-eyebrow">Controllers</span><div data-loop-node="sonic"><h4>SONIC</h4><span class="loop-detail">Whole-body policy</span></div><div class="loop-joint-control" data-loop-node="impedance"><h4>Joint impedance</h4><span class="loop-detail">Arms + fingers</span></div><span class="loop-command">Joint commands →</span></div>
          <div class="loop-rollout loop-box" data-loop-node="rollout"><div class="loop-rollout-heading"><h4>MuJoCo rollout</h4><span data-loop-trial></span></div><video data-architecture-clip="rollout" data-loop-rollout muted playsinline controls preload="metadata" aria-label="Recorded single-Codex execution"></video><div class="loop-score"><span>Mean object-tracking error</span><strong data-loop-add></strong></div></div>
        </div>
        <div class="loop-feedback" data-loop-node="feedback">
          <div class="loop-feedback-heading"><h4>Simulation feedback</h4><span>Inspect the execution → revise the next candidate</span></div>
          <div class="loop-feedback-grid">
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Object motion</h5><div class="loop-chart-tabs" role="group" aria-label="Object motion measurements"><button type="button" data-loop-chart="error" aria-pressed="true">Error</button><button type="button" data-loop-chart="path" aria-pressed="false">Path</button></div></div><button type="button" class="loop-chart-button" data-loop-open="object" aria-label="Enlarge object-motion measurements"><span data-loop-object-chart></span></button><div class="loop-chart-legend" data-loop-object-legend></div></div>
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Contact & support</h5></div><button type="button" class="loop-chart-button" data-loop-open="contact" aria-label="Enlarge contact-force measurements"><span data-loop-contact-chart></span></button><div class="loop-chart-legend"><span class="loop-key robot">Robot–object</span><span class="loop-key support">Floor–object</span></div></div>
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Inspected images</h5><span data-loop-image-line></span></div><button type="button" class="loop-image-button" data-loop-open="image" aria-label="Enlarge the image inspected by the agent"><img data-loop-image alt="" loading="lazy"></button><div class="loop-image-caption" data-loop-image-label></div></div>
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
    const maxForce = Math.ceil(Math.max(...data.stages.flatMap(s=>[...s.robot_force,...s.support_force]))/20)*20;
    const maxError = Math.ceil(Math.max(...data.stages.flatMap(s=>s.measured_add_cm))/50)*50;

    function chart(series, {xmin=0,xmax=1,ymin=0,ymax=1,xlabel='',ylabel='',title=''}) {
      const w=380,h=180,left=48,right=14,top=24,bottom=35;
      const root=svg('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title});
      const titleNode=svg('title'); titleNode.textContent=title;root.append(titleNode);
      const x=v=>left+(v-xmin)/(xmax-xmin||1)*(w-left-right),y=v=>h-bottom-(v-ymin)/(ymax-ymin||1)*(h-top-bottom);
      const label=(tx,ty,t,anchor='middle')=>{const node=svg('text',{x:tx,y:ty,'text-anchor':anchor});node.textContent=t;root.append(node);};
      for(let i=0;i<3;i++) {const value=ymin+(ymax-ymin)*i/2;root.append(svg('path',{d:`M ${left} ${y(value)} H ${w-right}`,class:'loop-gridline'}));label(left-7,y(value)+4,Math.abs(value)<.01?'0':Number(value.toFixed(1)),'end');}
      for(let i=0;i<3;i++){const value=xmin+(xmax-xmin)*i/2;label(x(value),h-bottom+17,Number(value.toFixed(1)));}
      series.forEach(s=>root.append(svg('path',{d:s.points.map((p,i)=>`${i?'L':'M'} ${x(p[0]).toFixed(2)} ${y(p[1]).toFixed(2)}`).join(' '),fill:'none',stroke:s.color,'stroke-width':2.3,'stroke-dasharray':s.dashed?'5 4':'none','stroke-linejoin':'round'})));
      label(left,13,ylabel,'start');label((left+w-right)/2,h-2,xlabel);
      return root;
    }
    function objectChart(stage) {
      if(chartMode==='path') return chart([{points:stage.target_path,color:colors.target,dashed:true},{points:stage.actual_path,color:colors.actual}],{...bounds,xlabel:'Object position X (m)',ylabel:'Object position Y (m)',title:'Target and executed object paths (top view)'});
      return chart([{points:stage.measured_add_cm.map((v,i)=>[100*i/(stage.measured_add_cm.length-1),v]),color:colors.error}],{xmax:100,ymax:maxError,xlabel:'Aligned path progress (%)',ylabel:'Object-tracking error (cm)',title:'ADD along the aligned object trajectory'});
    }
    function contactChart(stage) {
      return chart([{points:stage.seconds.map((t,i)=>[t,stage.robot_force[i]]),color:colors.robot},{points:stage.seconds.map((t,i)=>[t,stage.support_force[i]]),color:colors.support}],{xmax:14,ymax:maxForce,xlabel:'Execution time (s)',ylabel:'Contact force (N)',title:'Object contact forces from the recorded rollout'});
    }
    function drawCharts(){
      const stage=data.stages[current];
      $('[data-loop-object-chart]').replaceChildren(objectChart(stage));
      $('[data-loop-contact-chart]').replaceChildren(contactChart(stage));
      $('[data-loop-object-legend]').innerHTML=chartMode==='path'?'<span class="loop-key target">Target</span><span class="loop-key robot">Executed</span>':'ADD · same scale across trials';
    }
    data.stages.forEach((stage,index)=>{
      const button=document.createElement('button');button.type='button';button.textContent=stage.label;button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{stop();show(index);if(visible)rollout.play().catch(()=>{});});
      $('.loop-trials').append(button);trialButtons.push(button);
    });
    function show(index){
      current=index;const stage=data.stages[index];
      trialButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      rollout.pause();rollout.poster=stage.poster;rollout.src=stage.video;
      $('[data-loop-trial]').textContent=stage.label;
      $('[data-loop-add]').textContent=stage.add_cm.toFixed(2)+' cm';
      $('[data-loop-revision]').textContent=stage.revision;
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
      else{title=kind==='object'?'Object motion':'Contact & support';content.append(kind==='object'?objectChart(stage):contactChart(stage));description=data.chart_notes[kind==='object'?chartMode:'contact']+' Curves reconstructed from a replay that matches the saved trial score.';}
      const note=document.createElement('p');note.textContent=description;content.append(note);
      const attribution=document.createElement('a');attribution.href='architecture-trace/DATA-NOTICE.txt';attribution.textContent='Sources and attribution';attribution.className='loop-evidence-link';content.append(attribution);
      $('.loop-dialog-header h4').textContent=title;dialog.showModal();clearTimeout(timer);rollout.pause();
    }
    ui.querySelectorAll('[data-loop-open]').forEach(button=>button.addEventListener('click',()=>openEvidence(button.dataset.loopOpen)));
    $('[data-loop-quote]').addEventListener('click',()=>openEvidence('log'));$('[data-loop-source]').addEventListener('click',()=>openEvidence('log'));
    $('[data-loop-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{if(playing)advance();});

    function connect(){
      const canvas=$('.loop-canvas'),root=$('.loop-connectors'),g=root.querySelector('g'),base=canvas.getBoundingClientRect();
      root.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);g.replaceChildren();
      if(innerWidth<1100)return;
      const box=name=>{const r=ui.querySelector(`[data-loop-node="${name}"]`).getBoundingClientRect();return {l:r.left-base.left,r:r.right-base.left,t:r.top-base.top,b:r.bottom-base.top,x:r.left-base.left+r.width/2,y:r.top-base.top+r.height/2};};
      function path(d,kind){g.append(svg('path',{d,class:`loop-edge ${kind}`,'marker-end':'url(#loop-arrow)'}));}
      function join(from,to,kind='forward',offset=0) {const a=box(from),b=box(to),mid=(a.r+b.l)/2;path(`M ${a.r+2} ${a.y} H ${mid} V ${b.y+offset} H ${b.l-5}`,kind);}
      join('human','agent');join('initial','agent');join('agent','reference');join('body','sonic');join('ik','impedance','forward',-9);join('fingers','impedance','forward',9);join('control','rollout');
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
