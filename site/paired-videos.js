/* Matched clips share playback, seeking and looping as well as aligned frames. */
(() => {
  if (document.documentElement.dataset.media === 'off') return;
  document.querySelectorAll('[data-synced-videos]').forEach(group => {
    const videos = [...group.querySelectorAll('video')];
    if (videos.length < 2) return;
    const internalPause = new Set(), internalPlay = new Set(), internalSeek = new Set();
    let desired = true, visible = false, starting = false, looping = false;
    function pauseAll() {
      videos.forEach(video => {
        if (!video.paused) { internalPause.add(video); video.pause(); }
      });
    }
    function seek(video, time) {
      if (Math.abs(video.currentTime - time) < .025) return;
      internalSeek.add(video);
      video.currentTime = time;
    }
    function ready() { return videos.every(video => video.readyState >= 3 && !video.seeking); }
    function start() {
      if (!desired || !visible || document.hidden || starting || !ready()) return;
      starting = true;
      Promise.allSettled(videos.map(video => {
        if (!video.paused) return Promise.resolve();
        internalPlay.add(video);
        return video.play().catch(error => {
          internalPlay.delete(video);
          throw error;
        });
      })).then(results => {
        starting = false;
        looping = false;
        if (results.some(result => result.status === 'rejected')) {
          desired = false;
          pauseAll();
        }
      });
    }
    videos.forEach(video => {
      video.autoplay = false;
      video.loop = false; // Restart both clips together below.
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.playbackRate = 1;
      video.addEventListener('play', () => {
        if (internalPlay.delete(video)) return;
        desired = true;
        videos.filter(other => other !== video).forEach(other => seek(other, video.currentTime));
        start();
      });
      video.addEventListener('pause', () => {
        if (internalPause.delete(video) || video.ended || looping) return;
        desired = false;
        pauseAll();
      });
      video.addEventListener('seeking', () => {
        if (internalSeek.has(video)) return;
        pauseAll();
        videos.filter(other => other !== video).forEach(other => seek(other, video.currentTime));
      });
      video.addEventListener('seeked', () => { internalSeek.delete(video); start(); });
      video.addEventListener('waiting', () => { if (video.readyState < 3) pauseAll(); });
      video.addEventListener('canplay', start);
      video.addEventListener('ratechange', () => {
        videos.forEach(other => {
          if (other.playbackRate !== video.playbackRate) other.playbackRate = video.playbackRate;
        });
      });
      video.addEventListener('ended', () => {
        if (!desired || looping) return;
        looping = true;
        pauseAll();
        videos.forEach(other => seek(other, 0));
        start();
      });
    });
    pauseAll();
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        videos.forEach(video => { video.preload = 'auto'; });
        start();
      } else pauseAll();
    }, {threshold: .05}).observe(group);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseAll();
      else start();
    });
    function tick() {
      if (visible && desired && !document.hidden && ready()) {
        const master = videos[0];
        videos.slice(1).forEach(video => {
          if (Math.abs(video.currentTime - master.currentTime) > .1) seek(video, master.currentTime);
        });
        if (videos.some(video => video.paused)) start();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();
