const MixedEngine = (() => {
  const { $, escapeHTML, markdownToHTML, toast, shuffle, formatTime, loadJSON } = Utils;

  let _moduleId = null;
  let _questions = [];
  let _currentIdx = 0;
  let _answers = [];
  let _timer = null;
  let _elapsed = 0;
  let _finished = false;

  const start = async (moduleId) => {
    _stopTimer();
    _moduleId = moduleId;
    _currentIdx = 0;
    _answers = [];
    _elapsed = 0;
    _finished = false;

    const main = $('#main-content');
    main.innerHTML = '<div class="loading">⚙ Loading exam...</div>';

    const config = State.get('currentModuleConfig');

    // Load all quiz files for all units
    const all = [];
    for (const unit of config.units) {
      if (!unit.quizFile) continue;
      try {
        const data = await loadJSON(unit.quizFile);
        all.push(...(data.questions || []).map(q => ({ ...q, _unitId: unit.id, _unitTitle: unit.title })));
      } catch (e) {
        console.warn('Failed to load quiz for', unit.id);
      }
    }

    if (all.length === 0) {
      main.innerHTML = `<div class="placeholder-page"><h2>No questions available</h2><button class="btn btn-secondary" onclick="Router.navigate('#/${moduleId}')">← Back</button></div>`;
      return;
    }

    // Pick up to 20 random questions spread across units
    _questions = shuffle(all).slice(0, 20);
    _answers = new Array(_questions.length).fill(null);

    _startTimer();
    renderQuestion();
  };

  const _startTimer = () => {
    _timer = setInterval(() => {
      _elapsed++;
      const timerEl = $('#exam-timer');
      if (timerEl) timerEl.textContent = formatTime(_elapsed);
    }, 1000);
  };

  const _stopTimer = () => {
    if (_timer) { clearInterval(_timer); _timer = null; }
  };

  const renderQuestion = () => {
    const main = $('#main-content');
    const q = _questions[_currentIdx];
    const total = _questions.length;
    const pct = Math.round(((_currentIdx + 1) / total) * 100);
    const answered = _answers[_currentIdx] !== null;

    main.innerHTML = `
      <div class="exam-view">
        <div class="exam-header">
          <span class="exam-mode-badge">🔀 Mixed Run</span>
          <span class="exam-counter">Q${_currentIdx + 1}/${total}</span>
          <span class="exam-timer" id="exam-timer">${formatTime(_elapsed)}</span>
        </div>
        <div class="exam-progress">
          <div class="exam-progress-fill" style="width:${pct}%"></div>
        </div>

        <div class="exam-su-tag">
          <span class="su-badge">${(q._unitId || '').toUpperCase()}</span>
          <span class="exam-concept">${escapeHTML(q.concept || '')}</span>
        </div>

        <div class="quiz-card">
          <div class="quiz-prompt">${markdownToHTML(q.prompt || q.q || '')}</div>
          <div class="quiz-choices" id="exam-choices">
            ${(q.choices || q.o || []).map((c, i) => `
              <button class="choice-btn ${answered ? (i === (q.answer ?? q.a) ? 'correct' : (i === _answers[_currentIdx] ? 'wrong' : 'dim')) : ''}"
                data-i="${i}" ${answered ? 'disabled' : ''}
                onclick="MixedEngine._answer(${i})">
                <span class="choice-letter">${String.fromCharCode(65+i)}</span>
                <span class="choice-text">${escapeHTML(c)}</span>
              </button>
            `).join('')}
          </div>
          ${answered ? `
            <div class="quiz-feedback ${_answers[_currentIdx] === (q.answer ?? q.a) ? 'correct' : 'wrong'}">
              ${_answers[_currentIdx] === (q.answer ?? q.a) ? '✓ Correct!' : '✗ Not quite.'}
              <p>${escapeHTML(q.explanation || q.e || '')}</p>
            </div>
          ` : ''}
        </div>

        <div class="quiz-nav">
          <button class="btn btn-danger-ghost" onclick="MixedEngine._exitConfirm()">✕ Exit</button>
          ${_currentIdx === total - 1 ? `
            <button class="btn btn-primary" ${!_allAnswered() ? 'disabled' : ''} onclick="MixedEngine._finish()">Finish Exam</button>
          ` : `
            <button class="btn btn-primary" onclick="MixedEngine._next()">Next →</button>
          `}
        </div>
      </div>
    `;
  };

  const _answer = (choiceIdx) => {
    if (_answers[_currentIdx] !== null) return;
    _answers[_currentIdx] = choiceIdx;
    const q = _questions[_currentIdx];
    if (choiceIdx === (q.answer ?? q.a)) Gamification.awardXP(10, 'Exam correct', _moduleId);
    renderQuestion();
  };

  const _next = () => {
    if (_currentIdx < _questions.length - 1) { _currentIdx++; renderQuestion(); window.scrollTo(0, 0); }
  };

  const _allAnswered = () => _answers.every(a => a !== null);

  const _exitConfirm = () => {
    if (confirm('Exit Mixed Run? Your progress will be lost.')) {
      _stopTimer();
      Router.navigate(`#/${_moduleId}`);
    }
  };

  const _finish = () => {
    _stopTimer();
    _finished = true;

    const total = _questions.length;
    const correct = _answers.filter((a, i) => a === (_questions[i].answer ?? _questions[i].a)).length;
    const pct = Math.round((correct / total) * 100);
    const timeStr = formatTime(_elapsed);
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '💪';
    const code = State.get('currentModuleConfig')?.code || _moduleId.toUpperCase();

    Storage.updateProgress(_moduleId, p => {
      p.attempts[`mixed_${Date.now()}`] = { pct, correct, total, time: _elapsed };
    });
    Gamification.awardXP(50 + correct * 2, `Mixed Run ${pct}%`, _moduleId);
    Gamification.refreshHeader();

    const main = $('#main-content');
    main.innerHTML = `
      <div class="quiz-results">
        <div class="results-hero">
          <span class="results-emoji">${emoji}</span>
          <h1 class="results-score">${correct} / ${total}</h1>
          <p class="results-pct">${pct}% · Mixed Run</p>
          <p class="results-time">⏱ ${timeStr}</p>
        </div>
        <div class="results-actions">
          <button class="btn btn-primary" onclick="MixedEngine.start('${_moduleId}')">New Run</button>
          <button class="btn btn-secondary" onclick="Router.navigate('#/${_moduleId}')">Module Home</button>
          <button class="btn btn-ghost" onclick="Leaderboard.submitScore({module:'${code}',mode:'Mixed Run',pct:${pct},correct:${correct},total:${total},time:'${timeStr}'})">🏆 Submit Score</button>
        </div>
        <div class="results-breakdown">
          <h3>Results by SU</h3>
          ${renderSUBreakdown()}
        </div>
      </div>
    `;

    Leaderboard.submitScore({ module: code, mode: 'Mixed Run', pct, correct, total, time: timeStr });
  };

  const renderSUBreakdown = () => {
    const suStats = {};
    _questions.forEach((q, i) => {
      const uid = q._unitId;
      if (!suStats[uid]) suStats[uid] = { total: 0, correct: 0, title: q._unitTitle || uid };
      suStats[uid].total++;
      if (_answers[i] === (q.answer ?? q.a)) suStats[uid].correct++;
    });
    return Object.entries(suStats).map(([uid, s]) => {
      const pct = Math.round((s.correct / s.total) * 100);
      return `<div class="su-result-row">
        <span class="su-badge">${uid.toUpperCase()}</span>
        <span class="su-result-title">${escapeHTML(s.title)}</span>
        <span class="su-result-score">${s.correct}/${s.total} (${pct}%)</span>
      </div>`;
    }).join('');
  };

  return { start, _answer, _next, _exitConfirm, _finish };
})();
