// admin.js · dashboard admin FNATIX ID (bagian 1: shell, dashboard, pesanan).
(function () {
  const { esc, rp, rpOrDash, waLink, fmtDate, todayISO, monthStartISO, slugify, validHttpUrl, parseMoney, downloadCsv, uid } = window.U;
  const ORDER_STATUSES = ['Antrean', 'Dikerjakan', 'Menunggu Respons', 'Revisi', 'Selesai', 'Dibatalkan'];
  const ACTIVE_STATUSES = ['Antrean', 'Dikerjakan', 'Menunggu Respons', 'Revisi'];

  let S = null; // state admin

  function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3400);
  }

  function dialog(title, bodyHtml, wide) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="dialog' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="dialog-head"><h3 style="margin:0">' + esc(title) + '</h3>' +
      '<button type="button" class="btn ghost small x" data-close>Tutup</button></div>' + bodyHtml + '</div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov || (e.target.hasAttribute && e.target.hasAttribute('data-close'))) close(); });
    return { el: ov, close };
  }

  function confirmDialog(text) {
    return new Promise(function (resolve) {
      const d = dialog('Konfirmasi', '<p>' + esc(text) + '</p><div class="btn-row">' +
        '<button class="btn danger" id="cf-yes">Ya, lanjutkan</button>' +
        '<button class="btn ghost" data-close>Batal</button></div>');
      d.el.querySelector('#cf-yes').addEventListener('click', function () { d.close(); resolve(true); });
      d.el.addEventListener('click', function (e) { if (e.target === d.el) resolve(false); });
      const x = d.el.querySelector('[data-close]');
      if (x) x.addEventListener('click', function () { resolve(false); });
    });
  }

  function field(label, inner, hint) {
    return '<div class="field"><label>' + esc(label) + '</label>' + inner + (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + '</div>';
  }
  function input(name, val, attrs) {
    return '<input name="' + name + '" value="' + esc(val === null || val === undefined ? '' : val) + '" ' + (attrs || '') + '>';
  }
  function textarea(name, val, attrs) {
    return '<textarea name="' + name + '" ' + (attrs || '') + '>' + esc(val || '') + '</textarea>';
  }
  function selectHtml(name, options, val) {
    return '<select name="' + name + '">' + options.map(function (o) {
      const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('') + '</select>';
  }
  function formData(form) {
    const o = {};
    new FormData(form).forEach(function (v, k) { o[k] = v; });
    return o;
  }
  async function handle(form, fn) {
    const btn = form.querySelector('[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan…'; }
    try { await fn(formData(form)); return true; }
    catch (e) { toast(e.message || 'Gagal menyimpan.', true); if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; } return false; }
  }

  // ---------- perhitungan pembayaran ----------
  function paymentsOf(orderId) { return S.payments.filter(p => p.order_id === orderId); }
  function refundsOfPayment(pid) { return S.refunds.filter(r => r.payment_id === pid); }
  function orderPaidNet(orderId) {
    return paymentsOf(orderId).reduce(function (sum, p) {
      const ref = refundsOfPayment(p.id).reduce((a, r) => a + Number(r.amount), 0);
      return sum + Number(p.amount) - ref;
    }, 0);
  }
  function orderPaidGross(orderId) {
    return paymentsOf(orderId).reduce((a, p) => a + Number(p.amount), 0);
  }
  function orderTotal(o) { return Number(o.total_price || 0) - Number(o.discount || 0); }
  function orderPayStatus(o) {
    const paid = orderPaidNet(o.id);
    const total = orderTotal(o);
    if (paid <= 0) return 'Belum Bayar';
    if (paid < total) return 'DP';
    return 'Lunas';
  }
  function salePaidNet(saleId) {
    return S.payments.filter(p => p.digital_sale_id === saleId).reduce(function (sum, p) {
      const ref = refundsOfPayment(p.id).reduce((a, r) => a + Number(r.amount), 0);
      return sum + Number(p.amount) - ref;
    }, 0);
  }
  function saleTotal(s) { return Number(s.price_snapshot || 0) * Number(s.qty || 1) - Number(s.discount || 0); }
  function salePayStatus(s) {
    const paid = salePaidNet(s.id);
    if (paid <= 0) return 'Belum Bayar';
    if (paid < saleTotal(s)) return 'Sebagian';
    return 'Lunas';
  }

  async function loadAll() {
    const q = 'select=*&order=created_at.desc';
    const [settings, categories, services, portfolio, products, testimonials, orders, revisions, sales, payments, refunds, expenses] =
      await Promise.all([
        DB.select('studio_settings', 'select=*&id=eq.1'),
        DB.select('studio_categories', 'select=*&order=sort_order.asc'),
        DB.select('studio_services', 'select=*&order=sort_order.asc'),
        DB.select('studio_portfolio_items', 'select=*&order=sort_order.asc'),
        DB.select('studio_products', 'select=*&order=sort_order.asc'),
        DB.select('studio_testimonials', 'select=*&order=sort_order.asc'),
        DB.select('studio_orders', q),
        DB.select('studio_order_revisions', 'select=*&order=rev_date.asc'),
        DB.select('studio_digital_sales', q),
        DB.select('studio_payments', 'select=*&order=pay_date.asc'),
        DB.select('studio_refunds', 'select=*&order=refund_date.asc'),
        DB.select('studio_expenses', 'select=*&order=expense_date.desc')
      ]);
    S = {
      settings: settings[0] || {},
      categories, services, portfolio, products, testimonials,
      orders, revisions, sales, payments, refunds, expenses
    };
    return S;
  }

  function shell(active, title, bodyHtml) {
    const nav = [
      ['/admin', 'Dashboard'], ['/admin/pesanan', 'Pesanan'], ['/admin/portofolio', 'Portofolio'],
      ['/admin/layanan', 'Layanan'], ['/admin/produk', 'Produk'], ['/admin/penjualan', 'Penjualan Digital'],
      ['/admin/keuangan', 'Keuangan'], ['/admin/testimoni', 'Testimoni'], ['/admin/pengaturan', 'Pengaturan']
    ];
    return '<div class="admin-shell"><aside class="admin-side">' +
      '<a class="brand" href="/admin">' + esc(S.settings.brand_name || 'FNATIX ID') + '</a>' +
      nav.map(n => '<a href="' + n[0] + '" class="' + (active === n[0] ? 'active' : '') + '">' + n[1] + '</a>').join('') +
      '<a href="/" >Lihat Situs Publik</a>' +
      '<a href="#" id="nav-logout">Keluar</a>' +
      '</aside><main class="admin-main"><div class="admin-top"><h1>' + esc(title) + '</h1><span class="spacer"></span>' +
      '<span class="muted small">' + esc(S.profile ? S.profile.name || S.profile.user_id : '') + '</span></div>' +
      bodyHtml + '</main></div>';
  }
  function mountShell(root) {
    const lo = root.querySelector('#nav-logout');
    if (lo) lo.addEventListener('click', async function (e) {
      e.preventDefault();
      await DB.signOut();
      location.href = (window.FNATIX_BASE || '') + '/admin/login';
    });
  }

  // ---------- Login ----------
  function loginPage() {
    return '<main><section class="block"><div class="wrap" style="max-width:440px">' +
      '<h1>Login Admin</h1><p class="muted">Area khusus pemilik FNATIX ID.</p>' +
      '<form id="login-form" method="post"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username"></div>' +
      '<div class="field"><label>Kata Sandi</label><input name="password" type="password" required autocomplete="current-password"></div>' +
      '<button class="btn" type="submit" style="width:100%">Masuk</button>' +
      '<p class="err" id="login-err" style="color:var(--bad);margin-top:10px"></p></form>' +
      '<p class="small muted" style="margin-top:14px"><a href="/">Kembali ke beranda</a></p>' +
      '</div></section></main>';
  }
  function mountLogin(root) {
    const form = root.querySelector('#login-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const d = formData(form);
      const err = root.querySelector('#login-err');
      err.textContent = '';
      try {
        await DB.signIn(d.email.trim(), d.password);
        location.href = (window.FNATIX_BASE || '') + '/admin';
      } catch (ex) { err.textContent = 'Login gagal: ' + (ex.message || 'periksa email dan kata sandi.'); }
    });
  }

  // ---------- Dashboard ----------
  function dashboardPage() {
    const tz = S.settings.timezone || 'Asia/Jakarta';
    const today = todayISO(tz);
    const mStart = monthStartISO(tz);
    const active = S.orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const dueToday = S.orders.filter(o => o.deadline === today && ACTIVE_STATUSES.includes(o.status));
    const overdue = S.orders.filter(o => o.deadline && o.deadline < today && ACTIVE_STATUSES.includes(o.status));
    const inRevision = S.orders.filter(o => o.status === 'Revisi');
    let piutang = 0;
    S.orders.forEach(o => {
      if (o.status !== 'Dibatalkan') {
        const sisa = orderTotal(o) - orderPaidNet(o.id);
        if (sisa > 0) piutang += sisa;
      }
    });
    S.sales.forEach(s => {
      const sisa = saleTotal(s) - salePaidNet(s.id);
      if (sisa > 0) piutang += sisa;
    });
    const incomeMonth = S.payments.filter(p => p.pay_date >= mStart).reduce((a, p) => a + Number(p.amount), 0)
      - S.refunds.filter(r => r.refund_date >= mStart).reduce((a, r) => a + Number(r.amount), 0);
    const expenseMonth = S.expenses.filter(e => e.expense_date >= mStart).reduce((a, e) => a + Number(e.amount), 0);
    const upcoming = active.slice().sort(function (a, b) {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline < b.deadline ? -1 : 1;
    }).slice(0, 8);
    const stat = (v, k) => '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
    let h = '<div class="stat-grid">' +
      stat(active.length, 'Pesanan aktif') +
      stat(dueToday.length + overdue.length, 'Deadline hari ini / terlewat') +
      stat(inRevision.length, 'Sedang revisi') +
      stat(rp(piutang), 'Piutang (sisa tagihan)') +
      stat(rp(incomeMonth), 'Uang masuk bulan ini') +
      stat(rp(expenseMonth), 'Pengeluaran bulan ini') +
      '</div>';
    h += '<div class="admin-top"><h2 style="margin:0">Pekerjaan Terdekat</h2><span class="spacer"></span>' +
      '<a class="btn" href="/admin/pesanan?baru=1">Tambah Pesanan</a></div>';
    if (!upcoming.length) h += '<div class="empty">Tidak ada pesanan aktif. Klik Tambah Pesanan setelah menerima order via chat.</div>';
    else {
      h += '<div class="table-wrap"><table><thead><tr><th>Kode</th><th>Pelanggan</th><th>Status</th><th>Deadline</th><th class="num">Sisa</th></tr></thead><tbody>' +
        upcoming.map(function (o) {
          const sisa = orderTotal(o) - orderPaidNet(o.id);
          const dl = o.deadline ? (o.deadline < today ? '<span class="chip bad">Terlewat ' + fmtDate(o.deadline, tz) + '</span>' : fmtDate(o.deadline, tz)) : '–';
          return '<tr><td><a href="/admin/pesanan/' + o.id + '">' + esc(o.code || '') + '</a></td><td>' + esc(o.customer_name) + '</td>' +
            '<td><span class="chip">' + esc(o.status) + '</span></td><td>' + dl + '</td><td class="num">' + (sisa > 0 ? rp(sisa) : '–') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return { html: shell('/admin', 'Dashboard', h), mount: mountShell };
  }

  // ---------- Pesanan: daftar + papan ----------
  function payChip(o) {
    const st = orderPayStatus(o);
    const cls = st === 'Lunas' ? 'ok' : (st === 'DP' ? 'warn' : 'bad');
    return '<span class="chip ' + cls + '">' + st + '</span>';
  }
  function ordersPage(query) {
    const tz = S.settings.timezone || 'Asia/Jakarta';
    const fStatus = query.get('status') || '';
    const fPay = query.get('bayar') || '';
    const fSvc = query.get('layanan') || '';
    const fDue = query.get('deadline') || '';
    const q = (query.get('q') || '').toLowerCase();
    const view = query.get('tampilan') || 'daftar';
    let items = S.orders.slice();
    if (fStatus) items = items.filter(o => o.status === fStatus);
    if (fPay) items = items.filter(o => orderPayStatus(o) === fPay);
    if (fSvc) items = items.filter(o => o.service_id === fSvc);
    if (fDue === 'hari-ini') items = items.filter(o => o.deadline === todayISO(tz));
    if (fDue === 'terlewat') items = items.filter(o => o.deadline && o.deadline < todayISO(tz) && ACTIVE_STATUSES.includes(o.status));
    if (q) items = items.filter(o => (o.customer_name || '').toLowerCase().includes(q) || (o.code || '').toLowerCase().includes(q));
    items.sort(function (a, b) {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline < b.deadline ? -1 : 1;
    });

    let h = '<form method="get" action="/admin/pesanan" class="form-grid two get-filter" style="margin-bottom:14px">' +
      field('Cari nama / kode', '<input name="q" value="' + esc(query.get('q') || '') + '" placeholder="cth: FX-2026 atau nama pelanggan">') +
      field('Status', selectHtml('status', [''].concat(ORDER_STATUSES).map(s => [s, s || 'Semua status']), fStatus)) +
      field('Pembayaran', selectHtml('bayar', [['', 'Semua'], ['Belum Bayar', 'Belum Bayar'], ['DP', 'DP'], ['Lunas', 'Lunas']], fPay)) +
      field('Layanan', selectHtml('layanan', [['', 'Semua layanan']].concat(S.services.map(s => [s.id, s.name])), fSvc)) +
      field('Deadline', selectHtml('deadline', [['', 'Semua'], ['hari-ini', 'Hari ini'], ['terlewat', 'Terlewat']], fDue)) +
      field('Tampilan', selectHtml('tampilan', [['daftar', 'Daftar'], ['papan', 'Papan kerja']], view)) +
      '<div class="field"><label>&nbsp;</label><button class="btn secondary" type="submit">Terapkan Filter</button></div></form>' +
      '<div class="admin-top"><span class="muted">' + items.length + ' pesanan</span><span class="spacer"></span>' +
      '<button class="btn" id="btn-order-new">Tambah Pesanan</button> ' +
      '<button class="btn ghost" id="btn-order-csv">Ekspor CSV</button></div>';

    if (view === 'papan') {
      h += '<div class="board">' + ORDER_STATUSES.map(function (st) {
        const col = items.filter(o => o.status === st);
        return '<div class="board-col"><h3>' + st + ' (' + col.length + ')</h3>' +
          col.map(function (o) {
            return '<div class="board-card"><a href="/admin/pesanan/' + o.id + '">' + esc(o.code || '') + ' · ' + esc(o.customer_name) + '</a>' +
              '<div class="small muted">' + (o.deadline ? 'Deadline ' + fmtDate(o.deadline, tz) : 'Tanpa deadline') + ' · ' + orderPayStatus(o) + '</div>' +
              '<select data-status-for="' + o.id + '" aria-label="Ubah status ' + esc(o.code || '') + '">' +
              ORDER_STATUSES.map(s2 => '<option value="' + s2 + '"' + (s2 === o.status ? ' selected' : '') + '>' + s2 + '</option>').join('') + '</select></div>';
          }).join('') + '</div>';
      }).join('') + '</div>';
    } else if (!items.length) {
      h += '<div class="empty">Tidak ada pesanan yang cocok dengan filter.</div>';
    } else {
      h += '<div class="table-wrap"><table><thead><tr><th>Kode</th><th>Pelanggan</th><th>Layanan</th><th>Status</th><th>Bayar</th><th>Deadline</th><th class="num">Total</th><th class="num">Sisa</th></tr></thead><tbody>' +
        items.map(function (o) {
          const svc = S.services.find(s => s.id === o.service_id);
          const sisa = orderTotal(o) - orderPaidNet(o.id);
          return '<tr><td><a href="/admin/pesanan/' + o.id + '">' + esc(o.code || '') + '</a></td>' +
            '<td>' + esc(o.customer_name) + '</td><td>' + esc(svc ? svc.name : (o.service_name_snapshot || '–')) + '</td>' +
            '<td><span class="chip">' + esc(o.status) + '</span></td><td>' + payChip(o) + '</td>' +
            '<td>' + (o.deadline ? fmtDate(o.deadline, tz) : '–') + '</td>' +
            '<td class="num">' + rp(orderTotal(o)) + '</td><td class="num">' + (sisa > 0 ? rp(sisa) : '–') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return {
      html: shell('/admin/pesanan', 'Pesanan Jasa Edit', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#btn-order-new').addEventListener('click', function () { orderFormDialog(null); });
        if (query.get('baru') === '1') orderFormDialog(null);
        root.querySelector('#btn-order-csv').addEventListener('click', function () {
          const rows = [['Kode', 'Pelanggan', 'WhatsApp', 'Sumber', 'Layanan', 'Status', 'Status Bayar', 'Tanggal Masuk', 'Deadline', 'Total', 'Diskon', 'Terbayar', 'Sisa']];
          S.orders.forEach(function (o) {
            const svc = S.services.find(s => s.id === o.service_id);
            rows.push([o.code || '', o.customer_name, o.customer_wa || '', o.source, svc ? svc.name : (o.service_name_snapshot || ''), o.status, orderPayStatus(o), o.received_at || '', o.deadline || '', orderTotal(o), Number(o.discount || 0), orderPaidNet(o.id), orderTotal(o) - orderPaidNet(o.id)]);
          });
          downloadCsv('pesanan-fnatix.csv', rows);
        });
        root.querySelectorAll('[data-status-for]').forEach(function (sel) {
          sel.addEventListener('change', async function () {
            try {
              await DB.update('studio_orders', sel.getAttribute('data-status-for'), { status: sel.value, updated_at: new Date().toISOString() });
              toast('Status diperbarui.');
              await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (e) { toast(e.message, true); }
          });
        });
      }
    };
  }

  function orderFormDialog(existing) {
    const o = existing || {};
    const d = dialog(existing ? 'Edit Pesanan' : 'Tambah Pesanan',
      '<form id="order-form"><div class="form-grid two">' +
      field('Nama pelanggan *', input('customer_name', o.customer_name, 'required')) +
      field('Nomor WhatsApp', input('customer_wa', o.customer_wa, 'placeholder="08xx"')) +
      field('Sumber order', selectHtml('source', ['WhatsApp', 'Instagram', 'Lainnya'], o.source || 'WhatsApp')) +
      field('Layanan', selectHtml('service_id', [['', 'Pilih layanan atau isi manual']].concat(S.services.map(s => [s.id, s.name])), o.service_id || '')) +
      field('Nama layanan (manual, bila tidak memilih)', input('service_name_snapshot', o.service_name_snapshot)) +
      field('Tanggal masuk', input('received_at', o.received_at || todayISO(S.settings.timezone), 'type="date"')) +
      field('Deadline', input('deadline', o.deadline || '', 'type="date"')) +
      field('Prioritas', selectHtml('priority', ['Rendah', 'Normal', 'Tinggi'], o.priority || 'Normal')) +
      field('Status', selectHtml('status', ORDER_STATUSES, o.status || 'Antrean')) +
      field('Total harga (Rp)', input('total_price', o.total_price !== undefined ? o.total_price : '', 'type="number" min="0" step="1"')) +
      field('Diskon nominal (Rp)', input('discount', o.discount || 0, 'type="number" min="0" step="1"')) +
      field('Batas revisi', input('revision_limit', o.revision_limit || 0, 'type="number" min="0" step="1"')) +
      '</div>' +
      field('Ringkasan kebutuhan', textarea('needs_summary', o.needs_summary)) +
      field('Instruksi terperinci', textarea('instructions', o.instructions)) +
      field('Catatan internal (privat)', textarea('internal_notes', o.internal_notes)) +
      '<button class="btn" type="submit">Simpan</button></form>', true);
    const form = d.el.querySelector('#order-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const ok = await handle(form, async function (data) {
        const row = {
          customer_name: data.customer_name.trim(),
          customer_wa: data.customer_wa || '',
          source: data.source,
          service_id: data.service_id || null,
          service_name_snapshot: data.service_name_snapshot || '',
          received_at: data.received_at || todayISO(S.settings.timezone),
          deadline: data.deadline || null,
          priority: data.priority,
          status: data.status,
          total_price: parseMoney(data.total_price) || 0,
          discount: parseMoney(data.discount) || 0,
          revision_limit: parseInt(data.revision_limit || '0', 10) || 0,
          needs_summary: data.needs_summary || '',
          instructions: data.instructions || '',
          internal_notes: data.internal_notes || '',
          updated_at: new Date().toISOString()
        };
        if (existing) await DB.update('studio_orders', existing.id, row);
        else await DB.insert('studio_orders', row);
        toast('Pesanan tersimpan.');
        d.close();
        await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
      });
      return ok;
    });
  }

  // ---------- Detail pesanan ----------
  function orderDetailPage(id) {
    const o = S.orders.find(x => x.id === id);
    if (!o) return null;
    const tz = S.settings.timezone || 'Asia/Jakarta';
    const svc = S.services.find(s => s.id === o.service_id);
    const revs = S.revisions.filter(r => r.order_id === o.id);
    const pays = paymentsOf(o.id);
    const total = orderTotal(o);
    const paidNet = orderPaidNet(o.id);
    const sisa = total - paidNet;
    const atts = Array.isArray(o.attachments) ? o.attachments : [];
    const wa = waLink(o.customer_wa, 'Halo ' + o.customer_name + ', terkait pesanan ' + (o.code || '') + ' di FNATIX ID.');
    let h = '<p><a href="/admin/pesanan">&larr; Semua pesanan</a></p>' +
      '<div class="stat-grid" style="grid-template-columns:repeat(2,1fr)">' +
      '<div class="stat"><div class="v">' + rp(total) + '</div><div class="k">Nilai pesanan (setelah diskon)</div></div>' +
      '<div class="stat"><div class="v">' + rp(paidNet) + '</div><div class="k">Uang diterima (bersih refund)</div></div>' +
      '<div class="stat"><div class="v">' + (sisa > 0 ? rp(sisa) : rp(0)) + '</div><div class="k">Sisa tagihan · status ' + orderPayStatus(o) + '</div></div>' +
      '<div class="stat"><div class="v">' + revs.length + ' / ' + (o.revision_limit || 0) + '</div><div class="k">Revisi terpakai / batas</div></div></div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card-body">' +
      '<p style="margin:0"><b>' + esc(o.customer_name) + '</b> · ' + esc(o.source) + ' · Layanan: ' + esc(svc ? svc.name : (o.service_name_snapshot || '–')) + '</p>' +
      '<p class="muted" style="margin:0">Masuk ' + fmtDate(o.received_at, tz) + ' · Deadline ' + (o.deadline ? fmtDate(o.deadline, tz) : '–') + ' · Prioritas ' + esc(o.priority) + ' · Status <b>' + esc(o.status) + '</b></p>' +
      (o.needs_summary ? '<p style="margin:0"><b>Kebutuhan:</b> ' + esc(o.needs_summary) + '</p>' : '') +
      (o.instructions ? '<p style="margin:0;white-space:pre-line"><b>Instruksi:</b> ' + esc(o.instructions) + '</p>' : '') +
      (o.internal_notes ? '<p style="margin:0;white-space:pre-line"><b>Catatan internal:</b> ' + esc(o.internal_notes) + '</p>' : '') +
      (o.delivered_at ? '<p class="muted" style="margin:0">Hasil tercatat terkirim: ' + fmtDate(o.delivered_at, tz) + '</p>' : '') +
      '<div class="btn-row">' +
      (wa ? '<a class="btn small" href="' + wa + '" target="_blank" rel="noopener noreferrer">Buka WhatsApp</a>' : '') +
      '<button class="btn secondary small" id="od-edit">Edit Pesanan</button>' +
      '<button class="btn secondary small" id="od-status">Ubah Status</button>' +
      '<button class="btn ghost small" id="od-copy-progress">Salin Pesan Progres</button>' +
      '<button class="btn ghost small" id="od-copy-result">Salin Pesan Hasil</button>' +
      '<button class="btn ghost small" id="od-delivered">Catat Hasil Terkirim</button>' +
      '</div></div></div>';

    // Pembayaran
    h += '<h2>Pembayaran</h2><div class="table-wrap" style="margin-bottom:10px"><table><thead><tr><th>Tanggal</th><th>Metode</th><th>Referensi</th><th class="num">Nominal</th><th class="num">Refund</th><th></th></tr></thead><tbody>' +
      (pays.length ? pays.map(function (p) {
        const rf = refundsOfPayment(p.id).reduce((a, r) => a + Number(r.amount), 0);
        return '<tr><td>' + fmtDate(p.pay_date, tz) + '</td><td>' + esc(p.method || '–') + '</td><td>' + esc(p.reference || '–') + '</td>' +
          '<td class="num">' + rp(p.amount) + '</td><td class="num">' + (rf ? rp(rf) : '–') + '</td>' +
          '<td><button class="btn ghost small" data-refund="' + p.id + '">Refund</button></td></tr>';
      }).join('') : '<tr><td colspan="6" class="muted">Belum ada pembayaran tercatat.</td></tr>') +
      '</tbody></table></div>' +
      '<form id="pay-form" class="form-grid two">' +
      field('Nominal (Rp) *', '<input name="amount" type="number" min="1" step="1" required>') +
      field('Tanggal', '<input name="pay_date" type="date" value="' + todayISO(tz) + '">') +
      field('Metode', input('method', '', 'placeholder="Transfer / QRIS / Tunai"')) +
      field('Referensi', input('reference', '')) +
      '<div class="field"><label>&nbsp;</label><button class="btn" type="submit">Tambah Pembayaran</button></div></form>';

    // Revisi
    h += '<h2 style="margin-top:22px">Revisi</h2>' +
      (revs.length ? '<div class="table-wrap" style="margin-bottom:10px"><table><thead><tr><th>Ke</th><th>Tanggal</th><th>Catatan</th></tr></thead><tbody>' +
        revs.map(r => '<tr><td>' + r.revision_no + '</td><td>' + fmtDate(r.rev_date, tz) + '</td><td>' + esc(r.note) + '</td></tr>').join('') +
        '</tbody></table></div>' : '<p class="muted">Belum ada revisi tercatat.</p>') +
      '<form id="rev-form" class="form-grid two">' +
      field('Catatan revisi *', '<input name="note" required>') +
      field('Tanggal', '<input name="rev_date" type="date" value="' + todayISO(tz) + '">') +
      '<div class="field"><label>&nbsp;</label><button class="btn secondary" type="submit">Catat Revisi</button></div></form>';

    // Lampiran
    h += '<h2 style="margin-top:22px">Lampiran</h2>' +
      (atts.length ? '<div class="table-wrap" style="margin-bottom:10px"><table><thead><tr><th>Label</th><th>Jenis</th><th>Tautan</th><th></th></tr></thead><tbody>' +
        atts.map(function (a, i) {
          return '<tr><td>' + esc(a.label || 'Lampiran') + '</td><td>' + esc(a.kind || '') + '</td>' +
            '<td>' + (a.url ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">Buka</a>' : (a.path ? '<button class="btn ghost small" data-open-private="' + i + '">Buka (privat)</button>' : '–')) + '</td>' +
            '<td><button class="btn ghost small" data-del-att="' + i + '">Hapus</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">Belum ada lampiran. Proses via chat tetap bisa berjalan tanpa lampiran di web.</p>') +
      '<form id="att-form" class="form-grid two">' +
      field('Label', '<input name="label" placeholder="cth: Foto sumber dari pelanggan">') +
      field('Jenis', selectHtml('kind', ['sumber', 'referensi', 'preview', 'final'], 'sumber')) +
      field('URL eksternal (atau unggah file di bawah)', '<input name="url" placeholder="https://…">') +
      field('Unggah file privat', '<input name="file" type="file" accept="image/*,.pdf,.zip">') +
      '<div class="field"><label>&nbsp;</label><button class="btn secondary" type="submit">Tambah Lampiran</button></div></form>';

    return {
      html: shell('/admin/pesanan', 'Pesanan ' + (o.code || ''), h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#od-edit').addEventListener('click', function () { orderFormDialog(o); });
        root.querySelector('#od-status').addEventListener('click', function () {
          const d = dialog('Ubah Status Pesanan', '<form id="st-form">' +
            field('Status pengerjaan', selectHtml('status', ORDER_STATUSES, o.status)) +
            '<button class="btn" type="submit">Simpan Status</button></form>');
          d.el.querySelector('#st-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const data = formData(e.target);
            try {
              await DB.update('studio_orders', o.id, { status: data.status, updated_at: new Date().toISOString() });
              toast('Status diperbarui. Menandai Selesai tidak mengubah pembayaran.');
              d.close(); await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (ex) { toast(ex.message, true); }
          });
        });
        function copyText(text, okMsg) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { toast('Gagal menyalin.', true); });
          } else { toast('Clipboard tidak tersedia di browser ini.', true); }
        }
        root.querySelector('#od-copy-progress').addEventListener('click', function () {
          copyText('Halo ' + o.customer_name + ', pesananmu ' + (o.code || '') + ' saat ini berstatus: ' + o.status + '. Kami kabari lagi begitu ada perkembangan. Terima kasih sudah menunggu.', 'Pesan progres disalin. Tempel dan kirim sendiri via WhatsApp.');
        });
        root.querySelector('#od-copy-result').addEventListener('click', function () {
          copyText('Halo ' + o.customer_name + ', hasil edit pesanan ' + (o.code || '') + ' sudah selesai. Silakan dicek, kalau ada yang perlu direvisi tinggal kabari kami ya. Terima kasih sudah memakai FNATIX ID.', 'Pesan hasil disalin. Tempel dan kirim sendiri via WhatsApp.');
        });
        root.querySelector('#od-delivered').addEventListener('click', async function () {
          try {
            await DB.update('studio_orders', o.id, { delivered_at: todayISO(tz), updated_at: new Date().toISOString() });
            toast('Tanggal terkirim dicatat.');
            await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (e) { toast(e.message, true); }
        });
        root.querySelector('#pay-form').addEventListener('submit', async function (e) {
          e.preventDefault();
          const data = formData(e.target);
          const amount = parseMoney(data.amount);
          if (!amount || amount <= 0) { toast('Nominal pembayaran tidak valid.', true); return; }
          if (orderPaidGross(o.id) + amount > total) {
            toast('Pembayaran melebihi sisa tagihan (' + rp(sisa) + '). Untuk MVP, pembayaran di atas sisa ditolak.', true);
            return;
          }
          try {
            await DB.insert('studio_payments', { order_id: o.id, amount, pay_date: data.pay_date || todayISO(tz), method: data.method || '', reference: data.reference || '' });
            toast('Pembayaran tercatat sebagai satu entri keuangan.');
            await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (ex) { toast(ex.message, true); }
        });
        root.querySelectorAll('[data-refund]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const pid = btn.getAttribute('data-refund');
            const pay = S.payments.find(p => p.id === pid);
            const d = dialog('Catat Refund', '<form id="rf-form">' +
              field('Nominal refund (Rp) *', '<input name="amount" type="number" min="1" max="' + (pay ? pay.amount : '') + '" required>') +
              field('Tanggal', '<input name="refund_date" type="date" value="' + todayISO(tz) + '">') +
              field('Alasan', '<input name="reason">') +
              '<p class="small muted">Refund mengurangi arus kas dan tidak menghapus histori pembayaran awal.</p>' +
              '<button class="btn danger" type="submit">Simpan Refund</button></form>');
            d.el.querySelector('#rf-form').addEventListener('submit', async function (e) {
              e.preventDefault();
              const data = formData(e.target);
              const amount = parseMoney(data.amount);
              const already = refundsOfPayment(pid).reduce((a, r) => a + Number(r.amount), 0);
              if (!amount || amount <= 0 || (pay && already + amount > Number(pay.amount))) { toast('Nominal refund tidak valid atau melebihi pembayaran.', true); return; }
              try {
                await DB.insert('studio_refunds', { payment_id: pid, amount, refund_date: data.refund_date || todayISO(tz), reason: data.reason || '' });
                toast('Refund tercatat.');
                d.close(); await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
              } catch (ex) { toast(ex.message, true); }
            });
          });
        });
        root.querySelector('#rev-form').addEventListener('submit', async function (e) {
          e.preventDefault();
          const data = formData(e.target);
          try {
            await DB.insert('studio_order_revisions', { order_id: o.id, revision_no: revs.length + 1, note: data.note, rev_date: data.rev_date || todayISO(tz) });
            if (o.status !== 'Revisi') await DB.update('studio_orders', o.id, { status: 'Revisi', updated_at: new Date().toISOString() });
            toast('Revisi dicatat.');
            await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (ex) { toast(ex.message, true); }
        });
        root.querySelector('#att-form').addEventListener('submit', async function (e) {
          e.preventDefault();
          const form = e.target;
          const data = formData(form);
          const file = form.querySelector('[name=file]').files[0];
          try {
            let entry = { label: data.label || 'Lampiran', kind: data.kind, url: data.url || '' };
            if (file) {
              const path = 'orders/' + o.id + '/' + uid() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
              await DB.upload('studio-privat', path, file);
              await DB.insert('studio_assets', { storage_path: path, bucket: 'studio-privat', visibility: 'private', mime: file.type || '', size_bytes: file.size, parent_type: 'order', parent_id: o.id, role: 'lampiran' });
              entry = { label: data.label || file.name, kind: data.kind, path: path };
            } else if (!entry.url) { toast('Isi URL atau pilih file dulu.', true); return; }
            const next = atts.concat([entry]);
            await DB.update('studio_orders', o.id, { attachments: next, updated_at: new Date().toISOString() });
            toast('Lampiran ditambahkan.');
            await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
          } catch (ex) { toast(ex.message, true); }
        });
        root.querySelectorAll('[data-del-att]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            if (!(await confirmDialog('Hapus lampiran ini dari pesanan? File di storage tidak ikut terhapus.'))) return;
            const next = atts.filter((_, i) => i !== Number(btn.getAttribute('data-del-att')));
            try {
              await DB.update('studio_orders', o.id, { attachments: next, updated_at: new Date().toISOString() });
              await loadAll(); window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (e) { toast(e.message, true); }
          });
        });
        root.querySelectorAll('[data-open-private]').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            const a = atts[Number(btn.getAttribute('data-open-private'))];
            if (!a || !a.path) return;
            try {
              const url = await DB.signedUrl('studio-privat', a.path, 600);
              window.open(url, '_blank', 'noopener');
            } catch (e) { toast(e.message, true); }
          });
        });
      }
    };
  }

  window.Admin = {
    _part: 'orders',
    get S() { return S; },
    set S(v) { S = v; },
    loadAll, shell, mountShell, dialog, confirmDialog, field, input, textarea, selectHtml, formData, handle, toast,
    loginPage, mountLogin, dashboardPage, ordersPage, orderDetailPage,
    orderPaidNet, orderPaidGross, orderTotal, orderPayStatus, salePaidNet, saleTotal, salePayStatus,
    ORDER_STATUSES, ACTIVE_STATUSES
  };
})();
