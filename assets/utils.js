// utils.js · format rupiah, tanggal, tautan WhatsApp, CSV, util DOM.
(function () {
  function rp(n) {
    if (n === null || n === undefined || n === '') return '';
    return 'Rp' + Number(n).toLocaleString('id-ID');
  }
  function rpOrDash(n) { return (n === null || n === undefined) ? '–' : rp(n); }

  // Normalisasi nomor WA: 08xx -> 628xx, hanya angka.
  function normalizeWa(num) {
    if (!num) return '';
    let d = String(num).replace(/\D/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    return d;
  }
  function waLink(num, text) {
    const d = normalizeWa(num);
    if (!d) return null;
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  function fmtDate(iso, tz) {
    if (!iso) return '–';
    try {
      const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
      return d.toLocaleDateString('id-ID', { timeZone: tz || 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
  }
  function todayISO(tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Asia/Jakarta' }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function monthStartISO(tz) { return todayISO(tz).slice(0, 8) + '01'; }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // CSV aman untuk spreadsheet: bungkus kutip, gandakan kutip di dalam nilai, cegah formula injection.
  function csvCell(v) {
    let s = String(v === null || v === undefined ? '' : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function downloadCsv(filename, rows) {
    const text = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  }
  function validHttpUrl(u) {
    if (!u) return false;
    try {
      const x = new URL(u);
      return x.protocol === 'http:' || x.protocol === 'https:';
    } catch (e) { return false; }
  }
  function parseMoney(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
    return isNaN(n) ? null : n;
  }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  window.U = { rp, rpOrDash, normalizeWa, waLink, fmtDate, todayISO, monthStartISO, esc, downloadCsv, slugify, validHttpUrl, parseMoney, uid };
})();
