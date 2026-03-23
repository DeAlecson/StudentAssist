const Router = (() => {
  let _routes = {};
  let _currentPath = '/';
  let _isInitialized = false;

  const register = (path, handler) => {
    _routes[path] = handler;
  };

  const navigate = (path) => {
    if (typeof path !== 'string') return;
    window.location.hash = path;
  };

  const getCurrentPath = () => {
    return _currentPath;
  };

  const getCurrentModule = () => {
    const parts = _currentPath.split('/');
    return parts[1] || null;
  };

  const resolve = () => {
    let hash = window.location.hash.slice(1);
    if (!hash) hash = '/';

    _currentPath = hash;

    // Try exact match first
    if (_routes[hash]) {
      try {
        _routes[hash]();
      } catch (err) {
        console.error('Route handler error:', err);
      }
      return;
    }

    // Try pattern matching for module routes
    const parts = hash.split('/').filter(p => p);
    if (parts.length > 0) {
      const moduleId = parts[0];
      const mode = parts[1];
      const param = parts[2];

      // Check if it's a valid module route
      const pattern = '/:module/:mode' + (param ? '/:param' : '');
      if (_routes[pattern]) {
        try {
          _routes[pattern](moduleId, mode, param);
        } catch (err) {
          console.error('Route handler error:', err);
        }
        return;
      }

      // Check module root
      const modulePattern = '/:module';
      if (_routes[modulePattern]) {
        try {
          _routes[modulePattern](moduleId);
        } catch (err) {
          console.error('Route handler error:', err);
        }
        return;
      }
    }

    // Default to hub
    if (_routes['/']) {
      try {
        _routes['/']();
      } catch (err) {
        console.error('Route handler error:', err);
      }
    }
  };

  const init = () => {
    if (_isInitialized) return;
    _isInitialized = true;

    window.addEventListener('hashchange', resolve);
    resolve();
  };

  return {
    register,
    navigate,
    getCurrentPath,
    getCurrentModule,
    resolve,
    init
  };
})();
