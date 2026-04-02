const App = (() => {
  let _modules = [];
  let _currentModuleCode = null;

  const boot = async () => {
    // Initialize storage
    Storage.init();

    // Load modules configuration
    try {
      const modulesData = await Utils.loadJSON('data/modules.json');
      _modules = modulesData.modules || [];
    } catch (err) {
      console.error('Failed to load modules:', err);
      Utils.toast('Failed to load modules', 'error');
      return;
    }

    // Render hub
    renderHub();

    // Register routes
    registerRoutes();

    // Initialize router
    Router.init();

    // Bind global events
    bindGlobalEvents();

    // Setup leaderboard filters
    Leaderboard.bindFilters();
  };

  const renderHub = () => {
    const hubCards = Utils.$('#hub-cards');
    if (!hubCards) return;

    hubCards.innerHTML = '';

    _modules.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'hub-card' + (mod.available ? '' : ' hub-card-soon');
      card.dataset.module = mod.id;
      card.style.setProperty('--card-color', mod.color);

      let chipsHTML = '';
      if (mod.chips) {
        chipsHTML = mod.chips.map(chip => `<span class="hub-chip">${Utils.escapeHTML(chip)}</span>`).join('');
      }

      card.innerHTML = `
        <div class="hub-card-icon">${mod.icon}</div>
        <div class="hub-card-content">
          <div class="hub-card-header">
            <span class="hub-card-code">${Utils.escapeHTML(mod.code)}</span>
          </div>
          <h3 class="hub-card-title">
            <span class="hub-card-title-text">${Utils.escapeHTML(mod.title)}</span>
            <span class="hub-card-arrow">→</span>
          </h3>
          <p class="hub-card-desc">${Utils.escapeHTML(mod.description)}</p>
          <div class="hub-card-chips">${chipsHTML}</div>
        </div>
      `;

      if (mod.available) {
        card.addEventListener('click', () => loadModule(mod.id));
      }

      hubCards.appendChild(card);
    });
  };

  const loadModule = async (moduleId, targetRoute = null) => {
    const module = _modules.find(m => m.id === moduleId);
    if (!module || !module.available) return;

    try {
      State.set('loading', true);
      const config = await Utils.loadJSON(module.configFile);
      State.merge({
        currentModule: moduleId,
        currentModuleConfig: config,
        moduleColor: module.color
      });
      _currentModuleCode = module.code;

      // Update CSS variable
      document.documentElement.style.setProperty('--module-color', module.color);

      // Show module screen, hide hub
      Utils.$('#hub-screen').classList.remove('active');
      Utils.$('#module-screen').classList.add('active');

      // Update topbar
      Utils.$('#topbar-module-name').textContent = module.code;

      // Render side nav module switcher
      renderSideNavModules();

      // Refresh header with module progress
      Gamification.refreshHeader();

      // Navigate to target route (or module home)
      Router.navigate(targetRoute || `#/${moduleId}`);

      State.set('loading', false);
    } catch (err) {
      console.error('Failed to load module:', err);
      Utils.toast('Failed to load module', 'error');
      State.set('loading', false);
    }
  };

  const renderSideNavModules = () => {
    const container = Utils.$('#sn-modules');
    if (!container) return;

    container.innerHTML = '';
    _modules.filter(m => m.available).forEach(mod => {
      const card = document.createElement('button');
      card.className = 'sn-mod-card' + (mod.id === State.get('currentModule') ? ' active' : '');
      card.textContent = mod.code;
      card.addEventListener('click', () => {
        closeSideNav();
        loadModule(mod.id);
      });
      container.appendChild(card);
    });
  };

  const registerRoutes = () => {
    // Hub route
    Router.register('/', () => {
      Utils.$('#hub-screen').classList.add('active');
      Utils.$('#module-screen').classList.remove('active');
      State.set('currentRoute', '/');
    });

    // Module root (home)
    Router.register('/:module', (moduleId) => {
      if (State.get('currentModule') !== moduleId) {
        loadModule(moduleId);
        return;
      }
      State.set('currentRoute', `/${moduleId}`);
      Renderer.moduleHome(moduleId);
    });

    // Module sub-routes
    Router.register('/:module/:mode', (moduleId, mode) => {
      if (State.get('currentModule') !== moduleId) {
        loadModule(moduleId, `#/${moduleId}/${mode}`);
        return;
      }
      State.set('currentRoute', `/${moduleId}/${mode}`);
      handleModeRoute(moduleId, mode);
    });

    Router.register('/:module/:mode/:param', (moduleId, mode, param) => {
      if (State.get('currentModule') !== moduleId) {
        loadModule(moduleId, `#/${moduleId}/${mode}/${param}`);
        return;
      }
      State.set('currentRoute', `/${moduleId}/${mode}/${param}`);
      handleModeRoute(moduleId, mode, param);
    });
  };

  const handleModeRoute = (moduleId, mode, param) => {
    switch (mode) {
      case 'learn':
        if (param) {
          LearnEngine.start(moduleId, param);
        } else {
          Renderer.learnSelector(moduleId);
        }
        break;
      case 'quiz':
        if (param) {
          QuizEngine.startUnit(moduleId, param);
        } else {
          Renderer.quizSelector(moduleId);
        }
        break;
      case 'assessment':
        if (param) {
          AssessmentEngine.start(moduleId, param);
        } else {
          Renderer.assessmentSelector(moduleId);
        }
        break;
      case 'mixed':
        MixedEngine.start(moduleId);
        break;
      case 'practice':
        if (param) {
          PracticeEngine.start(moduleId, param);
        } else {
          PracticeEngine.showSelector(moduleId);
        }
        break;
      case 'exam':
        if (param) {
          ExamEngine.start(moduleId, param);
        } else {
          ExamEngine.showSelector(moduleId);
        }
        break;
      default:
        Renderer.moduleHome(moduleId);
    }
  };

  const showPlaceholder = (title, description) => {
    const main = Utils.$('#main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="placeholder-page">
        <div class="placeholder-icon">🚀</div>
        <div class="placeholder-title">${Utils.escapeHTML(title)}</div>
        <div class="placeholder-desc">${Utils.escapeHTML(description)}</div>
      </div>
    `;
  };

  const bindGlobalEvents = () => {
    // Back button
    const backBtn = Utils.$('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.navigate('#/');
      });
    }

    // Nav toggle
    const navToggleBtn = Utils.$('#nav-toggle-btn');
    if (navToggleBtn) {
      navToggleBtn.addEventListener('click', openSideNav);
    }

    // Nav close
    const navClose = Utils.$('#nav-close');
    if (navClose) {
      navClose.addEventListener('click', closeSideNav);
    }

    // Nav overlay
    const navOverlay = Utils.$('#nav-overlay');
    if (navOverlay) {
      navOverlay.addEventListener('click', closeSideNav);
    }

    // Side nav route buttons
    const sideNavBtns = Utils.$$('.sn-btn[data-route]');
    sideNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        const moduleId = State.get('currentModule');
        closeSideNav();
        if (route === 'home') {
          Router.navigate(`#/${moduleId}`);
        } else {
          Router.navigate(`#/${moduleId}/${route}`);
        }
      });
    });

    // Side nav reset button
    const resetBtn = Utils.$('#sn-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset progress for this module? This cannot be undone.')) {
          const moduleId = State.get('currentModule');
          Storage.resetModule(moduleId);
          Gamification.refreshHeader();
          Utils.toast('Module progress reset', 'info');
          closeSideNav();
        }
      });
    }

    // Settings button
    const settingsBtn = Utils.$('#settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', openSettings);
    }

    // Settings close
    const settingsClose = Utils.$('#settings-close');
    if (settingsClose) {
      settingsClose.addEventListener('click', closeSettings);
    }

    // Settings overlay click (close)
    const settingsOverlay = Utils.$('#settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) closeSettings();
      });
    }

    // Leaderboard button
    const lbBtn = Utils.$('#lb-btn');
    if (lbBtn) {
      lbBtn.addEventListener('click', () => Leaderboard.open());
    }

    // Leaderboard close
    const lbClose = Utils.$('#lb-close');
    if (lbClose) {
      lbClose.addEventListener('click', () => Leaderboard.close());
    }

    // Leaderboard overlay click (close)
    const lbOverlay = Utils.$('#leaderboard-overlay');
    if (lbOverlay) {
      lbOverlay.addEventListener('click', (e) => {
        if (e.target === lbOverlay) Leaderboard.close();
      });
    }

    // Settings - API Key
    const apiKeySaveBtn = Utils.$('#api-key-save');
    if (apiKeySaveBtn) {
      apiKeySaveBtn.addEventListener('click', () => {
        const input = Utils.$('#api-key-input');
        const key = (input.value || '').trim();
        if (key.startsWith('sk-ant-')) {
          Storage.setApiKey(key);
          State.set('apiKeyActive', true);
          Utils.$('#api-key-status').textContent = 'Key saved (session only)';
          Utils.$('#api-key-status').className = 'settings-status success';
        } else {
          Utils.$('#api-key-status').textContent = 'Invalid key format';
          Utils.$('#api-key-status').className = 'settings-status error';
        }
      });
    }

    const apiKeyClearBtn = Utils.$('#api-key-clear');
    if (apiKeyClearBtn) {
      apiKeyClearBtn.addEventListener('click', () => {
        Storage.clearApiKey();
        State.set('apiKeyActive', false);
        Utils.$('#api-key-input').value = '';
        Utils.$('#api-key-status').textContent = 'Key cleared';
        Utils.$('#api-key-status').className = 'settings-status success';
      });
    }

    // Settings - Display Name
    const displayNameSaveBtn = Utils.$('#display-name-save');
    if (displayNameSaveBtn) {
      displayNameSaveBtn.addEventListener('click', () => {
        const input = Utils.$('#display-name-input');
        const name = (input.value || '').trim();
        Storage.updateSettings(s => {
          s.displayName = name;
          return s;
        });
        Utils.toast('Display name saved', 'success', 2000);
      });
    }

    // Settings - Export
    const exportBtn = Utils.$('#export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studentassist-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.toast('Progress exported', 'success', 2000);
      });
    }

    // Settings - Reset All
    const resetAllBtn = Utils.$('#reset-all-btn');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        if (confirm('Reset ALL data? This cannot be undone.')) {
          Storage.resetAll();
          Utils.toast('All data reset', 'info');
          Router.navigate('#/');
          closeSettings();
        }
      });
    }

    // Load saved settings into form
    loadSettingsForm();
  };

  const loadSettingsForm = () => {
    const settings = Storage.getSettings();
    const displayNameInput = Utils.$('#display-name-input');
    if (displayNameInput && settings.displayName) {
      displayNameInput.value = settings.displayName;
    }

    const apiKey = Storage.getApiKey();
    if (apiKey) {
      State.set('apiKeyActive', true);
      Utils.$('#api-key-status').textContent = 'Key loaded from session';
      Utils.$('#api-key-status').className = 'settings-status success';
    }
  };

  const openSideNav = () => {
    const nav = Utils.$('#side-nav');
    const overlay = Utils.$('#nav-overlay');
    if (nav) nav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    State.set('navOpen', true);
  };

  const closeSideNav = () => {
    const nav = Utils.$('#side-nav');
    const overlay = Utils.$('#nav-overlay');
    if (nav) nav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    State.set('navOpen', false);
  };

  const openSettings = () => {
    const overlay = Utils.$('#settings-overlay');
    if (overlay) overlay.style.display = 'flex';
    State.set('settingsOpen', true);
  };

  const closeSettings = () => {
    const overlay = Utils.$('#settings-overlay');
    if (overlay) overlay.style.display = 'none';
    State.set('settingsOpen', false);
  };

  return {
    boot,
    loadModule,
    renderHub,
    showPlaceholder
  };
})();

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.boot);
} else {
  App.boot();
}
