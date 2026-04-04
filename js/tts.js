/* ── TTS — Web Speech API (universal, no download, no crash) ── */
const TTS = (() => {

  let _speaking  = false;
  let _utterance = null;

  const isEnabled = () => Storage.getSettings().ttsEnabled === true;
  const getVoice  = () => Storage.getSettings().ttsVoice  || '';

  // ── Strip markdown to clean spoken text ─────────────────────────
  const _strip = (text) => (text || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, ' ')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|.*?\|/g, ' ')
    .replace(/[-]{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ── Button state — drives CSS via data attribute ────────────────
  const _setBtns = (state) => {
    document.querySelectorAll('.tts-btn').forEach(btn => {
      btn.dataset.ttsState = state;
      btn.disabled  = false;
      btn.title     = state === 'speaking' ? 'Stop reading' : 'Read aloud';
      btn.classList.toggle('tts-speaking', state === 'speaking');
    });
  };

  // ── Settings status indicator ───────────────────────────────────
  const _setIndicator = (msg, cls) => {
    const el = document.getElementById('tts-load-indicator');
    if (!el) return;
    el.textContent = msg;
    el.className = 'tts-load-indicator' + (cls ? ' ' + cls : '');
  };

  // ── List available English voices from the browser ──────────────
  const listVoices = () => {
    if (!window.speechSynthesis) return [];
    return window.speechSynthesis
      .getVoices()
      .filter(v => v.lang && v.lang.toLowerCase().startsWith('en'))
      .map(v => ({ id: v.name, name: v.name + (v.default ? ' ★' : '') }));
  };

  // ── Stop any current playback ───────────────────────────────────
  const stop = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    _utterance = null;
    _speaking  = false;
    _setBtns('idle');
  };

  // ── Speak ───────────────────────────────────────────────────────
  const speak = (rawText) => {
    if (!isEnabled()) {
      if (typeof Utils !== 'undefined') Utils.toast('Enable TTS in Settings first', 'info', 2500);
      return;
    }
    if (_speaking) { stop(); return; }

    if (!window.speechSynthesis) {
      if (typeof Utils !== 'undefined') Utils.toast('TTS not supported on this browser', 'error', 3500);
      return;
    }

    const text = _strip(rawText);
    if (!text) return;

    window.speechSynthesis.cancel(); // clear any queued speech

    const utter  = new SpeechSynthesisUtterance(text);
    utter.rate   = 0.95;
    utter.pitch  = 1.0;
    utter.volume = 1.0;
    utter.lang   = 'en-US';

    // Apply selected voice if available
    const voiceName = getVoice();
    if (voiceName) {
      const match = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
      if (match) utter.voice = match;
    }

    utter.onstart = () => {
      _speaking = true;
      _setBtns('speaking');
    };
    utter.onend = () => {
      _speaking  = false;
      _utterance = null;
      _setBtns('idle');
    };
    utter.onerror = (e) => {
      // 'interrupted' is normal when stop() is called — don't show an error
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('TTS error:', e.error);
      }
      _speaking  = false;
      _utterance = null;
      _setBtns('idle');
    };

    _utterance = utter;
    _speaking  = true;
    _setBtns('speaking');
    window.speechSynthesis.speak(utter);
  };

  const testVoice = () => speak(
    'Hello! This is a preview of the selected voice. StudentAssist will use this voice to read lesson content aloud.'
  );

  // Expose _setIndicator for app.js to call when populating voice list
  const showStatus = (msg, cls) => _setIndicator(msg, cls);

  return { speak, stop, testVoice, listVoices, isEnabled, getVoice, showStatus };
})();
