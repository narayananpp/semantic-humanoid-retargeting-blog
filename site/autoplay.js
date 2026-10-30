/* Play the visible examples automatically; keep hidden tabs and offscreen videos idle. */
(() => {
  if (document.documentElement.dataset.media === 'off') return;
  const watched = new Set();
  const userPaused = new WeakSet();
  function visible(video) {
    if (document.hidden || !video.isConnected || !video.getClientRects().length) return false;
    const rect = video.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  }
  function sync(video) {
    const active = visible(video);
    video.autoplay = active;
    if (active && !userPaused.has(video)) video.play().catch(() => {});
    else if (!active) video.pause();
  }
  const observer = new IntersectionObserver(entries => entries.forEach(({target}) => sync(target)), {threshold: [0, .15]});
  function register(video) {
    if (watched.has(video)) return;
    watched.add(video);
    video.muted = true; video.defaultMuted = true;
    video.playsInline = true;
    // The walkthrough tour uses 'ended' to advance its stages.
    video.loop = !video.hasAttribute('data-walkthrough-video');
    video.addEventListener('pointerdown', () => {
      video.dataset.userInteracting = 'true';
      setTimeout(() => delete video.dataset.userInteracting, 500);
    });
    video.addEventListener('pause', () => { if (video.dataset.userInteracting && visible(video)) userPaused.add(video); });
    video.addEventListener('play', () => userPaused.delete(video));
    video.addEventListener('loadedmetadata', () => sync(video));
    observer.observe(video);
    sync(video);
  }
  document.querySelectorAll('video').forEach(register);
  let frame;
  const refresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      document.querySelectorAll('video').forEach(register);
      for (const video of watched) {
        if (!video.isConnected) { observer.unobserve(video); watched.delete(video); }
        else sync(video);
      }
    });
  };
  new MutationObserver(records => {
    if (records.some(r => r.type === 'childList' || ['src','hidden','open'].includes(r.attributeName))) refresh();
  }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['src','hidden','open']});
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('visibilitychange', refresh);
})();
