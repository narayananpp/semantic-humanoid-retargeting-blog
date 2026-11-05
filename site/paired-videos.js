/* Comparison playback uses the human clip's duration, not physical elapsed time. */
(() => {
  if (document.documentElement.dataset.media === 'off') return;
  const groups = new Map();
  function attach(group) {
    const videos = [...group.querySelectorAll('video')].filter(v => v.closest('[data-synced-videos]') === group);
    if (!videos.length) return;
    const reference = document.querySelector(group.dataset.syncReference || ':not(*)') || videos[0];
    const normalized = group.dataset.syncedVideos === 'duration';
    const listeners = [], internalPause = new Set(), internalPlay = new Set(), internalSeek = new Set();
    let desired = true, visible = false, starting = false, looping = false, disposed = false;
    const on = (node, event, handler) => { node.addEventListener(event, handler); listeners.push(() => node.removeEventListener(event, handler)); };
    const duration = v => Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const progress = v => normalized ? v.currentTime / duration(v) : v.currentTime;
    const at = (v, value) => normalized ? value * duration(v) : value;
    function pauseAll() {
      videos.forEach(v => { if (!v.paused) { internalPause.add(v); v.pause(); } });
    }
    function seek(v, time) {
      if (!Number.isFinite(time) || !duration(v) || Math.abs(v.currentTime - time) < .04) return;
      internalSeek.add(v);v.currentTime = Math.max(0, Math.min(time, duration(v)));
    }
    function rates() {
      if (!duration(reference)) return;
      videos.forEach(v => {
        if (!duration(v)) return;
        const rate = normalized ? duration(v) / duration(reference) : 1;
        // Browsers support a bounded playback-rate range; drift correction handles extremes.
        const supported = Math.max(.0625, Math.min(16, rate));
        if (Math.abs(v.playbackRate - supported) > .001) v.playbackRate = supported;
      });
    }
    function ready() { return duration(reference) && videos.every(v => duration(v) && v.readyState >= 2 && !v.seeking); }
    function start() {
      rates();
      if (disposed || !desired || !visible || document.hidden || starting || group.dataset.syncPaused === 'true' || !ready()) return;
      let aligned = true;
      videos.slice(1).forEach(v => {
        const target = at(v, progress(videos[0]));
        if (Math.abs(v.currentTime - target) > .15) { seek(v, target);aligned = false; }
      });
      if (!aligned) return;
      starting = true;
      Promise.allSettled(videos.map(v => {
        if (!v.paused) return Promise.resolve();
        internalPlay.add(v);
        return v.play().catch(e => { internalPlay.delete(v); throw e; });
      })).then(results => {
        starting = false;looping = false;
        if (disposed || !visible || document.hidden || group.dataset.syncPaused === 'true') pauseAll();
        else if (results.some(r => r.status === 'rejected')) pauseAll();
      });
    }
    videos.forEach(v => {
      v.autoplay = false;v.loop = false;v.muted = true;v.defaultMuted = true;v.playsInline = true;
      on(v, 'play', () => {
        if (internalPlay.delete(v)) return;
        desired = true;videos.filter(x => x !== v).forEach(x => seek(x, at(x, progress(v))));start();
      });
      on(v, 'pause', () => {
        if (internalPause.delete(v) || v.ended || looping) return;
        desired = false;pauseAll();
      });
      on(v, 'seeking', () => {
        if (internalSeek.has(v)) return;
        pauseAll();videos.filter(x => x !== v).forEach(x => seek(x, at(x, progress(v))));
      });
      on(v, 'seeked', () => { internalSeek.delete(v);start(); });
      on(v, 'waiting', () => { if (v.readyState < 2) pauseAll(); });
      on(v, 'canplay', start);on(v, 'loadedmetadata', start);
      on(v, 'emptied', () => { internalSeek.clear();pauseAll();videos.forEach(x => seek(x, 0)); });
      on(v, 'ended', () => {
        if (!desired || looping) return;
        looping = true;pauseAll();videos.forEach(x => seek(x, 0));start();
      });
    });
    if (!videos.includes(reference)) { reference.preload = 'metadata';on(reference, 'loadedmetadata', start); }
    pauseAll();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && group.getClientRects().length > 0;
      if (visible) { videos.forEach(v => {v.preload = 'auto';});start(); } else pauseAll();
    }, {threshold: 0});observer.observe(group);
    on(document, 'visibilitychange', () => { if (document.hidden) pauseAll(); else start(); });
    on(group, 'comparison-resume', start);
    on(group, 'comparison-pause', pauseAll);
    on(group, 'comparison-restart', () => { desired = true;pauseAll();videos.forEach(v => seek(v, 0));start(); });
    const timer = setInterval(() => {
      if (disposed || !visible || !desired || document.hidden || group.dataset.syncPaused === 'true' || !ready()) return;
      const master = videos[0];
      videos.slice(1).forEach(v => { const target = at(v, progress(master));if (Math.abs(v.currentTime - target) > .15) seek(v, target); });
      if (videos.some(v => v.paused)) start();
    }, 200);
    groups.set(group, {videos, dispose() { disposed = true;clearInterval(timer);observer.disconnect();listeners.forEach(remove => remove());pauseAll(); }});
  }
  function refresh() {
    groups.forEach((state, group) => {
      if (!group.isConnected || state.videos.some(v => !group.contains(v))) {state.dispose();groups.delete(group);}
    });
    document.querySelectorAll('[data-synced-videos]').forEach(group => { if (!groups.has(group)) attach(group); });
  }
  refresh();
  new MutationObserver(records => { if (records.some(r => r.type === 'childList')) refresh(); }).observe(document.body, {childList:true,subtree:true});
})();
