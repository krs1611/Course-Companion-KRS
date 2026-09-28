const MODEL = 'claude-sonnet-5';

const PROMPTS = {
  summary: 'Write a clear summary of this lecture: a 2-3 sentence overview, then the key ideas as short bullet lines starting with "- ".',
  notes: 'Turn this lecture into structured study notes. Use short headings on their own lines and bullet lines starting with "- ". Include key terms with one-line definitions.',
  flashcards: 'Create 10 flashcards from this lecture. Format each exactly as:\nQ: question\nA: answer\n\nwith a blank line between cards.',
  quiz: 'Create a 6-question practice quiz from this lecture so the learner can check their understanding. Multiple choice with options A-D. After all questions, add an "Answers" section with a one-line explanation for each. Do not reference the platform or any real course assessment.'
};

async function generate({ mode, text }) {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) return { ok: false, error: 'Add your Anthropic API key in Settings first.' };
  if (!text || text.trim().length < 50) return { ok: false, error: 'Not enough text. Paste a transcript or grab the captions first.' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: 'You are a study assistant. Write plain text only: no markdown symbols other than "- " bullets. Base everything strictly on the provided transcript.',
        messages: [{ role: 'user', content: PROMPTS[mode] + '\n\nTranscript:\n' + text.slice(0, 60000) }]
      })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: (data.error && data.error.message) || 'Request failed (' + res.status + ')' };
    const out = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    await chrome.storage.local.set({ lastResult: { mode, out, at: Date.now() } });
    return { ok: true, text: out };
  } catch (e) {
    return { ok: false, error: 'Network error: ' + e.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (msg.type === 'generate') { generate(msg).then(send); return true; }
});
