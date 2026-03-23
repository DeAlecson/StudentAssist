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
    const content = Utils.$('#lb-content');
    if (!content) return;

    content.innerHTML = '<div class="lb-loading">Loading leaderboard...</div>';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(SHEET_URL + '?action=get', { signal: controller.signal });
      clearTimeout(timer);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      _allData = json.data || [];

      render();
    } catch (err) {
      console.error('Leaderboard load error:', err);
      const msg = err.name === 'AbortError' ? 'Request timed out' : 'Unable to load leaderboard';
      content.innerHTML = `<div class="empty-state"><div class="empty-state-desc">${msg}</div></div>`;
    }
  };

  const render = () => {
    const content = Utils.$('#lb-content');
    if (!content) return;

    let filtered = _allData;
    if (_filter !== 'all') {
      filtered = _allData.filter(row => (row.Module || row.module || '') === _filter);
    }

    // Sort by score descending (Score % is stored as decimal: 0.55 = 55%)
    filtered.sort((a, b) => {
      const scoreA = parseFloat(a['Score %'] ?? a.score) || 0;
      const scoreB = parseFloat(b['Score %'] ?? b.score) || 0;
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
      const name    = row.Name   || row.name   || 'Anonymous';
      const module  = row.Module || row.module || '';
      const mode    = row.Mode   || row.mode   || '';
      // API stores score as decimal (0.55 = 55%) — multiply by 100
      const rawScore  = parseFloat(row['Score %'] ?? row.score) || 0;
      const scorePct  = rawScore <= 1 ? rawScore * 100 : rawScore;
      const correct   = row.Correct || row.correct || '';
      const total     = row.Total   || row.total   || '';
      const time      = row.Time    || row.time    || '';

      html += `
        <div class="lb-row">
          <div class="lb-rank">${medal}</div>
          <div class="lb-info">
            <div class="lb-name">${Utils.escapeHTML(name)}</div>
            <div class="lb-module">${Utils.escapeHTML(module)}${mode ? ' · ' + Utils.escapeHTML(mode) : ''}</div>
          </div>
          <div class="lb-score-col">
            <div class="lb-score">${scorePct.toFixed(1)}%</div>
            ${correct && total ? `<div class="lb-detail">${correct}/${total}${time ? ' · ' + Utils.escapeHTML(time) : ''}</div>` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    content.innerHTML = html;
  };

  const promptName = () => {
    return new Promise((resolve) => {
      const modal = Utils.$('#name-modal');
      if (!modal) { resolve(null); return; }

      const input = Utils.$('#name-modal-input', modal);
      const submitBtn = Utils.$('#name-modal-submit', modal);
      const skipBtn = Utils.$('#name-modal-skip', modal);

      if (input) input.value = '';
      modal.style.display = 'flex';
      if (input) input.focus();

      const handleSubmit = () => {
        const name = (input.value || '').trim();
        if (name) {
          Storage.updateSettings(s => { s.displayName = name; return s; });
          modal.style.display = 'none';
          resolve(name);
        }
      };

      const handleSkip = () => {
        modal.style.display = 'none';
        resolve(null);
      };

      submitBtn.onclick = handleSubmit;
      skipBtn.onclick = handleSkip;
      if (input) input.onkeypress = (e) => { if (e.key === 'Enter') handleSubmit(); };
    });
  };

  const submitScore = async (data) => {
    let name = Storage.getSettings().displayName;
    if (!name) {
      name = await promptName();
    }
    if (!name) return;

    try {
      const payload = {
        action: 'submit',
        name,
        module: data.module,
        mode: data.mode,
        score: data.pct,
        correct: data.correct,
        total: data.total,
        time: data.time
      };

      await fetch(SHEET_URL, {
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
