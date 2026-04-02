const Renderer = (() => {
  const { $, $$, escapeHTML, markdownToHTML } = Utils;

  // ─── Module Home Screen ───
  const moduleHome = (moduleId) => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    if (!config) return;

    const p = Storage.getProgress(moduleId);
    const totalSUs = config.units.length;
    const completedLessons = (p.completedLessons || []).filter(id => !id.includes('_assess') && !id.includes('_quiz')).length;
    const completedQuizzes = (p.completedQuizzes || []).length;
    const xp = p.xp || 0;
    const level = p.level || 1;

    main.innerHTML = `
      <div class="module-home">
        <div class="module-home-hero">
          <div class="module-home-icon">${config.icon || '📚'}</div>
          <h1>${escapeHTML(config.title)}</h1>
          <div class="module-home-stats">
            <div class="mh-stat"><span class="mh-stat-val">${completedLessons}/${totalSUs}</span><span class="mh-stat-lbl">Lessons</span></div>
            <div class="mh-stat"><span class="mh-stat-val">${completedQuizzes}/${totalSUs}</span><span class="mh-stat-lbl">Quizzes</span></div>
            <div class="mh-stat"><span class="mh-stat-val">Lv ${level}</span><span class="mh-stat-lbl">${xp} XP</span></div>
          </div>
        </div>

        <div class="home-section-label">
          <span class="section-pill learn-pill">Learn</span>
          <span class="section-caption">Flashcards → Lesson → Assessment per SU</span>
        </div>
        <div class="home-learn-card" onclick="Router.navigate('#/${moduleId}/learn')">
          <div class="learn-card-left">
            <span class="learn-card-icon">📖</span>
            <div>
              <div class="learn-card-title">Learn Mode</div>
              <div class="learn-card-desc">Study each unit with flashcards, guided lessons and AI-marked mini assessments</div>
              <div class="learn-su-pills">
                ${config.units.map(u => {
                  const done = (p.completedLessons || []).includes(u.id);
                  return `<span class="su-pill ${done ? 'done' : ''}">${u.id.toUpperCase()}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
          <span class="learn-card-arrow">›</span>
        </div>

        <div class="home-section-label" style="margin-top:1.25rem">
          <span class="section-pill practice-pill">Practice</span>
          <span class="section-caption">Test your knowledge</span>
        </div>
        <div class="mode-grid">
          <div class="mode-card" onclick="Router.navigate('#/${moduleId}/quiz')">
            <div class="mode-icon">❓</div>
            <div class="mode-title">Quiz Run</div>
            <div class="mode-desc">MCQ questions separated by Study Unit</div>
            <span class="mode-badge">Per SU</span>
          </div>
          <div class="mode-card" onclick="Router.navigate('#/${moduleId}/assessment')">
            <div class="mode-icon">🎯</div>
            <div class="mode-title">Assessment</div>
            <div class="mode-desc">Short-answer questions, AI-marked with feedback</div>
            <span class="mode-badge purple">AI Marked</span>
          </div>
          <div class="mode-card full-width" onclick="MixedEngine.start('${moduleId}')">
            <div class="mode-icon">🔀</div>
            <div class="mode-title">Mixed Run — Exam Mode</div>
            <div class="mode-desc">20 random questions across all Study Units. Timed. Submit to global leaderboard.</div>
            <span class="mode-badge purple">Exam Mode · Leaderboard</span>
          </div>
        </div>

        <div class="home-section-label" style="margin-top:1.25rem">
          <span class="section-pill exam-pill">Past Papers</span>
          <span class="section-caption">Real SUSS exam questions</span>
        </div>
        <div class="mode-grid">
          <div class="mode-card" onclick="Router.navigate('#/${moduleId}/practice')">
            <div class="mode-icon">📝</div>
            <div class="mode-title">Exam Practice</div>
            <div class="mode-desc">Practise individual real exam questions at your own pace. AI-marked with model answers.</div>
            <span class="mode-badge">No Timer</span>
          </div>
          <div class="mode-card" onclick="Router.navigate('#/${moduleId}/exam')">
            <div class="mode-icon">🎓</div>
            <div class="mode-title">Legacy Exam Mode</div>
            <div class="mode-desc">Full 2-hour past paper simulation. Real exam conditions. AI-marked on submit.</div>
            <span class="mode-badge purple">2 Hours · Leaderboard</span>
          </div>
        </div>

        ${p.weakTopics && p.weakTopics.length > 0 ? `
          <div class="weak-topics-card">
            <div class="weak-topics-header">⚠ Weak Topics</div>
            <div class="weak-topics-list">
              ${p.weakTopics.slice(0, 5).map(t => `
                <div class="weak-topic-item">
                  <span class="weak-topic-concept">${escapeHTML(t.concept)}</span>
                  <span class="weak-topic-su">${t.unitId?.toUpperCase()}</span>
                  <span class="weak-topic-count">✗ ${t.count}x</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // ─── SU Selector (Learn) ───
  const learnSelector = (moduleId) => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    if (!config) return;
    const p = Storage.getProgress(moduleId);

    main.innerHTML = `
      <div class="su-selector">
        <div class="su-selector-header">
          <h2>📖 Learn Mode</h2>
          <p class="su-selector-desc">Select a Study Unit to begin</p>
        </div>
        <div class="su-list">
          ${config.units.map(unit => {
            const lessonDone = (p.completedLessons || []).includes(unit.id);
            const quizDone = (p.completedQuizzes || []).includes(unit.id + '_quiz');
            const assessDone = (p.completedLessons || []).includes(unit.id + '_assess');
            const mastery = p.masteryMap?.[unit.id] || 0;
            return `
              <div class="su-card" onclick="LearnEngine.start('${moduleId}', '${unit.id}')">
                <div class="su-card-icon">${unit.icon || '📚'}</div>
                <div class="su-card-body">
                  <div class="su-card-code">${unit.id.toUpperCase()}</div>
                  <div class="su-card-title">${escapeHTML(unit.title)}</div>
                  <div class="su-card-desc">${escapeHTML(unit.description || '')}</div>
                  <div class="su-card-status">
                    <span class="su-status-chip ${lessonDone ? 'done' : ''}">📖 Lesson</span>
                    <span class="su-status-chip ${quizDone ? 'done' : ''}">❓ Quiz</span>
                    <span class="su-status-chip ${assessDone ? 'done' : ''}">🎯 Assess</span>
                  </div>
                </div>
                <span class="su-card-arrow">›</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  // ─── SU Selector (Quiz) ───
  const quizSelector = (moduleId) => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    if (!config) return;
    const p = Storage.getProgress(moduleId);

    main.innerHTML = `
      <div class="su-selector">
        <div class="su-selector-header">
          <h2>❓ Quiz Run</h2>
          <p class="su-selector-desc">Pick a Study Unit to quiz on</p>
        </div>
        <div class="su-list">
          ${config.units.map(unit => {
            const done = (p.completedQuizzes || []).includes(unit.id + '_quiz');
            const mastery = p.masteryMap?.[unit.id] || 0;
            return `
              <div class="su-card" onclick="QuizEngine.startUnit('${moduleId}', '${unit.id}')">
                <div class="su-card-icon">${unit.icon || '📚'}</div>
                <div class="su-card-body">
                  <div class="su-card-code">${unit.id.toUpperCase()}</div>
                  <div class="su-card-title">${escapeHTML(unit.title)}</div>
                  ${mastery > 0 ? `<div class="mastery-bar"><div class="mastery-fill" style="width:${mastery}%"></div></div><span class="mastery-label">${mastery}% mastery</span>` : ''}
                </div>
                ${done ? '<span class="su-done-badge">✓</span>' : '<span class="su-card-arrow">›</span>'}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  // ─── Assessment SU Selector ───
  const assessmentSelector = (moduleId) => {
    const main = $('#main-content');
    const config = State.get('currentModuleConfig');
    if (!config) return;

    main.innerHTML = `
      <div class="su-selector">
        <div class="su-selector-header">
          <h2>🎯 Assessment Mode</h2>
          <p class="su-selector-desc">Choose a unit for your assessment</p>
          ${!AI.isAvailable() ? '<div class="ai-notice">💡 Add an API key in Settings for AI marking. Model answers shown otherwise.</div>' : '<div class="ai-notice ai-active">🤖 AI marking enabled</div>'}
        </div>
        <div class="su-list">
          ${config.units.map(unit => `
            <div class="su-card" onclick="AssessmentEngine.start('${moduleId}', '${unit.id}')">
              <div class="su-card-icon">${unit.icon || '📚'}</div>
              <div class="su-card-body">
                <div class="su-card-code">${unit.id.toUpperCase()}</div>
                <div class="su-card-title">${escapeHTML(unit.title)}</div>
                <div class="su-card-desc">${escapeHTML(unit.description || '')}</div>
              </div>
              <span class="su-card-arrow">›</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  return { moduleHome, learnSelector, quizSelector, assessmentSelector };
})();
