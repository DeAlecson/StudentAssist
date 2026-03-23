const State = (() => {
  let _state = {
    currentModule: null,         // 'ict162' | 'sst101' | 'acc202'
    currentModuleConfig: null,   // loaded module config
    currentRoute: '/',
    navOpen: false,
    settingsOpen: false,
    lbOpen: false,
    apiKeyActive: false,
    loading: false,
    moduleColor: '#00d4ff'
  };

  let _listeners = [];

  const get = (key) => {
    if (key === undefined) return { ..._state };
    return _state[key];
  };

  const set = (key, val) => {
    if (_state[key] !== val) {
      _state[key] = val;
      _notify();
    }
  };

  const merge = (partial) => {
    let changed = false;
    for (const key in partial) {
      if (_state[key] !== partial[key]) {
        _state[key] = partial[key];
        changed = true;
      }
    }
    if (changed) _notify();
  };

  const subscribe = (fn) => {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter(l => l !== fn);
    };
  };

  const _notify = () => {
    _listeners.forEach(fn => {
      try {
        fn({ ..._state });
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  };

  return {
    get,
    set,
    merge,
    subscribe
  };
})();
