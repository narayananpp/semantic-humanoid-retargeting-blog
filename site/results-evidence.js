/* Final paired outcomes; intermediate semantic judgments are not inferred. */
(() => {
  const roots=[...document.querySelectorAll('[data-results-pairs]')];
  if(!roots.length)return;
  const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
  Promise.all([
    fetch('assets/analysis/retargeting-results.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}),
    fetch('dynamics-showcase.json?v=results-six-methods-1').then(r=>{if(!r.ok)throw Error(r.status);return r.json();})
  ]).then(([data,gallery])=>{
    const titles=new Map(gallery.clips.map(r=>[r.clip,r.title]));
    for(const root of roots){
      const methods=root.dataset.resultsPairs==='communication'?['orchestrator','communicating']:['communicating','codex120'];
      const byMethod=methods.map(m=>new Map(data.records.filter(r=>r.method===m).map(r=>[r.clip,r])));
      const controls=el('div',undefined,'results-evidence-controls');
      const label=el('label','Dataset '),select=el('select');select.setAttribute('aria-label','Evidence dataset');
      for(const [value,text] of [['all','All 40 tasks'],['humoto','HUMOTO'],['omomo','OMOMO']]){const option=el('option',text);option.value=value;select.append(option);}
      label.append(select);controls.append(label);const list=el('div',undefined,'results-task-list');root.append(controls,list);
      function render(){
        list.replaceChildren();
        for(const [clip,left] of byMethod[0]){
          if(select.value!=='all'&&left.dataset!==select.value)continue;
          const right=byMethod[1].get(clip),details=el('details'),summary=el('summary');
          const name=titles.get(clip)||clip.replace(/^sub\d+_/,'').replace(/[-_]\d+$/,'').replaceAll('_',' ');
          summary.append(el('span',name),el('span',`${left.semantic==='PASS'?'PASS':'FAIL'} / ${right.semantic==='PASS'?'PASS':'FAIL'}`,'results-verdicts'));
          details.append(summary);const pair=el('div',undefined,'results-judgment-pair');
          for(const record of [left,right]){
            const section=el('div');section.append(el('h5',data.methods[record.method]));
            const m=record.metrics;section.append(el('p',m?`ADD ${(m.mean_add_m*100).toFixed(2)} cm · Position ${(m.position_mean_m*100).toFixed(2)} cm · Orientation ${m.orientation_mean_deg.toFixed(2)}°`:'Tracking unavailable: incomplete execution.','results-numbers'));
            section.append(el('strong',record.semantic==='PASS'?'PASS':record.semantic==='FAIL_INCOMPLETE_EXECUTION'?'Incomplete execution':'FAIL'));
            if(record.judge_reason)section.append(el('blockquote',record.judge_reason));
            if(record.opening_review_reason)section.append(el('p','Opening-contact review: '+record.opening_review_reason));
            pair.append(section);
          }
          details.append(pair);list.append(details);
        }
      }
      select.addEventListener('change',render);render();
    }
  }).catch(()=>roots.forEach(root=>root.append(el('p','The recorded results could not be loaded. Please reload the page.'))));
})();
