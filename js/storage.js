const Storage = (() => {
  const PREFIX = 'sa_';

  const DEFAULT_PROGRESS = {
    version: '1.0.0',
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    completedLessons: [],
    completedQuizzes: [],
    completedFlashcards: [],
    masteryMap: {},
    wrongAnswers: [],
    weakTopics: [],
    attempts: {}
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    displayName: '',
    aiMarking: true
  };

  const init = () => {
    if (!localStorage.getItem(PREFIX + 'initialized')) {
      // Initialize all modules with default progress
      const modules = ['ict162', 'sst101', 'acc202'];
      modules.forEach(mid => {
        const key = PREFIX + mid + '_progress';
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify({ ...DEFAULT_PROGRESS }));
        }
      });

      if (!localStorage.getItem(PREFIX + 'settings')) {
        localStorage.setItem(PREFIX + 'settings', JSON.stringify({ ...DEFAULT_SETTINGS }));
      }

      localStorage.setItem(PREFIX + 'initialized', 'true');
    }
  };

  const getProgress = (moduleId) => {
    const key = PREFIX + moduleId + '_progress';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : { ...DEFAULT_PROGRESS };
  };

  const setProgress = (moduleId, progress) => {
    const key = PREFIX + moduleId + '_progress';
    localStorage.setItem(key, JSON.stringify(progress));
  };

  const updateProgress = (moduleId, fn) => {
    const prog = getProgress(moduleId);
    const updated = fn(prog) || prog;
    setProgress(moduleId, updated);
    return updated;
  };

  const getSettings = () => {
    const stored = localStorage.getItem(PREFIX + 'settings');
    return stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };
  };

  const setSettings = (settings) => {
    localStorage.setItem(PREFIX + 'settings', JSON.stringify(settings));
  };

  const updateSettings = (fn) => {
    const settings = getSettings();
    const updated = fn(settings) || settings;
    setSettings(updated);
    return updated;
  };

  const getApiKey = () => {
    return sessionStorage.getItem(PREFIX + 'api_key');
  };

  const setApiKey = (key) => {
    if (key) {
      sessionStorage.setItem(PREFIX + 'api_key', key);
    }
  };

  const clearApiKey = () => {
    sessionStorage.removeItem(PREFIX + 'api_key');
  };

  const resetModule = (moduleId) => {
    const key = PREFIX + moduleId + '_progress';
    localStorage.setItem(key, JSON.stringify({ ...DEFAULT_PROGRESS }));
  };

  const resetAll = () => {
    const modules = ['ict162', 'sst101', 'acc202'];
    modules.forEach(mid => resetModule(mid));
    setSettings({ ...DEFAULT_SETTINGS });
    clearApiKey();
  };

  const exportData = () => {
    const modules = ['ict162', 'sst101', 'acc202'];
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      progress: {}
    };

    modules.forEach(mid => {
      data.progress[mid] = getProgress(mid);
    });

    return data;
  };

  return {
    init,
    getProgress,
    setProgress,
    updateProgress,
    getSettings,
    setSettings,
    updateSettings,
    getApiKey,
    setApiKey,
    clearApiKey,
    resetModule,
    resetAll,
    exportData
  };
})();
