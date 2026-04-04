const LearnEngine = (() => {
  const { $, $$, escapeHTML, markdownToHTML, toast, loadJSON } = Utils;

  let _moduleId = null;
  let _unitId = null;
  let _config = null;
  let _phase = 'flashcards'; // 'flashcards' | 'lesson' | 'assessment'

  // Phase 1 state
  let _cards = [];
  let _cardIdx = 0;
  let _cardResults = {}; // { cardId: 'got' | 'again' }
  let _flipped = false;

  // Phase 2 state
  let _lesson = null;
  let _sectionIdx = 0;
  let _sectionAnswers = {}; // { sectionIdx: choiceIndex }

  // Phase 3 state
  let _assessAnswers = {}; // { questionId: { text, markingResult } }
  let _assessSubmitted = false;

  const start = async (moduleId, unitId) => {
    _moduleId = moduleId;
    _unitId = unitId;
    _phase = 'flashcards';
    _cardIdx = 0;
    _cardResults = {};
    _flipped = false;
    _sectionIdx = 0;
    _sectionAnswers = {};
    _assessAnswers = {};
    _assessSubmitted = false;

    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === unitId);
    if (!unit) { toast('Unit not found', 'error'); return; }
    _config = unit;

    // Load data
    const [cards, lesson] = await Promise.all([
      loadJSON(unit.flashcardFile).catch(() => ({ cards: [] })),
      loadJSON(unit.lessonFile).catch(() => ({ sections: [], assessment: { questions: [] } }))
    ]);

    _cards = cards.cards || [];
    _lesson = lesson;

    if (_cards.length === 0) {
      // Skip directly to lesson if no flashcards
      _phase = 'lesson';
      renderLesson();
    } else {
      renderFlashcards();
    }
  };

  // ─── PHASE 1: Flashcards ───
  const renderFlashcards = () => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === _unitId);
    const gotCount = Object.values(_cardResults).filter(v => v === 'got').length;
    const total = _cards.length;

    main.innerHTML = `
      <div class="learn-view">
        <div class="learn-phase-header">
          <span class="phase-badge phase-1">Phase 1 of 3 · Flashcards</span>
          <span class="phase-unit">${escapeHTML(unit.title)}</span>
        </div>
        <div class="learn-progress">
          <div class="learn-progress-fill" style="width:${Math.round((_cardIdx/total)*100)}%"></div>
        </div>

        <div class="fc-status">
          <span class="fc-counter">${_cardIdx + 1} / ${total}</span>
          <span class="fc-got-count">✓ ${gotCount} got it</span>
        </div>

        <div class="flashcard-container" id="fc-container" onclick="LearnEngine._flipCard()">
          <div class="flashcard ${_flipped ? 'flipped' : ''}" id="flashcard">
            <div class="flashcard-front">
              <span class="fc-tag">${escapeHTML(_cards[_cardIdx].concept || 'Concept')}</span>
              <div class="fc-front-text">${escapeHTML(_cards[_cardIdx].front)}</div>
              <div class="fc-hint">Tap to reveal →</div>
            </div>
            <div class="flashcard-back">
              <div class="fc-back-text">${markdownToHTML(_cards[_cardIdx].back)}</div>
            </div>
          </div>
        </div>

        ${_flipped ? `
          <div class="fc-actions">
            <button class="btn btn-again" onclick="LearnEngine._markCard('again')">🔁 Again</button>
            <button class="btn btn-got" onclick="LearnEngine._markCard('got')">✓ Got it</button>
          </div>
        ` : `
          <div class="fc-actions">
            <button class="btn btn-ghost" onclick="LearnEngine._skipFlashcards()">Skip to Lesson →</button>
          </div>
        `}

        ${gotCount === total && total > 0 ? `
          <div class="phase-complete-nudge">
            🎉 All cards reviewed! Ready for the lesson?
            <button class="btn btn-primary" onclick="LearnEngine._goToLesson()" style="margin-top:.75rem">Start Lesson →</button>
          </div>
        ` : ''}
      </div>
    `;
  };

  const _flipCard = () => {
    _flipped = !_flipped;
    const card = $('#flashcard');
    if (card) card.classList.toggle('flipped', _flipped);
    renderFlashcards();
  };

  const _markCard = (result) => {
    const card = _cards[_cardIdx];
    _cardResults[card.id] = result;

    if (result === 'got') {
      Gamification.awardXP(3, 'Flashcard', _moduleId);
    }

    // Advance to next card
    if (_cardIdx < _cards.length - 1) {
      _cardIdx++;
      _flipped = false;
      renderFlashcards();
    } else {
      _flipped = false;
      renderFlashcards();
    }
  };

  const _skipFlashcards = () => _goToLesson();

  const _goToLesson = () => {
    _phase = 'lesson';
    _sectionIdx = 0;
    renderLesson();
  };

  // ─── PHASE 2: Lesson ───
  const renderLesson = () => {
    const main = $('#main-content');
    if (!_lesson || !_lesson.sections) {
      _goToAssessment();
      return;
    }

    const total = _lesson.sections.length;
    const pct = Math.round(((_sectionIdx + 1) / total) * 100);
    const section = _lesson.sections[_sectionIdx];
    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === _unitId);
    const answered = _sectionAnswers[_sectionIdx] !== undefined;

    const sectionTypeIcon = {
      'intro': '👋', 'definition': '📖', 'example': '💡', 'concept': '🔑', 'checkpoint': '✅'
    }[section.type] || '📄';

    main.innerHTML = `
      <div class="learn-view">
        <div class="learn-phase-header">
          <span class="phase-badge phase-2">Phase 2 of 3 · Lesson</span>
          <span class="phase-unit">${escapeHTML(unit.title)}</span>
        </div>
        <div class="learn-progress">
          <div class="learn-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="learn-section-counter">${_sectionIdx + 1} of ${total}</div>

        <div class="learn-card">
          <div class="learn-section-badge">
            <span>${sectionTypeIcon} ${escapeHTML(section.title)}</span>
            ${(typeof TTS !== 'undefined' && TTS.isEnabled()) ? `<button class="tts-btn" title="Read aloud" onclick="LearnEngine._speakSection()">🔊</button>` : ''}
          </div>
          <div class="learn-content">${markdownToHTML(section.content || '')}</div>

          ${section.type === 'checkpoint' && section.question ? renderCheckpoint(section.question, _sectionIdx, answered) : ''}
        </div>

        <div class="learn-nav">
          <button class="btn btn-secondary" ${_sectionIdx === 0 ? 'disabled' : ''} onclick="LearnEngine._prevSection()">← Prev</button>
          ${_sectionIdx === total - 1 ? `
            <button class="btn btn-primary" onclick="LearnEngine._goToAssessment()">Assessment →</button>
          ` : `
            <button class="btn btn-primary"
              ${section.type === 'checkpoint' && section.question && !answered ? 'disabled' : ''}
              onclick="LearnEngine._nextSection()">Next →</button>
          `}
        </div>
      </div>
    `;
  };

  const renderCheckpoint = (q, sectionIdx, answered) => {
    const chosen = _sectionAnswers[sectionIdx];
    return `
      <div class="checkpoint-block">
        <div class="checkpoint-prompt">${escapeHTML(q.prompt)}</div>
        <div class="checkpoint-choices">
          ${q.choices.map((c, i) => `
            <button class="choice-btn ${answered ? (i === q.answer ? 'correct' : (i === chosen ? 'wrong' : 'dim')) : ''}"
              data-idx="${i}" ${answered ? 'disabled' : ''}
              onclick="LearnEngine._answerCheckpoint(${sectionIdx}, ${i})">
              <span class="choice-letter">${String.fromCharCode(65+i)}</span>
              <span class="choice-text">${escapeHTML(c)}</span>
            </button>
          `).join('')}
        </div>
        ${answered ? `
          <div class="checkpoint-feedback ${chosen === q.answer ? 'correct' : 'wrong'}">
            ${chosen === q.answer ? '✓ Correct!' : '✗ Not quite.'}
            <p>${escapeHTML(q.explanation)}</p>
          </div>
        ` : ''}
      </div>
    `;
  };

  const _answerCheckpoint = (sectionIdx, choiceIdx) => {
    _sectionAnswers[sectionIdx] = choiceIdx;
    const section = _lesson.sections[sectionIdx];
    if (choiceIdx === section.question.answer) {
      Gamification.awardXP(5, 'Checkpoint correct', _moduleId);
    }
    renderLesson();
  };

  const _speakSection = () => {
    const section = _lesson && _lesson.sections && _lesson.sections[_sectionIdx];
    if (!section || typeof TTS === 'undefined') return;
    const text = (section.title ? section.title + '. ' : '') + (section.content || '');
    TTS.speak(text);
  };

  const _prevSection = () => {
    if (typeof TTS !== 'undefined') TTS.stop();
    if (_sectionIdx > 0) { _sectionIdx--; renderLesson(); window.scrollTo(0, 0); }
  };

  const _nextSection = () => {
    if (typeof TTS !== 'undefined') TTS.stop();
    if (_sectionIdx < _lesson.sections.length - 1) { _sectionIdx++; renderLesson(); window.scrollTo(0, 0); }
  };

  const _goToAssessment = () => {
    if (typeof TTS !== 'undefined') TTS.stop();
    Storage.updateProgress(_moduleId, p => {
      if (!p.completedLessons.includes(_unitId)) p.completedLessons.push(_unitId);
    });
    Gamification.awardXP(15, 'Lesson complete', _moduleId);
    Gamification.refreshHeader();

    _phase = 'assessment';
    renderAssessment();
  };

  // ─── PHASE 3: Mini Assessment ───
  const renderAssessment = () => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    const unit = config.units.find(u => u.id === _unitId);
    const questions = (_lesson.assessment && _lesson.assessment.questions) || [];
    const hasKey = AI.isAvailable();

    if (questions.length === 0) {
      renderLearnComplete();
      return;
    }

    main.innerHTML = `
      <div class="learn-view">
        <div class="learn-phase-header">
          <span class="phase-badge phase-3">Phase 3 of 3 · Mini Assessment</span>
          <span class="phase-unit">${escapeHTML(unit.title)}</span>
        </div>
        ${!hasKey ? `<div class="ai-notice">💡 No API key — model answers will be shown after you submit.</div>` : `<div class="ai-notice ai-active">🤖 AI marking active — Claude will give you feedback.</div>`}

        <div class="assessment-questions" id="assess-questions">
          ${questions.map((q, i) => renderAssessmentQuestion(q, i)).join('')}
        </div>

        <div class="learn-nav">
          <button class="btn btn-ghost" onclick="LearnEngine._backToLesson()">← Back to Lesson</button>
          <button class="btn btn-primary" id="assess-submit-btn" onclick="LearnEngine._submitAssessment()">
            ${hasKey ? '🤖 Submit for AI Marking' : 'Submit & See Answers'}
          </button>
        </div>
      </div>
    `;
  };

  const renderAssessmentQuestion = (q, i) => {
    const state = _assessAnswers[q.id] || {};
    const submitted = !!state.submitted;

    return `
      <div class="assess-q" id="assess-q-${q.id}">
        <div class="assess-q-num">Q${i+1}</div>
        <div class="assess-q-prompt">${escapeHTML(q.prompt)}</div>
        <textarea class="assessment-answer" id="assess-text-${q.id}"
          placeholder="Type your answer here..." ${submitted ? 'disabled' : ''}>${escapeHTML(state.text || '')}</textarea>
        ${submitted ? renderMarkingResult(q, state) : ''}
      </div>
    `;
  };

  const renderMarkingResult = (q, state) => {
    if (state.markingResult) {
      return `
        <div class="marking-result">
          <div class="marking-score">Score: ${state.markingResult.score}/10</div>
          <div class="marking-feedback">${markdownToHTML(state.markingResult.feedback)}</div>
          <details class="model-answer-details">
            <summary>View model answer</summary>
            <div class="model-answer-block">${markdownToHTML(q.modelAnswer)}</div>
          </details>
        </div>
      `;
    } else {
      return `
        <div class="marking-result no-ai">
          <div class="marking-score-label">Model Answer:</div>
          <div class="model-answer-block">${markdownToHTML(q.modelAnswer)}</div>
          <div class="key-points">
            <strong>Key Points:</strong>
            <ul>${(q.keyPoints || []).map(p => `<li>${escapeHTML(p)}</li>`).join('')}</ul>
          </div>
        </div>
      `;
    }
  };

  const _backToLesson = () => {
    _phase = 'lesson';
    renderLesson();
  };

  const _submitAssessment = async () => {
    const submitBtn = $('#assess-submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    const questions = (_lesson.assessment && _lesson.assessment.questions) || [];
    const hasKey = AI.isAvailable();

    // Collect all answers
    let anyEmpty = false;
    for (const q of questions) {
      const textarea = $(`#assess-text-${q.id}`);
      const text = textarea ? textarea.value.trim() : '';
      if (!text) { anyEmpty = true; }
      _assessAnswers[q.id] = { text, submitted: false };
    }

    if (anyEmpty) {
      toast('Please answer all questions before submitting', 'warning');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // Mark each question
    for (const q of questions) {
      const state = _assessAnswers[q.id];
      state.submitted = true;

      if (hasKey) {
        try {
          const moduleCode = State.get('currentModuleConfig')?.code || 'the module';
          const systemPrompt = `You are a supportive ${moduleCode} tutor. Mark the student's short answer.
Be encouraging but accurate. Focus on understanding of key concepts, not grammar.
Respond with ONLY a JSON object: {"score": 0-10, "feedback": "2-3 sentence feedback mentioning what was good and what was missing"}`;

          const userPrompt = `Question: ${q.prompt}
Model answer: ${q.modelAnswer}
Key points to cover: ${(q.keyPoints || []).join(', ')}
Student answer: ${state.text}`;

          const raw = await AI.complete(systemPrompt, userPrompt, 300);
          const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
          state.markingResult = json;

          if (json.score >= 7) Gamification.awardXP(10, 'Assessment answer', _moduleId);
          else if (json.score >= 4) Gamification.awardXP(5, 'Assessment answer', _moduleId);
        } catch (e) {
          console.warn('AI marking failed:', e);
          state.markingResult = null;
        }
      }
    }

    Storage.updateProgress(_moduleId, p => {
      if (!p.completedLessons.includes(_unitId + '_assess')) {
        p.completedLessons.push(_unitId + '_assess');
      }
    });
    Gamification.awardXP(25, 'Assessment complete', _moduleId);
    Gamification.refreshHeader();

    renderAssessment();

    // Show completion banner
    setTimeout(() => {
      const questionsEl = $('#assess-questions');
      if (questionsEl) {
        const doneEl = document.createElement('div');
        doneEl.className = 'assess-complete-banner';
        doneEl.innerHTML = `
          <div class="assess-complete-icon">🎓</div>
          <h3>SU Complete!</h3>
          <p>You've finished Learn Mode for this unit.</p>
          <button class="btn btn-primary" onclick="LearnEngine._finishLearn()">Back to Module Home</button>
        `;
        questionsEl.parentElement.insertBefore(doneEl, questionsEl.nextSibling);
      }
    }, 100);
  };

  const _finishLearn = () => {
    Router.navigate(`#/${_moduleId}`);
  };

  const renderLearnComplete = () => {
    const main = $('#main-content');
    main.innerHTML = `
      <div class="learn-complete">
        <div class="learn-complete-icon">🎓</div>
        <h2>Unit Complete!</h2>
        <p>You've finished the lesson and checkpoint questions.</p>
        <button class="btn btn-primary" onclick="LearnEngine._finishLearn()">Back to Module Home</button>
      </div>
    `;
  };

  return {
    start,
    _flipCard,
    _markCard,
    _skipFlashcards,
    _goToLesson,
    _answerCheckpoint,
    _speakSection,
    _prevSection,
    _nextSection,
    _goToAssessment,
    _backToLesson,
    _submitAssessment,
    _finishLearn
  };
})();
