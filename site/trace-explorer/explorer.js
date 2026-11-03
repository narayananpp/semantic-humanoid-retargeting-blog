import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const $ = id => document.getElementById(id);
const DATA = 'trace-explorer/collaborative/';
let recording;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = value => Number.isFinite(value) ? value.toFixed(2) : '—';
const clock = value => `${Math.floor(value)}:${String(Math.round((value % 1) * 60)).padStart(2,'0')}`;
const state = {agent:null, trial:null, tab:'activity', filter:'context',  eventQuery:'', motion:null, contacts:null, time:0, playing:false, touring:false, generation:0, agentRequest:0, tabEvent:null, sourceLine:null};
const caches = {agent:new Map(), motion:new Map()};
let renderer, scene, camera, controls, meshes=[], pathGroup, contactGroup, contactMarkers=[], initialTarget, currentCamera='wide';
let viewReady=false,needsRender=true;

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status}).`);
  return response.json();
}
function report(error) {
  $('app-error').hidden = false;
  $('app-error').textContent = error.message || String(error);
  console.error(error);
}
function bind(id, event, fn) { $(id).addEventListener(event, fn); }

async function setupScene() {
  THREE.Object3D.DEFAULT_UP.set(0,0,1);
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#e7ece8');
  scene.fog = new THREE.Fog('#e7ece8', 9, 23);
  const viewport=$('viewport');
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  renderer.domElement.setAttribute('aria-label','Interactive 3D playback of G1 and the clothes stand. Drag to rotate the camera.');
  viewport.prepend(renderer.domElement);
  camera = new THREE.PerspectiveCamera(36,1,.01,100);
  controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=.09;
  controls.minDistance=.22;controls.maxDistance=9;
  controls.maxPolarAngle=Math.PI*.49;
  controls.addEventListener('change',()=>{needsRender=true;});
  const ambient=new THREE.HemisphereLight('#ffffff','#879c8e',2.3);
  ambient.position.set(0,0,5);scene.add(ambient);
  const key=new THREE.DirectionalLight('#fff6e9',3.2);key.position.set(-.5,-3,7);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20});
  key.shadow.bias=-.00015;key.shadow.normalBias=.012;scene.add(key);
  const fill=new THREE.DirectionalLight('#d3e7ff',1.25);fill.position.set(3,4,3);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#e2e7e1',roughness:1,metalness:0}));
  floor.position.z=-.006;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(12,48,'#c4d0c7','#d3ddd5');grid.rotation.x=Math.PI/2;grid.position.z=-.003;
  grid.material.transparent=true;grid.material.opacity=.30;scene.add(grid);
  const [spec, response] = await Promise.all([getJSON(DATA+'scene.json'),fetch(DATA+'geometry.bin')]);
  if(!response.ok) throw new Error('The 3D geometry could not be loaded.');
  const binary=await response.arrayBuffer();
  meshes=spec.geoms.map(g=>{
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,g.vertices.offset,g.vertices.count),3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,g.indices.offset,g.indices.count),1));
    geometry.computeVertexNormals();
    const object=g.body.includes('source_runtime_object');
    const color=object?new THREE.Color('#76a4bc'):new THREE.Color(...g.rgba.slice(0,3));
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:object?.52:.42,metalness:object?.20:.25}));
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData=g;scene.add(mesh);return mesh;
  });
  pathGroup=new THREE.Group();scene.add(pathGroup);
  contactGroup=new THREE.Group();scene.add(contactGroup);
  const contactGeo=new THREE.SphereGeometry(.009,10,8);
  const contactMat=new THREE.MeshStandardMaterial({color:'#e6a539',emissive:'#704300',emissiveIntensity:.5,roughness:.5,depthTest:false});
  for(let i=0;i<64;i++){const marker=new THREE.Mesh(contactGeo,contactMat);marker.renderOrder=5;marker.visible=false;contactGroup.add(marker);contactMarkers.push(marker);}
  new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();needsRender=true;}).observe(viewport);
  viewReady=true;
  let last=performance.now();
  document.addEventListener('visibilitychange',()=>{last=performance.now();needsRender=true;});
  function animate(now){
    requestAnimationFrame(animate);
    const dt=(now-last)/1000;last=now;
    if(state.playing && state.motion && !document.hidden){
      state.time+=dt*Number($('speed').value);
      if(state.time>=state.motion.duration){
        state.time=state.motion.duration;setPlaying(false);
        if(state.touring)nextTour();
      }
      applyFrame();updateTransport();
    }
    controls.update();if(needsRender&&!document.hidden){renderer.render(scene,camera);needsRender=false;}
  }
  requestAnimationFrame(animate);
}

function cameraPreset(name='wide') {
  if(!state.motion || !meshes.length) return;
  currentCamera=name;
  let target=initialTarget.clone();
  if(name==='hands'){
    const hand=meshes.find(m=>m.userData.body==='left_wrist_yaw_link') || meshes.find(m=>m.userData.body.includes('left_hand'));
    if(hand)target=hand.position.clone();
    camera.position.copy(target).add(new THREE.Vector3(1.05,-.9,.45));
  } else if(name==='side') {
    camera.position.copy(target).add(new THREE.Vector3(3.8,.15,.85));
  } else camera.position.copy(target).add(new THREE.Vector3(2.6,-3.0,1.25));
  controls.target.copy(target);controls.update();
  document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===name));
}
const qA=new THREE.Quaternion(),qB=new THREE.Quaternion();
function applyFrame() {
  needsRender=true;
  const m=state.motion;if(!m)return;
  let lo=0,hi=m.frames-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(m.buffer[mid*m.stride]<=state.time)lo=mid;else hi=mid-1;}
  const next=Math.min(lo+1,m.frames-1),a=lo*m.stride,b=next*m.stride;
  const span=m.buffer[b]-m.buffer[a],alpha=span>0?(state.time-m.buffer[a])/span:0;
  meshes.forEach((mesh,j)=>{
    const p=a+1+j*7,q=b+1+j*7;
    mesh.position.set(m.buffer[p]+(m.buffer[q]-m.buffer[p])*alpha,m.buffer[p+1]+(m.buffer[q+1]-m.buffer[p+1])*alpha,m.buffer[p+2]+(m.buffer[q+2]-m.buffer[p+2])*alpha);
    qA.set(m.buffer[p+4],m.buffer[p+5],m.buffer[p+6],m.buffer[p+3]);
    qB.set(m.buffer[q+4],m.buffer[q+5],m.buffer[q+6],m.buffer[q+3]);
    mesh.quaternion.copy(qA).slerp(qB,alpha);
  });
  const points=state.contacts?.[lo]||[];
  contactMarkers.forEach((marker,i)=>{marker.visible=i<points.length;if(marker.visible){marker.position.fromArray(points[i]);marker.scale.setScalar(Math.min(1.9,.8+Math.sqrt(points[i][3])*.09));}});
}
function setPlaying(playing){state.playing=playing;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'Pause recorded rollout':'Play recorded rollout');}
function updateTransport() {
  $('scrubber').value=state.time;
  $('motion-time').textContent=`${state.time.toFixed(2)} / ${(state.motion?.duration||0).toFixed(2)} s`;
}
function disposePaths(){if(!pathGroup)return;while(pathGroup.children.length){const child=pathGroup.children[0];pathGroup.remove(child);child.geometry.dispose();child.material.dispose();}}
function drawPaths(){
  needsRender=true;
  disposePaths();
  if(!state.trial?.paths)return;
  for(const [key,color] of [['target_curve','#a06ac4'],['actual_curve','#087b68']]){
    const points=state.trial.paths[key].map(p=>new THREE.Vector3(...p));
    const geometry=new THREE.BufferGeometry().setFromPoints(points);
    const material=new THREE.LineBasicMaterial({color,transparent:true,opacity:.9,depthTest:false});
    const line=new THREE.Line(geometry,material);line.renderOrder=3;pathGroup.add(line);
  }
  pathGroup.visible=$('paths-toggle').checked;
}

async function selectAgent(id, requestedTrial, options={}) {
  const request=++state.agentRequest;
  stopTour();state.generation++;setPlaying(false);
  $('loading').hidden=false;
  if(!caches.agent.has(id))caches.agent.set(id,getJSON(DATA+`agent-${id}.json`));
  const agent=await caches.agent.get(id);if(request!==state.agentRequest)return;state.agent=agent;
  $('agent').value=id;
  $('agent-meta').textContent=`${agent.trials.length-1} recorded trials · ${agent.selected?'selected final result':'collaborating agent'}`;
  const chosen=agent.trials.find(t=>t.id===requestedTrial)||agent.trials.find(t=>t.id!=='initial'&&t.motion)||agent.trials.find(t=>t.id==='final')||agent.trials[0];
  if(!chosen)throw new Error('No scored trials were found for this agent.');
  await selectTrial(chosen.id,options);
}
async function selectTrial(id,options={}) {
  const trial=state.agent.trials.find(t=>t.id===id);if(!trial)return;
  if(!options.tour)stopTour();
  const generation=++state.generation;
  state.trial=trial;state.sourceLine=options.sourceLine?Number(options.sourceLine):null;state.tabEvent=null;state.time=0;state.motion=null;state.contacts=null;setPlaying(false);
  $('play').disabled=true;$('scrubber').disabled=true;
  const clip=$('stage-video');clip.pause();$('video-card').open=false;$('video-card').hidden=!trial.video;
  if(trial.video){clip.src=DATA+trial.video;}else{clip.removeAttribute('src');clip.load();}
  $('trial-label').textContent=trial.id==='initial'?'Initial reference':trial.id==='final'?'Final execution':`Trial ${trial.id}`;
  $('evidence-title').textContent=trial.id==='initial'?'Initial reference':trial.id==='final'?'Final execution':`Trial ${trial.id}`;
  $('refinement-time').textContent=`${trial.time_min.toFixed(2)} min`;
  $('add-value').innerHTML=`${fmt(trial.add_cm)}<small> cm</small>`;
  $('tour').disabled=!state.agent.trials.some(t=>t.motion);
  $('contacts-toggle').disabled=true;$('contacts-state').textContent='';
  $('no-motion').hidden=!!trial.motion;
  $('nearest-replay').textContent=state.agent.trials.some(t=>t.motion)?'Open nearest available replay':'Open selected agent’s replay';
  $('loading').hidden=!trial.motion;
  $('viewer-hint').hidden=!trial.motion;
  meshes.forEach(m=>m.visible=!!trial.motion);
  needsRender=true;
  contactGroup.visible=false;pathGroup.visible=false;
  renderHistory();renderEvidence();renderStages();updateTransport();
  history.replaceState(null,'',`#agent=${state.agent.id}&trial=${encodeURIComponent(id)}&tab=${state.tab}${state.sourceLine?`&line=${state.sourceLine}`:''}`);
  if(!trial.motion)return;
  try{
    const info=trial.motion;
    if(!caches.motion.has(info.file))caches.motion.set(info.file,(async()=>{
      const [r,c]=await Promise.all([fetch(DATA+info.file),info.contacts?getJSON(DATA+info.contacts):Promise.resolve(null)]);
      if(!r.ok)throw new Error('The recorded motion could not be loaded.');
      return {motion:{...info,buffer:new Float32Array(await r.arrayBuffer())},contacts:c};
    })());
    const loaded=await caches.motion.get(info.file);
    if(generation!==state.generation)return;
    state.motion=loaded.motion;state.contacts=loaded.contacts;applyFrame();
    // A stable camera frames the same work area across every revision.
    initialTarget=new THREE.Vector3(-.65,-1.17,.62);
    cameraPreset(currentCamera);
    drawPaths();
    $('play').disabled=false;$('scrubber').disabled=false;$('scrubber').max=info.duration;
    $('loading').hidden=true;
    $('contacts-toggle').disabled=!state.contacts;
    $('contacts-state').textContent=state.contacts?'Recorded object contacts':'Contact recording unavailable';
    contactGroup.visible=!!state.contacts&&$('contacts-toggle').checked;
    updateTransport();if(options.autoplay&&(!options.tour||state.touring))setPlaying(true);
  }catch(error){if(generation===state.generation){$('loading').hidden=true;report(error);}}
}

