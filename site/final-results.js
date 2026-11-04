(() => {
  const root = document.querySelector('[data-final-results]');
  if (!root) return;
  let dataset = 'humoto', metric = 'tracking';
  const panel = root.querySelector('[role="tabpanel"]');
  function render() {
    for (const image of root.querySelectorAll('[data-result-image]')) {
      image.closest('picture').hidden = image.dataset.resultImage !== `${dataset}-${metric}`;
    }
    panel.setAttribute('aria-labelledby', `result-${dataset} result-${metric}`);
  }
  for (const group of root.querySelectorAll('[role="tablist"]')) {
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus = false) {
      for (const item of tabs) {
        item.setAttribute('aria-selected', String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      }
      if (tab.dataset.resultDataset) dataset = tab.dataset.resultDataset;
      if (tab.dataset.resultMetric) metric = tab.dataset.resultMetric;
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
