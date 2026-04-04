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
    attempts: {},
    tokenUsage: { inputTokens: 0, outputTokens: 0, calls: 0 }
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    displayName: '',
    aiMarking: true,
    ttsEnabled: false,
    ttsVoice: 'af_sky'
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
    // Non-blocking push to Supabase if signed in
    if (typeof Auth !== 'undefined' && Auth.isAuthed()) {
      pushToSupabase(moduleId).catch(err => console.warn('Supabase push failed:', err));
    }
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
    const modules = ['ict162', 'sst101', 'acc202', 'mkt202'];
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

  const importData = (data) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid data format');

    // Restore settings (only safe fields)
    if (data.settings && typeof data.settings === 'object') {
      updateSettings(s => {
        if (data.settings.displayName) s.displayName = data.settings.displayName;
        if (data.settings.theme) s.theme = data.settings.theme;
        return s;
      });
    }

    // Restore progress for every module present in the backup
    if (data.progress && typeof data.progress === 'object') {
      Object.entries(data.progress).forEach(([moduleId, progress]) => {
        if (progress && typeof progress === 'object') {
          const key = PREFIX + moduleId + '_progress';
          // Merge with defaults so any new fields are included
          const merged = { ...DEFAULT_PROGRESS, ...progress };
          localStorage.setItem(key, JSON.stringify(merged));
        }
      });
    }
  };

  // ── Supabase sync ───────────────────────────────────────────────────────────
  // Table: user_progress(user_id uuid, module_id text, progress jsonb, updated_at timestamptz)
  // Primary key: (user_id, module_id)

  const pushToSupabase = async (moduleId) => {
    if (typeof Auth === 'undefined' || !Auth.isAuthed()) return;
    const client = Auth.getClient();
    const user   = Auth.getUser();
    const progress = getProgress(moduleId);
    const { error } = await client
      .from('user_progress')
      .upsert(
        { user_id: user.id, module_id: moduleId, progress, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,module_id' }
      );
    if (error) throw error;
  };

  const pullFromSupabase = async () => {
    if (typeof Auth === 'undefined' || !Auth.isAuthed()) return;
    const client = Auth.getClient();
    const { data, error } = await client
      .from('user_progress')
      .select('module_id, progress');
    if (error) throw error;
    if (data) {
      data.forEach(({ module_id, progress }) => {
        if (progress && typeof progress === 'object') {
          const merged = { ...DEFAULT_PROGRESS, ...progress };
          localStorage.setItem(PREFIX + module_id + '_progress', JSON.stringify(merged));
        }
      });
      if (typeof Gamification !== 'undefined') Gamification.refreshHeader();
    }
  };

  const pushAllToSupabase = async () => {
    const modules = ['ict162', 'sst101', 'acc202', 'mkt202'];
    await Promise.all(modules.map(mid => pushToSupabase(mid)));
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
    exportData,
    importData,
    pushToSupabase,
    pullFromSupabase,
    pushAllToSupabase
  };
})();