function renderHistory(){
  const trials=state.agent.trials.filter(t=>t.motion),w=800,h=190,left=45,right=16,top=15,bottom=36;
  const xmax=Math.max(30,...trials.map(t=>t.time_min)),ymax=Math.max(10,...trials.map(t=>t.add_cm))*1.1;
  const X=t=>left+t/xmax*(w-left-right),Y=v=>top+(1-v/ymax)*(h-top-bottom);
  let markup='';
  for(let i=0;i<=3;i++){
    const value=ymax*i/3,y=Y(value);
    markup+=`<line x1="${left}" x2="${w-right}" y1="${y}" y2="${y}" stroke="#e8eeea"/><text x="${left-9}" y="${y+3}" text-anchor="end">${value.toFixed(0)}</text>`;
  }
  for(let t=0;t<=xmax;t+=5)markup+=`<text x="${X(t)}" y="${h-17}" text-anchor="middle">${t}</text>`;
  markup+=`<text x="${left}" y="9">Mean ADD (cm) ↓</text><text x="${w-right}" y="${h-1}" text-anchor="end">Refinement time (min)</text>`;
  const path=trials.map((t,i)=>`${i?'L':'M'}${X(t.time_min)},${Y(t.add_cm)}`).join(' ');
  markup+=`<path d="${path}" fill="none" stroke="#16665f" stroke-width="1.8"/>`;
  markup+=`<line x1="${X(state.trial.time_min)}" x2="${X(state.trial.time_min)}" y1="${top}" y2="${h-bottom}" stroke="#b56a3c" stroke-dasharray="3 4" opacity=".6"/>`;
  trials.forEach(t=>{
    const selected=t===state.trial;
    markup+=`<g class="point" data-trial="${escapeHTML(t.id)}" tabindex="0" role="button" aria-label="Trial ${escapeHTML(t.id)}, ${fmt(t.add_cm)} centimetres, ${t.time_min.toFixed(2)} minutes${t.motion?', replay available':''}"><title>Trial ${escapeHTML(t.id)} · ${fmt(t.add_cm)} cm · ${t.time_min.toFixed(2)} min</title><circle cx="${X(t.time_min)}" cy="${Y(t.add_cm)}" r="${selected?6:t.motion?4.5:3}" fill="${selected?'#ba642f':t.motion?'white':'#a5b8ae'}" stroke="${selected?'#fff':t.motion?'#16665f':'#a5b8ae'}" stroke-width="${selected?2:1.5}"/></g>`;
  });
  $('error-chart').innerHTML=markup;
  $('error-chart').querySelectorAll('[data-trial]').forEach(g=>{g.addEventListener('click',()=>selectTrial(g.dataset.trial));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectTrial(g.dataset.trial);}});});
  $('trial-count').textContent=`${trials.length} playable stages`;
  const rail=$('trial-rail'),previousScroll=rail.scrollLeft;
  rail.innerHTML=trials.map(t=>`<button data-trial="${escapeHTML(t.id)}" class="${t.motion?'has-replay':''}" aria-pressed="${t===state.trial}">${escapeHTML(t.id)}<strong>${fmt(t.add_cm)} cm</strong></button>`).join('');
  rail.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectTrial(b.dataset.trial)));
  rail.scrollLeft=previousScroll;
  const active=rail.querySelector('[aria-pressed=true]');
  if(active&&(active.offsetLeft-rail.offsetLeft<rail.scrollLeft||active.offsetLeft-rail.offsetLeft+active.offsetWidth>rail.scrollLeft+rail.clientWidth))rail.scrollLeft=active.offsetLeft-rail.offsetLeft-rail.clientWidth/2;
}

