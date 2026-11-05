/* Play the visible examples automatically; keep hidden tabs and offscreen videos idle. */
(() => {
  if (document.documentElement.dataset.media === 'off') return;
  const watched = new Set();
  const userPaused = new WeakSet();
  const blocked = new Set();
  function visible(video) {
    if (document.hidden || !video.isConnected || !video.getClientRects().length) return false;
    const rect = video.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  }
  function sync(video) {
    const active = visible(video);
    video.autoplay = active && !userPaused.has(video);
    if (active) video.preload = 'auto';
    if (active && !userPaused.has(video) && video.paused) {
      video.play().then(() => blocked.delete(video)).catch(error => {
        if (error.name === 'NotAllowedError') blocked.add(video);
      });
    }
    else if (!active) video.pause();
  }
  const observer = new IntersectionObserver(entries => entries.forEach(({target}) => sync(target)), {threshold: [0, .15]});
  function register(video) {
    // The architecture figure sequences its own clips.
    if (watched.has(video) || video.hasAttribute('data-architecture-clip') || (video.closest('[data-synced-videos]') && !video.hasAttribute('data-independent-playback'))) return;
    watched.add(video);
    video.muted = true; video.defaultMuted = true;
    video.playsInline = true;
    const playbackRate = Number(video.dataset.playbackRate);
    if (Number.isFinite(playbackRate) && playbackRate > 0) {
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
    }
    // The walkthrough tour uses 'ended' to advance its stages.
    video.loop = !video.hasAttribute('data-walkthrough-video');
    video.addEventListener('pointerdown', () => {
      video.dataset.userInteracting = 'true';
      setTimeout(() => delete video.dataset.userInteracting, 500);
    });
    video.addEventListener('pause', () => { if (video.dataset.userInteracting && visible(video)) userPaused.add(video); });
    video.addEventListener('play', () => userPaused.delete(video));
    video.addEventListener('loadedmetadata', () => sync(video));
    video.addEventListener('loadeddata', () => sync(video));
    video.addEventListener('canplay', () => sync(video));
    video.addEventListener('ended', () => { if (!video.hasAttribute('data-walkthrough-video')) sync(video); });
    video.addEventListener('emptied', () => { userPaused.delete(video); blocked.delete(video); });
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
    if (records.some(r => r.type === 'childList' || ['src','hidden','open','class','style','aria-hidden'].includes(r.attributeName))) refresh();
  }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['src','hidden','open','class','style','aria-hidden']});
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('scroll', refresh, {passive: true});
  window.addEventListener('resize', refresh, {passive: true});
  window.addEventListener('pageshow', refresh);
  setInterval(() => { if (!document.hidden) refresh(); }, 1000);
  for (const event of ['pointerup', 'keydown']) {
    document.addEventListener(event, () => { if (blocked.size) refresh(); }, {passive: true});
  }
})();
