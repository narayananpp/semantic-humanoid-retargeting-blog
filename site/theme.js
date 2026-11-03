/* Light/dark theme: follows the system until the reader picks one, then remembers it. */
(() => {
  const key = 'humotar-theme';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  } catch (error) {}
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : system.matches);
  const label = button => {
    button.textContent = isDark() ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-pressed', String(isDark()));
  };
  const relabel = () => document.querySelectorAll('[data-theme-toggle]').forEach(label);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      label(button);
      button.addEventListener('click', () => {
        const next = isDark() ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem(key, next); } catch (error) {}
        relabel();
      });
    });
  });
  if (system.addEventListener) system.addEventListener('change', relabel);
})();