function linkedTrials(event){return state.agent.trials.filter(t=>t.call_ids.includes(event.id));}
function imageMarkup(event){
  if(!event.image)return '<p class="context-note">This inspected image is not retained in the archive.</p>';
  return `<a class="inspection-image" href="${DATA+escapeHTML(event.image)}" target="_blank" rel="noopener"><img loading="lazy" src="${DATA+escapeHTML(event.image)}" alt="Image inspected by Agent ${state.agent.id}, event ${event.line}"><span>Open image ↗</span></a>`;
}
function eventMarkup(event){
  const message=event.kind==='agentMessage',image=event.kind==='imageView',exchange=event.kind==='exchange';
  const title=message?'Agent observation':image?'Image inspection':exchange?(event.recipient===null?'Shared with all agents':`Message to Agent ${event.recipient}`):event.title;
  const linked=linkedTrials(event);
  const text=event.text||event.description||'';
  let body=image?imageMarkup(event):`<p>${escapeHTML(text)}</p>`;
  if(event.tool)body+=`<span class="tool-name">${escapeHTML(event.tool)}</span>`;
  if(event.message_count!==undefined)body+=`<p class="tool-result">${event.message_count} message${event.message_count===1?'':'s'} returned</p>`;
  if(event.status==='failed')body+='<p class="tool-result failed">The operation did not complete successfully.</p>';
  if(event.attachments?.length)body+=`<p class="tool-result">${event.attachments.length} shared artifact${event.attachments.length===1?'':'s'}</p>`;
  body+=linked.slice(0,6).map(t=>`<button class="event-play" data-event-trial="${escapeHTML(t.id)}">${t.motion?'▶ Replay':'Inspect'} trial ${escapeHTML(t.id)} · ${fmt(t.add_cm)} cm</button>`).join(' ');
  if(linked.length>6)body+=`<p class="context-note">${linked.length} trials scored in this operation. Replay stages are shown in the refinement history.</p>`;
  return `<article class="event-card ${message?'observation':exchange?'exchange-card':''}"><div class="event-top"><b>${escapeHTML(title)}</b><time>${clock(event.time_min)} min</time></div><div class="event-body">${body}<span class="event-note">Recorded event · line ${event.line}</span></div></article>`;
}
function contextEvents(){
  const t=state.trial,all=state.agent.events,idx=state.agent.trials.indexOf(t);
  if(t.id==='initial')return [];
  const next=state.agent.trials[idx+1],prev=state.agent.trials[idx-1];
  const result=all.filter(e=>t.call_ids.includes(e.id)||e.time_min>=Math.max(0,prev?.time_min||0,t.start_min-1.2)&&e.time_min<Math.min(next?.start_min??t.time_min+1.5,t.time_min+2));
  const before=all.filter(e=>e.kind==='agentMessage'&&e.time_min<=t.start_min).at(-1);
  const after=all.find(e=>e.kind==='agentMessage'&&e.time_min>=t.time_min);
  for(const e of [before,after])if(e&&!result.includes(e))result.push(e);
  return result.sort((a,b)=>a.id-b.id);
}
function pathPlot(trial){
  if(!trial.paths)return '';
  const paths=[trial.paths.target_curve,trial.paths.actual_curve],all=paths.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
  const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const span=Math.max(xmax-xmin,ymax-ymin,.1),sx=x=>40+260*(x-(xmin+xmax)/2+span/2)/span,sy=y=>290-260*(y-(ymin+ymax)/2+span/2)/span;
  return `<h3 class="measure-title">Object path · top view</h3><svg class="path-plot" viewBox="0 0 340 330" role="img" aria-label="Desired and executed object paths in the horizontal plane">${paths.map((points,i)=>`<path d="${points.map((p,j)=>`${j?'L':'M'}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`).join(' ')}" fill="none" stroke="${i?'#087b68':'#a06ac4'}" stroke-width="2.5"/>`).join('')}</svg><p class="path-legend"><span>● Desired</span><span>● Executed</span></p><p class="context-note">Spatial paths from the recorded object-path analysis.</p>`;
}
function renderStages(){
  $('agent-finals').innerHTML='<span>Final executions</span>'+recording.agents.map(a=>`<button data-final="${a.id}" class="${state.agent.id===a.id&&state.trial.id==='final'?'active':''}">Agent ${a.id}${a.selected?' · selected':''} <strong>${fmt(a.final_add_cm)} cm</strong></button>`).join('');
  $('agent-finals').querySelectorAll('[data-final]').forEach(b=>b.addEventListener('click',()=>selectAgent(Number(b.dataset.final),'final').catch(report)));
  $('key-stages').innerHTML=recording.stages.map((stage,i)=>`<button data-stage="${i}" class="${state.agent.id===stage.agent&&state.trial.id===stage.trial?'active':''}"><span class="stage-index">${i+1}</span><b>${escapeHTML(stage.label)}</b><span>${stage.trial==='initial'?'Before refinement':`Agent ${stage.agent} · ${stage.time_min.toFixed(1)} min`}</span><strong>${fmt(stage.add_cm)} <small>cm ADD</small></strong></button>`).join('');
  $('key-stages').querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',async()=>{
    const stage=recording.stages[Number(button.dataset.stage)];
    if(stage.agent!==state.agent.id)await selectAgent(stage.agent,stage.trial);else await selectTrial(stage.trial);
  }));
}
function renderEvidence(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===state.tab));
  $('evidence-content').setAttribute('aria-labelledby',`tab-${state.tab}`);
  const trial=state.trial,panel=$('evidence-content');
  if(state.tab==='activity'){
    panel.innerHTML=`<div class="filter-row"><button data-filter="context" class="${state.filter==='context'?'active':''}">This trial</button><button data-filter="all" class="${state.filter==='all'?'active':''}">All activity</button><button data-filter="messages" class="${state.filter==='messages'?'active':''}">Observations</button><input id="event-search" type="search" placeholder="Find a tool, observation or result…" aria-label="Search recorded activity" value="${escapeHTML(state.eventQuery)}"></div><div id="event-list"></div>`;
    const renderList=()=>{
      let events=state.sourceLine?state.agent.events.filter(e=>e.line===state.sourceLine):state.filter==='context'?contextEvents():state.agent.events;
      if(state.filter==='messages')events=events.filter(e=>e.kind==='agentMessage');
      const query=state.eventQuery.toLowerCase();
      if(query)events=events.filter(e=>`${e.text||''} ${e.title||''} ${e.description||''} ${e.tool||''}`.toLowerCase().includes(query));
      $('event-list').innerHTML=events.length?events.map(eventMarkup).join(''):`<p class="empty">${trial.id==='initial'?'The initial reference precedes agent refinement. Choose a revision above to inspect its recorded activity.':'No recorded events match this view.'}</p>`;
      $('event-list').querySelectorAll('[data-event-trial]').forEach(b=>b.addEventListener('click',()=>selectTrial(b.dataset.eventTrial,{autoplay:true})));
    };
    panel.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.sourceLine=null;state.filter=b.dataset.filter;renderEvidence();}));
    $('event-search').addEventListener('input',e=>{state.eventQuery=e.target.value;renderList();});renderList();
  }else if(state.tab==='exchanges'){
    panel.innerHTML=`<p class="context-note">Recorded messages across all four agents, in time order.</p><div class="exchange-list">${recording.exchanges.map(e=>`<article class="event-card exchange-card"><div class="event-top"><b>Agent ${e.agent} → ${e.recipient===null?'All agents':'Agent '+e.recipient}</b><time>${clock(e.time_min)} min</time></div><blockquote>${escapeHTML(e.text)}</blockquote><span class="tool-name">${escapeHTML(e.tool)}</span>${e.attachments?.length?`<span class="artifact-count">${e.attachments.length} shared artifacts</span>`:''}<button class="event-play" data-exchange-agent="${e.agent}" data-exchange-minute="${e.time_min}">Inspect this agent’s trial →</button><span class="event-note">Recorded event · line ${e.line}</span></article>`).join('')}</div>`;
    panel.querySelectorAll('[data-exchange-agent]').forEach(button=>button.addEventListener('click',async()=>{
      const id=Number(button.dataset.exchangeAgent),minute=Number(button.dataset.exchangeMinute);
      if(!caches.agent.has(id))caches.agent.set(id,getJSON(DATA+`agent-${id}.json`));
      const agent=await caches.agent.get(id),trial=[...agent.trials].filter(t=>t.id!=='initial').sort((a,b)=>Math.abs(a.time_min-minute)-Math.abs(b.time_min-minute))[0];
      state.tab='activity';state.filter='context';await selectAgent(id,trial.id);
    }));
  }else if(state.tab==='images'){
    const images=state.agent.events.filter(e=>e.kind==='imageView');
    panel.innerHTML=`<p class="context-note">Views actually inspected by Agent ${state.agent.id}. Click an image to enlarge it.</p><div class="inspection-gallery">${images.map(e=>`<figure>${imageMarkup(e)}<figcaption>${clock(e.time_min)} min · recorded event ${e.line}</figcaption></figure>`).join('')||'<p class="empty">No image inspections were recorded for this agent.</p>'}</div>`;
  }else{
    panel.innerHTML=`<div class="metric-grid"><div class="metric-tile"><span>Mean object-tracking error (ADD)</span><strong>${fmt(trial.add_cm)} <small>cm</small></strong></div><div class="metric-tile"><span>Object position error</span><strong>${fmt(trial.position_cm)} <small>cm</small></strong></div><div class="metric-tile"><span>Object orientation error</span><strong>${fmt(trial.orientation_deg)} <small>deg</small></strong></div><div class="metric-tile"><span>Recorded motion</span><strong>${fmt(trial.duration)} <small>s</small></strong></div></div>${pathPlot(trial)}<h3 class="measure-title">Motion source</h3><p class="context-note">${escapeHTML(trial.motion?.provenance||'The trial score is retained. This trial is outside the six prepared 3D replay stages.')}</p><p class="context-note">Lower object-tracking error is better. This score alone does not establish task completion.</p>`;
  }
  $('evidence-source').textContent=state.tab==='exchanges'?'Original messages · all four agents':`Agent ${state.agent.id} · recorded ${state.tab==='images'?'image inspections':state.tab==='measurements'?'measurements':'activity'}`;
}

