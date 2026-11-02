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

/* Dataset tabs for the recorded matched-time ADD histories. */
(() => {
  for (const root of document.querySelectorAll('[data-matched-time-curves]')) {
    const tabs = [...root.querySelectorAll('[data-add-dataset]')];
    const individual = root.querySelector('[data-add-individual]');
    function select(tab, focus = false) {
      for (const item of tabs) {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
      }
      if (focus) tab.focus();
    }
    for (const tab of tabs) {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const index = tabs.indexOf(tab);
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      });
    }
    individual.addEventListener('change', () => {
      for (const img of root.querySelectorAll('[data-add-image]')) {
        const base = `assets/analysis/results/matched-time-add-${img.dataset.addImage}${individual.checked ? '-tasks' : ''}`;
        img.src = `${base}.svg`;
        img.closest('picture').querySelector('source').srcset = `${base}-mobile.svg`;
      }
    });
  }
})();

/* Original trace excerpts for the communication timeline. */
(() => {
  const roots = [...document.querySelectorAll('[data-communication-trace]')];
  if (!roots.length) return;
  const data = fetch('assets/analysis/communication-trace.json').then(response => {
    if (!response.ok) throw Error(response.status);
    return response.json();
  });
  for (const root of roots) {
    const details = root.querySelector('.communication-trace-source');
    const panel = root.querySelector('[data-communication-detail]');
    async function show(node) {
      details.open = true;
      panel.textContent = 'Loading original excerpt…';
      for (const other of root.querySelectorAll('[data-communication-event]')) other.classList.toggle('is-selected', other === node);
      try {
        const trace = await data;
        const event = trace.events.find(item => item.id === node.dataset.communicationEvent);
        if (!node.classList.contains('is-selected')) return;
        const heading = document.createElement('strong');
        heading.textContent = `${event.mode === 'independent' ? 'Independent' : 'Collaborative'} swarm · Worker ${event.worker + 1} · ${event.minute.toFixed(1)} min`;
        const quote = document.createElement('blockquote'); quote.textContent = event.quote;
        const source = document.createElement('div'); source.className = 'communication-trace-provenance';
        source.textContent = `${event.tool} · Worker ${String(event.worker).padStart(2, '0')} · ${event.source}:${event.line}`;
        const hash = document.createElement('div'); hash.className = 'communication-trace-provenance'; hash.textContent = `Source SHA-256: ${event.source_sha256}`;
        panel.replaceChildren(heading, quote, source, hash);
      } catch (_) { panel.textContent = 'The original excerpt could not be loaded. Please reload the page.'; }
    }
    for (const node of root.querySelectorAll('[data-communication-event]')) {
      node.addEventListener('click', () => show(node));
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(node); }
      });
    }
  }
})();
