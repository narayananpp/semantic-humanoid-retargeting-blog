(() => {
  for (const showcase of document.querySelectorAll('[data-text-motion-showcase]')) {
    const select = showcase.querySelector('[data-text-motion-select]');
    const examples = [...showcase.querySelectorAll('[data-text-motion-example]')];
    const update = () => {
      for (const example of examples) {
        example.hidden = example.dataset.textMotionExample !== select.value;
        if (example.hidden) example.querySelector('video').pause();
      }
    };
    select.addEventListener('change', update);
    update();
  }
})();
