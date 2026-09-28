const $ = s => document.querySelector(s);
const tabs = document.querySelectorAll('nav button');
tabs.forEach(b => b.onclick = () => show(b.dataset.tab));
function show(n) {
  tabs.forEach(b => b.setAttribute('aria-selected', b.dataset.tab === n));
  document.querySelectorAll('section').forEach(s => s.hidden = s.id !== n);
  if (n === 'progress') loadProgress();
}
async function send(msg) {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!t) return null;
  try { return (await chrome.tabs.sendMessage(t.id, msg)) || null; } catch { return null; }
}

// ---- Player ----
let speed = 1, skipLen = 10;
function paintSpeed() { $('#speedval').textContent = speed + '×'; }
async function setSpeed(x) {
  x = Math.max(0.25, Math.min(3, Math.round(x * 100) / 100));
  const r = await send({ type: 'setSpeed', value: x });
  if (r) { speed = x; paintSpeed(); } else $('#pstatus').textContent = 'No video found on this page.';
}
[1, 1.25, 1.5, 2, 2.5, 3].forEach(v => {
  const b = document.createElement('button'); b.textContent = v + '×'; b.onclick = () => setSpeed(v); $('#presets').appendChild(b);
});
$('#slower').onclick = () => setSpeed(speed - 0.25);
$('#faster').onclick = () => setSpeed(speed + 0.25);
$('#back').onclick = () => send({ type: 'skip', value: -skipLen });
$('#fwd').onclick = () => send({ type: 'skip', value: skipLen });
(async () => {
  const s = await send({ type: 'getState' });
  if (s) { speed = s.speed; skipLen = s.skip || 10; $('#pstatus').textContent = 'Video found.'; paintSpeed();
    document.querySelectorAll('.sk').forEach(e => e.textContent = skipLen); }
  else $('#pstatus').textContent = 'No video found on this page.';
})();

// ---- Study ----
$('#grab').onclick = async () => {
  $('#sstatus').textContent = 'Reading captions…';
  const r = await send({ type: 'getTranscript' });
  if (r && r.text) { $('#text').value = r.text; $('#sstatus').textContent = 'Captions loaded (' + r.text.length + ' characters).'; }
  else $('#sstatus').textContent = 'No captions found. Turn captions on in the player, or paste the transcript.';
};
$('#gen').onclick = async () => {
  $('#gen').disabled = true; $('#sstatus').textContent = 'Working…'; $('#out').textContent = ''; $('#copy').hidden = true;
  const r = await chrome.runtime.sendMessage({ type: 'generate', mode: $('#mode').value, text: $('#text').value });
  $('#gen').disabled = false;
  if (r && r.ok) { $('#out').textContent = r.text; $('#copy').hidden = false; $('#sstatus').textContent = ''; }
  else $('#sstatus').textContent = (r && r.error) || 'Something went wrong.';
};
$('#copy').onclick = () => { navigator.clipboard.writeText($('#out').textContent); $('#copy').textContent = 'Copied'; setTimeout(() => $('#copy').textContent = 'Copy result', 1200); };
chrome.storage.local.get('lastResult', r => { if (r.lastResult) { $('#out').textContent = r.lastResult.out; $('#copy').hidden = false; } });

// ---- Progress ----
async function loadProgress() {
  const all = await chrome.storage.local.get(null);
  const items = Object.entries(all).filter(([k]) => k.startsWith('p:')).map(([, v]) => v).sort((a, b) => b.updated - a.updated);
  const box = $('#plist'); box.textContent = '';
  if (!items.length) { box.innerHTML = '<p class="muted">Nothing tracked yet. Watch a video for a few seconds and it shows up here.</p>'; return; }
  items.slice(0, 30).forEach(p => {
    const d = document.createElement('div'); d.className = 'item';
    const a = document.createElement('a'); a.href = '#'; a.textContent = p.title; a.title = p.title;
    a.onclick = e => { e.preventDefault(); chrome.tabs.create({ url: p.url }); };
    const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<i style="width:' + p.pct + '%"></i>';
    const m = document.createElement('div'); m.className = 'muted small';
    m.textContent = (p.done ? 'Finished' : p.pct + '% watched') + ' · ' + new Date(p.updated).toLocaleDateString();
    d.append(a, bar, m); box.appendChild(d);
  });
}
$('#clear').onclick = async () => {
  const all = await chrome.storage.local.get(null);
  await chrome.storage.local.remove(Object.keys(all).filter(k => k.startsWith('p:'))); loadProgress();
};

// ---- Settings ----
chrome.storage.local.get(['apiKey', 'settings'], r => {
  const s = { speed: 1, skip: 10, autoNext: false, ...(r.settings || {}) };
  $('#key').value = r.apiKey || ''; $('#dspeed').value = s.speed; $('#dskip').value = s.skip; $('#auto').checked = s.autoNext;
});
$('#save').onclick = async () => {
  await chrome.storage.local.set({
    apiKey: $('#key').value.trim(),
    settings: { speed: +$('#dspeed').value || 1, skip: +$('#dskip').value || 10, autoNext: $('#auto').checked }
  });
  $('#saved').textContent = 'Saved.';
};
