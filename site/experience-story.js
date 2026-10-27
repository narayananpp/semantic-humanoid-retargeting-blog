/* Matched checkpoints and public messages; refinement time is separate from video time. */
(() => {
  const colors = {base:'#93999e',without_experience:'#5273a0',with_experience:'#087f77'};
  const labels = {without_experience:'Without experience',with_experience:'With experience'};
  const node = (tag, cls, text) => { const e=document.createElement(tag); if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e; };
  const pause = root => root.querySelectorAll('video').forEach(v=>v.pause());
  function videoCard(media, title) {
    const card=node('figure','experience-film'), caption=node('figcaption','',title);if(title.includes('No physics simulation')){caption.textContent=title.replace('No physics simulation','');caption.append(node('mark','','No physics simulation'));}card.append(caption);
    if(document.documentElement.dataset.media==='off') {card.append(node('p','video-pending','Video available in the media edition.'));return card;}
    const video=node('video');Object.assign(video,{controls:true,muted:true,playsInline:true,preload:'none'});
    video.setAttribute('aria-label',title);video.src=media.video;if(media.poster)video.poster=media.poster;card.append(video);
    const error=node('p','video-pending','This video is being prepared.');error.hidden=true;
    video.addEventListener('error',()=>{error.hidden=false;});video.addEventListener('loadedmetadata',()=>{error.hidden=true;});card.append(error);
    return card;
  }
  function best(points, seed) {
    const out=seed?[seed]:[];let value=seed?.add_cm??Infinity;
    for(const p of [...points].sort((a,b)=>a.minute-b.minute))if(p.add_cm<value){value=p.add_cm;out.push(p);}
    return out;
  }
  function chart(root, task) {
    const W=610,L=60,R=22,T=22,B=55;
    let H=350;
    const all=task.points.filter(p=>p.add_cm>0), lo=Math.min(...all.map(p=>p.add_cm))*.8, hi=Math.max(...all.map(p=>p.add_cm))*1.12;
    const x=t=>L+t/30*(W-L-R), y=v=>T+(Math.log(hi)-Math.log(v))/(Math.log(hi)-Math.log(lo))*(H-T-B);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','Mean ADD over refinement time, with matched branches at 15 minutes.');root.append(svg);
    const baseScore=task.metrics.base.mean_add_m*100;let cursor=15,animation;
    const path=(pts,t)=>{const q=pts.filter(p=>p.minute<=t);if(!q.length)return '';let d=`M${x(q[0].minute)},${y(q[0].add_cm)}`;for(const p of q.slice(1))d+=`H${x(p.minute)}V${y(p.add_cm)}`;return d+`H${x(t)}`;};
    function draw(t, checkpoint=false){
      H=checkpoint?381.25:350;
      svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      let s='<title>Refinement history; mean ADD in centimetres on a logarithmic axis</title>';
      for(let power=Math.floor(Math.log10(lo));power<=Math.ceil(Math.log10(hi));power++)for(const factor of [1,3]){
        const v=factor*10**power;if(v<lo||v>hi)continue;
        s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e5e5"/><text x="${L-9}" y="${y(v)+4}" text-anchor="end">${Number(v.toPrecision(3))}</text>`;
      }
      for(const v of [0,5,10,15,20,25,30])s+=`<text x="${x(v)}" y="${H-B+23}" text-anchor="middle">${v}</text>`;
      s+=`<text x="${L}" y="13">Mean ADD (cm · log scale)</text><text x="${(L+W-R)/2}" y="${H-7}" text-anchor="middle">Refinement time (min)</text><line x1="${x(15)}" x2="${x(15)}" y1="${T}" y2="${H-B}" stroke="#9a9d9f" stroke-dasharray="4 5"/>`;
      for(const p of all){if(p.minute<=t)s+=`<circle cx="${x(p.minute)}" cy="${y(p.add_cm)}" r="1.8" fill="${colors[p.condition]}" opacity=".2"/>`;}
      const b=best(all.filter(p=>p.condition==='base'));
      s+=`<path d="${path(b,Math.min(t,15))}" fill="none" stroke="${colors.base}" stroke-width="2"/>`;
      if(t>=15){
        s+=`<circle cx="${x(15)}" cy="${y(baseScore)}" r="4" fill="white" stroke="#5b6266" stroke-width="2"/>`;
        for(const c of ['without_experience','with_experience']){
          const curve=best(all.filter(p=>p.condition===c),{minute:15,add_cm:baseScore});
          s+=`<path d="${path(curve,t)}" fill="none" stroke="${colors[c]}" stroke-width="2.5"/>`;
          const active=curve.filter(p=>p.minute<=t).at(-1);if(active)s+=`<circle cx="${x(t)}" cy="${y(active.add_cm)}" r="4" fill="${colors[c]}"/>`;
          if(t>=29.99){const final=task.metrics[c].mean_add_m*100;s+=`<path d="M${x(30)},${y(final)-6}l6,6 -6,6 -6,-6z" fill="${colors[c]}" stroke="white"/>`;}
        }
      }
      s+=`<line x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${H-B}" stroke="#41494c" stroke-width="1" opacity=".5"/>`;
      svg.innerHTML=s;
    }
    draw(30);
    return draw;
  }

  function build(root, example, task) {
    root.classList.add('experience-progression');
    const score=(media,title,value)=>{
      const card=videoCard(media,title);
      if(value!==undefined)card.append(node('p','experience-final-score',`Mean ADD ${value.toFixed(2)} cm`));
      return card;
    };
    const priorId='experience-prior-'+example.clip;
    const quoteBox=(quote,condition)=>{
      const box=node('blockquote','experience-message');
      const author=condition==='with_experience'?'With-experience agent':'Agent report';
      box.append(node('p','message-author',`${author} · ${quote.minute.toFixed(1)} min`),node('p','message-text',quote.text));
      if(condition!=='with_experience'||!example.prior)return box;
      const context=node('div','experience-message-context'),link=node('a','experience-prior-node');
      link.href='#'+priorId;
      link.append(node('span','prior-node-label','Prior strategy'),node('strong','','Adjust wrist orientation to oppose tipping'),node('span','',example.prior.peer_title),node('span','prior-node-action','View the source human and robot motions ↓'));
      context.append(box,link);return context;
    };
    const overview=node('div','experience-outcomes');overview.setAttribute('aria-label','Human reference and final outcomes');
    overview.append(videoCard(example.media.human,'Human reference'));
    for(const condition of Object.keys(labels))overview.append(score(example.media[condition],labels[condition]+' · final',example.metrics[condition].mean_add_m*100));
    root.append(overview);
    root.append(node('h4','experience-progression-heading','Refinement from the shared checkpoint'));
    const tabs=node('div','experience-stages');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Experience refinement stages');root.append(tabs);
    const clock=node('p','experience-clock');root.append(clock);
    const layout=node('div','experience-stage-layout'),panel=node('div','experience-stage-panel'),plot=node('div','experience-trace');
    panel.id='experience-stage-'+example.clip;panel.setAttribute('role','tabpanel');layout.append(panel,plot);root.append(layout);
    const draw=chart(plot,task),legend=node('div','experience-legend');
    for(const [condition,label] of [['base','Initial refinement'],...Object.entries(labels)]){
      const item=node('span','',label);item.style.setProperty('--trace',colors[condition]);legend.append(item);
    }plot.append(legend);
    const stages=[{id:'checkpoint',label:'15 min · Shared checkpoint',minute:15},
      ...(example.intermediates||[]),{id:'final',label:'30 min · Final comparison',minute:30}];
    const buttons=[];
    function show(index){
      const stage=stages[index];pause(panel);panel.replaceChildren();
      layout.classList.toggle('is-checkpoint',stage.id==='checkpoint');
      draw(stage.minute,stage.id==='checkpoint');
      buttons.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.setAttribute('aria-pressed',String(i===index));b.tabIndex=i===index?0:-1;});
      panel.setAttribute('aria-labelledby',buttons[index].id);
      clock.textContent=stage.display_minute ? `Around ${stage.display_minute} min` : `Refinement time: ${stage.minute.toFixed(0)} min`;
      if(stage.id==='checkpoint'){
        panel.append(score(example.media.base,'Shared checkpoint',example.metrics.base.mean_add_m*100));
        panel.append(node('p','experience-stage-detail','Both continuations start from this motion. The shelf is partially lifted but does not reach upright.'));
        panel.append(quoteBox(example.quotes.with_experience[0],'with_experience'));
      }else if(stage.id==='final'){
        const pair=node('div','experience-stage-finals');
        for(const condition of Object.keys(labels)){
          const lane=node('div','');lane.append(score(example.media[condition],labels[condition]+' · final',example.metrics[condition].mean_add_m*100));
          lane.append(quoteBox(example.quotes[condition].at(-1),condition));pair.append(lane);
        }panel.append(pair);
      }else if(stage.comparison){
        const pair=node('div','experience-stage-finals');
        for(const condition of Object.keys(labels)){
          const item=stage.comparison[condition],lane=node('div','');
          lane.append(score(item.media,item.title,item.add_cm));
          lane.append(node('p','experience-stage-detail',item.description));
          if(item.quote)lane.append(quoteBox(item.quote,condition));
          if(item.quote_index!==undefined)lane.append(quoteBox(example.quotes[condition][item.quote_index],condition));
          pair.append(lane);
        }panel.append(pair);
      }else{
        panel.append(score(stage.media,stage.title,stage.add_cm));
        panel.append(node('p','experience-stage-detail',stage.description));
        if(stage.quote_index!==undefined)panel.append(quoteBox(example.quotes.with_experience[stage.quote_index],'with_experience'));
      }
    }
    stages.forEach((stage,index)=>{
      const b=node('button','',stage.label);b.type='button';b.id=panel.id+'-'+stage.id;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);
      b.addEventListener('click',()=>show(index));b.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?stages.length-1:(index+(event.key==='ArrowRight'?1:-1)+stages.length)%stages.length;show(next);buttons[next].focus();
      });buttons.push(b);tabs.append(b);
    });
    const alignPlot=()=>{
      const video=panel.querySelector('video');
      const offset=video && getComputedStyle(layout).gridTemplateColumns.split(' ').length>1
        ? video.getBoundingClientRect().top-panel.getBoundingClientRect().top : 0;
      plot.style.paddingTop=`${Math.max(0,offset)}px`;
    };
    new ResizeObserver(alignPlot).observe(panel);
    show(0);
    alignPlot();
    if(example.prior){
      const prior=node('div','experience-prior');prior.id=priorId;prior.tabIndex=-1;prior.append(node('h4','prior-heading',`From the supplied experience: ${example.prior.peer_title}`));
      const pair=node('div','source-motion-pair');if(example.prior.human)pair.append(videoCard(example.prior.human,'Human reference'));pair.append(videoCard(example.prior.media,'Prior robot execution'));prior.append(pair,node('p','prior-excerpt',`“${example.prior.text}”`));root.append(prior);
    }
    root.append(node('p','experience-trace-caption','Fig. 10. Shelf righting with and without related experience. Both branches continue from one 15-minute checkpoint to a 30-minute total budget. Videos show the checkpoint, an intermediate comparison and final executions. Faint dots show evaluated trials, curves show best-so-far ADD, and diamonds mark final submissions.'));
  }
  fetch('experience-story.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(data=>{
    for(const example of data.examples){const root=document.querySelector(`[data-example="${example.group==='related'?'shelf':'bin'}-walkthrough"] .experience-story`);if(root)build(root,example,data.tasks.find(t=>t.clip===example.clip));}
  }).catch(error=>document.querySelectorAll('.experience-story').forEach(r=>{r.textContent=`Walkthrough could not load: ${error.message}`;}));
})();
