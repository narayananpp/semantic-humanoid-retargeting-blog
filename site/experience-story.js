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
    const controls=el('div','prior-carousel-controls'),prev=el('button','','←'),count=el('span'),next=el('button','','→');
    prev.type=next.type='button';prev.setAttribute('aria-label','Previous experience');next.setAttribute('aria-label','Next experience');controls.append(prev,count,next);
    const panel=el('div','prior-carousel-panel');root.append(controls,panel,el('p','prior-carousel-note','The agent receives written reports. These videos show the source interactions.'));
    let index=0;function show(i){index=(i+priors.length)%priors.length;panel.querySelectorAll('video').forEach(v=>v.pause());panel.replaceChildren();const p=priors[index];count.textContent=`${index+1} / ${priors.length}`;const copy=el('div','prior-lesson');copy.append(el('h5','',p.lesson),el('blockquote','',`“${p.quote}”`));panel.append(film(p.human,p.title),copy);}
    prev.onclick=()=>show(index-1);next.onclick=()=>show(index+1);show(0);
    let timer=setInterval(()=>{if(!root.matches(':hover')&&!root.contains(document.activeElement)&&!document.hidden&&root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<innerHeight)show(index+1);},14000);
    root.addEventListener('focusin',()=>clearInterval(timer));return root;
  }
  function build(root,e){
    root.className='experience-story experience-flow';
    const inputs=el('div','experience-initial-inputs');inputs.append(film(e.media.human,'Human demonstration (SMPL)'),film(e.media.kinematic,'Initial kinematic reference'));root.append(inputs,el('div','experience-input-line'));
    const start=el('div','experience-shared');start.append(el('p','flow-kicker','15 min / Shared starting solution'),film(e.media.base,'Shared starting motion',e.metrics.base.mean_add_m*100));root.append(start);
    const branch=el('div','experience-branch-line');branch.setAttribute('aria-hidden','true');root.append(branch);
    const grid=el('div','experience-branches');root.append(grid);
    const left=el('section','experience-branch without'),right=el('section','experience-branch with');grid.append(left,right);
    left.append(el('h4','','Without experience'),el('p','branch-budget','15 more minutes from the same starting motion'));
    right.append(el('h4','','With experience'),el('p','branch-budget','15 more minutes from the same starting motion'));
    const source=el('div','experience-no-injection');source.append(el('p','flow-kicker','15 min / No additional reports'),el('h5','','Continue from the shared solution'),el('p','','The agent receives the same task, motion and remaining refinement time. No experience reports are added.'),quote(e.intermediates[0].comparison.without_experience.quote,'Next decision'));left.append(source);right.append(carousel(e.prior_inputs));
    const ldecision=el('div','experience-decision');ldecision.append(el('p','flow-kicker','Refinement without experience'),el('h5','','Test grasps nearer the far end'),el('p','','The first new grasp is unstable. At 20 minutes, the initial partial lift still has the lowest object-tracking error.'));left.append(ldecision);
    const rdecision=el('div','experience-decision');rdecision.append(el('p','flow-kicker','Learning applied'),el('h5','','Bound the feedback and move the body with the grasp'),quote(e.learning.evidence,'Agent after reading the reports'));right.append(rdecision);
    const lmid=e.intermediates[0].comparison.without_experience,rmid=e.intermediates[0].comparison.with_experience;
    const midway=el('div','experience-progress-row');root.append(midway);
    midway.append(film(lmid.media,'20 min / Best motion without experience',lmid.add_cm),film(rmid.media,'20.9 min / Revised stepping with experience',rmid.add_cm));
    const observed=el('div','experience-learning-result');observed.append(el('p','flow-kicker','Further refinement with experience'),el('p','','The agent first improves the shelf lift with revised stepping, then adds bounded object-pose feedback. Its later report connects that feedback to the lower error:'),quote(e.quotes.with_experience.at(-1),'Agent'));root.append(observed);
    const finals=el('div','experience-final-pair');root.append(finals);for(const [key,title] of [['without_experience','Without experience'],['with_experience','With experience']])finals.append(film(e.media[key],`30 min / ${title}`,e.metrics[key].mean_add_m*100));
    root.append(el('p','publication-caption','Shelf righting after equal 15-minute continuations from the same initial motion.'));
  }
  fetch('experience-story.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{const e=d.examples.find(x=>x.group==='related'),root=document.querySelector('#experience-shelf-walkthrough .experience-story');if(root)build(root,e);}).catch(e=>{const r=document.querySelector('.experience-story');if(r)r.textContent=`Walkthrough could not load: ${e.message}`;});
})();
