/* ── StudentAssist Auth — Email + Password via Supabase ── */

const Auth = {
  SUPABASE_URL:  'https://nattwladufwfqdledgch.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hdHR3bGFkdWZ3ZnFkbGVkZ2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTA5NzksImV4cCI6MjA5MDgyNjk3OX0.BWPx3ZV9rO6Hq9tnwRyI1aWl2Mn5R1w1wBgmIMJOWNs',

  client:  null,
  session: null,
  profile: null,
  _booted: false,
  _passwordRecovery: false,

  // ── Bootstrap ───────────────────────────────────────────
  async init() {
    if (typeof window.supabase === 'undefined') {
      console.warn('Auth: Supabase SDK not loaded');
      return;
    }
    if (this.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      // Not yet configured — skip auth gate and boot app directly
      console.info('Auth: not configured — booting without auth');
      this._launchApp();
      return;
    }

    this.client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true }
    });

    this.client.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      if (event === 'PASSWORD_RECOVERY') {
        this._passwordRecovery = true;
        this._showStep('reset');
        this._showGate();
      } else if (event === 'SIGNED_IN' && session && this._booted) {
        if (!this._passwordRecovery) await this._onSignedIn(session);
      } else if (event === 'SIGNED_OUT') {
        this.profile = null;
        this._booted = false;
        this._passwordRecovery = false;
        this._showStep('login');
        this._showGate();
      }
    });

    await new Promise(r => setTimeout(r, 80));

    const { data: { session } } = await this.client.auth.getSession();
    this._booted = true;
    if (session && !this._passwordRecovery) {
      this.session = session;
      await this._onSignedIn(session);
    } else if (!session && !this._passwordRecovery) {
      this._showStep('login');
      this._showGate();
    }
    this._hideLoader();
  },

  // ── Session handler ─────────────────────────────────────
  async _onSignedIn(session) {
    let profile = await this._fetchProfile(session.user.id);
    if (!profile) {
      // Trigger may not have fired yet — retry once
      await new Promise(r => setTimeout(r, 1000));
      profile = await this._fetchProfile(session.user.id);
    }
    if (!profile) {
      // Create a default profile for new users
      const { data } = await this.client.from('profiles').insert({
        id: session.user.id,
        email: session.user.email,
        display_name: session.user.email.split('@')[0],
        role: 'user'
      }).select().single();
      profile = data;
    }
    this.profile = profile;
    await this._launchApp();
  },

  async _fetchProfile(userId) {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return error ? null : data;
  },

  async _launchApp() {
    this._hideLoader();
    this._hideGate();
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('hidden');
    this._updateUserUI();
    if (typeof initApp === 'function') initApp();
  },

  // ── Update all user UI surfaces ─────────────────────────
  _updateUserUI() {
    const name   = this.profile?.display_name || this.profile?.email?.split('@')[0] || 'User';
    const email  = this.profile?.email || this.session?.user?.email || '';
    const initial = (name[0] || 'U').toUpperCase();

    // Hub menu button + dropdown
    const hubAvatar  = document.getElementById('hub-user-avatar');
    const hubName    = document.getElementById('hub-user-name');
    const hubMenuBtn = document.getElementById('hub-menu-btn');
    if (hubAvatar)  hubAvatar.textContent = initial;
    if (hubName)    hubName.textContent   = name;
    if (hubMenuBtn) hubMenuBtn.classList.remove('hidden');

    // Settings panel (module screen)
    const settEmailEl = document.getElementById('settings-user-email');
    const settNameEl  = document.getElementById('settings-user-name');
    const settInitEl  = document.getElementById('settings-user-initial');
    const settNameInput = document.getElementById('display-name-input');
    if (settEmailEl)    settEmailEl.textContent   = email;
    if (settNameEl)     settNameEl.textContent    = name;
    if (settInitEl)     settInitEl.textContent    = initial;
    if (settNameInput)  settNameInput.value       = name;

    // Show sync button when signed in
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) syncBtn.classList.remove('hidden');
  },

  // ── Auth operations ─────────────────────────────────────
  async signIn(email, password) {
    const { error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async signUp(email, password) {
    const redirectTo = window.location.href.split('?')[0].split('#')[0];
    const { error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { emailRedirectTo: redirectTo }
    });
    return error ? { ok: false, error: error.message } : { ok: true, confirmEmail: true };
  },

  async signOut() {
    try {
      await this.client.auth.signOut();
    } catch {
      await this.client.auth.signOut({ scope: 'local' });
    }
    this.session = null;
    this.profile = null;
  },

  async sendPasswordReset(email) {
    const redirectTo = window.location.href.split('?')[0].split('#')[0];
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(), { redirectTo }
    );
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async updateDisplayName(name) {
    if (!this.profile) return;
    const { error } = await this.client
      .from('profiles')
      .update({ display_name: name })
      .eq('id', this.profile.id);
    if (!error) {
      this.profile.display_name = name;
      this._updateUserUI();
    }
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  // ── Helpers ─────────────────────────────────────────────
  isAdmin()  { return this.profile?.role === 'admin'; },
  isAuthed() { return !!this.session; },
  getUser()  { return this.profile; },
  getClient(){ return this.client; },

  validatePassword(password) {
    if (password.length < 8) return { score: 0, label: 'Too short', color: 'red' };
    const hasNum   = /\d/.test(password);
    const hasSym   = /[^a-zA-Z0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const score = [hasNum, hasSym, hasUpper, hasLower].filter(Boolean).length;
    if (score <= 1) return { score: 1, label: 'Weak',   color: 'red'   };
    if (score === 2) return { score: 2, label: 'Fair',   color: 'amber' };
    if (score === 3) return { score: 3, label: 'Good',   color: 'green' };
    return             { score: 4, label: 'Strong', color: 'green' };
  },

  // ── Gate UI ─────────────────────────────────────────────
  _showGate() {
    this._hideLoader();
    const gate = document.getElementById('auth-gate');
    const app  = document.getElementById('app');
    if (gate) gate.classList.remove('hidden');
    if (app)  app.classList.add('hidden');
  },
  _hideGate() {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.add('hidden');
  },
  _hideLoader() {
    const el = document.getElementById('app-loader');
    if (el) el.classList.add('hidden');
  },
  _showStep(step) {
    ['login', 'register', 'reset'].forEach(s => {
      const el = document.getElementById(`auth-step-${s}`);
      if (el) el.classList.toggle('hidden', s !== step);
    });
    const tabs = document.getElementById('auth-tabs');
    if (tabs) tabs.classList.toggle('hidden', step === 'reset');
  }
};

// ── Gate event wiring ──────────────────────────────────────
function initAuthGate() {
  // Tab switching
  document.getElementById('gate-tab-login')?.addEventListener('click', () => {
    document.getElementById('gate-tab-login').classList.add('active');
    document.getElementById('gate-tab-register').classList.remove('active');
    Auth._showStep('login');
  });
  document.getElementById('gate-tab-register')?.addEventListener('click', () => {
    document.getElementById('gate-tab-register').classList.add('active');
    document.getElementById('gate-tab-login').classList.remove('active');
    Auth._showStep('register');
  });

  // Sign In
  const signInBtn = document.getElementById('auth-signin-btn');
  if (signInBtn) {
    const doSignIn = async () => {
      const email    = document.getElementById('auth-login-email').value.trim();
      const password = document.getElementById('auth-login-password').value;
      if (!email || !email.includes('@')) { Utils.toast('Enter a valid email', 'error'); return; }
      if (!password) { Utils.toast('Enter your password', 'error'); return; }
      signInBtn.disabled = true;
      signInBtn.textContent = 'Signing in…';
      const res = await Auth.signIn(email, password);
      signInBtn.disabled = false;
      signInBtn.textContent = 'Sign In';
      if (!res.ok) Utils.toast(res.error || 'Sign in failed', 'error');
    };
    signInBtn.addEventListener('click', doSignIn);
    document.getElementById('auth-login-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSignIn();
    });
  }

  // Sign Up
  const signUpBtn = document.getElementById('auth-signup-btn');
  const pwInput   = document.getElementById('auth-register-password');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      const bar   = document.getElementById('auth-pw-bar');
      const label = document.getElementById('auth-pw-label');
      const wrap  = document.getElementById('auth-pw-strength');
      if (!val) { wrap?.classList.add('hidden'); return; }
      wrap?.classList.remove('hidden');
      const r = Auth.validatePassword(val);
      if (bar)   { bar.style.width = `${r.score * 25}%`; bar.className = `pw-bar pw-bar-${r.color}`; }
      if (label) { label.textContent = r.label; label.className = `pw-label pw-label-${r.color}`; }
    });
  }
  if (signUpBtn) {
    signUpBtn.addEventListener('click', async () => {
      const email    = document.getElementById('auth-register-email').value.trim();
      const password = document.getElementById('auth-register-password').value;
      if (!email || !email.includes('@')) { Utils.toast('Enter a valid email', 'error'); return; }
      const strength = Auth.validatePassword(password);
      if (strength.score < 2) { Utils.toast('Password too weak — use 8+ chars with numbers and symbols', 'error'); return; }
      signUpBtn.disabled = true;
      signUpBtn.textContent = 'Creating account…';
      const res = await Auth.signUp(email, password);
      signUpBtn.disabled = false;
      signUpBtn.textContent = 'Create Account';
      if (!res.ok) {
        Utils.toast(res.error || 'Sign up failed', 'error');
      } else {
        document.getElementById('auth-register-email').value    = '';
        document.getElementById('auth-register-password').value = '';
        document.getElementById('auth-pw-strength')?.classList.add('hidden');
        Utils.toast('Account created! Check your email to confirm, then sign in.', 'success');
        document.getElementById('gate-tab-login')?.click();
      }
    });
  }

  // Forgot password
  document.getElementById('auth-forgot-link')?.addEventListener('click', async e => {
    e.preventDefault();
    const email = document.getElementById('auth-login-email').value.trim();
    if (!email || !email.includes('@')) { Utils.toast('Enter your email above first', 'error'); return; }
    const res = await Auth.sendPasswordReset(email);
    Utils.toast(res.ok ? 'Password reset email sent — check your inbox' : (res.error || 'Failed'), res.ok ? 'success' : 'error');
  });

  // New password (after reset link)
  const newPwInput = document.getElementById('auth-newpw-input');
  if (newPwInput) {
    newPwInput.addEventListener('input', () => {
      const val   = newPwInput.value;
      const bar   = document.getElementById('auth-newpw-bar');
      const label = document.getElementById('auth-newpw-label');
      const wrap  = document.getElementById('auth-newpw-strength');
      if (!val) { wrap?.classList.add('hidden'); return; }
      wrap?.classList.remove('hidden');
      const r = Auth.validatePassword(val);
      if (bar)   { bar.style.width = `${r.score * 25}%`; bar.className = `pw-bar pw-bar-${r.color}`; }
      if (label) { label.textContent = r.label; label.className = `pw-label pw-label-${r.color}`; }
    });
  }
  document.getElementById('auth-newpw-btn')?.addEventListener('click', async () => {
    const pw = document.getElementById('auth-newpw-input').value;
    if (Auth.validatePassword(pw).score < 2) { Utils.toast('Password too weak', 'error'); return; }
    const btn = document.getElementById('auth-newpw-btn');
    btn.disabled = true; btn.textContent = 'Updating…';
    Auth._passwordRecovery = false;
    const { error } = await Auth.client.auth.updateUser({ password: pw });
    btn.disabled = false; btn.textContent = 'Update Password';
    if (error) { Auth._passwordRecovery = true; Utils.toast(error.message, 'error'); }
    else Utils.toast('Password updated! Signing you in…', 'success');
  });
  document.getElementById('auth-reset-back-btn')?.addEventListener('click', () => {
    Auth._passwordRecovery = false;
    Auth._showStep('login');
  });

  // Sign out from settings
  document.getElementById('auth-signout-btn')?.addEventListener('click', () => Auth.signOut());
  // Sign out from hub chip
  document.getElementById('hub-signout-btn')?.addEventListener('click', () => Auth.signOut());
}
