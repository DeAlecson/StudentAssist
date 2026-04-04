const TTS = (() => {
  const VOICES = [
    { id: 'af_sky',      name: 'Sky (US Female)' },
    { id: 'af_bella',    name: 'Bella (US Female)' },
    { id: 'af_sarah',    name: 'Sarah (US Female)' },
    { id: 'af_nicole',   name: 'Nicole (US Female)' },
    { id: 'am_adam',     name: 'Adam (US Male)' },
    { id: 'am_michael',  name: 'Michael (US Male)' },
    { id: 'bf_emma',     name: 'Emma (UK Female)' },
    { id: 'bf_isabella', name: 'Isabella (UK Female)' },
    { id: 'bm_george',   name: 'George (UK Male)' },
    { id: 'bm_lewis',    name: 'Lewis (UK Male)' },
  ];

  let _tts = null;
  let _loadPromise = null;
  let _currentSource = null;
  let _audioCtx = null;
  let _speaking = false;

  const isEnabled  = () => Storage.getSettings().ttsEnabled === true;
  const getVoice   = () => Storage.getSettings().ttsVoice || 'af_sky';
  const listVoices = () => VOICES;

  // ── Strip markdown for clean TTS text ───────────────────────────────
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

  // ── Settings indicator ────────────────────────────────────────────
  const _setIndicator = (msg, cls) => {
    const el = document.getElementById('tts-load-indicator');
    if (!el) return;
    el.textContent = msg;
    el.className = 'tts-load-indicator' + (cls ? ' ' + cls : '');
  };

  // ── Button state — uses data-tts-state so CSS handles visuals ────
  // state: 'idle' | 'loading' | 'speaking'
  const _setBtns = (state) => {
    document.querySelectorAll('.tts-btn').forEach(btn => {
      btn.dataset.ttsState = state;
      btn.disabled = (state === 'loading');
      btn.title = state === 'speaking' ? 'Stop'
                : state === 'loading'  ? 'Loading…'
                : 'Read aloud';
      btn.classList.toggle('tts-speaking', state === 'speaking');
    });
  };

  // ── Pre-warm AudioContext synchronously while inside user gesture ─
  // This MUST be called before any await, otherwise mobile blocks it.
  const _warmCtx = () => {
    try {
      if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
      }
    } catch (_) {}
  };

  // ── Stop all playback ─────────────────────────────────────────────
  const stop = () => {
    // Stop Web Speech API if running
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    // Stop AudioContext source
    if (_currentSource) {
      try { _currentSource.stop(); } catch (_) {}
      _currentSource = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (_) {}
      _audioCtx = null;
    }
    _speaking = false;
    _setBtns('idle');
  };

  // ── Web Speech API fallback (works on all mobile browsers) ────────
  const _speakNative = (text) => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate  = 0.95;
      utter.pitch = 1.0;
      utter.lang  = 'en-US';
      utter.onend   = () => { _speaking = false; _setBtns('idle'); resolve(); };
      utter.onerror = () => { _speaking = false; _setBtns('idle'); resolve(); };
      synth.speak(utter);
    });
  };

  // ── Load Kokoro model ─────────────────────────────────────────────
  const load = async () => {
    if (_tts) return _tts;
    if (_loadPromise) return _loadPromise;

    _setIndicator('Loading TTS module…', 'loading');

    _loadPromise = (async () => {
      try {
        const { KokoroTTS } = await import('https://esm.sh/kokoro-js@1.2.1');
        _setIndicator('Downloading voice model (~86 MB, cached after first use)…', 'loading');
        _tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
          dtype: 'q8',
          progress_callback: (p) => {
            if (p.status === 'downloading' && p.total) {
              const pct = Math.round((p.loaded / p.total) * 100);
              _setIndicator(`Downloading… ${pct}%`, 'loading');
            } else if (p.status === 'done' || p.status === 'loaded') {
              _setIndicator('TTS ready ✓', 'ready');
            }
          }
        });
        _setIndicator('TTS ready ✓', 'ready');
        return _tts;
      } catch (err) {
        _loadPromise = null;
        _tts = null;
        _setIndicator('AI voice unavailable — using browser voice', 'error');
        throw err;
      }
    })();

    return _loadPromise;
  };

  // ── Play Float32 PCM audio via AudioContext ────────────────────────
  const _playFloat32 = (float32, sampleRate) => {
    return new Promise((resolve) => {
      // Re-use the pre-warmed context if still open
      if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      }
      // Always try to resume in case it was auto-suspended
      if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
      }

      const buf = _audioCtx.createBuffer(1, float32.length, sampleRate);
      buf.copyToChannel(float32, 0);
      const src = _audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(_audioCtx.destination);
      _currentSource = src;
      src.onended = () => {
        _speaking = false;
        _currentSource = null;
        _setBtns('idle');
        resolve();
      };
      src.start(0);
    });
  };

  // ── Main speak entry point ────────────────────────────────────────
  const speak = async (rawText) => {
    if (!isEnabled()) {
      if (typeof Utils !== 'undefined') Utils.toast('Enable TTS in Settings first', 'info', 2500);
      return;
    }
    if (_speaking) { stop(); return; }

    // ⚠️ Pre-warm AudioContext SYNCHRONOUSLY here — before any await.
    // Mobile browsers require AudioContext creation inside a user gesture.
    _warmCtx();

    const text = _strip(rawText);
    if (!text) return;

    _setBtns('loading');

    // ── Try Kokoro AI voice first ──────────────────────────────────
    try {
      const engine = await load();

      _speaking = true;
      _setBtns('speaking');

      const voice   = getVoice();
      const chunks  = [];
      let totalLen  = 0;
      let sr        = 24000;

      if (typeof engine.stream === 'function') {
        for await (const { audio } of engine.stream(text, { voice })) {
          if (!_speaking) break;
          if (audio?.audio) {
            chunks.push(audio.audio);
            totalLen += audio.audio.length;
            sr = audio.sampling_rate || sr;
          }
        }
      } else {
        const out = await engine.generate(text, { voice });
        if (out?.audio) {
          chunks.push(out.audio);
          totalLen = out.audio.length;
          sr = out.sampling_rate || sr;
        }
      }

      if (!_speaking) return; // Stopped mid-generation

      const combined = new Float32Array(totalLen);
      let offset = 0;
      for (const c of chunks) { combined.set(c, offset); offset += c.length; }

      await _playFloat32(combined, sr);

    } catch (err) {
      // ── Fallback: Web Speech API (works on all mobile browsers) ──
      console.warn('TTS: Kokoro unavailable, falling back to browser voice:', err.message);
      if (window.speechSynthesis) {
        try {
          _speaking = true;
          _setBtns('speaking');
          await _speakNative(text);
        } catch (e) {
          _speaking = false;
          _setBtns('idle');
          if (typeof Utils !== 'undefined') Utils.toast('TTS unavailable on this browser', 'error', 3500);
        }
      } else {
        _speaking = false;
        _setBtns('idle');
        if (typeof Utils !== 'undefined') Utils.toast('TTS not supported on this browser', 'error', 3500);
      }
    }
  };

  const testVoice = () => speak('Hello! This is a preview of the selected voice. StudentAssist will use this voice to read lesson content aloud.');

  return { speak, stop, load, testVoice, listVoices, isEnabled, getVoice };
})();
