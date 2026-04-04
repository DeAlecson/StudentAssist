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
  let _loading = false;
  let _loadPromise = null;
  let _currentSource = null;
  let _audioCtx = null;
  let _speaking = false;

  const isEnabled = () => Storage.getSettings().ttsEnabled === true;
  const getVoice  = () => Storage.getSettings().ttsVoice || 'af_sky';
  const listVoices = () => VOICES;

  // Strip markdown so TTS reads clean plain text
  const _strip = (text) => (text || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')       // remove images
    .replace(/#{1,6}\s+/g, '')             // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
    .replace(/\*(.+?)\*/g, '$1')           // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')      // code blocks
    .replace(/`(.+?)`/g, '$1')             // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // links
    .replace(/^\s*[-*+]\s+/gm, '')         // bullets
    .replace(/^\s*\d+\.\s+/gm, '')         // numbered list
    .replace(/\|.*?\|/g, ' ')             // tables
    .replace(/[-]{3,}/g, '')               // horizontal rules
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const _setIndicator = (msg, cls) => {
    const el = document.getElementById('tts-load-indicator');
    if (!el) return;
    el.textContent = msg;
    el.className = 'tts-load-indicator' + (cls ? ' ' + cls : '');
  };

  const _setAllBtns = (icon, title, speaking) => {
    document.querySelectorAll('.tts-btn').forEach(btn => {
      btn.innerHTML = icon;
      btn.title = title;
      btn.classList.toggle('tts-speaking', !!speaking);
      btn.disabled = false;
    });
  };

  const stop = () => {
    if (_currentSource) {
      try { _currentSource.stop(); } catch (_) {}
      _currentSource = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (_) {}
      _audioCtx = null;
    }
    _speaking = false;
    _setAllBtns('🔊', 'Read aloud', false);
  };

  const load = async () => {
    if (_tts) return _tts;
    if (_loadPromise) return _loadPromise;

    _loading = true;
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
              _setIndicator(`Downloading model… ${pct}%`, 'loading');
            } else if (p.status === 'done' || p.status === 'loaded') {
              _setIndicator('TTS ready ✓', 'ready');
            }
          }
        });
        _setIndicator('TTS ready ✓', 'ready');
        _loading = false;
        return _tts;
      } catch (err) {
        _loading = false;
        _loadPromise = null;
        _tts = null;
        _setIndicator('TTS failed to load — try Chrome/Edge', 'error');
        throw err;
      }
    })();

    return _loadPromise;
  };

  const _playFloat32 = (float32, sampleRate) => {
    return new Promise((resolve) => {
      if (_audioCtx) { try { _audioCtx.close(); } catch (_) {} }
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      const buf = _audioCtx.createBuffer(1, float32.length, sampleRate);
      buf.copyToChannel(float32, 0);
      const src = _audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(_audioCtx.destination);
      _currentSource = src;
      src.onended = () => {
        _speaking = false;
        _currentSource = null;
        _setAllBtns('🔊', 'Read aloud', false);
        resolve();
      };
      src.start(0);
    });
  };

  const speak = async (rawText) => {
    if (!isEnabled()) {
      if (typeof Utils !== 'undefined') Utils.toast('Enable TTS in Settings first', 'info', 2500);
      return;
    }

    // Toggle off if already speaking
    if (_speaking) { stop(); return; }

    const text = _strip(rawText);
    if (!text) return;

    _setAllBtns('⏳', 'Loading…', false);
    document.querySelectorAll('.tts-btn').forEach(b => b.disabled = true);

    try {
      const engine = await load();
      if (!engine) throw new Error('Engine not loaded');

      _speaking = true;
      _setAllBtns('⏹', 'Stop', true);

      const voice = getVoice();
      const chunks = [];
      let totalLen = 0;
      let sr = 24000;

      if (typeof engine.stream === 'function') {
        for await (const { audio } of engine.stream(text, { voice })) {
          if (!_speaking) break; // stopped mid-generation
          if (audio && audio.audio) {
            chunks.push(audio.audio);
            totalLen += audio.audio.length;
            sr = audio.sampling_rate || sr;
          }
        }
      } else {
        const out = await engine.generate(text, { voice });
        if (out && out.audio) {
          chunks.push(out.audio);
          totalLen = out.audio.length;
          sr = out.sampling_rate || sr;
        }
      }

      if (!_speaking) return;

      // Merge chunks
      const combined = new Float32Array(totalLen);
      let offset = 0;
      for (const c of chunks) { combined.set(c, offset); offset += c.length; }

      await _playFloat32(combined, sr);
    } catch (err) {
      console.error('TTS error:', err);
      _speaking = false;
      _setAllBtns('🔊', 'Read aloud', false);
      if (typeof Utils !== 'undefined') Utils.toast('TTS unavailable — try Chrome or Edge', 'error', 3500);
    }
  };

  const testVoice = () => {
    speak('Hello! This is a preview of the selected voice. StudentAssist will use this voice to read lesson content aloud.');
  };

  return { speak, stop, load, testVoice, listVoices, isEnabled, getVoice };
})();
