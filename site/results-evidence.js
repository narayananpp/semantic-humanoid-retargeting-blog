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

/* All-task audit: original evidence, not summaries inferred from outcomes. */
(() => {
  const root = document.querySelector('[data-communication-audit]');
  if (!root) return;
  const details = root.querySelector('[data-audit-evidence]');
  const browser = root.querySelector('[data-audit-browser]');
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  let loaded = false;
  details.addEventListener('toggle', async () => {
    if (!details.open || loaded) return;
    loaded = true;
    browser.textContent = 'Loading recorded evidence…';
    try {
      const response = await fetch('assets/analysis/communication-behavior.json?v=1');
      if (!response.ok) throw Error(response.status);
      const data = await response.json();
      const controls = el('div', undefined, 'communication-audit-controls');
      const category = el('select'), dataset = el('select');
      category.setAttribute('aria-label', 'Audited behavior');
      dataset.setAttribute('aria-label', 'Trace dataset');
      for (const [key, item] of Object.entries(data.categories)) {
        const option = el('option', `${item.group === 'independent' ? 'Independent' : 'Collaborative'}: ${item.label}`);
        option.value = key; category.append(option);
      }
      category.value = 'reuse';
      for (const [key, title] of [['all', 'All tasks'], ['humoto', 'HUMOTO'], ['omomo', 'OMOMO']]) {
        const option = el('option', title); option.value = key; dataset.append(option);
      }
      const behaviorLabel = el('label', 'Behavior '), datasetLabel = el('label', 'Dataset ');
      behaviorLabel.append(category); datasetLabel.append(dataset);
      controls.append(behaviorLabel, datasetLabel);
      const definition = el('p', undefined, 'communication-audit-definition');
      const count = el('p', undefined, 'communication-audit-count');
      const list = el('div', undefined, 'results-task-list');
      browser.replaceChildren(controls, definition, count, list);
      function render() {
        const key = category.value;
        definition.textContent = data.categories[key].definition;
        const records = data.records.filter(r => dataset.value === 'all' || r.dataset === dataset.value);
        const verified = records.filter(r => r.findings[key].status === 'verified');
        count.textContent = `${verified.length} of ${records.length} tasks verified. Remaining tasks have no qualifying evidence in this audit; this does not establish that the behavior was absent.`;
        list.replaceChildren();
        for (const row of [...verified, ...records.filter(r => r.findings[key].status !== 'verified')]) {
          const finding = row.findings[key];
          const task = el('details'), summary = el('summary');
          const title = row.clip.replace(/^sub\d+_/, '').replace(/[-_]\d+$/, '').replaceAll('_', ' ');
          summary.append(el('span', title), el('span', finding.status === 'verified' ? 'Verified' : 'Not established', 'results-verdicts'));
          task.append(summary);
          const body = el('div', undefined, 'communication-audit-task');
          body.append(el('div', row.clip, 'communication-audit-source'));
          body.append(el('p', `${row.dataset.toUpperCase()} · Independent: ${row.independent_success ? 'PASS' : 'FAIL'} · Collaborative: ${row.collaborative_success ? 'PASS' : 'FAIL'}`));
          if (key === 'reuse' && finding.status === 'verified') {
            body.append(el('strong', `Agent ${Number(finding.sender) + 1} → Agent ${Number(finding.receiver) + 1} · Completed test at ${finding.first_verified_minute.toFixed(1)} min`));
          }
          for (const id of finding.evidence || []) {
            const evidence = data.evidence[id];
            const section = el('section', undefined, 'communication-audit-quote');
            const heading = evidence.kind === 'received peer message'
              ? `Agent ${Number(evidence.sender) + 1} → Agent ${evidence.worker + 1} · Received message`
              : `Agent ${evidence.worker + 1} · ${evidence.kind === 'commandExecution' ? 'Executed command (excerpt)' : evidence.kind === 'dynamicToolCall' ? 'Communication tool record' : evidence.kind === 'analysis report' ? 'Saved report' : 'Recorded message'}`;
            section.append(el('strong', heading));
            section.append(el('blockquote', evidence.quote));
            section.append(el('div', `${evidence.file}:${evidence.line}`, 'communication-audit-source'));
            const provenance = el('details'), title = el('summary', 'Source fingerprint');
            provenance.append(title, el('code', evidence.source_sha256)); section.append(provenance);
            body.append(section);
          }
          if (finding.simulation_status) {
            const record = el('details'); record.append(el('summary', 'Saved simulation completion record'));
            record.append(el('p', `${finding.simulation_status} · ${finding.simulation_finished_at}`));
            record.append(el('div', finding.manifest, 'communication-audit-source'));
            record.append(el('code', finding.manifest_sha256)); body.append(record);
          }
          task.append(body); list.append(task);
        }
      }
      category.addEventListener('change', render); dataset.addEventListener('change', render); render();
    } catch (_) {
      loaded = false;
      browser.textContent = 'The evidence could not be loaded. Close and reopen this panel to retry.';
    }
  });
})();
