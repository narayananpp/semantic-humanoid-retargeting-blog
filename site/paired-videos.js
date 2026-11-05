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
    let desired = true, visible = false, looping = false, disposed = false;
    const attempting = new Set(), interactionUntil = new WeakMap();
    const on = (node, event, handler) => { node.addEventListener(event, handler); listeners.push(() => node.removeEventListener(event, handler)); };
    const duration = v => Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const progress = v => normalized ? v.currentTime / duration(v) : v.currentTime;
    const at = (v, value) => normalized ? value * duration(v) : value;
    function pauseAll() {
      videos.forEach(v => { v.autoplay=false;if (!v.paused) { internalPause.add(v); v.pause(); } });
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
    function start() {
      rates();
      if (disposed || !desired || !visible || document.hidden || group.dataset.syncPaused === 'true') return;
      // A slow or unavailable clip must not block the other visible videos.
      videos.forEach(v => {
        v.autoplay = true;v.preload = 'auto';
        if (v.readyState < 2 || v.seeking || attempting.has(v)) return;
        if (v !== videos[0] && duration(videos[0]) && duration(v)) {
          const target = at(v, progress(videos[0]));
          if (Math.abs(v.currentTime - target) > .25) seek(v, target);
        }
        if (!v.paused) return;
        attempting.add(v);internalPlay.add(v);
        v.play().catch(() => { internalPlay.delete(v); }).finally(() => {
          attempting.delete(v);
          if (disposed || !desired || !visible || document.hidden || group.dataset.syncPaused === 'true') pauseAll();
        });
      });
    }
    videos.forEach(v => {
      v.autoplay = false;v.loop = true;v.muted = true;v.defaultMuted = true;v.playsInline = true;
      on(v, 'pointerdown', () => interactionUntil.set(v, performance.now()+1000));
      on(v, 'keydown', () => interactionUntil.set(v, performance.now()+1000));
      on(v, 'play', () => {
        if (internalPlay.delete(v)) return;
        desired = true;start();
      });
      on(v, 'pause', () => {
        if (internalPause.delete(v) || v.ended || looping) return;
        // Browsers also pause media during scrolling, buffering and tab changes.
        // Only an interaction with the video controls counts as a user pause.
        if (!visible || document.hidden || v.readyState < 2 || v.seeking || performance.now() > (interactionUntil.get(v) || 0)) return;
        desired = false;videos.forEach(x => {x.autoplay=false;});pauseAll();
      });
      on(v, 'seeking', () => {
        if (internalSeek.has(v)) return;
        pauseAll();videos.filter(x => x !== v).forEach(x => seek(x, at(x, progress(v))));
      });
      on(v, 'seeked', () => { internalSeek.delete(v);start(); });
      on(v, 'canplay', start);on(v, 'loadeddata', start);on(v, 'loadedmetadata', start);
      on(v, 'emptied', () => { internalSeek.delete(v);desired=true; });
      on(v, 'ended', () => {
        if (!desired || looping || v !== videos[0]) return;
        looping = true;videos.forEach(x => seek(x, 0));looping = false;start();
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
    // Retry muted autoplay after buffering, scrolling back, or browser restoration.
    on(window, 'pageshow', start);
    on(document, 'pointerup', start);on(document, 'keydown', start);
    const timer = setInterval(start, 500);
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
