const PracticeEngine = (() => {
  const { $, escapeHTML, markdownToHTML, toast, loadJSON } = Utils;

  let _moduleId = null;
  let _paper = null;
  let _flatQuestions = [];
  let _currentIdx = 0;
  let _answer = '';
  let _result = null;

  // Flatten nested sub-questions into a single practice list
  const _flatten = (questions) => {
    const flat = [];
    (questions || []).forEach(q => {
      if (q.subQuestions && q.subQuestions.length > 0) {
        q.subQuestions.forEach(sq => {
          flat.push({
            ...sq,
            _parentLabel: q.label,
            _figures: sq.figures || q.figures || [],
            _caseStudyRef: sq._caseStudyRef || q._caseStudyRef || null
          });
        });
      } else {
        flat.push({ ...q, _figures: q.figures || [], _caseStudyRef: q._caseStudyRef || null });
      }
    });
    return flat;
  };

  // ─── Paper Selector ───
  const showSelector = (moduleId) => {
    _moduleId = moduleId;
    const config = State.get('currentModuleConfig');
    const main = $('#main-content');
    const papers = config.examPapers || [];

    main.innerHTML = `
      <div class="su-selector">
        <div class="su-selector-header">
          <h2>📝 Exam Practice</h2>
          <p class="su-selector-desc">Pick a past paper to practise individual questions — no timer, AI-marked</p>
        </div>
        ${papers.length === 0 ? `
          <div class="empty-state"><div class="empty-state-desc">No exam papers available for this module yet.</div></div>
        ` : `
          <div class="su-list">
            ${papers.map(p => `
              <div class="su-card" onclick="PracticeEngine.start('${moduleId}', '${p.id}')">
                <div class="su-card-icon">📄</div>
                <div class="su-card-body">
                  <div class="su-card-code">${escapeHTML(p.label)}</div>
                  <div class="su-card-title">${escapeHTML(config.code)} ${escapeHTML(p.label)} Paper</div>
                  <div class="su-card-desc">${escapeHTML(p.examType === 'open_book' ? 'Open Book · 100 marks' : 'Closed Book · 100 marks')}</div>
                </div>
                <span class="su-card-arrow">›</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  };

  // ─── Start practice for a specific paper ───
  const start = async (moduleId, paperId) => {
    _moduleId = moduleId;
    const config = State.get('currentModuleConfig');
    const paperMeta = (config.examPapers || []).find(p => p.id === paperId);
    if (!paperMeta) return;

    const main = $('#main-content');
    main.innerHTML = '<div class="loading">⚙ Loading exam paper...</div>';

    try {
      _paper = await loadJSON(paperMeta.file);
      _flatQuestions = _flatten(_paper.questions);
      renderQuestionList();
    } catch (e) {
      console.error('Practice load error:', e);
      main.innerHTML = `<div class="placeholder-page"><h2>Failed to load paper</h2>
        <button class="btn btn-secondary" onclick="Router.navigate('#/${moduleId}/practice')">← Back</button></div>`;
    }
  };

  // ─── Question List ───
  const renderQuestionList = () => {
    const main = $('#main-content');
    main.innerHTML = `
      <div class="practice-selector">
        <div class="practice-paper-header">
          <button class="btn btn-ghost" onclick="PracticeEngine.showSelector('${_moduleId}')">← Papers</button>
          <div class="practice-paper-info">
            <h2>📝 ${escapeHTML(_paper.semester)}</h2>
            <p>${escapeHTML(_paper.code)} · ${_flatQuestions.length} questions · ${_paper.examType === 'open_book' ? 'Open Book' : 'Closed Book'}</p>
          </div>
        </div>
        <div class="su-list">
          ${_flatQuestions.map((q, i) => `
            <div class="su-card" onclick="PracticeEngine._startQuestion(${i})">
              <div class="su-card-icon practice-qtype-icon">${_typeIcon(q.type)}</div>
              <div class="su-card-body">
                <div class="su-card-code">${escapeHTML(q._parentLabel ? q._parentLabel + ' › ' + q.label : q.label)}</div>
                <div class="su-card-title">${escapeHTML((q.text || '').substring(0, 90))}${(q.text || '').length > 90 ? '…' : ''}</div>
                <div class="su-card-desc">${q.marks} marks · ${escapeHTML(_typeName(q.type))}</div>
              </div>
              <span class="su-card-arrow">›</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const _typeIcon = (type) => {
    const map = { mcq: '❓', fill_blank: '✏️', essay: '📝', calculation: '🧮', code_analysis: '💻', output_prediction: '🔍' };
    return map[type] || '📝';
  };
  const _typeName = (type) => {
    const map = { mcq: 'MCQ', fill_blank: 'Fill in the Blank', essay: 'Essay', calculation: 'Calculation', code_analysis: 'Code Analysis', output_prediction: 'Output Prediction' };
    return map[type] || 'Short Answer';
  };

  // ─── Single Question View ───
  const _startQuestion = (idx) => {
    _currentIdx = idx;
    _answer = '';
    _result = null;
    renderQuestion();
    window.scrollTo(0, 0);
  };

  const renderQuestion = () => {
    const q = _flatQuestions[_currentIdx];
    const main = $('#main-content');
    const hasAI = AI.isAvailable();
    const cs = q._caseStudyRef ? (_paper.caseStudies || []).find(c => c.id === q._caseStudyRef) : null;

    main.innerHTML = `
      <div class="practice-view">

        <div class="practice-topbar">
          <button class="btn btn-ghost" onclick="PracticeEngine._backToList()">← Questions</button>
          <div class="practice-nav-counter">
            <button class="icon-btn" ${_currentIdx === 0 ? 'disabled' : ''} onclick="PracticeEngine._prev()">‹</button>
            <span>${_currentIdx + 1} / ${_flatQuestions.length}</span>
            <button class="icon-btn" ${_currentIdx === _flatQuestions.length - 1 ? 'disabled' : ''} onclick="PracticeEngine._next()">›</button>
          </div>
        </div>

        ${cs ? `
          <details class="case-study-accordion" ${_result ? '' : 'open'}>
            <summary class="cs-summary">📄 ${escapeHTML(cs.title)} — tap to expand/collapse</summary>
            <div class="case-study-body">${escapeHTML(cs.text).replace(/\n/g, '<br>')}</div>
          </details>
        ` : ''}

        ${(q._figures || []).length > 0 ? `
          <div class="exam-figures">
            ${q._figures.map(f => `<img src="${escapeHTML(f)}" class="exam-figure-img" alt="Question figure" onclick="this.classList.toggle('exam-figure-expanded')">`).join('')}
            <p class="figure-hint">Tap image to enlarge</p>
          </div>
        ` : ''}

        <div class="practice-card">
          <div class="practice-qlabel">
            ${escapeHTML(q._parentLabel ? q._parentLabel + ' › ' + q.label : q.label)}
            <span class="practice-marks-badge">${q.marks} marks</span>
          </div>
          <div class="practice-qtext">${markdownToHTML(q.text || '')}</div>

          ${q.items ? `
            <ul class="practice-subitems">
              ${q.items.map(item => `<li><strong>${escapeHTML(item.label)}</strong> ${escapeHTML(item.text)} <em>(${item.marks} marks)</em></li>`).join('')}
            </ul>
          ` : ''}

          ${q.type === 'mcq' ? `
            <div class="quiz-choices practice-choices">
              ${(q.choices || []).map((c, i) => `
                <button class="choice-btn ${_result ? (i === q.answer ? 'correct' : (_answer === String(i) ? 'wrong' : 'dim')) : (_answer === String(i) ? 'selected' : '')}"
                  onclick="${_result ? '' : `PracticeEngine._selectMCQ(${i})`}" ${_result ? 'disabled' : ''}>
                  <span class="choice-letter">${String.fromCharCode(65+i)}</span>
                  <span class="choice-text">${escapeHTML(c)}</span>
                </button>
              `).join('')}
            </div>
          ` : q.type === 'fill_blank' ? `
            <input type="text" id="practice-blank" class="settings-input practice-blank-input"
              placeholder="Fill in your answer..."
              value="${escapeHTML(_answer)}"
              ${_result ? 'disabled' : ''}
              onkeypress="if(event.key==='Enter') PracticeEngine._submit()">
          ` : `
            <textarea id="practice-textarea" class="assessment-answer practice-textarea"
              placeholder="${q.type === 'code_analysis' || q.type === 'output_prediction'
                ? 'Write your Python code or trace the output step by step...'
                : 'Write your full answer. Use examples and structure your response for maximum marks.'}"
              rows="10" ${_result ? 'disabled' : ''}>${escapeHTML(_answer)}</textarea>
          `}
        </div>

        ${_result ? _renderResult(q) : `
          <div class="practice-submit-bar">
            ${q.type === 'mcq' ? `
              <button class="btn btn-primary" onclick="PracticeEngine._submit()">Check Answer</button>
            ` : q.type === 'fill_blank' ? `
              <button class="btn btn-primary" onclick="PracticeEngine._submit()">Check Answer</button>
            ` : `
              <button class="btn btn-primary" onclick="PracticeEngine._submit()">
                ${hasAI ? '🤖 Submit for AI Marking' : '📋 Show Model Answer'}
              </button>
              ${!hasAI ? `<span class="ai-hint">Add API key in Settings for AI feedback</span>` : ''}
            `}
          </div>
        `}
      </div>
    `;
  };

  const _renderResult = (q) => {
    if (q.type === 'mcq') {
      const correct = _result.correct;
      return `
        <div class="practice-result">
          <div class="practice-result-banner ${correct ? 'correct' : 'wrong'}">${correct ? '✓ Correct!' : '✗ Not quite'}</div>
          <div class="practice-explanation">${markdownToHTML(q.explanation || '')}</div>
          ${_navBtns()}
        </div>`;
    }
    if (q.type === 'fill_blank') {
      const correct = _result.correct;
      return `
        <div class="practice-result">
          <div class="practice-result-banner ${correct ? 'correct' : 'wrong'}">${correct ? '✓ Correct!' : `✗ Answer: ${escapeHTML(String(q.answer || ''))}`}</div>
          <div class="practice-explanation">${markdownToHTML(q.explanation || '')}</div>
          ${_navBtns()}
        </div>`;
    }
    // Essay / code / calculation
    const score = _result.score;
    const colorClass = score == null ? '' : score >= 7 ? 'good' : score >= 4 ? 'ok' : 'low';
    return `
      <div class="practice-result">
        ${score != null ? `
          <div class="marking-result ${colorClass}">
            <div class="marking-score-header">
              <span class="marking-score-label">Score: ${score}/10</span>
              <div class="marking-score-bar"><div class="marking-score-fill" style="width:${score*10}%"></div></div>
            </div>
            <div class="marking-feedback">${markdownToHTML(_result.feedback || '')}</div>
          </div>
        ` : ''}
        <details open>
          <summary>📋 Model Answer & Key Points</summary>
          <div class="model-answer-block">${markdownToHTML(q.modelAnswer || 'See your lecturer for the model answer.')}</div>
          ${q.keyPoints && q.keyPoints.length ? `
            <div class="key-points-list"><strong>Marking Key Points:</strong>
              <ul>${q.keyPoints.map(p => `<li>${escapeHTML(p)}</li>`).join('')}</ul>
            </div>` : ''}
        </details>
        ${_navBtns()}
      </div>`;
  };

  const _navBtns = () => `
    <div class="practice-nav-btns">
      <button class="btn btn-secondary" onclick="PracticeEngine._startQuestion(${_currentIdx})">↺ Try Again</button>
      ${_currentIdx < _flatQuestions.length - 1
        ? `<button class="btn btn-primary" onclick="PracticeEngine._next()">Next Question →</button>`
        : `<button class="btn btn-primary" onclick="PracticeEngine._backToList()">Back to List</button>`}
    </div>`;

  const _selectMCQ = (i) => { _answer = String(i); renderQuestion(); };

  const _submit = async () => {
    const q = _flatQuestions[_currentIdx];

    if (q.type === 'mcq') {
      if (_answer === '') return toast('Please select an option first', 'warning');
      _result = { correct: parseInt(_answer) === q.answer };
      renderQuestion(); return;
    }

    if (q.type === 'fill_blank') {
      const input = $('#practice-blank');
      if (input) _answer = input.value.trim();
      if (!_answer) return toast('Please type your answer first', 'warning');
      const expected = String(q.answer || '').toLowerCase();
      _result = { correct: _answer.toLowerCase().includes(expected.split(' ')[0]) };
      renderQuestion(); return;
    }

    const ta = $('#practice-textarea');
    if (ta) _answer = ta.value.trim();
    if (!_answer) return toast('Please write your answer first', 'warning');

    if (!AI.isAvailable()) {
      _result = { score: null, feedback: null };
      renderQuestion(); return;
    }

    const submitBtn = $('.practice-submit-bar .btn-primary');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Marking…'; }

    const code = State.get('currentModuleConfig')?.code || _moduleId.toUpperCase();
    try {
      const sys = `You are a supportive ${code} exam marker. Mark this answer out of 10. Be specific, constructive and encouraging. Respond ONLY with JSON: {"score":0-10,"feedback":"2-4 sentences of targeted feedback"}`;
      const usr = `Question (${q.marks} marks): ${q.text}\nModel answer: ${q.modelAnswer || ''}\nKey points: ${(q.keyPoints || []).join('; ')}\nStudent answer: ${_answer}`;
      const raw = await AI.complete(sys, usr, 400);
      _result = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
    } catch (e) {
      _result = { score: null, feedback: 'AI marking unavailable. Model answer shown below.' };
    }
    renderQuestion();
  };

  const _prev = () => { if (_currentIdx > 0) { _currentIdx--; _answer = ''; _result = null; renderQuestion(); window.scrollTo(0,0); }};
  const _next = () => { if (_currentIdx < _flatQuestions.length - 1) { _currentIdx++; _answer = ''; _result = null; renderQuestion(); window.scrollTo(0,0); }};
  const _backToList = () => { _answer = ''; _result = null; renderQuestionList(); window.scrollTo(0,0); };

  return { showSelector, start, renderQuestionList, _startQuestion, _selectMCQ, _submit, _prev, _next, _backToList };
})();
