// app.js · router FNATIX ID (publik + admin dalam satu aplikasi).
(function () {
  const app = document.getElementById('app');
  let publicCtx = null;

  function loading() { app.innerHTML = '<div class="loading">Memuat…</div>'; }

  async function loadPublic() {
    if (publicCtx) return publicCtx;
    const [settings, categories, services, portfolio, products, testimonials] = await Promise.all([
      DB.select('studio_settings', 'select=*&id=eq.1'),
      DB.select('studio_categories', 'select=*&order=sort_order.asc'),
      DB.select('studio_services', 'select=*&status=eq.published&order=sort_order.asc'),
      DB.select('studio_portfolio_items', 'select=*&status=eq.published&order=sort_order.asc'),
      DB.select('studio_products', 'select=*&status=eq.published&order=sort_order.asc'),
      DB.select('studio_testimonials', 'select=*&status=eq.published&order=sort_order.asc')
    ]);
    const cats = categories || [];
    publicCtx = {
      settings: (settings && settings[0]) || {},
      categories: cats,
      services: services || [],
      portfolio: (portfolio || []).filter(p => p.public_permission),
      products: products || [],
      testimonials: (testimonials || []).filter(t => t.public_permission),
      catName: function (id) { const c = cats.find(x => x.id === id); return c ? c.name : ''; }
    };
    return publicCtx;
  }

  function setMeta(title, noindex) {
    document.title = title;
    let m = document.querySelector('meta[name="robots"]');
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
    m.content = noindex ? 'noindex, nofollow' : 'index, follow';
  }

  async function render() {
    const BASE = window.FNATIX_BASE || '';
    const path = (location.pathname.indexOf(BASE) === 0 ? location.pathname.slice(BASE.length) : location.pathname).replace(/\/+$/, '') || '/';
    const query = new URLSearchParams(location.search);
    loading();
    try {
      if (path === '/admin/login') {
        const s = await DB.getSession();
        if (s) { location.replace((window.FNATIX_BASE || '') + '/admin'); return; }
        setMeta('Login Admin · FNATIX ID', true);
        const page = Admin.loginPage();
        app.innerHTML = page;
        Admin.mountLogin(app);
        if (window.Motion) window.Motion.init();
        return;
      }
      if (path.startsWith('/admin')) {
        setMeta('Admin · FNATIX ID', true);
        const s = await DB.getSession();
        if (!s) { location.replace((window.FNATIX_BASE || '') + '/admin/login'); return; }
        // pastikan user terdaftar sebagai admin
        if (!Admin.S) {
          const prof = await DB.select('studio_admin_profiles', 'select=*&user_id=eq.' + encodeURIComponent(s.user.id));
          if (!prof || !prof.length) {
            app.innerHTML = '<main><section class="block"><div class="wrap" style="max-width:520px">' +
              '<h1>Bukan Akun Admin</h1><p class="muted">Akun ini belum terdaftar sebagai admin FNATIX ID. Daftarkan user ini di tabel studio_admin_profiles pada Supabase, atau masuk dengan akun admin.</p>' +
              '<button class="btn" id="not-admin-logout">Keluar</button></div></section></main>';
            app.querySelector('#not-admin-logout').addEventListener('click', async function () { await DB.signOut(); location.href = (window.FNATIX_BASE || '') + '/admin/login'; });
            return;
          }
          await Admin.loadAll();
          Admin.S.profile = prof[0];
        }
        let page = null;
        if (path === '/admin') page = Admin.dashboardPage();
        else if (path === '/admin/pesanan') page = Admin.ordersPage(query);
        else if (path.startsWith('/admin/pesanan/')) page = Admin.orderDetailPage(path.split('/')[3]);
        else if (path === '/admin/portofolio') page = Admin.portfolioAdminPage();
        else if (path === '/admin/layanan') page = Admin.servicesAdminPage();
        else if (path === '/admin/produk') page = Admin.productsAdminPage();
        else if (path === '/admin/penjualan') page = Admin.salesAdminPage();
        else if (path === '/admin/keuangan') page = Admin.financePage(query);
        else if (path === '/admin/testimoni') page = Admin.testimonialsAdminPage();
        else if (path === '/admin/pengaturan') page = Admin.settingsPage();
        if (!page) { app.innerHTML = '<main class="wrap" style="padding:30px 16px"><h1>Halaman admin tidak ditemukan</h1><p><a href="/admin">Kembali ke dashboard</a></p></main>'; return; }
        app.innerHTML = page.html;
        if (page.mount) page.mount(app);
        window.scrollTo(0, 0);
        if (window.Motion) window.Motion.init();
        return;
      }
      // publik
      const ctx = await loadPublic();
      const brand = ctx.settings.brand_name || 'FNATIX ID';
      let page = null;
      if (path === '/') { setMeta(brand + ' · Jasa Edit Foto dan Produk Digital', false); page = Public.homePage(ctx); }
      else if (path === '/portofolio') { setMeta('Portofolio · ' + brand, false); page = Public.portfolioPage(ctx, query); }
      else if (path === '/layanan') { setMeta('Layanan Edit Foto · ' + brand, false); page = Public.servicesPage(ctx); }
      else if (path === '/produk') { setMeta('Produk Digital · ' + brand, false); page = Public.productsPage(ctx); }
      else if (path.startsWith('/produk/')) {
        page = Public.productDetailPage(ctx, decodeURIComponent(path.split('/')[2]));
        if (page) setMeta('Produk · ' + brand, false);
      }
      if (!page) {
        app.innerHTML = Public.header(ctx.settings, '') + '<main><section class="block"><div class="wrap center">' +
          '<h1>Halaman tidak ditemukan</h1><p class="muted">Alamat yang kamu buka tidak tersedia.</p>' +
          '<a class="btn" href="/">Kembali ke Beranda</a></div></section></main>' + Public.footer(ctx.settings);
        return;
      }
      app.innerHTML = page.html;
      if (page.mount) page.mount(app);
      window.scrollTo(0, 0);
      if (window.Motion) window.Motion.init();
    } catch (e) {
      app.innerHTML = '<main><section class="block"><div class="wrap" style="max-width:560px">' +
        '<h1>Terjadi kendala</h1><p class="muted">' + (e.message || 'Data belum bisa dimuat.') + '</p>' +
        '<p class="muted small">Bila ini pemasangan baru, pastikan skema database sudah dijalankan di Supabase (lihat README proyek).</p>' +
        '<button class="btn" onclick="location.reload()">Coba Lagi</button></div></section></main>';
    }
  }

  // Navigasi SPA untuk tautan internal
  document.addEventListener('click', function (e) {
    const a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/') || a.target === '_blank') return;
    e.preventDefault();
    history.pushState({}, '', (window.FNATIX_BASE || '') + href);
    render();
  });
  // Form GET (filter admin) menjadi navigasi SPA
  document.addEventListener('submit', function (e) {
    const f = e.target;
    if (f.classList && f.classList.contains('get-filter') && f.action) {
      e.preventDefault();
      const url = new URL(f.action);
      new FormData(f).forEach(function (v, k) { if (v !== '') url.searchParams.set(k, v); });
      history.pushState({}, '', (window.FNATIX_BASE || '') + url.pathname + url.search);
      render();
    }
  });
  window.addEventListener('popstate', render);
  render();
})();
