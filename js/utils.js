const Utils = (() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const escapeHTML = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const markdownToHTML = (text) => {
    if (!text) return '';

    const placeholders = [];
    const ph = (html) => {
      const token = `\x00PH${placeholders.length}\x00`;
      placeholders.push(html);
      return token;
    };

    // Extract fenced code blocks first (before table detection)
    let out = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      ph(`<pre class="code-block"><code class="${lang ? 'lang-' + lang : ''}">${escapeHTML(code.trim())}</code></pre>`)
    );

    // Extract markdown tables: consecutive pipe-starting lines with a separator row
    out = out.replace(/((?:(?:^|\n)\|.+)+)/g, (block) => {
      const lines = block.replace(/^\n/, '').split('\n')
        .map(l => l.trim()).filter(l => l.startsWith('|'));
      if (lines.length < 2 || !/^\|[\s\-:|]+\|/.test(lines[1])) return block;

      const cells = (line) => line.split('|').slice(1, -1).map(c => c.trim());
      const headers = cells(lines[0]);
      const dataRows = lines.slice(2).filter(l => l.startsWith('|')).map(cells);

      let tbl = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
      tbl += headers.map(h => `<th>${h}</th>`).join('');
      tbl += '</tr></thead><tbody>';
      dataRows.forEach(row => {
        tbl += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
      });
      tbl += '</tbody></table></div>';
      return ph(tbl);
    });

    // Inline markdown + paragraphs
    let html = out
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';

    // Restore placeholders — unwrap block-level ones from surrounding <p> tags
    html = html.replace(/<p>(\x00PH\d+\x00)<\/p>/g, (_, token) => token);
    html = html.replace(/\x00PH(\d+)\x00/g, (_, i) => placeholders[+i]);

    return html;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  let toastContainer = null;
  const toast = (msg, type = 'info', duration = 3000) => {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  const loadJSON = async (path) => {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`Failed to load ${path}: ${resp.statusText}`);
      return await resp.json();
    } catch (err) {
      console.error('loadJSON error:', err);
      throw err;
    }
  };

  return {
    $,
    $$,
    escapeHTML,
    markdownToHTML,
    toast,
    formatTime,
    shuffle,
    loadJSON
  };
})();
