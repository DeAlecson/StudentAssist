const ExamEngine = (() => {
  const { $, $$, escapeHTML, markdownToHTML, toast, loadJSON, formatTime } = Utils;

  let _moduleId = null;
  let _paper = null;
  let _answers = {};   // { questionId: text/choiceIdx }
  let _results = {};   // { questionId: { score, feedback } }
  let _timer = null;
  let _elapsed = 0;
  let _finished = false;
  let _submitted = false;

  // ─── Paper Selector ───
  const showSelector = (moduleId) => {
    _moduleId = moduleId;
    const config = State.get('currentModuleConfig');
    const main = $('#main-content');
    const papers = config.examPapers || [];

    main.innerHTML = `
      <div class="su-selector">
        <div class="su-selector-header">
          <h2>🎓 Legacy Exam Mode</h2>
          <p class="su-selector-desc">Full past paper simulation · 2-hour countdown · AI-marked · Leaderboard eligible</p>
          <div class="exam-mode-notice">
            📌 Answers are typed and AI-marked. Case study passages are provided on screen.
            ${!AI.isAvailable() ? '<br>⚠ No API key detected — model answers shown on submit instead of AI scoring. <button class="btn btn-ghost btn-xs" onclick="document.getElementById(\'settings-btn\').click()">Add Key</button>' : ''}
          </div>
        </div>
        ${papers.length === 0 ? `
          <div class="empty-state"><div class="empty-state-desc">No exam papers available for this module yet.</div></div>
        ` : `
          <div class="su-list">
            ${papers.map(p => `
              <div class="su-card" onclick="ExamEngine.start('${moduleId}', '${p.id}')">
                <div class="su-card-icon">🎓</div>
                <div class="su-card-body">
                  <div class="su-card-code">${escapeHTML(p.label)}</div>
                  <div class="su-card-title">${escapeHTML(config.code)} ${escapeHTML(p.label)} — Full Paper</div>
                  <div class="su-card-desc">${escapeHTML(p.examType === 'open_book' ? 'Open Book' : 'Closed Book')} · 2 hours · 100 marks</div>
                </div>
                <div class="exam-start-badge">Start Exam →</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  };

  // ─── Start Full Exam ───
  const start = async (moduleId, paperId) => {
    _moduleId = moduleId;
    const config = State.get('currentModuleConfig');
    const paperMeta = (config.examPapers || []).find(p => p.id === paperId);
    if (!paperMeta) return;

    const main = $('#main-content');
    main.innerHTML = '<div class="loading">⚙ Preparing exam...</div>';

    try {
      _paper = await loadJSON(paperMeta.file);
    } catch (e) {
      main.innerHTML = `<div class="placeholder-page"><h2>Failed to load paper</h2>
        <button class="btn btn-secondary" onclick="Router.navigate('#/${moduleId}/exam')">← Back</button></div>`;
      return;
    }

    // Confirm before starting
    const confirmed = confirm(`Start ${_paper.semester} exam?\n\n⏱ 2-hour timer starts immediately.\n📋 ${_paper.questions.length} questions · ${_paper.totalMarks} marks\n\nAre you ready?`);
    if (!confirmed) {
      Router.navigate(`#/${moduleId}/exam`);
      return;
    }

    _answers = {};
    _results = {};
    _elapsed = 0;
    _finished = false;
    _submitted = false;

    _startTimer();
    renderExam();
  };

  // ─── Timer ───
  const _startTimer = () => {
    const DURATION = _paper?.duration || 7200;
    _timer = setInterval(() => {
      _elapsed++;
      const remaining = DURATION - _elapsed;
      const timerEl = $('#exam-live-timer');
      if (timerEl) {
        timerEl.textContent = formatTime(remaining);
        timerEl.className = 'exam-live-timer' + (remaining < 900 ? ' danger' : remaining < 1800 ? ' warn' : '');
      }
      if (remaining <= 0) {
        _stopTimer();
        toast('⏱ Time is up! Submitting your exam…', 'warning', 4000);
        setTimeout(() => _submit(), 1500);
      }
    }, 1000);
  };

  const _stopTimer = () => {
    if (_timer) { clearInterval(_timer); _timer = null; }
  };

  // ─── Render Full Exam ───
  const renderExam = () => {
    const DURATION = _paper?.duration || 7200;
    const remaining = DURATION - _elapsed;
    const main = $('#main-content');

    const questionsHTML = _paper.questions.map((q, qi) => _renderQuestion(q, qi)).join('');

    main.innerHTML = `
      <div class="exam-full-view">

        <!-- Sticky exam bar -->
        <div class="exam-sticky-bar">
          <div class="exam-sticky-left">
            <span class="exam-mode-badge">🎓 ${escapeHTML(_paper.semester)}</span>
            <span class="exam-type-pill">${_paper.examType === 'open_book' ? 'Open Book' : 'Closed Book'}</span>
          </div>
          <div id="exam-live-timer" class="exam-live-timer">${formatTime(remaining)}</div>
          <button class="btn btn-primary btn-sm" onclick="ExamEngine._confirmSubmit()">Submit Exam</button>
        </div>

        <!-- Case studies -->
        ${(_paper.caseStudies || []).map(cs => `
          <details class="case-study-accordion exam-cs" open>
            <summary class="cs-summary">📄 ${escapeHTML(cs.title)} — tap to expand/collapse</summary>
            <div class="case-study-body">${escapeHTML(cs.text).replace(/\n/g, '<br>')}</div>
          </details>
        `).join('')}

        <!-- Questions -->
        <div class="exam-questions-list">
          ${questionsHTML}
        </div>

        <div class="exam-footer-actions">
          <button class="btn btn-danger-ghost" onclick="ExamEngine._exitConfirm()">✕ Abandon Exam</button>
          <button class="btn btn-primary" onclick="ExamEngine._confirmSubmit()">Submit & Get Results</button>
        </div>
      </div>
    `;
  };

  const _renderQuestion = (q, qi) => {
    const isAnswered = _answers[q.id] != null && _answers[q.id] !== '';
    const figuresHTML = (q.figures || []).map(f =>
      `<img src="${escapeHTML(f)}" class="exam-figure-img" alt="Figure" onclick="this.classList.toggle('exam-figure-expanded')">`
    ).join('');
    const subFigures = (q.subQuestions || []).flatMap(sq => sq.figures || [])
      .map(f => `<img src="${escapeHTML(f)}" class="exam-figure-img" alt="Figure" onclick="this.classList.toggle('exam-figure-expanded')">`).join('');

    let inputHTML = '';

    if (q.type === 'mcq') {
      inputHTML = `<div class="quiz-choices exam-choices" id="choices-${q.id}">
        ${(q.choices || []).map((c, i) => `
          <button class="choice-btn ${_answers[q.id] === i ? 'selected' : ''}"
            onclick="ExamEngine._setAnswer('${q.id}', ${i}); this.closest('.quiz-choices').querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected')); this.classList.add('selected')">
            <span class="choice-letter">${String.fromCharCode(65+i)}</span>
            <span class="choice-text">${escapeHTML(c)}</span>
          </button>
        `).join('')}
      </div>`;
    } else if (q.type === 'fill_blank') {
      inputHTML = `<input type="text" class="settings-input exam-blank-input" placeholder="Your answer..."
        value="${escapeHTML(String(_answers[q.id] || ''))}"
        oninput="ExamEngine._setAnswer('${q.id}', this.value)">`;
    } else if (q.subQuestions && q.subQuestions.length > 0) {
      // Multi-part question: render each sub-question's textarea
      inputHTML = q.subQuestions.map(sq => `
        <div class="exam-subq" id="subq-${sq.id}">
          <div class="exam-subq-label">${escapeHTML(sq.label)} <span class="exam-marks">(${sq.marks} marks)</span></div>
          <div class="exam-subq-text">${markdownToHTML(sq.text || '')}</div>
          ${sq.type === 'mcq' ? `
            <div class="quiz-choices exam-choices">
              ${(sq.choices || []).map((c, i) => `
                <button class="choice-btn ${_answers[sq.id] === i ? 'selected' : ''}"
                  onclick="ExamEngine._setAnswer('${sq.id}', ${i}); this.closest('.quiz-choices').querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected')); this.classList.add('selected')">
                  <span class="choice-letter">${String.fromCharCode(65+i)}</span>
                  <span class="choice-text">${escapeHTML(c)}</span>
                </button>`).join('')}
            </div>
          ` : sq.type === 'fill_blank' ? `
            <input type="text" class="settings-input exam-blank-input" placeholder="Your answer..."
              value="${escapeHTML(String(_answers[sq.id] || ''))}"
              oninput="ExamEngine._setAnswer('${sq.id}', this.value)">
          ` : `
            <textarea class="assessment-answer exam-textarea" rows="6"
              placeholder="Answer ${escapeHTML(sq.label)} here..."
              oninput="ExamEngine._setAnswer('${sq.id}', this.value)">${escapeHTML(String(_answers[sq.id] || ''))}</textarea>
          `}
        </div>
      `).join('');
    } else {
      inputHTML = `<textarea class="assessment-answer exam-textarea" rows="8"
        placeholder="Write your answer here..."
        oninput="ExamEngine._setAnswer('${q.id}', this.value)">${escapeHTML(String(_answers[q.id] || ''))}</textarea>`;
    }

    return `
      <div class="exam-question-block" id="qblock-${q.id}">
        <div class="exam-q-header">
          <span class="exam-q-label">${escapeHTML(q.label)}</span>
          <span class="exam-q-marks">${q.marks} marks</span>
          ${isAnswered ? '<span class="exam-answered-dot" title="Answered">●</span>' : '<span class="exam-unanswered-dot" title="Not answered">○</span>'}
        </div>
        ${q.text ? `<div class="exam-q-text">${markdownToHTML(q.text)}</div>` : ''}
        ${figuresHTML || subFigures ? `<div class="exam-figures">${figuresHTML}${subFigures}</div>` : ''}
        ${inputHTML}
      </div>
    `;
  };

  // ─── Answer Management ───
  const _setAnswer = (questionId, value) => {
    _answers[questionId] = value;
    // Update answered indicator
    const dot = $(`#qblock-${questionId} .exam-answered-dot, #qblock-${questionId} .exam-unanswered-dot`);
    // Just toggle quietly, no full re-render needed
  };

  // ─── Submit ───
  const _confirmSubmit = () => {
    if (confirm('Submit your exam now? This will end the timer and AI-mark all your answers.')) {
      _stopTimer();
      _submit();
    }
  };

  const _exitConfirm = () => {
    if (confirm('Abandon exam? All your answers will be lost.')) {
      _stopTimer();
      Router.navigate(`#/${_moduleId}/exam`);
    }
  };

  const _submit = async () => {
    if (_submitted) return;
    _submitted = true;
    _stopTimer();

    const main = $('#main-content');
    main.innerHTML = `
      <div class="exam-marking-screen">
        <div class="exam-marking-icon">🤖</div>
        <h2>Marking your exam…</h2>
        <p>AI is reviewing each answer. This may take a minute.</p>
        <div id="marking-progress" class="marking-progress-list"></div>
      </div>
    `;

    const hasAI = AI.isAvailable();
    const code = State.get('currentModuleConfig')?.code || _moduleId.toUpperCase();
    const allQuestions = _allFlatQuestions();
    let totalScore = 0;
    let totalPossible = 0;

    for (const q of allQuestions) {
      const progressEl = $('#marking-progress');
      if (progressEl) {
        progressEl.innerHTML += `<div class="marking-item" id="marking-${q.id}">⏳ Marking ${escapeHTML(q.label || q.id)}…</div>`;
      }

      const answer = String(_answers[q.id] || '');
      totalPossible += 10; // normalised to /10 per question

      if (q.type === 'mcq') {
        const correct = parseInt(answer) === q.answer;
        _results[q.id] = { score: correct ? 10 : 0, feedback: correct ? 'Correct.' : `Correct answer: ${String.fromCharCode(65 + q.answer)} — ${escapeHTML(q.explanation || '')}` };
        totalScore += _results[q.id].score;
      } else if (q.type === 'fill_blank') {
        const expected = String(q.answer || '').toLowerCase();
        const correct = answer.toLowerCase().includes(expected.split(' ')[0]);
        _results[q.id] = { score: correct ? 10 : 0, feedback: correct ? 'Correct.' : `Expected: ${escapeHTML(String(q.answer || ''))}` };
        totalScore += _results[q.id].score;
      } else if (hasAI && answer.trim()) {
        try {
          const sys = `You are a strict but fair ${code} exam marker. Mark this answer out of 10 based on the model answer and key points. Be specific. Respond ONLY with JSON: {"score":0-10,"feedback":"2-3 sentences"}`;
          const usr = `Q (${q.marks} marks): ${q.text}\nModel: ${q.modelAnswer || ''}\nKey points: ${(q.keyPoints || []).join('; ')}\nAnswer: ${answer}`;
          const raw = await AI.complete(sys, usr, 300);
          _results[q.id] = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
          totalScore += _results[q.id].score;
        } catch (e) {
          _results[q.id] = { score: null, feedback: 'Marking failed.' };
        }
      } else {
        _results[q.id] = { score: null, feedback: answer.trim() ? 'See model answer below.' : 'No answer provided.' };
      }

      const item = $(`#marking-${q.id}`);
      if (item) {
        const s = _results[q.id].score;
        item.textContent = `${s != null ? `${s}/10` : '—'} ${escapeHTML(q.label || q.id)}`;
        item.className = 'marking-item done';
      }

      await new Promise(r => setTimeout(r, 100)); // small delay between AI calls
    }

    _finished = true;
    const pct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    renderResults(pct);
  };

  const _allFlatQuestions = () => {
    const flat = [];
    (_paper.questions || []).forEach(q => {
      if (q.subQuestions && q.subQuestions.length > 0) {
        q.subQuestions.forEach(sq => flat.push({ ...sq, _figures: sq.figures || q.figures || [] }));
      } else {
        flat.push({ ...q, _figures: q.figures || [] });
      }
    });
    return flat;
  };

  // ─── Results Screen ───
  const renderResults = (pct) => {
    const main = $('#main-content');
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '💪';
    const allQ = _allFlatQuestions();
    const timeStr = formatTime(_elapsed);
    const code = State.get('currentModuleConfig')?.code || _moduleId.toUpperCase();

    main.innerHTML = `
      <div class="quiz-results exam-results">
        <div class="results-hero">
          <span class="results-emoji">${emoji}</span>
          <h1 class="results-score">${pct}%</h1>
          <p class="results-pct">${escapeHTML(_paper.semester)} · ${escapeHTML(code)}</p>
          <p class="results-time">⏱ ${timeStr}</p>
          ${AI.isAvailable() ? '' : '<p class="results-hint">Add an API key in Settings for AI-marked scores</p>'}
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" onclick="Router.navigate('#/${_moduleId}/exam')">New Exam</button>
          <button class="btn btn-secondary" onclick="Router.navigate('#/${_moduleId}')">Module Home</button>
        </div>

        <div class="exam-answers-review">
          <h3>Answer Review</h3>
          ${allQ.map(q => {
            const r = _results[q.id];
            const ans = String(_answers[q.id] || '(no answer)');
            const score = r?.score;
            const colorClass = score == null ? '' : score >= 7 ? 'good' : score >= 4 ? 'ok' : 'low';
            return `
              <div class="exam-review-block">
                <div class="exam-review-header">
                  <span class="exam-review-label">${escapeHTML(q.label || q.id)}</span>
                  ${score != null ? `<span class="assess-score-badge ${colorClass}">${score}/10</span>` : '<span class="assess-score-badge">—</span>'}
                </div>
                ${(q._figures || []).length > 0 ? `<div class="exam-figures">${q._figures.map(f => `<img src="${escapeHTML(f)}" class="exam-figure-img" style="max-height:120px">`).join('')}</div>` : ''}
                <div class="exam-review-q">${markdownToHTML(q.text || '')}</div>
                <div class="exam-review-ans"><strong>Your answer:</strong><br>${escapeHTML(ans).replace(/\n/g,'<br>')}</div>
                ${r?.feedback ? `<div class="marking-feedback">${markdownToHTML(r.feedback)}</div>` : ''}
                <details>
                  <summary>View model answer</summary>
                  <div class="model-answer-block">${markdownToHTML(q.modelAnswer || 'Model answer not available.')}</div>
                  ${q.keyPoints ? `<ul class="key-points-list">${q.keyPoints.map(p=>`<li>${escapeHTML(p)}</li>`).join('')}</ul>` : ''}
                </details>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Submit to leaderboard if score > 0
    if (pct > 0) {
      Leaderboard.submitScore({ module: code, mode: 'Exam', pct, correct: null, total: null, time: timeStr });
    }
  };

  return { showSelector, start, _setAnswer, _confirmSubmit, _exitConfirm, _submit };
})();
