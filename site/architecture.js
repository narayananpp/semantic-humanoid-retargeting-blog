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
  fetch('architecture-trace/trace.json?v=7').then(r => {
    if (!r.ok) throw new Error('Trace unavailable');
    return r.json();
  }).then(build).catch(() => {});

  function build(data) {
    const base = new URL("architecture-trace/trace.json", document.baseURI);
    data.stages.forEach(stage => { for (const key of ["image", "video", "poster", "hand_image", "targets_video"]) if(stage[key]) stage[key] = new URL(stage[key], base).href; });
    const ui = document.createElement('div');
    ui.className = 'refinement-loop-ui';
    ui.innerHTML = `
      <div class="loop-heading"><div><span class="loop-eyebrow">Astra with refinement</span><h3>Motion refinement through simulation feedback</h3></div><span class="loop-task">Clothes-stand interaction</span></div>
      <div class="loop-toolbar"><div class="loop-trials" role="group" aria-label="Selected recorded trials"></div><div class="loop-playback"><span class="loop-phase" aria-live="polite">Recorded trial</span><button type="button" data-loop-play>▶ Play loop</button></div></div>
      <div class="loop-canvas">
        <svg class="loop-connectors" aria-hidden="true"><defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs><g></g></svg>
        <div class="loop-forward">
          <div class="loop-inputs">
            <div class="loop-input" data-loop-node="human"><h4>Human demonstration <span>SMPL</span></h4><video data-architecture-clip="human" muted autoplay loop playsinline preload="none" poster="architecture-media/human.jpg" src="architecture-media/human.mp4" aria-label="Human clothes-stand demonstration"></video></div>
            <div class="loop-retarget">↓ <span>Kinematic retargeting<br><b>HOI-Retarget</b></span></div>
            <div class="loop-input" data-loop-node="initial"><h4>Humanoid Kinematic reference</h4><video data-architecture-clip="initial" muted autoplay loop playsinline preload="none" poster="architecture-media/kinematic.jpg" src="architecture-media/kinematic.mp4" aria-label="Initial kinematic humanoid reference"></video></div>
          </div>
          <div class="loop-agent loop-box" data-loop-node="agent"><h4>Astra</h4></div>
          <div class="loop-record" data-loop-node="record"><blockquote id="architecture-agent-excerpt" data-loop-excerpt></blockquote><button type="button" class="loop-record-toggle" aria-expanded="false" aria-controls="architecture-agent-excerpt">Read more</button></div>
          <div class="loop-reference loop-arrow-label" data-loop-node="reference"><h4>End-effector references</h4></div>
          <div class="loop-ik-block loop-box" data-loop-node="ik"><h4>IK</h4></div>
          <div class="loop-targets loop-arrow-label" data-loop-node="targets"><div class="loop-target-preview"><video data-architecture-clip="targets" data-loop-targets-video muted autoplay loop playsinline preload="metadata" aria-label="Planned wrist targets over the G1 reference motion"></video><span class="loop-target-key" title="Colored arms show reference joint poses; gold markers show planned wrist targets.">Arm reference <i></i> Wrist targets</span><h4>Joint-space reference</h4></div></div>
          <div class="loop-control loop-box" data-loop-node="control"><h4 class="loop-control-title">Control</h4><h4>Whole-body controller<br>(e.g. SONIC)</h4></div>
          <div class="loop-rollout loop-box" data-loop-node="rollout"><div class="loop-rollout-heading"><h4>MuJoCo rollout</h4><span data-loop-trial></span></div><video data-architecture-clip="rollout" data-loop-rollout muted autoplay loop playsinline controls preload="metadata" aria-label="Recorded Astra execution"></video><div class="loop-score"><span>Mean object-tracking error</span><strong data-loop-add></strong></div></div>
        </div>
        <div class="loop-bottom">
        <div class="loop-feedback" data-loop-node="feedback">
          <div class="loop-feedback-heading"><h4>Simulation feedback</h4></div>
          <div class="loop-feedback-grid">
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Object-tracking error</h5><div class="loop-chart-tabs" role="group" aria-label="Object tracking measurements"><button type="button" data-loop-chart="error" aria-pressed="true">Mean ADD</button><button type="button" data-loop-chart="path" aria-pressed="false">3D object path</button></div></div><button type="button" class="loop-chart-button" data-loop-open="object" aria-label="Enlarge object-tracking measurements"><span data-loop-object-chart></span></button><div class="loop-chart-legend" data-loop-object-legend></div></div>
            <div class="loop-evidence loop-query-card"><div class="loop-evidence-heading"><h5>Execution feedback</h5><div class="loop-feedback-tabs" role="group" aria-label="Simulation measurements"><button type="button" data-feedback="forces">Contact forces</button><button type="button" data-feedback="speed">Object speed</button><button type="button" data-feedback="checks">Grasp checks</button><button type="button" data-feedback="error">Object error</button></div></div><button type="button" class="loop-chart-button" data-loop-open="feedback" aria-label="Enlarge the simulation measurements"><span data-loop-feedback-chart></span></button><div class="loop-feedback-legend" data-loop-feedback-legend></div></div>
            <div class="loop-evidence"><div class="loop-evidence-heading"><h5>Image feedback</h5></div><div class="loop-inspections"><button type="button" class="loop-image-button" data-loop-open="image" aria-label="Enlarge the image inspected by the agent"><img data-loop-image alt="" loading="lazy"></button><button type="button" class="loop-hand-button" data-loop-open="image" aria-label="View the original image for this hand-detail crop"><span data-loop-hand></span></button></div></div>
          </div>
          <div class="loop-query-summary"><span class="loop-query-tag">What the agent checked</span><strong data-loop-query-title></strong><span data-loop-query-values></span></div>
        </div>
        </div>
      </div>
      <dialog class="loop-dialog" aria-label="Recorded evidence"><div class="loop-dialog-header"><h4></h4><button type="button" data-loop-close aria-label="Close evidence">✕</button></div><div class="loop-dialog-content"></div></dialog>`;
    const caption = figure.querySelector('figcaption');
    figure.querySelector('.refinement-pipeline').hidden = true;
    figure.insertBefore(ui, caption);
    figure.classList.add('live-loop-figure');
    const $ = s => ui.querySelector(s);
    const rollout = $('[data-loop-rollout]');
    const trialButtons = [];
    const dialog = $('.loop-dialog');
    let yaw=-.65, pitch=.5;
    let current = 0, feedbackMode='checks', chartMode = 'error', playing = false, visible = false, timer, phase = 'recorded';
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
        if(s.dots) s.points.forEach(p=>{const dot=svg('circle',{cx:x(p[0]),cy:y(p[1]),r:s.selected?5:2.6,fill:s.color,opacity:s.selected?1:.45,stroke:s.selected?'var(--background)':'none','stroke-width':2});const title=svg('title');title.textContent=`${p[0].toFixed(2)} min, ${p[1].toFixed(2)} cm`;dot.append(title);root.append(dot);});
        else root.append(svg('path',{d:s.points.map((p,i)=>`${i?'L':'M'} ${x(p[0]).toFixed(2)} ${y(p[1]).toFixed(2)}`).join(' '),fill:'none',stroke:s.color,'stroke-width':2.3,'stroke-dasharray':s.dashed?'5 4':'none','stroke-linejoin':'round'}));
      });
      label(left,13,ylabel,'start');label((left+w-right)/2,h-2,xlabel);
      return root;
    }
    function path3D(stage) {
      const root=svg('svg',{viewBox:'0 0 380 210',role:'img',tabindex:'0','aria-label':'3D object paths. Drag or use arrow keys to rotate. X, Y and Z in metres.',class:'loop-path3d'});
      const points=[...stage.target_path,...stage.actual_path],lo=[0,1,2].map(a=>Math.min(...points.map(p=>p[a]))),hi=[0,1,2].map(a=>Math.max(...points.map(p=>p[a]))),center=lo.map((v,i)=>(v+hi[i])/2);
      let dragged=false;
      function draw(){
        root.replaceChildren();
        const rotate=p=>{const [x,y,z]=p.map((v,i)=>v-center[i]),u=Math.cos(yaw)*x-Math.sin(yaw)*y,v=Math.sin(yaw)*x+Math.cos(yaw)*y;return [u,Math.sin(pitch)*v-Math.cos(pitch)*z];};
        const corners=[];for(let i=0;i<8;i++)corners.push([0,1,2].map(a=>(i>>a)&1?hi[a]:lo[a]));
        const projected=corners.map(rotate),xmin=Math.min(...projected.map(p=>p[0])),xmax=Math.max(...projected.map(p=>p[0])),ymin=Math.min(...projected.map(p=>p[1])),ymax=Math.max(...projected.map(p=>p[1])),fit=Math.min(265/(xmax-xmin||1),132/(ymax-ymin||1));
        const project=p=>{const q=rotate(p);return [180+(q[0]-(xmin+xmax)/2)*fit,100+(q[1]-(ymin+ymax)/2)*fit];};
        const line=(a,b,color,dashed=false)=>{const p=project(a),q=project(b);root.append(svg('path',{d:`M${p}L${q}`,fill:'none',stroke:color,'stroke-width':1,'stroke-dasharray':dashed?'3 3':'none'}));};
        for(let i=0;i<=4;i++){
          const x=lo[0]+(hi[0]-lo[0])*i/4,y=lo[1]+(hi[1]-lo[1])*i/4;
          line([x,lo[1],lo[2]],[x,hi[1],lo[2]],'#cdd4d0');line([lo[0],y,lo[2]],[hi[0],y,lo[2]],'#cdd4d0');
        }
        for(let a=0;a<3;a++){const tip=[...lo];tip[a]=hi[a];line(lo,tip,'#8c9695');const p=project(tip),text=svg('text',{x:p[0]+(a===0?8:a===1?-8:0),y:p[1]+(a===1?17:-9),'text-anchor':a===0?'start':a===1?'end':'middle'});text.textContent=`${['X','Y','Z'][a]} (m)`;const title=svg('title');title.textContent=`${lo[a].toFixed(2)} to ${hi[a].toFixed(2)} metres`;text.append(title);root.append(text);}
        for(const [path,color,dashed] of [[stage.target_path,colors.target,true],[stage.actual_path,colors.actual,false]]){
          root.append(svg('path',{d:path.map((p,i)=>`${i?'L':'M'}${project(p)}`).join(' '),fill:'none',stroke:color,'stroke-width':2.5,'stroke-dasharray':dashed?'5 3':'none'}));
          for(const [i,r] of [[0,3],[path.length-1,5]]){const p=project(path[i]);root.append(svg('circle',{cx:p[0],cy:p[1],r,fill:color}));}
        }
        const hint=svg('text',{x:370,y:202,'text-anchor':'end'});hint.textContent='Drag to rotate';root.append(hint);
      }
      root.addEventListener('pointerdown',event=>{const x=event.clientX,y=event.clientY,oldYaw=yaw,oldPitch=pitch;dragged=false;root.setPointerCapture(event.pointerId);root.onpointermove=e=>{if(Math.abs(e.clientX-x)+Math.abs(e.clientY-y)>4)dragged=true;yaw=oldYaw+(e.clientX-x)*.012;pitch=Math.max(-1.4,Math.min(1.4,oldPitch+(e.clientY-y)*.01));draw();};root.onpointerup=root.onpointercancel=()=>{root.onpointermove=null;};});
      root.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();}});
      root.addEventListener('keydown',event=>{if(!event.key.startsWith('Arrow'))return;event.preventDefault();if(event.key==='ArrowLeft')yaw-=.15;if(event.key==='ArrowRight')yaw+=.15;if(event.key==='ArrowUp')pitch-=.1;if(event.key==='ArrowDown')pitch+=.1;draw();});
      draw();return root;
    }
    function objectChart(stage) {
      if(chartMode==='path') return path3D(stage);
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
    function feedbackChart(stage) {
      const f=stage.feedback;
      if(feedbackMode==='checks') {
        const root=svg('svg',{viewBox:'0 0 380 180',role:'img','aria-label':'Recorded grasp and starting-pose checks'});
        const rows=stage.id==='initial'?[['Foot below floor','36.1 mm',true],['Hand–object overlap','7.5 mm',true]]:stage.id==='002'?[['Thumb clearance','0.50 mm',false],['Middle-finger clearance','0.50 mm',false],['Index-finger clearance','0.50 mm',false]]:stage.id==='003'?[['Active contacts','None',false],['Joint-limit violations','None',false],['Object starting pose','Unchanged',false]]:[];
        if(!rows.length){const text=svg('text',{x:190,y:85,'text-anchor':'middle'});text.textContent='No new grasp check at this stage';root.append(text);return root;}
        rows.forEach(([label,value,warning],i)=>{const y=40+i*46;root.append(svg('rect',{x:18,y:y-18,width:344,height:35,rx:5,fill:warning?'#b3593114':'#167c7710'}));const dot=svg('circle',{cx:32,cy:y,r:4,fill:warning?colors.error:colors.actual});root.append(dot);for(const [x,t,anchor] of [[46,label,'start'],[346,value,'end']]){const text=svg('text',{x,y:y+4,'text-anchor':anchor});text.textContent=t;root.append(text);}});
        return root;
      }
      if(feedbackMode==='error') return chart([{points:f.add_cm.map((v,i)=>[100*i/(f.add_cm.length-1),v]),color:colors.error}],{xmax:100,ymax:Math.max(5,Math.ceil(Math.max(...f.add_cm)/5)*5),xlabel:'Aligned object path (%)',ylabel:'Object-pose error, ADD (cm)',title:'Distances between matching object points along aligned paths. 0% is the start and 100% is the end of each path, not task success. Human and robot timing need not match.'});
      if(feedbackMode==='speed') return chart([{points:f.seconds.map((t,i)=>[t,f.speed_cm_s[i]]),color:colors.actual}],{xmax:f.seconds.at(-1),ymax:Math.max(5,Math.ceil(Math.max(...f.speed_cm_s)/5)*5),xlabel:'Execution time (s)',ylabel:'Object speed (cm/s)',title:'Recorded object speed during execution'});
      return chart([{points:f.seconds.map((t,i)=>[t,f.robot_force[i]]),color:colors.actual},{points:f.seconds.map((t,i)=>[t,f.floor_force[i]]),color:colors.support}],{xmax:f.seconds.at(-1),ymax:Math.max(10,Math.ceil(Math.max(...f.robot_force,...f.floor_force)/10)*10),xlabel:'Execution time (s)',ylabel:'Contact force (N)',title:'Robot–object and floor–object contact forces'});
    }
    function drawFeedback(){
      $('[data-loop-feedback-chart]').replaceChildren(feedbackChart(data.stages[current]));
      ui.querySelectorAll('[data-feedback]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.feedback===feedbackMode));b.hidden=b.dataset.feedback==='checks'&&!['initial','002','003'].includes(data.stages[current].id);});
      $('[data-loop-feedback-legend]').innerHTML=feedbackMode==='forces'?'<span class="loop-key robot">Robot–object</span><span class="loop-key support">Floor–object</span>':feedbackMode==='checks'?'Starting-pose measurements':'Recorded rollout measurements';
    }
    ui.querySelectorAll('[data-feedback]').forEach(b=>b.addEventListener('click',()=>{feedbackMode=b.dataset.feedback;drawFeedback();}));
    data.stages.forEach((stage,index)=>{
      if(index>0 && stage.id!=='023' && Number(stage.id)>Number(data.stages[index-1].id)+1){const gap=document.createElement('span');gap.textContent='…';gap.className='loop-omitted';$('.loop-trials').append(gap);}
      const button=document.createElement('button');button.type='button';button.textContent=stage.label;button.title=stage.id==='023'?'Final execution':stage.label;button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{stop();show(index);});
      $('.loop-trials').append(button);trialButtons.push(button);
    });
    function show(index){
      current=index;const stage=data.stages[index];
      trialButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      rollout.pause();rollout.poster=stage.poster;rollout.src=stage.video;
      const referenceVideo=$('[data-loop-targets-video]');referenceVideo.pause();referenceVideo.src=stage.targets_video;
      $('[data-loop-trial]').textContent=stage.label;
      $('[data-loop-add]').textContent=stage.add_cm.toFixed(2)+' cm';
      const query=stage.queries[0];
      feedbackMode=stage.feedback.focus;
      $('[data-loop-query-title]').textContent=stage.id==='003'?'Two-hand starting pose':query.label;
      const explanations={
        initial:'The starting pose has a foot below the floor and hand–object overlap.',
        '001':'The sampled robot–object contact forces are zero while the fingers close.',
        '002':'The three fingertips start about 0.5 mm from the object surface, with no detected overlap.',
        '003':'The two-hand starting pose has no detected collisions or joint-limit violations. The object remains in its original pose.',
        '006':'At the finish, the floor does not support the stand and the object is still moving.',
        '013':'The object-tracking error at the finish is 15.63 cm, despite a mean ADD of 8.76 cm.',
        '017':'The stand is nearly upright and touches the floor, but the hand is still in contact.',
        '023':'The floor supports the stand, robot contact is zero, and the object has stopped moving.'
      };
      $('[data-loop-query-values]').textContent=explanations[stage.id];
      $('[data-loop-excerpt]').textContent='“'+stage.quote+'”';
      $('.loop-record').classList.remove('is-expanded');$('.loop-record-toggle').setAttribute('aria-expanded','false');$('.loop-record-toggle').textContent='Read more';
      drawInspection();
      drawCharts();drawFeedback();setPhase('recorded');resumeVideos();requestAnimationFrame(connect);
    }
    function drawInspection(){
      const stage=data.stages[current];
      $('[data-loop-image]').src=stage.image;
      $('[data-loop-image]').alt='Original image inspected by the agent';
      const hand=$('.loop-hand-button');hand.hidden=!stage.hand_image;
      if(stage.hand_image){const [x,y,w,h]=stage.hand_crop;const crop=$('[data-loop-hand]');crop.style.backgroundImage=`url("${stage.hand_image}")`;crop.style.backgroundSize=`${100/w}% ${100/h}%`;crop.style.backgroundPosition=`${100*x/(1-w)}% ${100*y/(1-h)}%`;}
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
      if(playing){stop();pauseVideos();return;}
      if(current===data.stages.length-1)show(0);
      playing=true;resumeVideos();ui.classList.add('loop-playing');$('[data-loop-play]').textContent='Ⅱ Pause loop';setPhase('recorded');advance();
    });
    ui.querySelectorAll('[data-loop-chart]').forEach(button=>button.addEventListener('click',()=>{
      chartMode=button.dataset.loopChart;ui.querySelectorAll('[data-loop-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawCharts();
    }));
    function openEvidence(kind){
      const stage=data.stages[current],content=$('.loop-dialog-content');content.replaceChildren();
      let title,description;
      if(kind==='image'){title='Agent-inspected image';const im=new Image();im.src=$('[data-loop-image]').src;im.alt=$('[data-loop-image]').alt;content.append(im);description='';}
      else if(kind==='feedback'){title='Simulation measurements';content.append(feedbackChart(stage));description=feedbackMode==='checks'?'Recorded geometry and pose checks.':'Measurements from a replay verified against the original execution score.';}
      else{title='Object tracking';content.append(objectChart(stage));description=chartMode==='path'?'Drag to rotate. X, Y and Z are in metres.':data.chart_notes[chartMode];}
      if(description){const note=document.createElement('p');note.textContent=description;content.append(note);}
      $('.loop-dialog-header h4').textContent=title;dialog.showModal();pauseVideos();
    }
    ui.querySelectorAll('[data-loop-open]').forEach(button=>button.addEventListener('click',()=>openEvidence(button.dataset.loopOpen)));
    $('[data-loop-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{resumeVideos();if(playing)advance();});

    $('.loop-record-toggle').addEventListener('click',()=>{
      const expanded=$('.loop-record').classList.toggle('is-expanded');
      $('.loop-record-toggle').setAttribute('aria-expanded',String(expanded));
      $('.loop-record-toggle').textContent=expanded?'Read less':'Read more';
      requestAnimationFrame(connect);
    });
    function connect(){
      const canvas=$('.loop-canvas'),root=$('.loop-connectors'),g=root.querySelector('g'),recordNode=$('.loop-record');
      const scale=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
      if(innerWidth>=1100){
        const agentRect=$('[data-loop-node="agent"]').getBoundingClientRect(),ikRect=$('[data-loop-node="ik"]').getBoundingClientRect();
        recordNode.style.width=`${Math.max(190,(ikRect.right-agentRect.right)/scale+12)}px`;
        canvas.style.paddingTop=`${Math.max(0,recordNode.offsetHeight-120)}px`;
      }else{recordNode.style.width='';recordNode.style.left='';recordNode.style.top='';canvas.style.paddingTop='';}
      const feedbackBlock=$('.loop-bottom');
      if(innerWidth>=1100){
        const previousLift=-(parseFloat(feedbackBlock.style.marginTop)||0);
        const feedbackTop=$('[data-loop-node="feedback"]').getBoundingClientRect().top+previousLift;
        const contentBottom=Math.max(...['rollout','control'].map(name=>$(`[data-loop-node="${name}"]`).getBoundingClientRect().bottom));
        feedbackBlock.style.marginTop=`-${Math.max(0,feedbackTop-contentBottom-28)}px`;
      }else feedbackBlock.style.marginTop='';
      const base=canvas.getBoundingClientRect();
      root.setAttribute('viewBox',`0 0 ${base.width/scale} ${base.height/scale}`);g.replaceChildren();
      if(innerWidth<1100)return;
      const box=name=>{const r=ui.querySelector(`[data-loop-node="${name}"]`).getBoundingClientRect();return {l:(r.left-base.left)/scale,r:(r.right-base.left)/scale,t:(r.top-base.top)/scale,b:(r.bottom-base.top)/scale,x:(r.left-base.left+r.width/2)/scale,y:(r.top-base.top+r.height/2)/scale};};
      function path(d,kind){g.append(svg('path',{d,class:`loop-edge ${kind}`,'marker-end':'url(#loop-arrow)'}));}
      function join(from,to,kind='forward',offset=0) {const a=box(from),b=box(to),mid=(a.r+b.l)/2;path(`M ${a.r+2} ${a.y} H ${mid} V ${b.y+offset} H ${b.l-5}`,kind);}
      join('human','agent','forward',-12);join('initial','agent','forward',12);join('agent','ik');
      join('ik','control');join('control','rollout');
      const agent=box('agent');
      const a=box('rollout'),f=box('feedback');
      g.append(svg('path',{d:`M ${a.x} ${a.b} V ${f.t}`,class:'loop-feedback-connection'}));
      path(`M ${a.x} ${a.b} V ${f.t-2}`,'feedback-out');
      path(`M ${f.l-2} ${f.y} H ${agent.x} V ${agent.b+5}`,'feedback-return');
      recordNode.style.left=`${agent.r-10}px`;
      recordNode.style.top=`${agent.t-32-recordNode.offsetHeight}px`;
      const record=box('record');
      g.append(svg('path',{d:`M ${record.l+9} ${record.b-1} L ${agent.x+8} ${agent.t-3} L ${record.l+35} ${record.b-1}`,class:'loop-bubble-tail'}));
    }
    const layoutObserver=new ResizeObserver(()=>requestAnimationFrame(connect));
    layoutObserver.observe($('.loop-canvas'));layoutObserver.observe($('.loop-record'));
    layoutObserver.observe($('[data-loop-node="rollout"]'));
    layoutObserver.observe($('[data-loop-node="feedback"]'));
    const videos=Array.from(ui.querySelectorAll('video'));
    const blocked=new Set();
    function videoInView(video){
      const r=video.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
    }
    function resumeVideos(){
      const allowed=!document.hidden&&!dialog.open&&document.documentElement.dataset.media!=='off';
      videos.forEach(video=>{
        const active=allowed&&videoInView(video);
        video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;video.playbackRate=1;video.autoplay=active;
        if(!active){video.pause();return;}
        if(video.paused)video.play().then(()=>blocked.delete(video)).catch(error=>{
          if(error.name==='NotAllowedError')blocked.add(video);
        });
      });
    }
    function pauseVideos(){
      clearTimeout(timer);
      videos.forEach(video=>{video.autoplay=false;video.pause();});
    }
    const videoObserver=new IntersectionObserver(resumeVideos,{threshold:[0,.01]});
    videos.forEach(video=>{
      video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;
      video.addEventListener('loadedmetadata',resumeVideos);
      video.addEventListener('canplay',resumeVideos);
      videoObserver.observe(video);
    });
    new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      if(visible&&!document.hidden){resumeVideos();if(playing)advance();}
      else pauseVideos();
    },{threshold:0}).observe(ui);
    let playbackFrame;
    function refreshPlayback(){cancelAnimationFrame(playbackFrame);playbackFrame=requestAnimationFrame(resumeVideos);}
    window.addEventListener('scroll',refreshPlayback,{passive:true});
    window.addEventListener('resize',refreshPlayback,{passive:true});
    window.addEventListener('pageshow',refreshPlayback);
    // Retry a muted autoplay blocked by browser policy after the next interaction.
    for(const event of ['pointerup','keydown'])document.addEventListener(event,()=>{
      if(blocked.size)resumeVideos();
    },{passive:true});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)pauseVideos();
      else{resumeVideos();if(visible&&playing)advance();}
    });
    show(0);
  }
})();