function stopTour(){state.touring=false;$('tour').textContent='▶ Play six stages';$('tour').classList.remove('running');}
async function playStage(index){
  const stage=recording.stages[index];
  if(stage.agent!==state.agent.id)await selectAgent(stage.agent,stage.trial);
  state.touring=true;$('tour').textContent='Ⅱ Stop stage playback';$('tour').classList.add('running');
  await selectTrial(stage.trial,{tour:true,autoplay:true});
}
function nextTour(){
  if(!state.touring)return;
  const idx=recording.stages.findIndex(s=>s.agent===state.agent.id&&s.trial===state.trial.id);
  if(idx>=recording.stages.length-1){stopTour();return;}
  playStage(idx+1).catch(report);
}
function stepTrial(direction){const trials=state.agent.trials.filter(t=>t.motion);const i=trials.indexOf(state.trial);const next=trials[Math.max(0,Math.min(trials.length-1,i+direction))];if(next)selectTrial(next.id);}

async function boot(){
  bind('about-button','click',()=>$('about').showModal());bind('close-about','click',()=>$('about').close());
  bind('about','click',e=>{if(e.target===$('about')){const r=$('about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about').close();}});
  recording=await getJSON(DATA+'index.json');
  await setupScene();
  const params=new URLSearchParams(location.hash.slice(1));
  if(['activity','exchanges','measurements','images'].includes(params.get('tab')))state.tab=params.get('tab');
  await selectAgent(Math.max(0,Math.min(3,Number(params.get('agent'))||0)),params.get('trial')||'initial',{sourceLine:params.get('line')});
  window.addEventListener('hashchange',()=>{
    const route=new URLSearchParams(location.hash.slice(1));
    const id=Math.max(0,Math.min(3,Number(route.get('agent'))||0));
    if(['activity','exchanges','measurements','images'].includes(route.get('tab')))state.tab=route.get('tab');
    if(id!==state.agent.id)selectAgent(id,route.get('trial'),{sourceLine:route.get('line')}).catch(report);
    else if(route.get('trial')&&state.agent.trials.some(t=>t.id===route.get('trial')))selectTrial(route.get('trial'),{sourceLine:route.get('line')}).catch(report);
    else renderEvidence();
  });
  bind('agent','change',e=>selectAgent(Number(e.target.value)).catch(report));
  bind('play','click',()=>{if(state.time>=state.motion.duration)state.time=0;stopTour();setPlaying(!state.playing);});
  bind('scrubber','input',e=>{stopTour();setPlaying(false);state.time=Number(e.target.value);applyFrame();updateTransport();});
  bind('reset-camera','click',()=>cameraPreset('wide'));
  document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>cameraPreset(b.dataset.camera)));
  bind('paths-toggle','change',()=>{pathGroup.visible=$('paths-toggle').checked&&!!state.motion;$('overlay-legend').hidden=!$('paths-toggle').checked;needsRender=true;});
  bind('contacts-toggle','change',()=>{contactGroup.visible=$('contacts-toggle').checked&&!!state.contacts;needsRender=true;});
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;renderEvidence();history.replaceState(null,'',`#agent=${state.agent.id}&trial=${encodeURIComponent(state.trial.id)}&tab=${state.tab}${state.sourceLine?`&line=${state.sourceLine}`:''}`);}));
  const tabs=[...document.querySelectorAll('[data-tab]')];
  tabs.forEach((b,i)=>b.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();const next=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];next.click();next.focus();}}));
  bind('nearest-replay','click',()=>{const t=state.agent.trials.filter(t=>t.motion).sort((a,b)=>Math.abs(a.time_min-state.trial.time_min)-Math.abs(b.time_min-state.trial.time_min))[0];if(t)selectTrial(t.id);else selectAgent(0);});
  bind('tour','click',()=>{if(state.touring){stopTour();setPlaying(false);return;}state.touring=true;$('tour').textContent='Ⅱ Stop revision playback';$('tour').classList.add('running');playStage(0).catch(report);});
  bind('copy-link','click',async()=>{try{await navigator.clipboard.writeText(location.href);$('copy-link').textContent='Link copied';setTimeout(()=>$('copy-link').textContent='Copy link ↗',1600);}catch{window.prompt('Copy this link',location.href);}});
  document.addEventListener('trace-pause',()=>{stopTour();setPlaying(false);$('stage-video').pause();});
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(document.activeElement.tagName)||$('about').open)return;if(e.code==='Space'&&state.motion){e.preventDefault();$('play').click();}else if(e.key==='ArrowRight'){e.preventDefault();stepTrial(1);}else if(e.key==='ArrowLeft'){e.preventDefault();stepTrial(-1);}else if(e.key.toLowerCase()==='r')cameraPreset('wide');});
  // A public handle for deterministic visual and interaction checks; no mutation API.
  window.traceExplorer={get state(){return {agent:state.agent?.id,trial:state.trial?.id,time:state.time,playing:state.playing,motion:!!state.motion,tab:state.tab};}};
}
boot().catch(error=>{$('loading').hidden=true;report(error);});
