/* Only the active saved execution loads; no background video prefetch. */
(() => {
  const root=document.querySelector('#dynamics-showcase');if(!root)return;
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  fetch('dynamics-showcase.json?v=humotar-names-3',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(data=>{
    const tabs=make('div','showcase-datasets');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Dataset');
    const panel=make('div','showcase-content');panel.id='showcase-motion-panel';panel.setAttribute('role','tabpanel');
    const player=make('div','showcase-player'),list=make('div','showcase-list');panel.append(player,list);root.prepend(tabs,panel);
    let dataset='humoto',chosen,method='orchestrator';const buttons=[];
    function show(row){
      chosen=row.clip;player.querySelectorAll('video').forEach(v=>v.pause());player.replaceChildren();
      list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clip===chosen)));
      player.append(make('h4','',row.title));
      const methods=row.methods||{orchestrator:{...row,label:'HuMoTAR'}};
      const picker=make('label','method-choice','Method'),select=make('select');
      select.setAttribute('aria-label','Dynamics method');
      for(const [key,label] of [['orchestrator','HuMoTAR'],['codex','Codex'],['zero_shot','Astra one-shot'],['hoi_spider','HOI-Retarget + SPIDER']]){
        if(!methods[key])continue;
        const option=make('option','',label);
        option.value=key;select.append(option);
      }
      const active=methods[method]?method:'orchestrator';select.value=active;
      select.addEventListener('change',()=>{method=select.value;show(row);});picker.append(select);player.append(picker);
      const execution=methods[active];
      if(row.status==='ready'&&document.documentElement.dataset.media!=='off'){
        const pair=make('div','source-motion-pair');
        const entries=[];
        if(row.human?.status==='ready') entries.push([row.human,'Human reference · SMPL']);
        entries.push([execution,execution.label]);
        for(const [media,label] of entries){
          const figure=make('figure','source-motion-card'),video=make('video');
          Object.assign(video,{src:media.video,poster:media.poster||'',controls:true,muted:true,playsInline:true,preload:'none'});
          video.setAttribute('aria-label',row.title+': '+label);figure.append(make('figcaption','',label),video);pair.append(figure);
        }
        player.append(pair);
      }else if(row.poster){const image=make('img');Object.assign(image,{src:row.poster,alt:row.title});player.append(image);}
      else player.append(make('p','showcase-pending','GPU Blender render in progress.'));
      player.append(make('p','showcase-caption',active==='orchestrator'?(row.description||`${row.title}. HuMoTAR execution in physics simulation.`):`${row.title}. ${execution.label} execution in physics simulation.`));
    }
    function choose(name){
      dataset=name;const rows=data.clips.filter(r=>r.dataset===name);buttons.forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.dataset===name));b.tabIndex=b.dataset.dataset===name?0:-1;});
      panel.setAttribute('aria-labelledby','showcase-tab-'+name);list.replaceChildren();
      for(const row of rows){const b=make('button','showcase-choice');b.type='button';b.dataset.clip=row.clip;
        if(row.poster){const image=make('img');Object.assign(image,{src:row.poster,alt:'',loading:'lazy'});b.append(image);}
        b.append(make('span','',row.title));b.addEventListener('click',()=>show(row));list.append(b);
      }show(rows.find(r=>r.status==='ready')||rows[0]);
    }
    for(const name of ['humoto','omomo']){const b=make('button','',name.toUpperCase());b.type='button';b.dataset.dataset=name;b.id='showcase-tab-'+name;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.addEventListener('click',()=>choose(name));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const other=name==='humoto'?'omomo':'humoto';choose(other);buttons.find(x=>x.dataset.dataset===other).focus();}});tabs.append(b);buttons.push(b);}
    choose(dataset);
  }).catch(e=>root.append(make('p','',`Showcase could not load: ${e.message}`)));
})();
