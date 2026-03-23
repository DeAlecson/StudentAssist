const QuizEngine = (() => {
  const { $, $$, escapeHTML, markdownToHTML, toast, shuffle, loadJSON, formatTime } = Utils;

  let _moduleId = null;
  let _unitIds = []; // ['su1'] or ['su1','su2','su3']
  let _quiz = null;  // merged questions array
  let _currentIdx = 0;
  let _answers = [];
  let _startTime = null;

  const startUnit = async (moduleId, unitId) => {
    await _start(moduleId, [unitId]);
  };

  const startMixed = async (moduleId, unitIds) => {
    await _start(moduleId, unitIds);
  };

  const _start = async (moduleId, unitIds) => {
    _moduleId = moduleId;
    _unitIds = unitIds;
    _currentIdx = 0;
    _answers = [];
    _startTime = Date.now();

    const config = State.get('currentModuleConfig');

    // Load all quiz files
    const allQuestions = [];
    for (const unitId of unitIds) {
      const unit = config.units.find(u => u.id === unitId);
      if (!unit || !unit.quizFile) continue;
      try {
        const data = await loadJSON(unit.quizFile);
        allQuestions.push(...(data.questions || []).map(q => ({ ...q, _unitId: unitId })));
      } catch (e) {
        console.warn('Failed to load quiz for', unitId);
      }
    }

    if (allQuestions.length === 0) {
      $('#main-content').innerHTML = `<div class="placeholder-page">
        <span class="placeholder-page-icon">📝</span>
        <h2>No quiz available</h2>
        <p>Quiz content for this unit is coming soon.</p>
        <button class="btn btn-secondary" onclick="Router.navigate('#/${moduleId}')">← Back</button>
      </div>`;
      return;
    }

    _quiz = shuffle(allQuestions);
    _answers = new Array(_quiz.length).fill(null);
    renderQuestion();
  };

  const renderQuestion = () => {
    const main = $('#main-content');
    if (!_quiz) return;

    const q = _quiz[_currentIdx];
    const total = _quiz.length;
    const pct = Math.round(((_currentIdx + 1) / total) * 100);
    const answered = _answers[_currentIdx] !== null;
    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === q._unitId);

    main.innerHTML = `
      <div class="quiz-view">
        <div class="quiz-header">
          <button class="btn btn-ghost" onclick="Router.navigate('#/${_moduleId}')">← Exit</button>
          <span class="quiz-counter">Q${_currentIdx + 1} / ${total}</span>
          ${_unitIds.length > 1 ? `<span class="su-badge">${escapeHTML(unit ? unit.id.toUpperCase() : '')}</span>` : ''}
        </div>

        <div class="quiz-progress">
          <div class="quiz-progress-fill" style="width:${pct}%"></div>
        </div>

        <div class="quiz-card">
          <span class="quiz-type-badge">${q.type === 'output_prediction' ? '🔍 Output Prediction' : q.type === 'error_spotting' ? '🐛 Error Spotting' : '❓ MCQ'}</span>
          <div class="quiz-concept">Concept: ${escapeHTML(q.concept || '')}</div>
          <div class="quiz-prompt">${markdownToHTML(q.prompt || q.q || '')}</div>

          <div class="quiz-choices" id="quiz-choices">
            ${(q.choices || q.o || []).map((c, i) => `
              <button class="choice-btn ${answered ? (i === (q.answer ?? q.a) ? 'correct' : (i === _answers[_currentIdx] ? 'wrong' : 'dim')) : ''}"
                data-i="${i}" ${answered ? 'disabled' : ''}
                onclick="QuizEngine._answer(${i})">
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
          <button class="btn btn-secondary" ${_currentIdx === 0 ? 'disabled' : ''} onclick="QuizEngine._prev()">← Prev</button>
          ${_currentIdx === total - 1 ? `
            <button class="btn btn-primary" ${!_allAnswered() ? 'disabled' : ''} onclick="QuizEngine._finish()">See Results</button>
          ` : `
            <button class="btn btn-primary" onclick="QuizEngine._next()">Next →</button>
          `}
        </div>
      </div>
    `;
  };

  const _answer = (choiceIdx) => {
    if (_answers[_currentIdx] !== null) return; // Already answered
    _answers[_currentIdx] = choiceIdx;
    const q = _quiz[_currentIdx];
    const correct = choiceIdx === (q.answer ?? q.a);
    if (correct) Gamification.awardXP(10, 'Quiz correct', _moduleId);
    // Track weak topics
    if (!correct) {
      Storage.updateProgress(_moduleId, p => {
        const concept = q.concept || q._unitId;
        const existing = p.weakTopics.find(t => t.concept === concept);
        if (existing) { existing.count++; existing.lastSeen = new Date().toISOString(); }
        else p.weakTopics.push({ concept, unitId: q._unitId, count: 1, lastSeen: new Date().toISOString() });
        p.weakTopics.sort((a, b) => b.count - a.count);
        if (p.weakTopics.length > 30) p.weakTopics = p.weakTopics.slice(0, 30);
      });
    }
    renderQuestion();
  };

  const _prev = () => {
    if (_currentIdx > 0) { _currentIdx--; renderQuestion(); window.scrollTo(0, 0); }
  };

  const _next = () => {
    if (_currentIdx < _quiz.length - 1) { _currentIdx++; renderQuestion(); window.scrollTo(0, 0); }
  };

  const _allAnswered = () => _answers.every(a => a !== null);

  const _finish = () => {
    const elapsed = Math.round((Date.now() - _startTime) / 1000);
    const total = _quiz.length;
    const correct = _answers.filter((a, i) => a === (_quiz[i].answer ?? _quiz[i].a)).length;
    const pct = Math.round((correct / total) * 100);

    // Save progress
    Storage.updateProgress(_moduleId, p => {
      for (const uid of _unitIds) {
        if (!p.completedQuizzes.includes(uid + '_quiz')) p.completedQuizzes.push(uid + '_quiz');
        if (!p.masteryMap[uid]) p.masteryMap[uid] = 0;
        p.masteryMap[uid] = Math.min(100, p.masteryMap[uid] + Math.round(pct * 0.4));
      }
      // Save wrong answers
      _answers.forEach((a, i) => {
        const q = _quiz[i];
        if (a !== (q.answer ?? q.a)) {
          p.wrongAnswers.push({ questionId: q.id, unitId: q._unitId, concept: q.concept, timestamp: new Date().toISOString() });
          if (p.wrongAnswers.length > 100) p.wrongAnswers = p.wrongAnswers.slice(-100);
        }
      });
    });

    Gamification.awardXP(correct * 3, `Quiz ${pct}%`, _moduleId);
    Gamification.refreshHeader();

    // Show results
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '💪';
    const msg = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job! Review the missed ones.' : pct >= 40 ? 'Keep going — review mistakes below.' : 'No worries, let\'s review together.';
    const timeStr = formatTime(elapsed);

    const main = $('#main-content');
    main.innerHTML = `
      <div class="quiz-results">
        <div class="results-hero">
          <span class="results-emoji">${emoji}</span>
          <h1 class="results-score">${correct} / ${total}</h1>
          <p class="results-pct">${pct}%</p>
          <p class="results-msg">${msg}</p>
          <p class="results-time">⏱ ${timeStr}</p>
        </div>
        <div class="results-actions">
          <button class="btn btn-primary" onclick="QuizEngine._retry()">Retry</button>
          <button class="btn btn-secondary" onclick="Router.navigate('#/${_moduleId}')">Module Home</button>
          <button class="btn btn-ghost" onclick="Leaderboard.submitScore({module:'${State.get('currentModuleConfig')?.code}', mode:'Quiz', pct:${pct}, correct:${correct}, total:${total}, time:'${timeStr}'})">Submit to LB 🏆</button>
        </div>
        <div class="results-breakdown">
          <h3>Review</h3>
          ${_quiz.map((q, i) => {
            const isCorrect = _answers[i] === (q.answer ?? q.a);
            return `<div class="result-item ${isCorrect ? 'correct' : 'wrong'}">
              <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
              <div class="result-info">
                <span class="result-concept">${escapeHTML(q.concept || '')}</span>
                ${!isCorrect ? `<p class="result-explain">${escapeHTML(q.explanation || q.e || '')}</p>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    // Auto-prompt leaderboard
    const code = State.get('currentModuleConfig')?.code || _moduleId.toUpperCase();
    Leaderboard.promptName(() => {
      Leaderboard.submitScore({ module: code, mode: 'Quiz', pct, correct, total, time: timeStr });
    });
  };

  const _retry = () => {
    _currentIdx = 0;
    _answers = new Array(_quiz.length).fill(null);
    _quiz = shuffle(_quiz);
    _startTime = Date.now();
    renderQuestion();
  };

  return { startUnit, startMixed, _answer, _prev, _next, _finish, _retry };
})();
