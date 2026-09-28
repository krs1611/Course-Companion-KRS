(() => {
  if (window.__courseCompanion) return;
  window.__courseCompanion = true;

  const DEFAULTS = { speed: 1, skip: 10, autoNext: false };
  let settings = { ...DEFAULTS };
  let video = null;
  let lastSave = 0;
  let restored = false;
  const KEY = 'p:' + location.origin + location.pathname + location.search;

  chrome.storage.local.get(['settings'], r => {
    settings = { ...DEFAULTS, ...(r.settings || {}) };
    if (video) video.playbackRate = settings.speed;
  });
  chrome.storage.onChanged.addListener(ch => {
    if (ch.settings) settings = { ...DEFAULTS, ...ch.settings.newValue };
  });

  // ---------- video discovery ----------
  function pickVideo() {
    const vids = [...document.querySelectorAll('video')].filter(v => v.clientWidth > 200);
    vids.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return vids[0] || null;
  }
  function attach(v) {
    if (!v || v === video) return;
    video = v;
    v.playbackRate = settings.speed;
    v.addEventListener('loadedmetadata', restore);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    if (v.readyState >= 1) restore();
  }
  new MutationObserver(() => attach(pickVideo())).observe(document.documentElement, { childList: true, subtree: true });
  attach(pickVideo());

  // ---------- resume + progress (real watch position only) ----------
  function restore() {
    if (restored || !video) return;
    restored = true;
    chrome.storage.local.get(KEY, r => {
      const p = r[KEY];
      if (p && p.pos > 5 && !p.done && p.pos < video.duration - 10) {
        video.currentTime = p.pos;
        hud('Resumed at ' + fmt(p.pos));
      }
    });
  }
  function save(done) {
    if (!video || !isFinite(video.duration) || video.duration < 30) return;
    const top = window === window.top;
    const entry = {
      title: (top ? document.title : document.title || '') || document.referrer || location.href,
      url: top ? location.href : (document.referrer || location.href),
      pos: video.currentTime,
      dur: video.duration,
      pct: Math.min(100, Math.round((video.currentTime / video.duration) * 100)),
      done: !!done,
      updated: Date.now()
    };
    chrome.storage.local.set({ [KEY]: entry });
  }
  function onTime() {
    const now = Date.now();
    if (now - lastSave > 5000) { lastSave = now; save(false); }
  }
  function onEnded() {
    save(true);
    if (settings.autoNext) tryNext();
  }

  // ---------- auto-advance (only after the video has actually finished) ----------
  function tryNext() {
    const re = /^(next( lesson| video| item| up)?|continue|go to next item)\b/i;
    const cands = [...document.querySelectorAll('button, a, [role="button"]')];
    const btn = cands.find(el => re.test((el.getAttribute('aria-label') || el.textContent || '').trim()));
    if (!btn) return hud('Finished. No "Next" button found on this page.');
    hud('Next lesson in 3s…');
    setTimeout(() => btn.click(), 3000);
  }

  // ---------- controls ----------
  function setSpeed(x) {
    x = Math.max(0.25, Math.min(3, Math.round(x * 100) / 100));
    settings.speed = x;
    if (video) video.playbackRate = x;
    chrome.storage.local.get('settings', r => chrome.storage.local.set({ settings: { ...(r.settings || {}), speed: x } }));
    hud(x + '×');
  }
  function skip(s) { if (video) { video.currentTime = Math.max(0, video.currentTime + s); hud((s > 0 ? '+' : '') + s + 's'); } }

  document.addEventListener('keydown', e => {
    if (!e.altKey || !video) return;
    const k = e.key;
    if (k === '.' || k === '≥') { setSpeed(video.playbackRate + 0.25); e.preventDefault(); }
    else if (k === ',' || k === '≤') { setSpeed(video.playbackRate - 0.25); e.preventDefault(); }
    else if (k === 'ArrowRight') { skip(settings.skip); e.preventDefault(); }
    else if (k === 'ArrowLeft') { skip(-settings.skip); e.preventDefault(); }
  }, true);

  // ---------- tiny on-screen indicator ----------
  let hudEl, hudTimer;
  function hud(text) {
    if (!video || window.innerWidth < 300) return;
    if (!hudEl) {
      hudEl = document.createElement('div');
      hudEl.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;padding:6px 12px;border-radius:8px;background:rgba(23,37,42,.88);color:#fff;font:600 14px system-ui,sans-serif;pointer-events:none;transition:opacity .2s;opacity:0';
      document.documentElement.appendChild(hudEl);
    }
    hudEl.textContent = text;
    hudEl.style.opacity = '1';
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => (hudEl.style.opacity = '0'), 1400);
  }
  const fmt = s => { s = Math.floor(s); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };

  // ---------- transcript from captions (or selected text) ----------
  async function getTranscript() {
    if (video && video.textTracks.length) {
      const tracks = [...video.textTracks].filter(t => t.kind === 'subtitles' || t.kind === 'captions');
      const originals = tracks.map(t => t.mode);
      tracks.forEach(t => { if (t.mode === 'disabled') t.mode = 'hidden'; });
      await new Promise(r => setTimeout(r, 700));
      let text = '';
      for (const t of tracks) {
        if (t.cues && t.cues.length) { text = [...t.cues].map(c => c.text.replace(/<[^>]+>/g, '')).join(' '); break; }
      }
      tracks.forEach((t, i) => (t.mode = originals[i]));
      if (text) return text;
    }
    return String(window.getSelection() || '');
  }

  chrome.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg.type === 'getState') {
      if (!video) return false; // let a frame that has a video answer
      send({ speed: video.playbackRate, time: video.currentTime, duration: video.duration, skip: settings.skip });
    } else if (msg.type === 'setSpeed') {
      if (!video) return false; setSpeed(msg.value); send({ ok: true });
    } else if (msg.type === 'skip') {
      if (!video) return false; skip(msg.value); send({ ok: true });
    } else if (msg.type === 'getTranscript') {
      getTranscript().then(t => { if (t) send({ text: t }); else if (video) send({ text: '' }); });
      return true;
    }
    return false;
  });
})();
