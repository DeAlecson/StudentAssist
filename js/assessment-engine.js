const AssessmentEngine = (() => {
  const { $, escapeHTML, markdownToHTML, toast, loadJSON } = Utils;

  let _moduleId = null;
  let _unitId = null;
  let _questions = []; // Generated or static
  let _answers = {};   // { qIdx: { text, result } }
  let _submitted = false;
  let _startTime = null;

  const start = async (moduleId, unitId) => {
    _moduleId = moduleId;
    _unitId = unitId;
    _answers = {};
    _submitted = false;
    _startTime = Date.now();

    const main = $('#main-content');
    main.innerHTML = '<div class="loading">⚙ Preparing assessment...</div>';

    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === unitId);

    if (AI.isAvailable()) {
      try {
        await _generateAIQuestions(unit);
      } catch (e) {
        console.warn('AI generation failed, using static:', e);
        await _loadStaticQuestions(unit);
      }
    } else {
      await _loadStaticQuestions(unit);
    }

    renderAssessment();
  };

  const _generateAIQuestions = async (unit) => {
    const code = State.get('currentModuleConfig')?.code || 'the module';
    const lesson = await loadJSON(unit.lessonFile).catch(() => ({}));
    const topicSummary = (lesson.sections || []).filter(s => s.type !== 'checkpoint')
      .map(s => s.title + ': ' + (s.content || '').substring(0, 200)).join('\n');

    const systemPrompt = `You are an academic assessor for ${code} - ${unit.title}.
Generate exactly 4 short-answer assessment questions.
Questions should test understanding and application, not just recall.
Each question should be answerable in 3-6 sentences.
Respond ONLY with a JSON array:
[
  {
    "prompt": "question text",
    "modelAnswer": "complete model answer in 4-5 sentences",
    "keyPoints": ["key point 1", "key point 2", "key point 3"]
  }
]`;

    const raw = await AI.complete(systemPrompt, `Topic: ${unit.title}\n\nContent overview:\n${topicSummary}`, 1200);
    const arr = JSON.parse(raw.match(/\[[\s\S]*\]/)[0]);
    _questions = arr.map((q, i) => ({ ...q, id: `gen_${i}`, _generated: true }));
  };

  const _loadStaticQuestions = async (unit) => {
    try {
      const lesson = await loadJSON(unit.lessonFile);
      _questions = (lesson.assessment && lesson.assessment.questions) || [];
    } catch (e) {
      _questions = [];
    }
  };

  const renderAssessment = () => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === _unitId);
    const hasKey = AI.isAvailable();

    if (_questions.length === 0) {
      main.innerHTML = `<div class="placeholder-page">
        <span class="placeholder-page-icon">🎯</span>
        <h2>Assessment Coming Soon</h2>
        <p>Assessment content for ${unit?.title} is being prepared.</p>
        <button class="btn btn-secondary" onclick="Router.navigate('#/${_moduleId}')">← Back</button>
      </div>`;
      return;
    }

    main.innerHTML = `
      <div class="assessment-view">
        <div class="assess-header">
          <div class="assess-title">
            <h2>🎯 Assessment</h2>
            <span class="su-badge">${unit?.id?.toUpperCase()}</span>
          </div>
          <div class="assess-subtitle">${escapeHTML(unit?.title || '')}</div>
          ${hasKey ? `<div class="ai-active-badge">🤖 AI Marking Active</div>` : `<div class="ai-inactive-badge">📄 Model answers on submit</div>`}
        </div>

        <form id="assess-form">
          ${_questions.map((q, i) => `
            <div class="assess-block" id="assess-block-${i}">
              <div class="assess-q-header">
                <span class="assess-q-num">Q${i+1}</span>
                ${_answers[i]?.result ? `<span class="assess-score-badge">${_answers[i].result.score}/10</span>` : ''}
              </div>
              <div class="assess-q-prompt">${escapeHTML(q.prompt)}</div>
              <textarea class="assessment-answer" id="assess-ans-${i}"
                placeholder="Write your answer here (3–6 sentences)..."
                ${_submitted ? 'disabled' : ''}>${escapeHTML(_answers[i]?.text || '')}</textarea>
              ${_submitted && _answers[i] ? renderResult(_answers[i], q) : ''}
            </div>
          `).join('')}
        </form>

        ${!_submitted ? `
          <div class="assess-footer">
            <button class="btn btn-ghost" onclick="Router.navigate('#/${_moduleId}')">← Exit</button>
            <button class="btn btn-primary" id="assess-submit" onclick="AssessmentEngine._submit()">
              ${hasKey ? '🤖 Submit for AI Marking' : '📋 Submit & View Answers'}
            </button>
          </div>
        ` : `
          <div class="assess-footer">
            <button class="btn btn-secondary" onclick="Router.navigate('#/${_moduleId}')">Back to Home</button>
            <button class="btn btn-ghost" onclick="AssessmentEngine.start('${_moduleId}','${_unitId}')">New Assessment</button>
          </div>
        `}
      </div>
    `;
  };

  const renderResult = (ansState, q) => {
    if (ansState.result) {
      const score = ansState.result.score;
      const colorClass = score >= 7 ? 'good' : score >= 4 ? 'ok' : 'low';
      return `
        <div class="marking-result ${colorClass}">
          <div class="marking-score-header">
            <span class="marking-score-label">Score: ${score}/10</span>
            <div class="marking-score-bar"><div class="marking-score-fill" style="width:${score*10}%"></div></div>
          </div>
          <div class="marking-feedback">${markdownToHTML(ansState.result.feedback)}</div>
          <details><summary>View model answer</summary>
            <div class="model-answer-block">${markdownToHTML(q.modelAnswer)}</div>
          </details>
        </div>
      `;
    } else {
      return `
        <div class="marking-result no-ai">
          <div class="model-answer-label">Model Answer:</div>
          <div class="model-answer-block">${markdownToHTML(q.modelAnswer)}</div>
          <div class="key-points-list"><strong>Key Points:</strong><ul>${(q.keyPoints||[]).map(p=>`<li>${escapeHTML(p)}</li>`).join('')}</ul></div>
        </div>
      `;
    }
  };

  const _submit = async () => {
    const submitBtn = $('#assess-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Marking...'; }

    let allFilled = true;
    for (let i = 0; i < _questions.length; i++) {
      const ta = $(`#assess-ans-${i}`);
      const text = ta ? ta.value.trim() : '';
      if (!text) { allFilled = false; }
      _answers[i] = { text, submitted: true, result: null };
    }

    if (!allFilled) {
      toast('Please answer all questions', 'warning');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = AI.isAvailable() ? '🤖 Submit for AI Marking' : '📋 Submit & View Answers'; }
      return;
    }

    _submitted = true;

    if (AI.isAvailable()) {
      for (let i = 0; i < _questions.length; i++) {
        const q = _questions[i];
        const code = State.get('currentModuleConfig')?.code || 'the module';
        try {
          const sys = `You are a supportive ${code} tutor. Mark this short answer out of 10. Be encouraging but accurate. Focus on conceptual understanding. Respond with ONLY JSON: {"score":0-10,"feedback":"2-3 sentences of specific feedback"}`;
          const usr = `Question: ${q.prompt}\nModel answer: ${q.modelAnswer}\nKey points: ${(q.keyPoints||[]).join(', ')}\nStudent answer: ${_answers[i].text}`;
          const raw = await AI.complete(sys, usr, 300);
          _answers[i].result = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
          if (_answers[i].result.score >= 7) Gamification.awardXP(10, 'Assessment Q', _moduleId);
          else if (_answers[i].result.score >= 4) Gamification.awardXP(5, 'Assessment Q', _moduleId);
        } catch (e) {
          console.warn('AI marking failed for Q', i, e);
          _answers[i].result = null;
        }
      }
    }

    Storage.updateProgress(_moduleId, p => {
      const key = _unitId + '_assessment';
      if (!p.completedLessons.includes(key)) p.completedLessons.push(key);
    });
    Gamification.awardXP(25, 'Assessment complete', _moduleId);
    Gamification.refreshHeader();

    renderAssessment();
  };

  return { start, _submit };
})();
