// db.js: lapisan data Supabase (REST + Auth + Storage) tanpa dependensi CDN.
(function () {
  const CFG = window.FNATIX_CONFIG;
  const BASE = CFG.SUPABASE_URL;
  const ANON = CFG.SUPABASE_ANON_KEY;
  const SESSION_KEY = 'fnatix-studio-session';

  function getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.expires_at && Date.now() / 1000 > s.expires_at - 60) return refreshSession(s);
      return Promise.resolve(s);
    } catch (e) { return Promise.resolve(null); }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }
  async function refreshSession(s) {
    if (!s || !s.refresh_token) { setSession(null); return null; }
    try {
      const r = await fetch(BASE + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      if (!r.ok) { setSession(null); return null; }
      const d = await r.json();
      const ns = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at, user: d.user };
      setSession(ns);
      return ns;
    } catch (e) { return s; }
  }

  async function signIn(email, password) {
    const r = await fetch(BASE + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error_description || d.msg || 'Login gagal.');
    const s = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at, user: d.user };
    setSession(s);
    return s;
  }
  async function signOut() {
    const s = await getSession();
    if (s) {
      try {
        await fetch(BASE + '/auth/v1/logout', {
          method: 'POST',
          headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + s.access_token }
        });
      } catch (e) { /* abaikan */ }
    }
    setSession(null);
  }

  async function headers(extra) {
    const s = await getSession();
    const h = { 'apikey': ANON, 'Content-Type': 'application/json' };
    if (s && s.access_token) h['Authorization'] = 'Bearer ' + s.access_token;
    return Object.assign(h, extra || {});
  }

  // query: string PostgREST, contoh "select=*&status=eq.published&order=sort_order.asc"
  async function select(table, query) {
    const r = await fetch(BASE + '/rest/v1/' + table + '?' + (query || 'select=*'), { headers: await headers() });
    if (!r.ok) throw new Error(await errText(r));
    return r.json();
  }
  async function insert(table, row) {
    const r = await fetch(BASE + '/rest/v1/' + table, {
      method: 'POST',
      headers: await headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(row)
    });
    if (!r.ok) throw new Error(await errText(r));
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  }
  async function update(table, id, patch) {
    const r = await fetch(BASE + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: await headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(patch)
    });
    if (!r.ok) throw new Error(await errText(r));
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  }
  async function remove(table, id) {
    const r = await fetch(BASE + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: await headers()
    });
    if (!r.ok) throw new Error(await errText(r));
    return true;
  }
  async function errText(r) {
    try { const d = await r.json(); return d.message || d.hint || ('HTTP ' + r.status); }
    catch (e) { return 'HTTP ' + r.status; }
  }

  // Storage
  async function upload(bucket, path, file) {
    const s = await getSession();
    const r = await fetch(BASE + '/storage/v1/object/' + bucket + '/' + path, {
      method: 'POST',
      headers: {
        'apikey': ANON,
        'Authorization': 'Bearer ' + (s ? s.access_token : ANON),
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: file
    });
    if (!r.ok) throw new Error(await errText(r));
    return path;
  }
  function publicUrl(bucket, path) {
    return BASE + '/storage/v1/object/public/' + bucket + '/' + path;
  }
  async function signedUrl(bucket, path, expiresIn) {
    const s = await getSession();
    const r = await fetch(BASE + '/storage/v1/object/sign/' + bucket + '/' + path, {
      method: 'POST',
      headers: {
        'apikey': ANON,
        'Authorization': 'Bearer ' + (s ? s.access_token : ANON),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: expiresIn || 3600 })
    });
    if (!r.ok) throw new Error(await errText(r));
    const d = await r.json();
    return BASE + '/storage/v1' + d.signedURL;
  }

  window.DB = { getSession, signIn, signOut, select, insert, update, remove, upload, publicUrl, signedUrl };
})();
