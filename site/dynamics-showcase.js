/* Only the active saved execution loads; no background video prefetch. */
(() => {
  const root=document.querySelector('#dynamics-showcase');if(!root)return;
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  fetch('dynamics-showcase.json?v=spider-full-20261102',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(data=>{
    const tabs=make('div','showcase-datasets');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Dataset');
    const panel=make('div','showcase-content');panel.id='showcase-motion-panel';panel.setAttribute('role','tabpanel');
    const header=make('div','showcase-header'),player=make('div','showcase-player'),list=make('div','showcase-list');panel.append(header,player,list);root.prepend(tabs,panel);
    let dataset='humoto',chosen,method='codex120';const buttons=[];
    function show(row){
      chosen=row.clip;player.querySelectorAll('video').forEach(v=>v.pause());player.replaceChildren();header.replaceChildren();
      list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clip===chosen)));
      header.append(make('h4','',row.title));
      const methods=Object.fromEntries(Object.entries(row.methods||{}).filter(([key])=>!['orchestrator','communicating'].includes(key)));
      const picker=make('label','method-choice','Method'),select=make('select');
      select.setAttribute('aria-label','Dynamics method');
      for(const [key,label] of [['hoi_spider','HOI-Retarget + SPIDER'],['zero_shot','Astra one-shot'],['codex','Astra with refinement, 30 min'],['codex120','Astra with refinement']]){
        if(!methods[key])continue;
        const option=make('option','',label);
        option.value=key;select.append(option);
      }
      const active=methods[method]?method:Object.keys(methods)[0];select.value=active;
      buttons.forEach(b=>{b.textContent=b.dataset.dataset.toUpperCase()+(active==='codex120'?' (2 hours)':active==='codex'?' (30 min)':'');});
      select.addEventListener('change',()=>{method=select.value;show(row);});picker.append(select);header.append(picker);
      const execution=methods[active];
      if(row.status==='ready'&&document.documentElement.dataset.media!=='off'){
        const pair=make('div','source-motion-pair');pair.dataset.syncedVideos='duration';
        const entries=[];
        if(row.human?.status==='ready') entries.push([row.human,'Human reference · SMPL']);
        entries.push([execution,active==='codex120'?'Astra with refinement':active==='codex'?'Astra with refinement, 30 min':execution.label]);
        for(const [media,label] of entries){
          const figure=make('figure','source-motion-card'),video=make('video');
          Object.assign(video,{src:media.video,poster:media.poster||'',controls:true,muted:true,autoplay:true,loop:true,playsInline:true,preload:'none'});
          video.setAttribute('aria-label',row.title+': '+label);figure.append(make('figcaption','',label),video);pair.append(figure);
        }
        player.append(pair);
      }else if(row.poster){const image=make('img');Object.assign(image,{src:row.poster,alt:row.title});player.append(image);}
      else player.append(make('p','showcase-pending','GPU Blender render in progress.'));
      if(execution.display_note)player.append(make('p','showcase-caption',execution.display_note));
    }
    function choose(name){
      dataset=name;const rows=data.clips.filter(r=>r.dataset===name);buttons.forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.dataset===name));b.tabIndex=b.dataset.dataset===name?0:-1;});
      panel.setAttribute('aria-labelledby','showcase-tab-'+name);list.replaceChildren();
      for(const row of rows){const b=make('button','showcase-choice');b.type='button';b.dataset.clip=row.clip;
        if(row.poster){const image=make('img');Object.assign(image,{src:row.poster,alt:'',loading:'lazy'});b.append(image);}
        b.append(make('span','',row.title));b.addEventListener('click',()=>show(row));list.append(b);
      }show(rows.find(r=>r.status==='ready')||rows[0]);list.scrollTop=0;list.scrollLeft=0;
    }
    for(const name of ['humoto','omomo']){const b=make('button','',name.toUpperCase());b.type='button';b.dataset.dataset=name;b.id='showcase-tab-'+name;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.addEventListener('click',()=>choose(name));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const other=name==='humoto'?'omomo':'humoto';choose(other);buttons.find(x=>x.dataset.dataset===other).focus();}});tabs.append(b);buttons.push(b);}
    document.querySelectorAll('[data-showcase-method]').forEach(link=>link.addEventListener('click',()=>{method=link.dataset.showcaseMethod;const row=data.clips.find(r=>r.clip===chosen);if(row)show(row);}));
    choose(dataset);
  }).catch(e=>root.append(make('p','',`Showcase could not load: ${e.message}`)));
})();
