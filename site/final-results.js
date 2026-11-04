(() => {
  const root = document.querySelector('[data-final-results]');
  if (!root) return;
  let dataset = 'humoto';
  const panel = root.querySelector('[role="tabpanel"]');
  function render() {
    for (const content of root.querySelectorAll('[data-result-content]')) {
      content.hidden = content.dataset.resultContent !== dataset;
    }
    panel.setAttribute('aria-labelledby', `result-${dataset}`);
  }
  for (const group of root.querySelectorAll('[role="tablist"]')) {
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus = false) {
      for (const item of tabs) {
        item.setAttribute('aria-selected', String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      }
      if (tab.dataset.resultDataset) dataset = tab.dataset.resultDataset;
      render();
      if (focus) tab.focus();
    }
    for (const tab of tabs) {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const index = tabs.indexOf(tab);
        const next = {ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0, End: tabs.length - 1}[event.key];
        if (next !== undefined) {
          event.preventDefault();
          select(tabs[next], true);
        }
      });
    }
  }
  render();
  root.querySelector('.final-results-controls').hidden = false;
})();
