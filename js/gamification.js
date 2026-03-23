const Gamification = (() => {
  const XP_PER_LEVEL = 150;

  const XP_REWARDS = {
    flashcard_got_it: 3,
    quiz_correct: 10,
    quiz_partial: 5,
    lesson_complete: 15,
    assessment_complete: 25,
    mixed_run_complete: 50
  };

  const getCurrentModuleId = () => State.get('currentModule');

  const awardXP = (amount, reason, moduleId) => {
    moduleId = moduleId || getCurrentModuleId();
    if (!moduleId) return;

    Storage.updateProgress(moduleId, (prog) => {
      prog.xp += amount;
      prog.level = getLevelFromXP(prog.xp);
      return prog;
    });

    // Show toast
    const reasons = {
      flashcard: '+3 XP — Flashcard mastered',
      quiz_correct: '+10 XP — Quiz question correct',
      quiz_partial: '+5 XP — Quiz question partial',
      lesson: '+15 XP — Lesson completed',
      assessment: '+25 XP — Assessment complete',
      mixed: '+50 XP — Mixed run complete'
    };

    Utils.toast(reasons[reason] || `+${amount} XP — ${reason}`, 'success', 2000);
    refreshHeader();
  };

  const checkStreak = (moduleId) => {
    moduleId = moduleId || getCurrentModuleId();
    if (!moduleId) return;

    Storage.updateProgress(moduleId, (prog) => {
      const today = new Date().toDateString();
      const lastActive = prog.lastActiveDate;

      if (lastActive === today) {
        // Same day, no change
      } else if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
        // Previous day, increment
        prog.streak++;
      } else {
        // Reset streak
        prog.streak = 0;
      }

      prog.lastActiveDate = today;
      return prog;
    });
  };

  const getLevelFromXP = (xp) => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
  };

  const getProgressToNextLevel = (xp) => {
    const level = getLevelFromXP(xp);
    const currentLevelXP = (level - 1) * XP_PER_LEVEL;
    const nextLevelXP = level * XP_PER_LEVEL;
    const progress = xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    return { progress, needed, percentage: (progress / needed) * 100 };
  };

  const refreshHeader = () => {
    const moduleId = getCurrentModuleId();
    if (!moduleId) return;

    const prog = Storage.getProgress(moduleId);
    const headerEl = Utils.$('#header-xp');
    if (!headerEl) return;

    const { percentage } = getProgressToNextLevel(prog.xp);
    const xpToNext = Math.ceil(XP_PER_LEVEL - (prog.xp % XP_PER_LEVEL));

    headerEl.textContent = `Lv ${prog.level} · ${xpToNext} XP`;
    headerEl.title = `${Math.round(percentage)}% to next level`;
  };

  return {
    awardXP,
    checkStreak,
    getLevelFromXP,
    getProgressToNextLevel,
    refreshHeader,
    XP_REWARDS
  };
})();
