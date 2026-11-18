/* BRAT/STAGE v5.1 — shared full-screen lyrics extension for Spicetify and SpotiKit.
 * No third-party JS dependencies. LRCLIB lyric text belongs to its respective holders.
 * THIS_FILE_IS_COMPILED with src/core.js + src/style.css; see scripts/build.py.
 */
function BratStageBootstrap(runtime, lifecycle) {
  'use strict';
  runtime = runtime || window.Spicetify;
  lifecycle = lifecycle || null;
  if (window.__bratStageLoaded) {
    console.warn("[BratStage] Already loaded; disable the duplicate installation.");
    return () => {};
  }
  if (!runtime?.Player || !runtime?.Platform) {
    if (!lifecycle) setTimeout(() => BratStageBootstrap(), 250);
    return () => {};
  }
  window.__bratStageLoaded = true;

  const C = BratStageCore;
  const PREFIX = 'bratstage:v1:'; // retain v1 keys to migrate existing preferences
  const S = runtime;
  const PLATFORM = lifecycle ? "SpotiKit" : "Spicetify";
  const globalListeners = [];
  const ownedButtons = [];
  let disposed = false;
  const listenGlobal = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    globalListeners.push(() => target.removeEventListener(type, fn, options));
  };
  const FONTS = {
    brutal: 'Arial, Helvetica, sans-serif',
    black: '"Arial Black", Impact, Arial, sans-serif',
    condensed: 'Impact, "Arial Narrow", sans-serif',
    rounded: '"Trebuchet MS", Verdana, sans-serif',
    geometric: '"Century Gothic", Futura, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", monospace',
    system: 'system-ui, -apple-system, sans-serif',
    neo: 'Helvetica Neue, Arial, sans-serif',
    poster: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
    cinematic: 'Arial, Helvetica, sans-serif'
  };
  const PRESETS = {
    brat:      { label:'BRAT CLASSIC', tagline:'neon & unhinged', bg:'#8ace27', fg:'#11150b', accent:'#c7ff63', font:'brutal', motion:'glide', effect:'grain', beatMode:'off', phraseMode:'wash', bgMode:'solid', lyricDisplay:'square', fontSize:118 },
    noir:      { label:'MIDNIGHT', tagline:'apple-inspired', bg:'#101316', fg:'#f2f2ed', accent:'#a7c6ff', font:'geometric', motion:'cinema', effect:'glow', beatMode:'off', phraseMode:'wash', bgMode:'album', lyricDisplay:'stack', visibleLines:4 },
    bubblegum: { label:'POPSTAR', tagline:'bubblegum rush', bg:'#f8a4bd', fg:'#29101b', accent:'#ffeb8e', font:'black', motion:'pop', effect:'chromatic', beatMode:'off', phraseMode:'gradient', bgMode:'solid', lyricDisplay:'reveal' },
    blueprint: { label:'ELECTRIC', tagline:'icy electricity', bg:'#92cfff', fg:'#111c42', accent:'#ecfffc', font:'condensed', motion:'wipe', effect:'scanlines', beatMode:'off', phraseMode:'wash', bgMode:'solid' },
    cherry:    { label:'AFTERHOURS', tagline:'red room', bg:'#9b172e', fg:'#fff2dc', accent:'#f9c3a0', font:'serif', motion:'blur', effect:'vignette', beatMode:'off', phraseMode:'wash', bgMode:'solid' },
    paper:     { label:'EDITORIAL', tagline:'clean & loud', bg:'#efece0', fg:'#22221b', accent:'#b4dd46', font:'mono', motion:'snap', effect:'none', beatMode:'off', phraseMode:'wash', bgMode:'solid' }
  };
  const DEFAULT = {
    theme:'brat', bg:'#8ace27', fg:'#11150b', accent:'#c7ff63', font:'brutal', fontSize:112,
    motion:'glide', effect:'none', visibleLines:4, textCase:'lowercase', dim:30,
    fontWeight:900, lineSpacing:14, lyricsAlign:'center', layoutLeft:42, coverWidth:450,
    bgMode:'solid', beatMode:'off', phraseMode:'wash', phraseDuration:950, beatIntensity:55, backgroundBlur:28, backgroundOpacity:76,
    bpm:120, lyricsOffset:0, videoOffset:0, videoUrl:'', imageUrl:'',
    reduceMotion:false, showHints:false, fullscreenOnOpen:false, hideCursor:true,
    showArtwork:false, showTrackInfo:false, lyricDisplay:'square', autoFit:true, autoFitMin:28,
    motionDuration:460, wordEffect:'brat', wordMode:'automatic', autoHideMs:2600, hideControls:true, videoPlacement:'background', autoVideo:false, youtubeApiKey:'', betterLyricsApiKey:'',
    beatOffset:0, bgPalette:'custom', beatSmoothing:65, paletteCadence:'every', infoPlacement:'dock', captionGuard:18
  };
  const svgs = {
    play:'<path d="m9 6 10 6-10 6V6Z" fill="currentColor" stroke="none"/>',
    pause:'<rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    previous:'<path d="M6 5v14M19 5 9 12l10 7V5Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    next:'<path d="M18 5v14M5 5l10 7-10 7V5Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    settings:'<path d="M12 2.8 14 4l2.3-.5 1.2 2 2.3.6.1 2.4 1.6 1.8-1 2.3 1 2.3-1.6 1.8-.1 2.4-2.3.6-1.2 2-2.3-.5-2 1.2-2-1.2-2.3.5-1.2-2-2.3-.6-.1-2.4-1.6-1.8 1-2.3-1-2.3 1.6-1.8.1-2.4 2.3-.6 1.2-2 2.3.5z"/><circle cx="12" cy="12" r="3.2"/>',
    exit:'<path d="M6 6 18 18M18 6 6 18" stroke-width="2" stroke-linecap="round"/>',
    expand:'<path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6" stroke-width="2" stroke-linecap="round"/>',
    shrink:'<path d="M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6" stroke-width="2" stroke-linecap="round"/>',
    minimize:'<path d="M5 12h14" stroke-width="2.2" stroke-linecap="round"/>',
    volume:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M17 9c1.8 1.7 1.8 4.3 0 6M19 6c3.8 3.1 3.8 8.9 0 12" stroke-linecap="round"/>',
    mute:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
    stage:'<rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5" stroke-width="1.55"/><path d="M8.2 6.9v10.2" stroke-width="2.45" stroke-linecap="round"/><path d="M9.8 12.3c1.2-1.5 3.5-2 5-1 2.4 1.6 1.7 5.5-1.7 5.9-1.8.2-3.1-.6-3.8-1.8" stroke-width="2.35" stroke-linecap="round"/><circle cx="17.05" cy="7.25" r="1.3" fill="currentColor" stroke="none"/>',
    music:'<path d="M9 18V5l12-2v13M9 18c0 3-6 3-6 0s6-3 6 0Zm12-2c0 3-6 3-6 0s6-3 6 0Z"/>',
    video:'<rect x="3" y="5" width="15" height="14" rx="2"/><path d="m18 10 4-3v10l-4-3z"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" stroke-linecap="round" stroke-linejoin="round"/>',
    repeatOne:'<path d="m17 2 4 4-4 4M3 10V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 14v1a3 3 0 0 1-3 3H3" stroke-linecap="round" stroke-linejoin="round"/><text x="12" y="15.25" font-family="Arial,sans-serif" font-size="9" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle">1</text>'
  };
  const ico = (name, sz=20) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true">${svgs[name] || ''}</svg>`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const $ = (s, scope=document) => scope.querySelector(s);
  const storeGet = (key) => { try { return S.LocalStorage?.get?.(PREFIX + key) ?? localStorage.getItem(PREFIX + key); } catch { return null; } };
  const storeSet = (key, val) => { try { if (S.LocalStorage?.set) S.LocalStorage.set(PREFIX + key, val); else localStorage.setItem(PREFIX + key, val); return true; } catch (e) { console.warn('[BratStage] Storage full/unavailable', e); return false; } };
  const storeDel = (key) => { try { S.LocalStorage?.remove?.(PREFIX + key); localStorage.removeItem(PREFIX + key); } catch {} };
  const getJson = (key, fallback) => { try { return JSON.parse(storeGet(key)) || fallback; } catch { return fallback; } };
  const safeHex = (value, fallback) => /^#[\da-fA-F]{6}$/.test(value || '') ? value : fallback;
  const VALID = {
    theme:['custom', ...Object.keys(PRESETS)], font:Object.keys(FONTS), motion:['snap','fade','slide','pop','blur','flip','whip','cinema','wipe','glide','type'],
    effect:['none','grain','scanlines','glow','chromatic','vignette'],
    bgMode:['solid','album','image','video'], beatMode:['off','pulse','invert','shift','ambient','lyricFlip'],
    textCase:['lowercase','none','uppercase'], lyricsAlign:['left','center','right'],
    lyricDisplay:['stack','spotlight','square','locked','reveal'], wordEffect:['brat','silk','wipe','glow','snap','none'],phraseMode:['wash','flip','gradient','off'], wordMode:['automatic','instant','estimated'],
    videoPlacement:['background','artwork'], bgPalette:['custom','album','cinema'], paletteCadence:['every','two','three','varied'], infoPlacement:['dock','left','hidden']
  };
  function validate(src) {
    const out = { ...DEFAULT };
    for (const key of Object.keys(DEFAULT)) {
      const x = src?.[key];
      if (x === undefined || x === null) continue;
      if (VALID[key]) out[key] = VALID[key].includes(x) ? x : out[key];
      else if (['bg','fg','accent'].includes(key)) out[key] = safeHex(x, out[key]);
      else if (typeof out[key] === 'boolean') out[key] = Boolean(x);
      else if (typeof out[key] === 'number') {
        const limits = {autoHideMs:[500,12000],phraseDuration:[200,3000],autoFitMin:[16,80],motionDuration:[150,1600],beatOffset:[-800,800],beatSmoothing:[0,100],captionGuard:[0,35],fontSize:[28,150],fontWeight:[500,900],lineSpacing:[0,36],layoutLeft:[28,60],coverWidth:[240,580],visibleLines:[1,11],dim:[5,80],beatIntensity:[0,100],backgroundBlur:[0,70],backgroundOpacity:[10,100],bpm:[50,220],lyricsOffset:[-5000,5000],videoOffset:[-30000,30000]};
        out[key] = C.clamp(x,...(limits[key] || [0,100]));
      } else if (typeof x === 'string') out[key] = x.slice(0,1000);
    }
    return out;
  }
  const oldSettings=getJson('settings',null);
  let settings = validate(oldSettings || DEFAULT);
  // Upgrade v1's default 64px lyric cap without erasing user-chosen themes or other preferences.
  if(oldSettings && oldSettings.lyricDisplay===undefined && Number(oldSettings.fontSize)===64){
    settings.fontSize=112;storeSet('settings',JSON.stringify(settings));
  }
  // One-time v3 migration: retain personal colors/video credentials and offsets,
  // but replace the broken v2 lyric-and-wheel defaults.
  if(!storeGet('migrated-v3')) {
    settings=validate({...settings,lyricDisplay:'square',motion:'cinema',beatMode:'off',
      wordMode:'automatic',motion:'glide',wordEffect:'brat',phraseMode:'wash',lyricsAlign:'center',hideControls:true,autoHideMs:2600});
    storeSet('settings',JSON.stringify(settings));storeSet('migrated-v3','yes');
  }
  let customLrc = getJson('customLrc', {});
  let trackVideos = getJson('trackVideos', {});
  let trackOffsets = getJson('trackOffsets', {});
  let lyricCache = new Map();
  let open = false, minimized = false, settingsOpen = false, settingsTab = 'themes';
  let currentTrack = null, trackSeq = 0, currentLyrics = [], lyricsMode = 'loading', lyricsSource = '', activeLine = -99;
  let unsyncedStart = 0, audioBeats = [], beatState = 'bpm', beatIndex = -1, lastBeatKey = '';
  let root, mini, timer, toastTimer, fetchController, videoLoaded = false, videoAppliedId = null, lastVideoSync = 0;
  let imageObjectUrl = null, storedBackground = null, controls = {}, listening = [];
  let palette = null, ghostTimer=0, lastLineFlip=-1, lastRenderKey='', wordStep=-1;
  let youtubeSeq=0, videoTime=null, videoLastSeek=0, videoStatus='idle', lastVideoMode='solid', tapBeats=[];
  let dialActive=null, wheelPreview={}, autoVideoResults={};
  let seekDragging = false, volumeDragging = false, settingsSelection = null;
  let uiHideTimer=0,uiPointerHeld=false,keyboardFocus=false, fittedWordStep=-888, wordAccuracy='line';
  let liveVideoTimer=null, sampledProgress=-1, sampledAt=0, lastClock=0, lastPaletteKey='';
  let playbackIntent=null, playbackIntentUntil=0, playbackCommandAt=-9999;
  let repeatIntent=null, repeatIntentUntil=0;
  // The v4 default only migrates layout/color settings, without deleting an existing key or per-track overrides.
  if(!storeGet('migrated-v4')) {
    const from=oldSettings||{};
    settings=validate({...settings,
      theme:from.bgPalette==='album'?'custom':'custom',infoPlacement:from.infoPlacement||'dock',
      lyricDisplay:'square',wordMode:'automatic',wordEffect:'brat',
      bgPalette:from.bgPalette==='album'?'album':'cinema',paletteCadence:'every',
      captionGuard:18});
    storeSet('settings',JSON.stringify(settings));storeSet('migrated-v4','yes');
  }
  function playbackMs() {
    const raw=Math.max(0,Number(S.Player.getProgress?.()||0));
    const now=performance.now(),playing=Boolean(S.Player.isPlaying?.());
    if(!playing || raw!==sampledProgress || Math.abs(raw-lastClock)>360) {
      sampledProgress=raw;sampledAt=now;lastClock=raw;
      return raw;
    }
    // Interpolate between discrete Spotify progress updates, capped to avoid drifting
    // when playback is buffering or the Spotify clock is stale.
    lastClock=raw+Math.min(230,Math.max(0,now-sampledAt));
    return lastClock;
  }
  function resetPlaybackClock() {sampledProgress=-1;sampledAt=0;lastClock=0;}


  function createUI() {
    if ($('#bs-root')) return;
    const style = document.createElement('style');
    style.id = 'bs-style';style.dataset.owner='brat-stage';
    style.textContent = window.__BRATSTAGE_CSS__ || '';
    document.head.append(style);
    root = document.createElement('div'); root.id = 'bs-root'; root.style.display = 'none'; root.setAttribute('aria-label','BratStage immersive music player');
    root.innerHTML = `
      <div class="bs-backdrop" aria-hidden="true">
        <img class="bs-bg-media" id="bs-bg-media" alt=""/>
        <iframe class="bs-bg-video" id="bs-bg-video" title="Muted YouTube music video" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>
        <div class="bs-video-caption-guard" id="bs-video-caption-guard"></div><div class="bs-bg-wash"></div><div class="bs-vignette"></div><div class="bs-noise"></div><div class="bs-scanlines"></div><div class="bs-pulse"></div>
      </div>
      <div class="bs-hotzone bs-hotzone-top" aria-hidden="true"></div>
      <div class="bs-hotzone bs-hotzone-bottom" aria-hidden="true"></div>
      <header class="bs-header bs-chrome" aria-label="Screen controls"><nav class="bs-head-actions" aria-label="Player options">
        <button type="button" class="bs-icon-btn" id="bs-minimize" aria-label="Minimize" title="Minimize">${ico('minimize')}</button>
        <button type="button" class="bs-icon-btn" id="bs-fullscreen" aria-label="Fullscreen" title="Fullscreen">${ico('expand')}</button>
        <button type="button" class="bs-icon-btn" id="bs-settings-btn" aria-label="Settings" title="Settings (Alt+S)">${ico('settings')}</button>
        <button type="button" class="bs-icon-btn" id="bs-close" aria-label="Close" title="Close (Esc)">${ico('exit')}</button>
      </nav></header>
      <main class="bs-main" id="bs-main">
        <section class="bs-now" id="bs-now" aria-label="Artwork and track">
          <div class="bs-cover-wrap"><img class="bs-cover" id="bs-cover" alt="Album cover"/><div class="bs-video-slot" id="bs-video-slot"></div></div>
          <div class="bs-now-meta"><h1 class="bs-track" id="bs-track"> </h1><div class="bs-artist" id="bs-artist"> </div><div class="bs-album" id="bs-album"> </div></div>
        </section>
        <section class="bs-lyrics" aria-label="Timed lyrics">
          <div id="bs-line-list" class="bs-line-list" aria-live="off"><div class="bs-lyrics-empty">Play a song</div></div>
          <div id="bs-lyric-ghost" class="bs-lyric-ghost" aria-hidden="true"></div>
        </section>
      </main>
      <footer class="bs-footer bs-chrome" aria-label="Playback controls">
        <div class="bs-progress-row"><span id="bs-elapsed">0:00</span><div class="bs-progress-track" id="bs-progress-track" role="slider" tabindex="0" aria-label="Seek in track" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="bs-progress-filled" id="bs-progress-filled"></div><div class="bs-progress-handle" id="bs-progress-handle"></div></div><span id="bs-duration">0:00</span></div>
        <div class="bs-footer-row">
          <div class="bs-dock-track" id="bs-dock-track"><img id="bs-dock-cover" alt=""/><span class="bs-dock-meta"><strong id="bs-dock-title"></strong><small id="bs-dock-artist"></small></span></div>
          <div class="bs-transport">
            <button type="button" class="bs-icon-btn bs-plain-button" id="bs-prev" title="Previous" aria-label="Previous track">${ico('previous',21)}</button>
            <button type="button" class="bs-play-button" id="bs-toggle" aria-label="Pause" title="Play / pause">${ico('pause',25)}</button>
            <button type="button" class="bs-icon-btn bs-plain-button" id="bs-next" title="Next" aria-label="Next track">${ico('next',21)}</button>
            <button type="button" class="bs-icon-btn bs-plain-button bs-repeat-button" id="bs-repeat" title="Repeat off" aria-label="Repeat off; click to repeat all" aria-pressed="false" data-mode="0">${ico('repeat',19)}</button>
          </div>
          <div class="bs-vol-area">
            <button type="button" class="bs-icon-btn bs-plain-button bs-video-toggle" id="bs-video-toggle" title="Toggle music video" aria-label="Toggle music video">${ico('video',18)}</button>
            <button type="button" class="bs-icon-btn bs-plain-button" id="bs-mute" aria-label="Mute / unmute" title="Mute / unmute">${ico('volume',19)}</button>
            <input id="bs-volume-range" class="bs-volume-range" type="range" aria-label="Volume" min="0" max="100" value="65" step="1" />
          </div>
        </div><div class="bs-bottom-hint" id="bs-hint">ALT+B · SPACE · ESC · [ ] SYNC</div>
      </footer>
      <div class="bs-settings-scrim" id="bs-settings-scrim"></div>
      <aside class="bs-settings" id="bs-settings" aria-label="BRAT/STAGE settings" aria-modal="true" role="dialog">
        <div class="bs-settings-header"><div><div class="bs-settings-title">customize.</div><div class="bs-settings-sub">BRAT/STAGE v5.1 · cinematic color</div></div><button type="button" class="bs-icon-btn" id="bs-settings-close" aria-label="Close settings">${ico('exit')}</button></div>
        <div class="bs-settings-tabs" id="bs-settings-tabs" role="tablist"></div>
        <div class="bs-settings-content" id="bs-settings-content"></div>
      </aside><div class="bs-toast" id="bs-toast" role="status"></div>`
    document.body.append(root);
    mini = document.createElement('div'); mini.id = 'bs-mini'; mini.innerHTML = `<img id="bs-mini-cover" alt=""/><div class="bs-mini-meta"><strong id="bs-mini-track">BRAT/STAGE</strong><span id="bs-mini-artist">Minimized</span></div><button id="bs-mini-open" aria-label="Restore player" title="Restore">${ico('expand',18)}</button><button id="bs-mini-close" aria-label="Dismiss mini player" title="Dismiss">×</button>`;
    document.body.append(mini);
    controls = {
      track:$('#bs-track'), artist:$('#bs-artist'), album:$('#bs-album'), cover:$('#bs-cover'),
      list:$('#bs-line-list'), ghost:$('#bs-lyric-ghost'),
      elapsed:$('#bs-elapsed'), duration:$('#bs-duration'), progress:$('#bs-progress-filled'), handle:$('#bs-progress-handle'),
      progressTrack:$('#bs-progress-track'), volume:$('#bs-volume-range'), toggle:$('#bs-toggle'), repeat:$('#bs-repeat'), mute:$('#bs-mute'),
      background:$('#bs-bg-media'), video:$('#bs-bg-video'), hint:$('#bs-hint')
    };
    bindUI(); renderTabs(); renderSettings(); applySettings(); refreshTrack(false);
  }

  function notify(message) {
    const n = $('#bs-toast'); if (!n || !open) { S.showNotification?.(message); return; }
    n.textContent = message;
    n.classList.add('bs-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.classList.remove('bs-visible'), 2500);
  }
  function iconButtonClick(id, action) { $(id).addEventListener('click', action); }
  function bindUI() {
    iconButtonClick('#bs-close', closePlayer);
    iconButtonClick('#bs-minimize', minimizePlayer);
    iconButtonClick('#bs-fullscreen', toggleFullscreen);
    iconButtonClick('#bs-settings-btn', () => toggleSettings(true));
    iconButtonClick('#bs-settings-close', () => toggleSettings(false));
    iconButtonClick('#bs-settings-scrim', () => toggleSettings(false));
    iconButtonClick('#bs-prev', () => S.Player.back());
    iconButtonClick('#bs-next', () => S.Player.next());
    iconButtonClick('#bs-toggle', requestPlaybackToggle);
    iconButtonClick('#bs-repeat', cycleRepeat);


    iconButtonClick('#bs-video-toggle', () => {
      if(settings.bgMode === 'video') setting('bgMode',lastVideoMode === 'video' ? 'solid' : lastVideoMode);
      else {lastVideoMode=settings.bgMode; setting('bgMode','video'); if(!C.videoId(trackVideos[currentTrack?.uri] || '') && !settings.youtubeApiKey) { toggleSettings(true); settingsTab='sync';renderTabs();renderSettings(); notify('Add a video URL or a YouTube API key for automatic matching.'); }}
    });
    iconButtonClick('#bs-mute', () => S.Player.toggleMute());
    iconButtonClick('#bs-mini-open', openPlayer);
    iconButtonClick('#bs-mini-close', () => { mini.classList.remove('bs-visible');minimized=false; });
    controls.list.addEventListener('click', (ev) => {
      const line = ev.target.closest('[data-line]');
      if (!line) return;
      const i = Number(line.dataset.line);
      if (currentLyrics[i]?.at !== null && Number.isFinite(currentLyrics[i]?.at)) {
        S.Player.seek(Math.max(0, currentLyrics[i].at - appliedOffset()));resetPlaybackClock();
      } else { unsyncedStart = Math.max(0, i - 1); renderLyrics(true); }
    });
    controls.list.addEventListener('wheel', (ev) => {
      if (lyricsMode !== 'plain') return;
      ev.preventDefault();
      unsyncedStart = C.clamp(unsyncedStart + Math.sign(ev.deltaY), 0, Math.max(0,currentLyrics.length - settings.visibleLines));
      renderLyrics(true);
    }, {passive:false});
    $('#bs-settings-tabs').addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-tab]');
      if (!t) return;
      settingsTab = t.dataset.tab; renderTabs(); renderSettings();
    });
    const panel = $('#bs-settings-content');
    panel.addEventListener('click', settingsClick);
    panel.addEventListener('change', settingsChange);
    panel.addEventListener('input', settingsInput);
    panel.addEventListener('paste',event=>{if(event.target?.id==='bs-video-url'){
      clearTimeout(liveVideoTimer);liveVideoTimer=setTimeout(()=>commitVideoLink(false),60);
    }});
    panel.addEventListener('keydown',event=>{if(event.target?.id==='bs-video-url'&&event.key==='Enter'){
      event.preventDefault();clearTimeout(liveVideoTimer);commitVideoLink(true);
    }});
    setupDials();setupAutoHide();
    root.addEventListener('dblclick', (e) => { if (e.target.id === 'bs-cover') toggleFullscreen(); });
    listenGlobal(window,'message',handleYoutubeMessage);
    listenGlobal(document,'fullscreenchange', () => {
      if ($('#bs-fullscreen')) $('#bs-fullscreen').innerHTML = ico(document.fullscreenElement === root ? 'shrink' : 'expand');
      root?.classList.toggle('bs-native-fullscreen',document.fullscreenElement===root);
    });
  }

  // Spotify reports playback state asynchronously. Use explicit play/pause commands,
  // keep the visual state optimistic briefly, and never regenerate the button SVG
  // on every animation frame (doing that can cancel pointer clicks mid-press).
  function renderPlaybackButton(playing) {
    if (!controls.toggle) return;
    const state = String(Boolean(playing));
    if (controls.toggle.dataset.playing !== state) {
      controls.toggle.innerHTML = ico(playing ? 'pause' : 'play', 27);
      controls.toggle.dataset.playing = state;
    }
    const action = playing ? 'Pause' : 'Play';
    if (controls.toggle.getAttribute('aria-label') !== action)
      controls.toggle.setAttribute('aria-label',action);
    controls.toggle.title=action;
  }
  function displayedPlaybackState(actual) {
    if (playbackIntent !== null) {
      if (actual === playbackIntent || performance.now() > playbackIntentUntil) playbackIntent = null;
      else return playbackIntent;
    }
    return actual;
  }
  function requestPlaybackToggle() {
    const now=performance.now();
    if (now-playbackCommandAt < 190) return; // avoids accidental double-taps
    const playing=Boolean(S.Player.isPlaying?.());
    const next=!playing;
    playbackCommandAt=now;
    playbackIntent=next;
    playbackIntentUntil=now+1100;
    renderPlaybackButton(next);
    try {
      const op = next ? (S.Player.play || S.Player.togglePlay) : (S.Player.pause || S.Player.togglePlay);
      const result=op?.call(S.Player);
      if(result && typeof result.catch==='function') result.catch(err=>{
        playbackIntent=null;
        console.warn('[BratStage] Playback command failed:',err);
        notify('Spotify could not change playback.');
        tick();
      });
    } catch(err) {
      playbackIntent=null;
      console.warn('[BratStage] Playback command failed:',err);
      notify('Spotify could not change playback.');
    }
  }
  function renderRepeatButton(mode) {
    if (!controls.repeat) return;
    mode=[0,1,2].includes(mode)?mode:0;
    if (controls.repeat.dataset.mode !== String(mode)) {
      controls.repeat.innerHTML=ico(mode===2?'repeatOne':'repeat',20);
      controls.repeat.dataset.mode=String(mode);
    }
    const label=mode===0?'Repeat off; click to repeat all':mode===1?'Repeat all; click to repeat this song':'Repeat one; click to turn repeat off';
    controls.repeat.setAttribute('aria-label',label);
    controls.repeat.title=mode===0?'Repeat off':mode===1?'Repeat all':'Repeat one';
    controls.repeat.setAttribute('aria-pressed',String(mode!==0));
  }
  function displayedRepeatMode(actual) {
    if(repeatIntent !== null) {
      if(actual===repeatIntent || performance.now()>repeatIntentUntil) repeatIntent=null;
      else return repeatIntent;
    }
    return actual;
  }
  function cycleRepeat() {
    const actual=Number(S.Player.getRepeat?.()??0);
    const current=displayedRepeatMode(actual);
    const next=(current+1)%3;
    repeatIntent=next;repeatIntentUntil=performance.now()+1100;
    renderRepeatButton(next);
    try {
      const result=S.Player.setRepeat?.(next);
      if(result && typeof result.catch==='function') result.catch(err=>{
        repeatIntent=null;
        console.warn('[BratStage] Repeat command failed:',err);
        notify('Could not change repeat mode.');
        tick();
      });
    }catch(err){
      repeatIntent=null;
      console.warn('[BratStage] Repeat command failed:',err);
      notify('Could not change repeat mode.');
    }
  }
  function rootIsActive() { return root && root.style.display !== 'none'; }
  function openPlayer() {
    if (!root) createUI();
    open = true; minimized = false; mini.classList.remove('bs-visible'); root.style.display = 'flex';
    refreshTrack(true); applySettings();
    if(timer)cancelAnimationFrame(timer); tick(); timer=requestAnimationFrame(frame);
    revealControls();
    if (settings.fullscreenOnOpen && document.fullscreenEnabled && document.fullscreenElement !== root) {
      root.requestFullscreen?.().catch(() => {});
    }
  }
  function closePlayer() {
    toggleSettings(false);
    open = false; minimized = false;
    root.style.display = 'none'; mini.classList.remove('bs-visible');
    if (document.fullscreenElement === root) document.exitFullscreen?.().catch(() => {});
    if(timer)cancelAnimationFrame(timer);timer=null;clearTimeout(uiHideTimer);videoPause();
  }
  function minimizePlayer() {
    if (!root) return;
    open = false; minimized = true; toggleSettings(false);
    root.style.display = 'none'; mini.classList.add('bs-visible');
    if (document.fullscreenElement === root) document.exitFullscreen?.().catch(() => {});
    if(timer)cancelAnimationFrame(timer);timer=null;clearTimeout(uiHideTimer);videoPause(); updateMini();
  }
  async function toggleFullscreen() {
    if (!rootIsActive()) return;
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else if (root.requestFullscreen) await root.requestFullscreen();
      else notify('OS fullscreen is not available; immersive overlay is still active.');
    } catch { notify('OS fullscreen was blocked by Spotify; immersive overlay is still active.'); }
  }
  function toggleSettings(value) {
    settingsOpen = Boolean(value); root.classList.toggle('bs-settings-open', settingsOpen);
    if (settingsOpen) { revealControls();renderTabs();renderSettings();$('#bs-settings-close').focus(); }
    else {if(root.contains(document.activeElement))document.activeElement?.blur?.();keyboardFocus=false;scheduleHide();}
  }
  function revealControls(){
    if(!rootIsActive())return;
    root.classList.remove('bs-ui-hidden');
    scheduleHide();
  }
  function scheduleHide(){
    clearTimeout(uiHideTimer);
    if(!settings.hideControls||!rootIsActive()||settingsOpen||uiPointerHeld)return;
    uiHideTimer=setTimeout(()=>{
      if(!settingsOpen&&!uiPointerHeld&&!keyboardFocus)root.classList.add('bs-ui-hidden');
      else scheduleHide();
    },settings.autoHideMs);
  }
  function setupAutoHide(){
    let last=0;
    root.addEventListener('pointermove',e=>{
      if(performance.now()-last<90)return;
      last=performance.now();revealControls();
    },{passive:true});
    root.addEventListener('pointerdown',()=>{keyboardFocus=false;uiPointerHeld=true;revealControls();});
    listenGlobal(window,'pointerup',()=>{uiPointerHeld=false;scheduleHide();});
    root.addEventListener('focusin',revealControls);
    root.addEventListener('focusout',()=>setTimeout(()=>{if(!root.matches(':focus-within'))keyboardFocus=false;scheduleHide();},100));
    root.addEventListener('keydown',e=>{if(e.key==='Tab')keyboardFocus=true;revealControls();});
  }

  function updateMini() {
    if (!currentTrack) return;
    $('#bs-mini-track').textContent = currentTrack.name;
    $('#bs-mini-artist').textContent = currentTrack.artist;
    $('#bs-mini-cover').src = currentTrack.cover || '';
  }
  function keyboard(e) {
    const tag = e.target?.tagName?.toLowerCase();
    const editing = ['input','textarea','select'].includes(tag) || e.target?.isContentEditable;
    if (e.altKey && e.code === 'KeyB') { e.preventDefault();rootIsActive() ? closePlayer() : openPlayer();return; }
    if (!rootIsActive()) return;
    if (e.key === 'Escape') { e.preventDefault();settingsOpen ? toggleSettings(false) : closePlayer(); return; }
    if (editing) return;
    if (e.altKey && e.code === 'KeyS') {e.preventDefault();toggleSettings(!settingsOpen);return;}
    if (settingsOpen) return;
    if (e.key === '[' || e.key === ']') { e.preventDefault(); setOffset(appliedOffset() + (e.key === ']' ? 50 : -50));return; }
    if (e.code === 'Space') {e.preventDefault();requestPlaybackToggle();return;}
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();S.Player.seek(Math.max(0, C.clamp(S.Player.getProgress() + (e.code === 'ArrowRight'?5000:-5000), 0, S.Player.getDuration())));
    }
  }

  function toCoverUrl(url) {
    const raw=String(url || '');
    if (/^spotify:image:[a-zA-Z0-9]+$/.test(raw)) return `https://i.scdn.co/image/${raw.split(':')[2]}`;
    return raw;
  }
  function getTrack() {
    const item = S.Player.data?.item || S.Player.data?.track;
    if (!item?.uri) return null;
    const m = item.metadata || {};
    return {
      uri:item.uri,
      name:item.name || m.title || m.track_name || 'Unknown track',
      artist:m.artist_name || item.artists?.map(x => x.name).join(', ') || item.artist?.name || 'Unknown artist',
      album:m.album_title || item.album?.name || 'Single',
      cover:toCoverUrl(m.image_url || m.image_xlarge_url || m.image_large_url || item.album?.images?.[0]?.url || item.image_url || ''),
      duration:Number(S.Player.getDuration?.() || m.duration || item.duration?.milliseconds || 0)
    };
  }
  function refreshTrack(force) {
    const t = getTrack();
    const changed = (t?.uri || '') !== (currentTrack?.uri || '');
    if (!changed && !force) return;
    if (changed) {
      ++trackSeq;lastLineFlip=-1;wordStep=-1;palette=null;tapBeats=[];lastPaletteKey='';resetPlaybackClock();
      fetchController?.abort();
      audioBeats=[];beatIndex=-1;lastBeatKey='';beatState='bpm';
      currentLyrics=[];activeLine=-99;unsyncedStart=0;lyricsMode='loading';lyricsSource='';
    }
    currentTrack=t;
    if (!t) {
      controls.track.textContent='No track playing';controls.artist.textContent='Start playback in Spotify';
      controls.album.textContent='SPOTIFY DESKTOP';controls.cover.removeAttribute('src');
      $('#bs-dock-title').textContent='Not playing';$('#bs-dock-artist').textContent='Spotify';$('#bs-dock-cover').removeAttribute('src');
      controls.list.innerHTML='<div class="bs-lyrics-empty">play something.<small>BRAT/STAGE wakes up when Spotify does.</small></div>';
      controls.background.removeAttribute('src');
      updateVideo();return;
    }
    controls.track.textContent=t.name;
    extractCoverPalette(t.cover,trackSeq);
    controls.artist.textContent=t.artist;
    controls.album.textContent=t.album || 'SINGLE';
    controls.cover.src=t.cover || '';
    const dockCover=$('#bs-dock-cover');if(dockCover)dockCover.src=t.cover||'';
    const dockTitle=$('#bs-dock-title');if(dockTitle)dockTitle.textContent=t.name;
    const dockArtist=$('#bs-dock-artist');if(dockArtist)dockArtist.textContent=t.artist;
    controls.cover.alt=`Album artwork for ${t.name}`;
    controls.background.src=t.cover || '';
    controls.duration.textContent=C.time(t.duration);

    updateMini(); updateVideo();
    if (changed && settings.bgMode==='video') syncVideo(true);
    if (changed) { loadLyrics(t,trackSeq); loadAudioAnalysis(t,trackSeq); }
    else if (force && !currentLyrics.length) loadLyrics(t,trackSeq);
  }

  async function fetchJson(url, signal, extraHeaders={}) {
    const response = await fetch(url, {signal,headers:{Accept:'application/json',...extraHeaders}});
    if (response.status === 429) throw new Error('Lyric service rate limit reached; retry later.');
    if (!response.ok) throw new Error(`Lyrics provider returned HTTP ${response.status}`);
    return response.json();
  }
  async function fetchPreciseLyrics(t,signal) {
    const search=new URLSearchParams({s:t.name,a:t.artist,al:t.album||'',d:String(Math.round(t.duration/1000))});
    const rawId=(t.uri||'').match(/^spotify:track:([a-zA-Z0-9]{22})$/)?.[1];
    const providerFetch=async(url,label,transform)=>{
      const local=new AbortController();
      const cancel=()=>local.abort();signal.addEventListener('abort',cancel,{once:true});
      const timeout=setTimeout(cancel,4300);
      try{
        const result=await fetchJson(url,local.signal,label.startsWith('BETTER')&&settings.betterLyricsApiKey.trim()?{'X-API-Key':settings.betterLyricsApiKey.trim()}:{});
        const content=transform(result);
        const lines=typeof content==='string' && content.trim().startsWith('<')?C.parseTTML(content):[];
        if(!lines.some(x=>x.words?.length>1))throw new Error(`${label} did not supply timed words`);
        return {wordLines:lines,source:label};
      }finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
    };
    const candidates=[providerFetch('https://api.betterlyrics.org/getLyrics?'+search,'BETTER LYRICS · TTML',r=>r.ttml||r.lyrics)];
    if(rawId) candidates.push(providerFetch('https://unison.betterlyrics.org/lyrics?spotify='+rawId,'UNISON · TTML',r=>{
      const d=r.success && r.data;
      // A linked-video match may represent a different edit. Treat a
      // nonmatching title/artist as a miss instead of painting bad lyrics.
      if(!d || d.format!=='ttml' ||
        (d.song && C.normalized(d.song)!==C.normalized(t.name)) ||
        (d.artist && !C.normalized(d.artist).includes(C.normalized(t.artist.split(',')[0]))))return null;
      return d.lyrics;
    }));
    try{return await Promise.any(candidates);}catch{return null;}
  }

  async function loadLyrics(t, sequence) {
    if(!t)return;
    const own=customLrc[t.uri];
    if(own){useLyrics(own,'IMPORTED TIMED FILE',sequence,true);return;}
    if(lyricCache.has(t.uri)){const c=lyricCache.get(t.uri);useLyrics(c,c.wordLines?'TIMED · CACHED':'LRCLIB · CACHED',sequence);return;}
    if(!open)return;
    lyricsMode='loading';wordAccuracy='looking up timed words';
    controls.list.replaceChildren(); // Never leak future lyrics while loading
    const ctrl=new AbortController();fetchController=ctrl;
    try{
      // Prefer timestamped words over beautiful-looking guesses.
      const precise=await fetchPreciseLyrics(t,ctrl.signal);
      if(sequence!==trackSeq || ctrl.signal.aborted)return;
      if(precise?.wordLines?.length){
        lyricCache.set(t.uri,precise);useLyrics(precise,precise.source,sequence);return;
      }
      const base='https://lrclib.net/api/';
      const qp=new URLSearchParams({track_name:t.name,artist_name:t.artist});
      if(t.album)qp.set('album_name',t.album);
      if(t.duration>0)qp.set('duration',String(Math.round(t.duration/1000)));
      let record;
      try{record=await fetchJson(base+'get?'+qp,ctrl.signal);}
      catch(err){
        if(ctrl.signal.aborted || /rate limit/.test(err.message))throw err;
        const found=await fetchJson(base+'search?'+new URLSearchParams({track_name:t.name,artist_name:t.artist}),ctrl.signal);
        record=C.chooseMatch(found,t);
      }
      if(sequence!==trackSeq||ctrl.signal.aborted)return;
      if(!record?.syncedLyrics && !record?.plainLyrics)throw new Error('No timed lyrics for recording.');
      lyricCache.set(t.uri,record);
      if(lyricCache.size>35)lyricCache.delete(lyricCache.keys().next().value);
      useLyrics(record,'LRCLIB · LINES',sequence);
    }catch(err){
      if(ctrl.signal.aborted||sequence!==trackSeq)return;
      currentLyrics=[];activeLine=-99;lyricsMode='missing';wordAccuracy='unavailable';
      controls.list.innerHTML='<div class="bs-lyrics-empty">no timed lyrics found.</div>';
      console.info('[BratStage] Lyric provider unavailable:',err?.message||err);
    }
  }
  function useLyrics(data,label,sequence,imported=false) {
    if(sequence!==trackSeq)return;
    const text=imported?data:data.syncedLyrics||'';
    const lines=Array.isArray(data.wordLines)?data.wordLines:
      /^\s*(?:<\?xml|<tt\b)/i.test(text)?C.parseTTML(text):C.parseLRC(text);
    currentLyrics=lines.length?lines:C.plainToLines(imported?data:data.plainLyrics);
    lyricsMode=lines.length?'synced':currentLyrics.length?'plain':'missing';
    wordAccuracy=currentLyrics.some(x=>x.words?.length>1)?'REAL WORD TIMESTAMPS':
      lyricsMode==='synced'?'LINE TIMESTAMPS · estimated words':'no timed words';
    lyricsSource=label;
    activeLine=-99;wordStep=-999;fittedWordStep=-888;unsyncedStart=0;
    renderLyrics(true);
  }

  async function loadAudioAnalysis(t,sequence) {
    if (!t || typeof S.getAudioData !== 'function') return;
    try {
      const data=await S.getAudioData(t.uri);
      if (sequence!==trackSeq) return;
      const beats = data?.beats || data?.audio_analysis?.beats || [];
      if (Array.isArray(beats) && beats.length) {
        audioBeats=beats.map(b=>({at:Number(b.start)*1000,confidence:Number.isFinite(Number(b.confidence))?Number(b.confidence):.5})).filter(b=>Number.isFinite(b.at)).sort((a,b)=>a.at-b.at);
        beatState='analyzed';beatIndex=-1;lastBeatKey='';
        const tempo = data?.track?.tempo || data?.sections?.[0]?.tempo;
        if (tempo && tempo>=50 && tempo<=220) settings.bpm=Math.round(tempo);
      }
    } catch (e) { console.debug('[BratStage] Audio analysis unavailable; BPM fallback used.',e?.message); }
  }
  function appliedOffset() {
    return currentTrack && Number.isFinite(Number(trackOffsets[currentTrack.uri]))
      ? Number(trackOffsets[currentTrack.uri]) : settings.lyricsOffset;
  }
  function setOffset(ms) {
    const next=Math.round(C.clamp(ms,-5000,5000));
    if (currentTrack) {
      trackOffsets[currentTrack.uri]=next;
      storeSet('trackOffsets',JSON.stringify(trackOffsets));
    } else settings.lyricsOffset=next;
    activeLine=-99;renderLyrics(true);
    const el=$('#bs-offset-value');if(el)el.textContent=`${next>0?'+':''}${next} ms`;
    notify(`Lyric offset ${next>0?'+':''}${next} ms for this song`);
  }
  function renderLyrics(force=false) {
    if (!root || !currentLyrics.length) return;
    const now = playbackMs() + appliedOffset();
    const curr = lyricsMode === 'synced' ? C.currentIndex(currentLyrics,now) : -1;
    const line=curr>=0?currentLyrics[curr]:null;
    const inTimedGap=Boolean(line?.end!=null && now>=line.end &&
      (currentLyrics[curr+1]?.at??Infinity)>now);
    if(lyricsMode==='synced' && (curr<0 || inTimedGap)) {
      if(activeLine!==-1||controls.list.childElementCount){controls.list.replaceChildren();controls.ghost.className='bs-lyric-ghost';}
      activeLine=-1;wordStep=-999;fittedWordStep=-888;
      return;
    }
    if (!force && curr === activeLine) {updateWordHighlight();return;}
    const oldLine=controls.list.querySelector('.bs-active');
    wordStep=-999;
    const prior=activeLine;
    activeLine=curr;
    const count = settings.lyricDisplay==='stack' ? settings.visibleLines : 1;
    const focus = curr < 0 ? 0 : curr;
    const range = lyricsMode==='synced' ? C.visibleRange(currentLyrics.length,focus,count)
      : {start:unsyncedStart,end:Math.min(currentLyrics.length,unsyncedStart+count)};
    const existing=new Map([...controls.list.querySelectorAll('[data-line]')].map(el=>[Number(el.dataset.line),el]));
    // Ghost the outgoing cinematic line instead of abruptly deleting it.
    if (oldLine && prior!==curr && !['stack','square','locked'].includes(settings.lyricDisplay) && !settings.reduceMotion) {
      controls.ghost.textContent=oldLine.textContent;
      controls.ghost.className='bs-lyric-ghost bs-ghost-out';
      controls.ghost.style.font=window.getComputedStyle(oldLine).font;
      controls.ghost.style.textTransform=settings.textCase;
      controls.ghost.style.textAlign=settings.lyricsAlign;
      controls.ghost.style.color=getComputedStyle(root).getPropertyValue('--bs-fg');
      controls.ghost.style.animationDuration=settings.motionDuration+'ms';
      clearTimeout(ghostTimer);
      ghostTimer=setTimeout(()=>{if(controls.ghost)controls.ghost.className='bs-lyric-ghost';},settings.motionDuration);
    }
    const frag=document.createDocumentFragment();
    for(let i=range.start;i<range.end;i++){
      const line=currentLyrics[i];
      let el= !force && existing.get(i);
      if (!el) {
        el=document.createElement('button');el.type='button';el.dataset.line=String(i);
        el.setAttribute('aria-label',line.text + (line.at===null?'':` at ${C.time(line.at)}`));
        el.title=line.at===null?'Scroll lyric text with mouse wheel':`Seek to ${C.time(line.at)}`;
        makeLineContent(el,line,i);
      }
      const old=el.classList.contains('bs-active');
      const isActive=i===focus && (curr>=0 || lyricsMode!=='synced');
      el.className='bs-line'+(isActive?' bs-active':i<focus?' bs-past':'')+
        (['square','locked'].includes(settings.lyricDisplay)?' bs-line-square':'')+
        (settings.lyricDisplay==='reveal'?' bs-line-reveal':'');
      if(isActive && (!old || force)) {
        el.style.animation='none'; void el.offsetWidth; el.style.removeProperty('animation');
      }
      frag.append(el);
    }
    controls.list.replaceChildren(frag);
    if (prior!==curr && settings.beatMode==='lyricFlip') lastLineFlip+=1;
    updateWordHighlight();fitLyrics();
  }
  function lineWords(line,i){
    if(line.words?.length)return settings.wordMode==='instant'?[]:line.words;
    if(!['reveal','square','locked'].includes(settings.lyricDisplay)||settings.wordMode!=='estimated')return [];
    return C.estimateWordTimings(line,currentLyrics[i+1]?.at,Number(S.Player.getDuration?.()||0));
  }
  function makeLineContent(el,line,i) {
    const tokens=lineWords(line,i);
    if(tokens.length) {
      for(const w of tokens) {
        const word=document.createElement('span');word.className='bs-word';word.textContent=w.text;
        word.dataset.wordMs=String(w.at); word.dataset.estimated=String(Boolean(w.estimated));
        el.append(word);
      }
    } else el.textContent=line.text;
  }
  function updateWordHighlight(){
    const wordEls=controls.list?.querySelectorAll('.bs-active .bs-word');
    if(!wordEls?.length)return;
    const now=playbackMs()+appliedOffset();
    let last=-1;
    for(let i=0;i<wordEls.length;i++)if(now>=Number(wordEls[i].dataset.wordMs))last=i;
    if(last===wordStep)return;
    wordStep=last;
    for(let i=0;i<wordEls.length;i++){
      const word=wordEls[i];
      const next=i<last?'bs-word-past':i===last?'bs-word-now':'bs-word-future';
      if(!word.classList.contains(next))word.className='bs-word '+next;
    }
    if(['square','locked'].includes(settings.lyricDisplay)&&fittedWordStep!==last){
      fittedWordStep=last;
      fitLyrics();
    }
  }
  function fitLyrics(){
    if(!controls.list||!rootIsActive())return;
    const rect=controls.list.getBoundingClientRect();
    if(rect.width<10||rect.height<10)return;
    const isSquare=['square','locked'].includes(settings.lyricDisplay);
    const font=getComputedStyle(root).getPropertyValue('--bs-font').trim()||'Arial';
    const canvas=fitLyrics.canvas||(fitLyrics.canvas=document.createElement('canvas'));
    const ctx=canvas.getContext('2d');
    const lines=[...controls.list.querySelectorAll('.bs-line')];
    for(const el of lines){
      if(!settings.autoFit){el.style.fontSize=settings.fontSize+'px';el.style.maxWidth='';continue;}
      let text=el.textContent||'';
      if(isSquare){
        // In the growing composition, *future* words do not reserve space.
        // Locked square measures the full verse once; no mid-line geometry jumps.
        if(settings.lyricDisplay==='square'){
          const shown=[...el.querySelectorAll('.bs-word:not(.bs-word-future)')].map(x=>x.textContent).join('');
          if(shown.trim())text=shown;
        }
        const width=Math.min(rect.width*.91,rect.height*.9,870);
        const height=Math.min(rect.height*.74,rect.width*.77,620);
        el.style.maxWidth=width+'px';
        let best=settings.autoFitMin,bestScore=-Infinity;
        // Evaluate square-ish arrangements at several font sizes. Word spacing
        // is measured using the real canvas font, not a character-count guess.
        for(let px=Math.max(16,settings.autoFitMin);px<=Math.max(30,settings.fontSize);px+=3){
          ctx.font=`${settings.fontWeight} ${px}px ${font}`;
          const tokens=text.trim().split(/\s+/).filter(Boolean);
          const widest=tokens.reduce((m,t)=>Math.max(m,ctx.measureText(t).width),0);
          if(widest>width)continue;
          const widths=tokens.map(x=>ctx.measureText(x+' ').width);
          let rows=1,rowW=0,maxRowW=0;
          for(const w of widths){if(rowW+w>width && rowW>0){maxRowW=Math.max(maxRowW,rowW);rows++;rowW=w;}else rowW+=w;}
          maxRowW=Math.max(maxRowW,rowW);
          const naturalH=rows*px*.94;
          if(naturalH>height)continue;
          const aspect=maxRowW/Math.max(1,naturalH);
          const score=px*1.5-8*Math.abs(Math.log(Math.max(.05,aspect)));
          if(score>bestScore){best=px;bestScore=score;}
        }
        el.style.fontSize=Math.round(best)+'px';
      } else {
        el.style.maxWidth='';
        const available=rect.width*.93;
        const gap=settings.lineSpacing*Math.max(0,lines.length-1);
        const h=(rect.height-gap)/Math.max(1,lines.length);
        ctx.font=`${settings.fontWeight} ${settings.fontSize}px ${font}`;
        const measured=Math.max(1,ctx.measureText(text).width);
        const scaled=Math.min(settings.fontSize, settings.fontSize*available/measured,h/1.14);
        el.style.fontSize=Math.max(Math.min(settings.autoFitMin,settings.fontSize),Math.floor(scaled))+'px';
      }
    }
  }

  let lastPaint=0;
  function frame(timestamp){
    if(!rootIsActive())return;
    if(timestamp-lastPaint>=16){tick();lastPaint=timestamp;}
    timer=requestAnimationFrame(frame);
  }
  function tick() {
    if(!rootIsActive())return;
    const progress=playbackMs();
    const duration=Math.max(0,Number(S.Player.getDuration?.()||currentTrack?.duration||0));
    const playing=Boolean(S.Player.isPlaying?.());
    const pct=duration?C.clamp(progress/duration,0,1):0;
    root.classList.toggle('bs-paused',!playing);
    controls.elapsed.textContent=C.time(progress);controls.duration.textContent=C.time(duration);
    if(!seekDragging){
      controls.progress.style.width=`${(pct*100).toFixed(2)}%`;
      controls.handle.style.left=`${(pct*100).toFixed(2)}%`;
      controls.progressTrack.setAttribute('aria-valuenow',String(Math.round(pct*100)));
    }
    const vol=C.clamp(S.Player.getVolume?.()??0,0,1);
    if(!volumeDragging){
      controls.volume.value=String(Math.round(vol*100));
      controls.volume.style.setProperty('--bs-range-pct',Math.round(vol*100)+'%');
    }
    renderPlaybackButton(displayedPlaybackState(playing));
    renderRepeatButton(displayedRepeatMode(Number(S.Player.getRepeat?.()??0)));
    const muted=String(Boolean(S.Player.getMute?.()));
    if(controls.mute.dataset.muted!==muted){
      controls.mute.innerHTML=ico(muted==='true'?'mute':'volume',19);
      controls.mute.dataset.muted=muted;
    }
    if(lyricsMode==='synced')renderLyrics();
    reactToBeats(progress,playing);
    if(settings.bgMode==='video' && performance.now()-lastVideoSync>2400){syncVideo();lastVideoSync=performance.now();}
  }
  function binaryBeatIndex(ms) {
    let lo=0,hi=audioBeats.length-1,out=-1;
    while(lo<=hi){const m=(lo+hi)>>1;if(audioBeats[m].at<=ms){out=m;lo=m+1;}else hi=m-1;}return out;
  }
  function computeBeat(ms){
    const adjusted=ms+settings.beatOffset;
    if(audioBeats.length){
      const i=binaryBeatIndex(adjusted);
      if(i<0)return null;
      return {id:i,dt:adjusted-audioBeats[i].at,confidence:audioBeats[i].confidence,accurate:true};
    }
    // Manual BPM is an estimated grid. Users can calibrate its phase using TAP.
    const period=60000/Math.max(50,settings.bpm);
    const pos=adjusted-(tapBeats.length?tapBeats[tapBeats.length-1]:0);
    const i=Math.floor(pos/period);
    return {id:i,dt:pos-i*period,confidence:.6,accurate:false};
  }
  function reactToBeats(ms,playing){
    const base=settings.bgPalette==='album'&&palette?palette.bg:settings.bg;
    const accent=settings.bgPalette==='album'&&palette?palette.accent:settings.accent;
    const phrase=Math.max(0,activeLine);
    const group=C.paletteIndex(phrase,settings.paletteCadence,currentTrack?.uri||'');
    const p=settings.bgPalette==='cinema' ? C.cinematicPalette(currentTrack?.uri||'',group)
      : settings.bgPalette==='album'&&palette ? C.albumLinePalette(palette,group)
      : C.phrasePalette(base,accent,settings.fg,group,settings.phraseMode);
    const beatEnabled=settings.beatMode!=='off'&&playing&&!settings.reduceMotion;
    const beat=beatEnabled?computeBeat(ms):null;
    const peak=beat?Math.exp(-Math.max(0,beat.dt)/Math.max(100,settings.beatSmoothing*3))*.24*settings.beatIntensity/100:0;
    let bg=p.bg,fg=p.fg;
    if(beatEnabled && beat){
      if(settings.beatMode==='invert'&&beat.id%2===0){bg=p.fg;fg=p.bg;}
      if(settings.beatMode==='shift')bg=C.mixHex(bg,accent,beat.id%3===0?.25:.07);
      if(settings.beatMode==='ambient')bg=C.mixHex(bg,accent,peak);
      if(settings.beatMode==='lyricFlip'&&activeLine%2===1){bg=p.fg;fg=p.bg;}
      if(beat.id!==beatIndex)beatIndex=beat.id;
    }
    root.style.setProperty('--bs-pulse-active',String(peak));
    if(root.style.getPropertyValue('--bs-bg')!==bg)root.style.setProperty('--bs-bg',bg);
    if(root.style.getPropertyValue('--bs-fg')!==fg)root.style.setProperty('--bs-fg',fg);
  }
  async function extractCoverPalette(url,sequence){
    palette=null;
    if(!url)return;
    try{
      const image=new Image();image.crossOrigin='anonymous';image.src=url;
      await image.decode();if(sequence!==trackSeq)return;
      const cv=document.createElement('canvas');cv.width=24;cv.height=24;
      const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,24,24);
      const raw=ctx.getImageData(0,0,24,24).data;
      const colors=[];
      for(let i=0;i<raw.length;i+=16){
        const r=raw[i],g=raw[i+1],b=raw[i+2];
        if(Math.max(r,g,b)-Math.min(r,g,b)<22)continue;
        colors.push([r,g,b]);
      }
      if(!colors.length)return;
      const mean=colors.reduce((acc,rgb)=>rgb.map((v,j)=>v+acc[j]),[0,0,0]).map(x=>Math.round(x/colors.length));
      const vibrant=colors.reduce((best,rgb)=>{
        const score=Math.max(...rgb)-Math.min(...rgb);
        return score>best.score?{score,rgb}:best;
      },{score:-1,rgb:mean}).rgb;
      const bg=C.rgbHex(...mean),ac=C.rgbHex(...vibrant);
      palette={bg,accent:ac,fg:C.readableText(bg,settings.fg)};
      if(settings.bgPalette==='album')applySettings();
    }catch(e){console.debug('[BratStage] Album palette unavailable',e?.message);}
  }

  function setting(key,val) {
    if (!(key in DEFAULT)) return;
    const next=validate({...settings,[key]:val});
    settings=next;
    if (['bg','fg','accent','font','motion','effect','bgMode','beatMode'].includes(key)) settings.theme='custom';
    storeSet('settings',JSON.stringify(settings));
    applySettings();
    if (['visibleLines','textCase','font','fontSize','fontWeight','lineSpacing','lyricsAlign','lyricDisplay','wordMode','wordEffect','autoFit','autoFitMin','motion'].includes(key)){wordStep=-1;renderLyrics(true);fitLyrics();}
    if (['autoVideo','youtubeApiKey','videoPlacement'].includes(key) && settings.bgMode==='video')updateVideo();
    if (key==='bgPalette') extractCoverPalette(currentTrack?.cover,trackSeq);
    if (key==='youtubeApiKey' || key==='autoVideo'){autoVideoResults={};if(currentTrack&&settings.bgMode==='video')searchAutoVideo(currentTrack,trackSeq);}
    if(key==='betterLyricsApiKey'&&currentTrack){lyricCache.delete(currentTrack.uri);loadLyrics(currentTrack,trackSeq);}
    if (['bgMode','videoOffset','videoUrl','videoPlacement'].includes(key)) updateVideo();
    if(key==='videoOffset')syncVideo(true);
    if(key==='hideControls'||key==='hideCursor'||key==='autoHideMs')revealControls();
  }
  function applySettings() {
    if (!root) return;
    root.style.setProperty('--bs-bg',settings.bg);
    root.style.setProperty('--bs-fg',settings.fg);
    root.style.setProperty('--bs-accent',settings.accent);
    root.style.setProperty('--bs-font',FONTS[settings.font] || FONTS.brutal);
    root.style.setProperty('--bs-size',`${settings.fontSize}px`);
    root.style.setProperty('--bs-motion-speed',`${settings.motionDuration}ms`);
    root.style.setProperty('--bs-phrase-speed',`${settings.phraseDuration}ms`);
    root.style.setProperty('--bs-weight',String(settings.fontWeight));
    root.style.setProperty('--bs-line-gap',`${settings.lineSpacing}px`);
    root.style.setProperty('--bs-text-align',settings.lyricsAlign);
    root.style.setProperty('--bs-left-col',`${settings.layoutLeft}%`);
    root.style.setProperty('--bs-cover-max',`${settings.coverWidth}px`);
    root.style.setProperty('--bs-dim',String(settings.dim/100));
    root.style.setProperty('--bs-opacity',String(settings.backgroundOpacity/100));
    root.style.setProperty('--bs-blur',`${settings.backgroundBlur}px`);
    root.style.setProperty('--bs-caption-guard',`${settings.captionGuard}%`);
    root.style.setProperty('--bs-case',settings.textCase);
    root.className=[`bs-bg-${settings.bgMode}`,`bs-motion-${settings.motion}`,`bs-effect-${settings.effect}`,`bs-display-${settings.lyricDisplay}`,
      (settings.infoPlacement==='left'||settings.bgMode==='video'&&settings.videoPlacement==='artwork')?'bs-show-artwork':'',
      (settings.infoPlacement==='left')?'bs-show-meta':'',settings.videoPlacement==='artwork'?'bs-video-artwork':'',
      `bs-info-${settings.infoPlacement}`,(document.fullscreenElement===root)?'bs-native-fullscreen':'',
      settings.reduceMotion?'bs-reduced':'',settings.hideCursor?'bs-hide-cursor':'',settingsOpen?'bs-settings-open':'',root.classList.contains('bs-paused')?'bs-paused':'',root.classList.contains('bs-has-video')?'bs-has-video':'',root.classList.contains('bs-ui-hidden')?'bs-ui-hidden':'',`bs-word-effect-${settings.wordEffect}`,`bs-phrase-${settings.phraseMode}`].join(' ');
    $('#bs-video-toggle')?.setAttribute('aria-pressed',String(settings.bgMode==='video'));
    $('#bs-video-toggle')?.classList.toggle('bs-active',settings.bgMode==='video');
    controls.hint.style.display=settings.showHints?'':'none';
    const cover=currentTrack?.cover || '';
    if(settings.bgMode==='album') controls.background.src=cover;
    if(settings.bgMode==='image') controls.background.src=settings.imageUrl || imageObjectUrl || cover;
    if(settings.bgMode==='solid') controls.background.src='';
    if(settings.bgMode!=='video') videoPause();
    if(settings.bgMode==='video') updateVideo();
  }

  function selectMarkup(key, label, choices, note='') {
    return `<div class="bs-field"><div class="bs-field-header"><label for="bs-field-${key}">${esc(label)}</label></div><select id="bs-field-${key}" data-setting="${key}">${Object.entries(choices).map(([v,text])=>`<option value="${esc(v)}" ${settings[key]===v?'selected':''}>${esc(text)}</option>`).join('')}</select>${note?`<small>${esc(note)}</small>`:''}</div>`;
  }
  function rangeMarkup(key,label,min,max,step=1,unit='') {
    return `<div class="bs-field"><div class="bs-field-header"><label for="bs-field-${key}">${esc(label)}</label><span class="bs-value" id="bs-label-${key}">${esc(settings[key])}${unit}</span></div><input id="bs-field-${key}" type="range" min="${min}" max="${max}" step="${step}" data-setting="${key}" value="${settings[key]}"></div>`;
  }
  function colorMarkup(key,label) {
    return `<div class="bs-field"><label for="bs-field-${key}">${esc(label)}</label><input type="color" id="bs-field-${key}" data-setting="${key}" value="${settings[key]}"></div>`;
  }
  function checkMarkup(key,label,note='') {
    return `<label class="bs-toggle">${esc(label)}<input type="checkbox" data-setting="${key}" ${settings[key]?'checked':''}></label>${note?`<p class="bs-note">${esc(note)}</p>`:''}`;
  }
  function renderTabs() {
    const tabs={themes:'Themes',type:'Typography',motion:'Motion',background:'Backdrop',sync:'Sync & video',diagnostics:'Diagnostics'};
    $('#bs-settings-tabs').innerHTML=Object.entries(tabs).map(([key,title]) => `<button type="button" class="bs-settings-tab" data-tab="${key}" role="tab" aria-selected="${settingsTab===key}">${title}</button>`).join('');
  }
  function renderSettings() {
    const holder=$('#bs-settings-content');if(!holder)return;
    if(settingsTab==='themes') {
      holder.innerHTML=`<div class="bs-settings-section"><h3>01 / instant aesthetics</h3><div class="bs-swatch-row">${Object.entries(PRESETS).map(([key,p]) => `<button type="button" class="bs-preset" data-preset="${key}" aria-pressed="${settings.theme===key}" style="background:${p.bg};color:${p.fg}"><span>${esc(p.label)}</span><small>${esc(p.tagline)}</small></button>`).join('')}</div></div>
      <div class="bs-settings-section"><h3>02 / custom palette</h3><div class="bs-colors">${colorMarkup('bg','Background')}${colorMarkup('fg','Text')}${colorMarkup('accent','Accent')}</div>${selectMarkup('phraseMode','Phrase-driven color',{wash:'Soft palette shift each lyric line',gradient:'Cinematic gradient / line mood',flip:'Occasional BRAT inversion',off:'Do not shift'})}${rangeMarkup('phraseDuration','Background transition duration',200,3000,100,' ms')}${selectMarkup('beatMode','Optional beat effect',{off:'Off (recommended)',pulse:'Beat pulse',invert:'Invert per beat',shift:'Color palette loop',ambient:'Ambient color flow',lyricFlip:'Flip each lyric line'})}</div>`;
      holder.insertAdjacentHTML('beforeend',`<div class="bs-settings-section">${rangeMarkup('beatIntensity','Beat strength',0,100,5,'%')}${selectMarkup('bgPalette','Palette source',{custom:'Custom colors',cinema:'Curated cinematic palette (32 combinations)',album:'Automatically sample album artwork'})}${selectMarkup('paletteCadence','Palette change frequency',{every:'Every lyric line',two:'Every 2 lines',three:'Every 3 lines',varied:'Randomly every 1–3 lines'})}${rangeMarkup('beatSmoothing','Beat decay / smoothing',0,100,5,'%')}${rangeMarkup('beatOffset','Beat alignment',-800,800,20,' ms')}${rangeMarkup('bpm','Fallback tempo (no audio analysis)',50,220,1,' BPM')}<button type="button" class="bs-action" data-action="tap-beat">Tap to align fallback beats</button><p class="bs-note">Uses actual analyzed beat timestamps whenever Spicetify provides them. Manual BPM is used otherwise, not microphone audio capture.</p></div>`);
    } else if(settingsTab==='type') {
      holder.innerHTML=`<div class="bs-settings-section"><h3>01 / the words</h3>${selectMarkup('font','Typeface',{'brutal':'Classic sans / BRAT','black':'Heavy black','condensed':'Condensed poster','rounded':'Soft rounded','geometric':'Geometric / Apple-like','serif':'Editorial serif','mono':'Typewriter / mono','system':'System UI'})}${selectMarkup('textCase','Letter case',{lowercase:'all lowercase',none:'As written',uppercase:'ALL CAPS'})}${rangeMarkup('fontSize','Lyric size',28,150,2,' px')}${rangeMarkup('fontWeight','Font weight',500,900,100,'')}${selectMarkup('lyricDisplay','Lyric composition',{square:'BRAT — growing square / auto zoom',locked:'BRAT — locked square / word reveal',reveal:'Cinematic words / no square',spotlight:'Spotlight / whole line',stack:'Apple-style multi-line'})}${selectMarkup('wordEffect','Individual word entrance',{brat:'BRAT pop / punchy',silk:'Silk fade',wipe:'Cut / wipe',glow:'Soft glow',snap:'Instant cut',none:'None'})}${rangeMarkup('visibleLines','Lines on screen (stack mode)',1,11,1,' lines')}${checkMarkup('autoFit','Auto-fit text to available space')}${rangeMarkup('autoFitMin','Minimum auto-fit size',16,80,2,' px')}${selectMarkup('wordMode','Word synchronization policy',{automatic:'True word timestamps, else full line (recommended)',estimated:'Force estimated word timings when unavailable',instant:'Always show entire line'})}${rangeMarkup('lineSpacing','Spacing between lines',0,36,2,' px')}${selectMarkup('lyricsAlign','Text alignment',{left:'Left / editorial',center:'Center / karaoke',right:'Right'})}${rangeMarkup('dim','Inactive line opacity',5,80,5,'%')}</div><div class="bs-settings-section"><h3>02 / composition</h3>${rangeMarkup('layoutLeft','Artwork column width',28,60,1,'%')}${rangeMarkup('coverWidth','Artwork maximum width',240,580,10,' px')}${selectMarkup('infoPlacement','Album artwork & track details',{dock:'Inside control dock (default)',left:'Large on the left',hidden:'Hide them entirely'})}</div><p class="bs-note">Word-precision availability depends on the song. Line count is exact. Very long lines can wrap, and font size may need reducing on smaller displays.</p>`;
    } else if(settingsTab==='motion') {
      holder.innerHTML=`<div class="bs-settings-section"><h3>01 / transitions</h3>${selectMarkup('motion','Lyric motion',{whip:'Kinetic whip',cinema:'Cinematic focus pull',wipe:'Director wipe',glide:'Silky glide',type:'Staggered word reveal',snap:'Brutal snap',fade:'Soft fade',slide:'Kinetic slide up',pop:'BRAT pop',blur:'Dreamy blur',flip:'3D tilt'})}${rangeMarkup('motionDuration','Animation duration',150,1600,50,' ms')}${selectMarkup('effect','Visual effect',{none:'Clean / no effect',grain:'Vintage film grain',scanlines:'CRT scanlines',glow:'Beat glow',chromatic:'RGB glitch text',vignette:'Cinematic vignette'})}${checkMarkup('reduceMotion','Reduce animation','Disables animated lyrics and beat flashes; OS reduced-motion preference is also respected.')}${checkMarkup('showHints','Show keyboard shortcuts')}${checkMarkup('hideControls','Auto-hide screen controls')}${checkMarkup('hideCursor','Hide mouse cursor with the controls','Mouse movement instantly restores the cursor and toolbar; settings remain accessible.')}${rangeMarkup('autoHideMs','Hide controls after',500,12000,250,' ms')}${checkMarkup('fullscreenOnOpen','Request real fullscreen when opened','The fullscreen API may be blocked by Spotify; the overlay still fills the client.')}</div>`;
    } else if(settingsTab==='background') {
      holder.innerHTML=`<div class="bs-settings-section"><h3>01 / the canvas</h3>${selectMarkup('bgMode','Background source',{solid:'Solid / color-reactive',album:'Blurred album artwork',image:'Custom photo / GIF',video:'YouTube music video (muted)'})}${rangeMarkup('backgroundOpacity','Media opacity',10,100,5,'%')}${rangeMarkup('backgroundBlur','Media blur',0,70,2,' px')}${selectMarkup('videoPlacement','Video placement',{background:'Full background',artwork:'Left video panel instead of album art'})}</div>
      <div class="bs-settings-section"><h3>02 / your picture</h3><div class="bs-field"><label for="bs-file-bg">Choose a photo or GIF (up to 20 MB)</label><input id="bs-file-bg" class="bs-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></div><div class="bs-field"><label for="bs-image-url">Or paste an image URL</label><input type="text" id="bs-image-url" data-setting="imageUrl" placeholder="https://example.com/background.gif" value="${esc(settings.imageUrl)}"></div><div class="bs-action-row"><button class="bs-action" data-action="clear-image">Remove uploaded image</button><button class="bs-action bs-action-accent" data-action="use-image">Use custom background</button></div><p class="bs-note">Uploaded media is stored in your local Spotify profile via IndexedDB, never sent to a service by BratStage. Online image URLs are loaded from the URL you enter.</p></div>`;
    } else if(settingsTab==='sync') {
      const video=trackVideos[currentTrack?.uri] || '';
      holder.innerHTML=`<div class="bs-settings-section"><h3>01 / lyric calibration</h3><div class="bs-field"><div class="bs-field-header"><label>Per-song lyric offset</label><span class="bs-value" id="bs-offset-value">${appliedOffset()} ms</span></div><div class="bs-action-row"><button class="bs-action" data-offset="-250">−250</button><button class="bs-action" data-offset="-50">−50</button><button class="bs-action" data-offset="50">+50</button><button class="bs-action" data-offset="250">+250</button><button class="bs-action" data-action="offset-reset">Reset</button></div><small>Positive means show the lyrics EARLIER. Offsets are stored separately for each track.</small></div>${rangeMarkup('lyricsOffset','Global fallback offset',-5000,5000,50,' ms')}</div>
      <div class="bs-settings-section"><h3>02 / word timing sources</h3><div class="bs-field"><label for="bs-field-betterLyricsApiKey">Better Lyrics API key (optional)</label><input type="password" id="bs-field-betterLyricsApiKey" data-setting="betterLyricsApiKey" placeholder="For uncached word-timed tracks" value="${esc(settings.betterLyricsApiKey)}"><small>This is NOT the Google/YouTube key. Only sent to Better Lyrics. Leave blank for cached public tracks.</small></div><p class="bs-note" id="bs-precision-note">${esc(lyricsSource||'Looking up lyrics')} · ${esc(wordAccuracy)}</p><p class="bs-note">Priority: locally imported word-timed TTML/LRC → Better Lyrics TTML → Unison community lyrics → LRCLIB. Estimated word timings are never presented as real karaoke timestamps.</p></div><div class="bs-settings-section"><h3>03 / advanced lyric files</h3><div class="bs-field"><label for="bs-file-lrc">Import timed LRC / enhanced LRC / TTML file for this track</label><input id="bs-file-lrc" class="bs-file-input" type="file" accept=".lrc,.ttml,.xml,.txt,text/plain,application/xml"></div><div class="bs-action-row"><button class="bs-action" data-action="remove-lrc">Remove custom lyrics</button><button class="bs-action" data-action="reload-lyrics">Reload all lyric providers</button></div><p class="bs-note">Standard [mm:ss.xx] lines are synchronized. Enhanced LRC also supports &lt;mm:ss.xx&gt; word timestamps. Unsynced plain text cannot magically become word-synced.</p></div>
      <div class="bs-settings-section"><h3>03 / video background</h3><div class="bs-field"><label for="bs-video-url">YouTube URL for this song</label><input id="bs-video-url" type="text" placeholder="https://www.youtube.com/watch?v=..." value="${esc(video)}"><small>Paste a YouTube URL to load instantly. Enter confirms the link; it saves automatically.</small></div>${checkMarkup('autoVideo','Auto-find official video for each track','Requires your own YouTube Data API v3 key. Songs without confidently matched videos are skipped.') }<div class="bs-field"><label for="bs-field-youtubeApiKey">YouTube Data API v3 key</label><input type="password" id="bs-field-youtubeApiKey" data-setting="youtubeApiKey" value="${esc(settings.youtubeApiKey)}" placeholder="Optional: paste your Google Cloud API key"><small>Stored locally in your Spotify profile. API requests go directly to Google. Restrict your key and quota.</small></div>${rangeMarkup('videoOffset','Video offset (video ahead +)',-30000,30000,100,' ms')}${rangeMarkup('captionGuard','Mask bottom of YouTube picture',0,35,1,' %')}<div class="bs-action-row"><button class="bs-action bs-action-accent" data-action="save-video">Load now</button><button class="bs-action" data-action="search-video">Find on YouTube</button><button class="bs-action" data-action="clear-video">Clear</button></div><p class="bs-note" id="bs-video-status">YouTube auto-matching uses a strict title, artist and channel match. No API key? Manual YouTube URLs still work. YouTube plays muted so only Spotify provides audio. Ads, video embedding restrictions, unavailable videos, and autoplay policies cannot be bypassed. Synchronization is best effort.</p></div>
      <div class="bs-settings-section"><h3>04 / portability</h3><div class="bs-action-row"><button class="bs-action" data-action="export">Export preferences JSON</button><button class="bs-action" data-action="import">Import preferences JSON</button><input type="file" id="bs-import-settings" style="display:none" accept=".json,application/json"><button class="bs-action" data-action="reset">Reset all appearance settings</button></div></div>`;
    } else if(settingsTab==='diagnostics') {
      const details={Platform:PLATFORM,Version:'5.1.0','Track loaded':currentTrack?'Yes':'No',
        'Lyrics source':lyricsSource||'None','Timing accuracy':wordAccuracy,
        'Lyric state':lyricsMode,'Video state':videoStatus,
        'Player API':typeof S.Player?.play==='function'?'Available':'Limited',
        'Audio analysis':typeof S.getAudioData==='function'?'Available':'Not exposed',
        'Real fullscreen':document.fullscreenEnabled?'Available':'Unavailable'};
      holder.innerHTML=`<div class="bs-settings-section"><h3>Platform diagnostics</h3>${Object.entries(details).map(([name,value])=>`<div class="bs-field"><div class="bs-field-header"><label>${esc(name)}</label><span class="bs-value">${esc(value)}</span></div></div>`).join('')}</div><div class="bs-settings-section"><h3>Troubleshooting</h3><p class="bs-note">Word-level synchronization requires word-timed lyrics. Native SpotiKit does not expose every Spicetify function; unsupported audio analysis is disabled rather than guessed.</p><div class="bs-action-row"><button class="bs-action bs-action-accent" data-action="copy-diagnostics">Copy safe diagnostics</button><button class="bs-action" data-action="reload-lyrics">Retry lyrics</button></div><p class="bs-note">This diagnostic excludes track titles, API keys, and private URLs.</p></div>`;
    }
  }
  function setPreset(key) {
    if (!PRESETS[key]) return;
    settings=validate({...settings,...PRESETS[key],theme:key,bgPalette:'custom'});
    storeSet('settings',JSON.stringify(settings));applySettings();renderTabs();renderSettings();renderLyrics(true);
    notify(`${PRESETS[key].label} preset applied`);
  }
  function commitVideoLink(showToast=false){
    const field=$('#bs-video-url');
    if(!field||!currentTrack)return false;
    const raw=field.value.trim(),id=C.videoId(raw);
    if(!id){if(showToast)notify('Enter a valid YouTube video link or 11-character ID.');return false;}
    if(C.videoId(trackVideos[currentTrack.uri])===id){
      if(settings.bgMode!=='video')setting('bgMode','video');
      return true;
    }
    trackVideos[currentTrack.uri]=raw;
    storeSet('trackVideos',JSON.stringify(trackVideos));
    videoAppliedId=null; // force reload when a new link replaces an auto-matched video
    setting('bgMode','video');
    updateVideo();
    if(showToast)notify('Video loading automatically.');
    return true;
  }
  function settingsInput(ev) {
    const el=ev.target,key=el.dataset.setting;
    if(el.id==='bs-video-url'){
      clearTimeout(liveVideoTimer);
      liveVideoTimer=setTimeout(()=>commitVideoLink(false),340);
      return;
    }
    if (!key || el.type==='file') return;
    if (el.type==='range' || el.type==='color') {
      setting(key,el.type==='range'?Number(el.value):el.value);
      const readout=$('#bs-label-'+key);if(readout)readout.textContent=el.value + (key==='fontSize'||key==='lineSpacing'||key==='coverWidth'||key==='autoFitMin'?' px':key==='motionDuration'||key==='beatOffset'||key==='lyricsOffset'||key==='videoOffset'?' ms':key==='autoHideMs'||key==='phraseDuration'?' ms':key==='visibleLines'?' lines':key==='bpm'?' BPM':'%');
    }
  }
  function settingsChange(ev) {
    const el=ev.target,key=el.dataset.setting;
    if (key && !['range','color'].includes(el.type)) {
      setting(key,el.type==='checkbox'?el.checked:el.value);
    }
    if (el.id==='bs-file-bg') uploadBackground(el.files?.[0]);
    if (el.id==='bs-file-lrc') importLyrics(el.files?.[0]);
    if (el.id==='bs-import-settings') importPreferences(el.files?.[0]);
  }
  function settingsClick(ev) {
    const preset=ev.target.closest('[data-preset]');
    if(preset){setPreset(preset.dataset.preset);return;}
    const off=ev.target.closest('[data-offset]');
    if(off){setOffset(appliedOffset()+Number(off.dataset.offset));return;}
    const target=ev.target.closest('[data-action]');if(!target)return;
    const action=target.dataset.action;
    if(action==='offset-reset')setOffset(0);
    if(action==='tap-beat'){tapBeats.push(Number(S.Player.getProgress?.()||0)+settings.beatOffset); if(tapBeats.length>6)tapBeats.shift(); beatIndex=-1;notify('Beat phase aligned to this moment. Tap in time with the music.');}
    if(action==='use-image'){setting('bgMode','image');notify('Custom image background enabled.');}
    if(action==='clear-image'){clearImage();}
    if(action==='remove-lrc'){
      if(!currentTrack)return notify('Play a song first.');
      delete customLrc[currentTrack.uri];storeSet('customLrc',JSON.stringify(customLrc));
      lyricCache.delete(currentTrack.uri);loadLyrics(currentTrack,trackSeq);notify('Custom lyrics removed.');
    }
    if(action==='reload-lyrics'){
      if(!currentTrack)return notify('Play a song first.');
      lyricCache.delete(currentTrack.uri);delete customLrc[currentTrack.uri];storeSet('customLrc',JSON.stringify(customLrc));
      loadLyrics(currentTrack,trackSeq);notify('Refreshing lyric provider.');
    }
    if(action==='save-video') commitVideoLink(true);
    if(action==='clear-video'){
      if(!currentTrack)return;
      delete trackVideos[currentTrack.uri];storeSet('trackVideos',JSON.stringify(trackVideos));
      $('#bs-video-url').value='';delete autoVideoResults[currentTrack.uri];updateVideo();notify('Track video removed.');
    }
    if(action==='search-video'){
      if(!currentTrack)return notify('Play a song first.');
      const query=encodeURIComponent(`${currentTrack.artist} ${currentTrack.name} official music video`);
      window.open(`https://www.youtube.com/results?search_query=${query}`,'_blank','noopener,noreferrer');
    }
    if(action==='copy-diagnostics') {
      const report={project:'BRAT/STAGE',version:'5.1.0',platform:PLATFORM,lyricsMode,
        lyricsSource,wordAccuracy,videoStatus,hasTrack:Boolean(currentTrack),
        playerAPI:Boolean(S.Player?.play),audioAnalysis:Boolean(S.getAudioData)};
      navigator.clipboard?.writeText(JSON.stringify(report,null,2)).then(()=>notify('Diagnostics copied.')).catch(()=>notify('Could not copy diagnostics.'));
    }
    if(action==='export') exportPreferences();
    if(action==='import') $('#bs-import-settings')?.click();
    if(action==='reset') {settings=validate(DEFAULT);storeSet('settings',JSON.stringify(settings));applySettings();renderSettings();renderLyrics(true);notify('Appearance reset to BRAT Classic.');}
  }
  async function uploadBackground(file) {
    if(!file)return;
    if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type))return notify('Use PNG, JPEG, WebP or GIF.');
    if(file.size>20*1024*1024)return notify('Background must be 20 MB or smaller.');
    try {
      await saveMedia('background',file);
      if(imageObjectUrl)URL.revokeObjectURL(imageObjectUrl);
      storedBackground=file;imageObjectUrl=URL.createObjectURL(file);
      settings.imageUrl='';
      setting('bgMode','image');notify('Background saved locally.');
    } catch(e) { console.warn('[BratStage] Media storage unavailable',e);notify('Could not save the image. Try a smaller file or image URL.'); }
  }
  async function clearImage() {
    try { await deleteMedia('background'); } catch {}
    storedBackground=null;
    if(imageObjectUrl)URL.revokeObjectURL(imageObjectUrl);
    imageObjectUrl=null;
    setting('imageUrl','');
    if(settings.bgMode==='image')setting('bgMode','album');
    notify('Uploaded picture removed.');
  }
  function mediaDB() {
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB) return reject(new Error('IndexedDB unsupported'));
      const r=indexedDB.open('bratstage-media-v1',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('media');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
  }
  async function mediaOperation(mode,key,value) {
    const db=await mediaDB();
    try { return await new Promise((resolve,reject)=>{
      const tx=db.transaction('media',mode==='get'?'readonly':'readwrite');
      const store=tx.objectStore('media');
      const r=mode==='put'?store.put(value,key):mode==='delete'?store.delete(key):store.get(key);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    }); } finally {db.close();}
  }
  const saveMedia=(key,value)=>mediaOperation('put',key,value);
  const loadMedia=(key)=>mediaOperation('get',key);
  const deleteMedia=(key)=>mediaOperation('delete',key);
  async function loadBackground() {
    try {storedBackground=await loadMedia('background');
      if(storedBackground instanceof Blob){imageObjectUrl=URL.createObjectURL(storedBackground);applySettings();}
    } catch(e){console.debug('[BratStage] No local background available',e?.message);}
  }
  async function importLyrics(file) {
    if(!currentTrack)return notify('Play a song first.');
    if(!file)return;
    if(file.size>500*1024)return notify('Lyrics file must be under 500 KB.');
    try {
      const contents=await file.text();
      if(!C.parseLRC(contents).length&&!C.parseTTML(contents).length&&!C.plainToLines(contents).length)return notify('The lyric file is empty.');
      customLrc[currentTrack.uri]=contents;
      if(!storeSet('customLrc',JSON.stringify(customLrc))){delete customLrc[currentTrack.uri];return notify('Cannot save lyric file; Spotify storage may be full.');}
      useLyrics(contents,'YOUR TIMED FILE',trackSeq,true);notify('Timed lyrics imported for this track.');
    }catch{notify('Cannot read this lyrics file.');}
  }
  function exportPreferences() {
    // The personal YouTube API key is deliberately excluded from exported presets.
    const payload={schema:'bratstage-v5',settings:{...settings,youtubeApiKey:'',betterLyricsApiKey:''},trackVideos,trackOffsets};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='bratstage-preferences.json';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    notify('Preferences exported.');
  }
  async function importPreferences(file) {
    if(!file)return;
    if(file.size>1000000)return notify('Preferences file too large.');
    try {
      const payload=JSON.parse(await file.text());
      if(!['bratstage-v1','bratstage-v2','bratstage-v3','bratstage-v4','bratstage-v5'].includes(payload.schema)||typeof payload.settings!=='object')throw new Error('Invalid format');
      settings=validate(payload.settings);
      if(payload.trackVideos && typeof payload.trackVideos==='object')trackVideos=Object.fromEntries(Object.entries(payload.trackVideos).filter(([k,v])=>typeof k==='string'&&C.videoId(v)));
      if(payload.trackOffsets && typeof payload.trackOffsets==='object')trackOffsets=Object.fromEntries(Object.entries(payload.trackOffsets).filter(([k,v])=>typeof k==='string'&&Number.isFinite(Number(v))).map(([k,v])=>[k,C.clamp(v,-5000,5000)]));
      storeSet('settings',JSON.stringify(settings));storeSet('trackVideos',JSON.stringify(trackVideos));storeSet('trackOffsets',JSON.stringify(trackOffsets));
      applySettings();renderSettings();renderLyrics(true);updateVideo();notify('Preferences imported successfully.');
    }catch(e){console.warn(e);notify('Invalid BratStage preferences JSON.');}
  }

  function videoForTrack() {
    if(!currentTrack)return null;
    return C.videoId(trackVideos[currentTrack.uri]) || C.videoId(autoVideoResults[currentTrack.uri]?.id);
  }
  async function searchAutoVideo(track,sequence) {
    if(!settings.autoVideo || !settings.youtubeApiKey.trim() || !track)return;
    if(autoVideoResults[track.uri] || trackVideos[track.uri])return;
    const nonce=++youtubeSeq;
    videoStatus='searching';
    autoVideoResults[track.uri]={status:'searching'};
    try{
      const args=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'12',
        q:`${track.artist} ${track.name} official music video`,key:settings.youtubeApiKey.trim()});
      const resp=await fetch('https://www.googleapis.com/youtube/v3/search?'+args,{headers:{Accept:'application/json'}});
      const data=await resp.json();
      if(!resp.ok)throw Error(data?.error?.message||`YouTube API HTTP ${resp.status}`);
      const match=C.chooseOfficialVideo(data.items||[],track);
      autoVideoResults[track.uri]=match?{id:match.id,status:'matched'}:{status:'no-official-match'};
      if(trackSeq===sequence && nonce===youtubeSeq && settings.bgMode==='video'){
        videoStatus=match?'matched':'no-official-match';
        updateVideo();
      }
    }catch(err){
      console.warn('[BratStage] YouTube auto-video unavailable:',err.message);
      autoVideoResults[track.uri]={status:'error'};
      if(sequence===trackSeq){videoStatus='error';notify('Automatic video unavailable: check API key / quota / network.');}
    }
  }
  function updateVideo() {
    if(!controls.video)return;
    const slot=$('#bs-video-slot');
    const backdrop=root.querySelector('.bs-backdrop');
    const parent=settings.videoPlacement==='artwork' ? slot : backdrop;
    if(controls.video.parentElement!==parent)parent.append(controls.video);
    if(settings.bgMode!=='video'){
      root.classList.remove('bs-has-video');
      if(videoAppliedId){controls.video.removeAttribute('src');videoAppliedId=null;videoLoaded=false;videoTime=null;}
      return;
    }
    const id=videoForTrack() || C.videoId(settings.videoUrl);
    root.classList.toggle('bs-has-video',Boolean(id));
    if(!id){
      if(videoAppliedId){controls.video.removeAttribute('src');videoAppliedId=null;videoLoaded=false;videoTime=null;}
      if(settings.autoVideo && settings.youtubeApiKey.trim() && currentTrack)searchAutoVideo(currentTrack,trackSeq);
      return;
    }
    if(id===videoAppliedId)return;
    videoAppliedId=id;videoLoaded=false;videoTime=null;
    const origin=window.location.origin;
    controls.video.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?enablejsapi=1&autoplay=1&mute=1&controls=0&playsinline=1&rel=0&cc_load_policy=0&start=${Math.floor(Math.max(0,playbackMs()+settings.videoOffset)/1000)}&origin=${encodeURIComponent(origin)}`;
    controls.video.onload=()=>{
      videoCommand('mute');
      videoCommand('setVolume',[0]);
      // Best effort only: captions are a YouTube user preference and cannot
      // reliably be disabled using documented embed parameters alone.
      videoCommand('unloadModule',['captions']);
      videoCommand('unloadModule',['cc']);
      controls.video.contentWindow?.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'https://www.youtube-nocookie.com');
      // Some Spotify WebViews do not forward onReady events, allow best-effort commands.
      videoLoaded=true;
      syncVideo(true);
    };
  }
  function handleYoutubeMessage(ev){
    if(!controls.video || ev.source!==controls.video.contentWindow)return;
    if(!/^https:\/\/(www\.)?(youtube(-nocookie)?\.com)$/.test(ev.origin))return;
    let payload;
    try{payload=typeof ev.data==='string'?JSON.parse(ev.data):ev.data;}catch{return;}
    if(!payload || typeof payload!=='object')return;
    if(payload.event==='onReady'){
      videoLoaded=true;videoCommand('unloadModule',['captions']);
      videoCommand('unloadModule',['cc']);syncVideo(true);
    }
    if(payload.event==='onApiChange'){
      videoCommand('unloadModule',['captions']);videoCommand('unloadModule',['cc']);
    }
    if(payload.event==='infoDelivery' && Number.isFinite(payload.info?.currentTime)){
      videoTime={value:payload.info.currentTime,at:performance.now()};
    }
  }
  function videoCommand(func,args=[]){
    if(!videoAppliedId || !controls.video.contentWindow)return;
    try{controls.video.contentWindow.postMessage(JSON.stringify({event:'command',func,args}),'https://www.youtube-nocookie.com');}catch{}
  }
  function videoPause(){videoCommand('pauseVideo');}
  function syncVideo(force=false){
    if(settings.bgMode!=='video'||!videoAppliedId||!videoLoaded||!open)return;
    const seconds=Math.max(0,((S.Player.getProgress?.()||0)+settings.videoOffset)/1000);
    const playing=Boolean(S.Player.isPlaying?.());
    const actual=videoTime ? videoTime.value + (playing?(performance.now()-videoTime.at)/1000:0) : NaN;
    const drift=Number.isFinite(actual)?Math.abs(actual-seconds):Infinity;
    // Avoid the v1 bug: seeking every 3 seconds causes visible video stutter.
    if(force || (drift>1.1 && performance.now()-videoLastSeek>6000)){
      videoCommand('seekTo',[seconds,true]);videoLastSeek=performance.now();
    }
    if(playing)videoCommand('playVideo');else videoCommand('pauseVideo');
    videoCommand('mute');
  }

  function changeProgress(pct,commit=true){
    const duration=Number(S.Player.getDuration?.()||0);
    if(duration<=0)return;
    const pos=Math.round(duration*C.clamp(pct,0,1));
    controls.progress.style.width=`${(100*pos/duration).toFixed(2)}%`;
    controls.handle.style.left=`${(100*pos/duration).toFixed(2)}%`;

    if(commit){S.Player.seek(pos);resetPlaybackClock();beatIndex=-1;syncVideo(true);}
  }
  function changeVolume(pct){
    const p=C.clamp(pct,0,1);
    S.Player.setVolume(p);
    controls.volume.value=String(Math.round(p*100));controls.volume.style.setProperty('--bs-range-pct',Math.round(p*100)+'%');
  }
  function setupDials(){
    const progress=controls.progressTrack;
    let drag=null;
    const pct=e=>{const r=progress.getBoundingClientRect();return C.clamp((e.clientX-r.left)/Math.max(1,r.width),0,1);};
    progress.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();drag=e.pointerId;seekDragging=true;
      progress.setPointerCapture?.(e.pointerId);changeProgress(pct(e),false);revealControls();
    });
    progress.addEventListener('pointermove',e=>{if(drag===e.pointerId)changeProgress(pct(e),false);});
    const release=e=>{if(drag!==e.pointerId)return;changeProgress(pct(e),true);drag=null;seekDragging=false;syncVideo(true);};
    progress.addEventListener('pointerup',release);
    progress.addEventListener('pointercancel',()=>{drag=null;seekDragging=false;});
    progress.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      changeProgress((S.Player.getProgress?.()||0)/Math.max(1,S.Player.getDuration?.()||1)+(e.key==='ArrowRight'?.02:-.02));
    });
    controls.volume.addEventListener('input',e=>{
      volumeDragging=true;changeVolume(Number(e.target.value)/100);revealControls();
    });
    controls.volume.addEventListener('change',()=>{volumeDragging=false;scheduleHide();});
    controls.volume.addEventListener('wheel',e=>{
      e.preventDefault();
      const current=Number(controls.volume.value||0);
      changeVolume((current+(e.deltaY<0?3:-3))/100);revealControls();
    },{passive:false});
  }

  function boot() {
    createUI();loadBackground();
    listenGlobal(document,'keydown',keyboard,true);
    const onSong=()=>{if(root){refreshTrack(false);if(minimized)updateMini();}};
    const onPlay=()=>{resetPlaybackClock();if(rootIsActive()){tick();syncVideo(true);}};
    const onProgress=()=>{if(rootIsActive())tick();};
    for(const [event,fn] of [['songchange',onSong],['onplaypause',onPlay],['onprogress',onProgress]]) {
      S.Player.addEventListener(event,fn);listening.push([event,fn]);
    }
    let registered=false;
    try {
      if(S.Playbar?.Button){const btn=new S.Playbar.Button('BRAT/STAGE fullscreen lyrics',ico('stage',18),()=>rootIsActive()?closePlayer():openPlayer());if(btn?.remove)ownedButtons.push(btn);registered=true;}
    }catch(e){console.warn('[BratStage] Playbar button unavailable',e);}
    try {
      if(!registered && S.Topbar?.Button){const btn=new S.Topbar.Button('BRAT/STAGE',ico('stage',18),()=>rootIsActive()?closePlayer():openPlayer(),false,true);if(btn?.remove)ownedButtons.push(btn);registered=true;}
    }catch(e){console.warn('[BratStage] Topbar button unavailable',e);}
    if(!registered)console.warn('[BratStage] No toolbar API available: use Alt+B to open.');
    window.BratStage = Object.freeze({open:openPlayer,close:closePlayer,minimize:minimizePlayer,
      settings:()=>{openPlayer();toggleSettings(true);},
      diagnostics:()=>({platform:PLATFORM,version:'5.1.0',hasTrack:Boolean(currentTrack),lyricsSource,precision:wordAccuracy,video:videoStatus}),
      getSettings:()=>({...settings,youtubeApiKey:'',betterLyricsApiKey:''}),version:'5.1.0'});
    console.info('[BratStage v5.1] '+PLATFORM+' ready. Press Alt+B or use the toolbar button.');
  }
  function destroy() {
    if (disposed) return;
    disposed = true;
    open = false; minimized = false;
    trackSeq++; fetchController?.abort();
    if (timer) cancelAnimationFrame(timer);
    clearTimeout(uiHideTimer);clearTimeout(toastTimer);clearTimeout(ghostTimer);
    clearTimeout(liveVideoTimer);
    try { videoPause(); } catch {}
    try { if(document.fullscreenElement === root) document.exitFullscreen?.().catch(()=>{}); } catch {}
    for(const [event,fn] of listening) try { S.Player.removeEventListener?.(event,fn); } catch {}
    for(const release of globalListeners) try { release(); } catch {}
    for(const btn of ownedButtons) try { btn.remove?.(); } catch {}
    if (imageObjectUrl) try { URL.revokeObjectURL(imageObjectUrl); } catch {}
    root?.remove();mini?.remove();
    if(document.getElementById('bs-style')?.dataset.owner==='brat-stage') document.getElementById('bs-style').remove();
    if(window.BratStage?.version==='5.1.0') delete window.BratStage;
    window.__bratStageLoaded=false;
  }
  boot();
  return destroy;
}
