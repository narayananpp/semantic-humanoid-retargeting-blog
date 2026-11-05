/* Render player controls in the page so CSS zoom scales the frame and controls together. */
(() => {
  const players = new WeakSet();
  const paths = {
    play:'M8 5l11 7-11 7z', pause:'M8 5v14M16 5v14',
    mute:'M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6',
    sound:'M11 5L6 9H3v6h3l5 4zM15 8q6 4 0 8M18 5q9 7 0 14',
    fullscreen:'M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6'
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}" fill="${name==='play'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  const time = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}` : '0:00';
  function attach(video) {
    if (players.has(video) || !video.controls) return;
    players.add(video);
    const player = document.createElement('div');player.className='scaled-video-player';
    const controls = document.createElement('div');controls.className='scaled-video-controls';
    controls.setAttribute('role','group');controls.setAttribute('aria-label',`${video.getAttribute('aria-label')||'Video'} playback controls`);
    controls.innerHTML=`<div class="scaled-video-buttons"><button type="button" data-video-play aria-label="Pause video">${icon('pause')}</button><span class="scaled-video-time"></span><span class="scaled-video-spacer"></span><button type="button" data-video-mute aria-label="Unmute video">${icon('mute')}</button><button type="button" data-video-fullscreen aria-label="Full screen">${icon('fullscreen')}</button></div><input class="scaled-video-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Video position">`;
    video.before(player);player.append(video,controls);video.controls=false;
    const play=controls.querySelector('[data-video-play]'),mute=controls.querySelector('[data-video-mute]'),full=controls.querySelector('[data-video-fullscreen]'),seek=controls.querySelector('input'),clock=controls.querySelector('.scaled-video-time');
    let scrubbing=false;
    function update() {
      const paused=video.paused;
      player.dataset.playing=String(!paused);
      if(play.dataset.paused!==String(paused)) {play.dataset.paused=String(paused);play.innerHTML=icon(paused?'play':'pause');play.setAttribute('aria-label',paused?'Play video':'Pause video');}
      if(mute.dataset.muted!==String(video.muted)) {mute.dataset.muted=String(video.muted);mute.innerHTML=icon(video.muted?'mute':'sound');mute.setAttribute('aria-label',video.muted?'Unmute video':'Mute video');}
      clock.textContent=`${time(video.currentTime)} / ${time(video.duration)}`;
      if(!scrubbing)seek.value=Number.isFinite(video.duration)&&video.duration>0?String(1000*video.currentTime/video.duration):'0';
      seek.disabled=!Number.isFinite(video.duration)||video.duration<=0;
      seek.setAttribute('aria-valuetext',`${time(video.currentTime)} of ${time(video.duration)}`);
    }
    play.addEventListener('click',()=>{
      // Inform the autoplay/synchronization managers that this is an explicit choice.
      video.dispatchEvent(new Event('video-control-interaction'));
      if(video.paused) video.play().catch(()=>{});else video.pause();
    });
    mute.addEventListener('click',()=>{video.muted=!video.muted;});
    seek.addEventListener('input',()=>{
      if(!Number.isFinite(video.duration))return;
      scrubbing=true;video.currentTime=video.duration*Number(seek.value)/1000;
    });
    seek.addEventListener('change',()=>{scrubbing=false;update();});
    full.addEventListener('click',async()=>{
      try {
        if(document.fullscreenElement===player)await document.exitFullscreen();
        else if(player.requestFullscreen)await player.requestFullscreen();
        else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
      }catch(_){}
    });
    for(const event of ['play','pause','timeupdate','durationchange','loadedmetadata','volumechange','ended','emptied'])video.addEventListener(event,update);
    update();
  }
  function refresh(){document.querySelectorAll('video[controls]').forEach(attach);}
  refresh();
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
})();
