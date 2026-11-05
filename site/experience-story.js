/* Recorded experience inputs, agent messages and matched continuations. */
(() => {
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function film(media,title,add){
    const f=el('figure','experience-film'),v=el('video');
    f.append(el('figcaption','',title));Object.assign(v,{src:media.video,poster:media.poster||'',controls:true,muted:true,autoplay:true,loop:true,playsInline:true,preload:'metadata'});v.setAttribute('aria-label',title);f.append(v);
    if(add!==undefined)f.append(el('p','experience-final-score',`Mean ADD ${add.toFixed(2)} cm`));return f;
  }
  function quote(q,label){
    const b=el('blockquote','experience-message');b.append(el('p','message-author',`${label} — ${q.minute.toFixed(1)} min`),el('p','message-text',q.text));return b;
  }
  function carousel(priors){
    const root=el('section','experience-injection');root.setAttribute('aria-label','Four supplied experience reports');
    root.append(el('p','flow-kicker','15 min / Experience injection'),el('h5','','Lessons from four earlier interactions'));
    const controls=el('div','prior-carousel-controls'),prev=el('button','','←'),count=el('span'),next=el('button','','→'),toggle=el('button','carousel-toggle','Pause');let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;toggle.type='button';toggle.textContent=paused?'Play':'Pause';toggle.setAttribute('aria-label','Pause experience carousel');toggle.onclick=()=>{paused=!paused;toggle.textContent=paused?'Play':'Pause';toggle.setAttribute('aria-label',(paused?'Play':'Pause')+' experience carousel');};
    prev.type=next.type='button';prev.setAttribute('aria-label','Previous experience');next.setAttribute('aria-label','Next experience');controls.append(prev,count,toggle,next);
    const panel=el('div','prior-carousel-panel');root.append(controls,panel,el('p','prior-carousel-note','The agent receives written reports. These videos show the source interactions.'));
    let index=0;function show(i){
      index=(i+priors.length)%priors.length;panel.querySelectorAll('video').forEach(v=>v.pause());panel.replaceChildren();const p=priors[index];count.textContent=`${index+1} / ${priors.length}`;
      panel.append(el('h5','prior-task-title',p.title));const pair=el('div','prior-motion-pair');pair.dataset.syncedVideos='duration';pair.append(film(p.human,'Human (SMPL)'),film(p.robot,'G1 execution'));panel.append(pair);
      const copy=el('div','prior-lesson');copy.append(el('strong','',p.lesson));panel.append(copy);
    }
    prev.onclick=()=>show(index-1);next.onclick=()=>show(index+1);show(0);
    let timer=setInterval(()=>{if(!paused&&!root.matches(':hover')&&!root.contains(document.activeElement)&&!document.hidden&&root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<innerHeight)show(index+1);},14000);
    root.addEventListener('show-prior',event=>{paused=true;toggle.textContent='Play';toggle.setAttribute('aria-label','Play experience carousel');show(priors.findIndex(p=>p.clip===event.detail));});return root;
  }
  function build(root,e){
    root.className='experience-story experience-flow';
    const inputs=el('div','experience-initial-inputs');inputs.append(film(e.media.human,'Human demonstration (SMPL)'),film(e.media.kinematic,'Initial kinematic reference'));root.append(inputs);
    inputs.querySelector('video').id='experience-human-clock';
    const start=el('div','experience-shared');start.append(film(e.media.base,'After 15 minutes',e.metrics.base.mean_add_m*100));root.append(start);

    const grid=el('div','experience-branches');root.append(grid);
    const left=el('section','experience-branch without'),right=el('section','experience-branch with');grid.append(left,right);
    left.append(el('h4','','Without experience'),el('p','branch-budget','15 more minutes from the same starting motion without experience context'));
    right.append(el('h4','','With experience'),el('p','branch-budget','15 more minutes from the same starting motion with experience context'));
    const source=el('div','experience-no-injection');source.append(el('p','flow-kicker','15 min / No additional reports'),el('h5','','Continue from the shared solution'),el('p','','The agent receives the same task, motion and remaining refinement time. No experience reports are added.'),quote(e.intermediates[0].comparison.without_experience.quote,'Next decision'));left.append(source);const injection=carousel(e.prior_inputs);right.append(injection);
    const ldecision=el('div','experience-decision');ldecision.append(el('p','flow-kicker','Refinement without experience'),el('h5','','Test grasps nearer the far end'),el('p','','The first new grasp is unstable. At 20 minutes, the initial partial lift still has the lowest object-tracking error.'));left.append(ldecision);
    const rdecision=el('div','experience-decision');
    rdecision.append(el('p','flow-kicker','Recorded experience log'));
    const relevant=e.prior_inputs.find(p=>p.clip==='walk_with_low_chair-308'),sourceLink=el('button','experience-report-link','Carry a low chair ↗');sourceLink.type='button';sourceLink.onclick=()=>{injection.dispatchEvent(new CustomEvent('show-prior',{detail:relevant.clip}));injection.scrollIntoView({block:'center',behavior:'smooth'});};rdecision.append(sourceLink);
    const excerpt=el('blockquote','experience-source-excerpt');for(const q of relevant.quotes)excerpt.append(el('p','',`“${q}”`));rdecision.append(excerpt);
    rdecision.append(el('p','experience-transfer-note','The report describes coordinated walking and bounded feedback. The need for more travel is the agent’s assessment of the shelf task.'),quote(e.learning.evidence,'Agent’s next decision'));right.append(rdecision);
    const lmid=e.intermediates[0].comparison.without_experience,rmid=e.intermediates[0].comparison.with_experience;
    const midway=el('div','experience-progress-row');root.append(midway);
    midway.append(film(lmid.media,'20 min / Best motion without experience',lmid.add_cm),film(rmid.media,'20.9 min / Revised stepping with experience',rmid.add_cm));
    const observed=el('div','experience-learning-result');observed.append(el('p','flow-kicker','Further refinement with experience'),el('p','','The agent first improves the shelf lift with revised stepping, then adds bounded object-pose feedback. Its later report connects that feedback to the lower error:'),quote(e.quotes.with_experience.at(-1),'Agent'));root.append(observed);
    const finals=el('div','experience-final-pair');root.append(finals);for(const [key,title] of [['without_experience','Without experience'],['with_experience','With experience']])finals.append(film(e.media[key],`30 min / ${title}`,e.metrics[key].mean_add_m*100));
    for(const group of [inputs,start,midway,finals]){group.dataset.syncedVideos='duration';group.dataset.syncReference='#experience-human-clock';}
    root.append(el('p','publication-caption','Shelf righting after equal 15-minute continuations.'));
    connectFlow(root,inputs,start,left,right,source,injection,ldecision,rdecision,midway,observed,finals);
  }
  function connectFlow(root,inputs,start,left,right,source,injection,ldecision,rdecision,midway,observed,finals){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('experience-flow-arrows');svg.setAttribute('aria-hidden','true');root.prepend(svg);
    const draw=()=>{
      if(innerWidth<=760){svg.replaceChildren();return;}
      const box=root.getBoundingClientRect(),rect=n=>{const r=n.getBoundingClientRect();return{x:r.left+r.width/2-box.left,top:r.top-box.top,bottom:r.bottom-box.top};};
      svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);let paths=[];
      const link=(a,b)=>{const f=rect(a),t=rect(b);paths.push(`M${f.x},${f.bottom+7} V${t.top-12}`);};
      link(inputs,start);const a=rect(start),l=rect(left.querySelector('h4')),r=rect(right.querySelector('h4')),y=a.bottom+26;
      paths.push(`M${a.x},${a.bottom+7} V${y} H${l.x} V${l.top-12}`,`M${a.x},${y} H${r.x} V${r.top-12}`);
      link(source,ldecision);link(injection,rdecision);link(ldecision.lastElementChild,midway.children[0]);link(rdecision.lastElementChild,midway.children[1]);link(midway.children[1],observed);link(midway.children[0],finals.children[0]);link(observed,finals.children[1]);
      svg.innerHTML='<defs><marker id="experience-arrow-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L8 5 L1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs>'+paths.map(d=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#experience-arrow-tip)"/>`).join('');
    };
    const observer=new ResizeObserver(()=>requestAnimationFrame(draw));for(const n of [root,inputs,start,left,right,midway,observed,finals])observer.observe(n);draw();
  }
  fetch('experience-story.json?v=experience-evidence-20261105').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{const e=d.examples.find(x=>x.group==='related'),root=document.querySelector('#experience-shelf-walkthrough .experience-story');if(root)build(root,e);}).catch(e=>{const r=document.querySelector('.experience-story');if(r)r.textContent=`Walkthrough could not load: ${e.message}`;});
})();
