const Leaderboard = (() => {
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyRTyMQJ-TqKM2RMAo45p-A34c24mWzroGQHpJsktsuX_JedTro2EKov1oZlafXd273Sg/exec';

  let _allData = [];
  let _filter = 'all';

  const open = async () => {
    const overlay = Utils.$('#leaderboard-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    State.set('lbOpen', true);
    await load();
  };

  const close = () => {
    const overlay = Utils.$('#leaderboard-overlay');
    if (overlay) overlay.style.display = 'none';
    State.set('lbOpen', false);
  };

  const load = async () => {
    try {
      const content = Utils.$('#lb-content');
      if (!content) return;

      content.innerHTML = '<div class="lb-loading">Loading leaderboard...</div>';

      const resp = await fetch(SHEET_URL + '?action=get');
      if (!resp.ok) throw new Error('Failed to fetch leaderboard');

      const json = await resp.json();
      _allData = json.data || [];

      render();
    } catch (err) {
      console.error('Leaderboard load error:', err);
      const content = Utils.$('#lb-content');
      if (content) {
        content.innerHTML = '<div class="empty-state"><div class="empty-state-desc">Unable to load leaderboard</div></div>';
      }
    }
  };

  const render = () => {
    const content = Utils.$('#lb-content');
    if (!content) return;

    let filtered = _allData;
    if (_filter !== 'all') {
      filtered = _allData.filter(row => row.module === _filter);
    }

    // Sort by score descending
    filtered.sort((a, b) => {
      const scoreA = parseFloat(a.score) || 0;
      const scoreB = parseFloat(b.score) || 0;
      return scoreB - scoreA;
    });

    if (filtered.length === 0) {
      content.innerHTML = '<div class="empty-state"><div class="empty-state-desc">No scores yet</div></div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    let html = '<div class="lb-table">';

    filtered.forEach((row, idx) => {
      const rank = idx + 1;
      const medal = idx < 3 ? medals[idx] : rank;
      const scorePct = Math.round((parseFloat(row.score) || 0) * 100) / 100;
      const scorePctNum = Math.round(scorePct * 100);

      html += `
        <div class="lb-row">
          <div class="lb-rank">${medal}</div>
          <div>
            <div class="lb-name">${Utils.escapeHTML(row.name || 'Anonymous')}</div>
            <div class="lb-module">${Utils.escapeHTML(row.module || '')}</div>
          </div>
          <div class="lb-score">${scorePct.toFixed(1)}%</div>
        </div>
      `;
    });

    html += '</div>';
    content.innerHTML = html;
  };

  const submitScore = async (data) => {
    // Prompt for name if not saved
    let name = Storage.getSettings().displayName;
    if (!name) {
      await promptName((n) => {
        name = n;
      });
    }

    if (!name) return; // User skipped

    try {
      const payload = {
        action: 'submit',
        name: name,
        module: data.module,
        mode: data.mode,
        score: data.pct,
        correct: data.correct,
        total: data.total,
        timeSeconds: data.time
      };

      const resp = await fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      Utils.toast('Score submitted to leaderboard!', 'success', 3000);
      await load();
    } catch (err) {
      console.error('Submit score error:', err);
      Utils.toast('Failed to submit score', 'error');
    }
  };

  const promptName = (callback) => {
    const modal = Utils.$('#name-modal');
    if (!modal) {
      callback(null);
      return;
    }

    const input = Utils.$('#name-modal-input', modal);
    const submitBtn = Utils.$('#name-modal-submit', modal);
    const skipBtn = Utils.$('#name-modal-skip', modal);

    modal.style.display = 'flex';

    const handleSubmit = () => {
      const name = (input.value || '').trim();
      if (name) {
        Storage.updateSettings(s => {
          s.displayName = name;
          return s;
        });
        modal.style.display = 'none';
        callback(name);
      }
    };

    const handleSkip = () => {
      modal.style.display = 'none';
      callback(null);
    };

    submitBtn.onclick = handleSubmit;
    skipBtn.onclick = handleSkip;
    input.onkeypress = (e) => {
      if (e.key === 'Enter') handleSubmit();
    };
  };

  const bindFilters = () => {
    const filterBtns = Utils.$$('.lb-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _filter = btn.dataset.filter || 'all';
        render();
      });
    });
  };

  return {
    open,
    close,
    load,
    render,
    submitScore,
    promptName,
    bindFilters
  };
})();
