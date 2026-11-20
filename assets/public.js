// public.js · halaman publik FNATIX ID (beranda, portofolio, layanan, produk).
(function () {
  const { esc, rp, waLink, validHttpUrl } = window.U;

  function waCta(settings, text, label, cls) {
    const link = waLink(settings.whatsapp, text || settings.wa_template_general || '');
    if (!link) return '<button class="btn ' + (cls || '') + '" disabled title="Nomor WhatsApp belum diatur admin">' + esc(label || 'Pesan via WhatsApp') + '</button>';
    return '<a class="btn ' + (cls || '') + '" href="' + link + '" target="_blank" rel="noopener noreferrer">' + esc(label || 'Pesan via WhatsApp') + '</a>';
  }


  const ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  const ICON_IG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>';

  function header(settings, active) {
    const logo = settings.logo_url ? '<img src="' + esc(settings.logo_url) + '" alt="">' : '';
    const links = [
      ['/', 'Beranda'], ['/portofolio', 'Portofolio'], ['/layanan', 'Layanan'], ['/produk', 'Produk']
    ];
    return '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="/">' + logo + '<span>' + esc(settings.brand_name || 'FNATIX ID') + '</span></a>' +
      '<nav class="main-nav" aria-label="Navigasi utama">' +
      links.map(l => '<a href="' + l[0] + '" class="' + (active === l[0] ? 'active' : '') + '">' + l[1] + '</a>').join('') +
      '</nav>' +
      '<div class="head-soc">' +
      (waLink(settings.whatsapp, '') ? '<a href="' + waLink(settings.whatsapp, '') + '" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp FNATIX ID">' + ICON_WA + '</a>' : '') +
      (validHttpUrl(settings.instagram_url) ? '<a href="' + esc(settings.instagram_url) + '" target="_blank" rel="noopener noreferrer" aria-label="Instagram FNATIX ID">' + ICON_IG + '</a>' : '') +
      '</div></div></header>';
  }

  function footer(settings) {
    const wa = waLink(settings.whatsapp, settings.wa_template_general || '');
    const ig = validHttpUrl(settings.instagram_url) ? settings.instagram_url : '';
    return '<footer class="site-footer"><div class="wrap">' +
      '<div><b>' + esc(settings.brand_name || 'FNATIX ID') + '</b>' +
      (settings.description ? '<p class="muted" style="margin-top:6px">' + esc(settings.description) + '</p>' : '') + '</div>' +
      '<div><b>Kontak</b><p style="margin-top:8px;display:flex;flex-direction:column;gap:9px">' +
      (wa ? '<a class="soc" href="' + wa + '" target="_blank" rel="noopener noreferrer">' + ICON_WA + '<span>WhatsApp</span></a>' : '') +
      (ig ? '<a class="soc" href="' + esc(ig) + '" target="_blank" rel="noopener noreferrer">' + ICON_IG + '<span>Instagram</span></a>' : '') + '</p></div>' +
      '<div><b>Navigasi</b><p class="muted" style="margin-top:6px">' +
      '<a href="/portofolio">Portofolio</a><br><a href="/layanan">Layanan</a><br><a href="/produk">Produk Digital</a></p></div>' +
      '</div></footer>';
  }

  function baHtml(item, cls) {
    return '<div class="ba ' + (cls || '') + '" data-ba>' +
      '<img src="' + esc(item.before_url) + '" alt="Foto sebelum edit: ' + esc(item.title) + '" loading="lazy">' +
      '<img class="ba-after" src="' + esc(item.image_url) + '" alt="Foto sesudah edit: ' + esc(item.title) + '" loading="lazy">' +
      '<span class="ba-tag before">Sebelum</span><span class="ba-tag after">Sesudah</span>' +
      '<span class="ba-line"></span>' +
      '<button type="button" class="ba-handle" role="slider" aria-label="Geser perbandingan sebelum dan sesudah" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">&#8596;</button><span class="ba-pct">50%</span>' +
      '</div>';
  }

  function mountBa(root) {
    root.querySelectorAll('[data-ba]').forEach(function (box) {
      const handle = box.querySelector('.ba-handle');
      const pct = box.querySelector('.ba-pct');
      let cur = 50;
      function setPos(p) {
        cur = Math.max(2, Math.min(98, p));
        box.style.setProperty('--pos', cur + '%');
        handle.setAttribute('aria-valuenow', Math.round(cur));
        if (pct) pct.textContent = Math.round(cur) + '%';
        box.classList.toggle('hide-before', cur > 88);
        box.classList.toggle('hide-after', cur < 12);
      }
      function fromEvent(e) {
        const r = box.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        setPos(x / r.width * 100);
      }
      let drag = false;
      box.addEventListener('pointerdown', function (e) { drag = true; box.classList.add('dragging'); box.setPointerCapture(e.pointerId); fromEvent(e); });
      box.addEventListener('pointermove', function (e) { if (drag) fromEvent(e); });
      function endDrag() { drag = false; box.classList.remove('dragging'); }
      box.addEventListener('pointerup', endDrag);
      box.addEventListener('pointercancel', endDrag);
      handle.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { setPos(cur - 4); e.preventDefault(); }
        if (e.key === 'ArrowRight') { setPos(cur + 4); e.preventDefault(); }
        if (e.key === 'Home') { setPos(2); e.preventDefault(); }
        if (e.key === 'End') { setPos(98); e.preventDefault(); }
      });
      // Sapuan intro sekali saat pertama masuk layar, agar pengunjung sadar bisa digeser.
      if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const io = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          box.classList.add('sweep');
          setPos(74);
          setTimeout(function () { setPos(50); }, 620);
          setTimeout(function () { box.classList.remove('sweep'); }, 1350);
        }, { threshold: 0.45 });
        io.observe(box);
      }
    });
  }

  function srcBadge(item, statik) {
    if (item.sumber === 'produk') return '<span class="src-badge produk' + (statik ? ' static' : '') + '">Produk Digital</span>';
    return '<span class="src-badge jasa' + (statik ? ' static' : '') + '">Jasa Edit</span>';
  }
  function srcLabel(item) {
    return item.sumber === 'produk' ? 'Hasil produk digital' + (item.produk_nama ? ': ' + item.produk_nama : '') : 'Hasil jasa edit FNATIX ID';
  }

  function portfolioCard(item, catName) {
    const media = item.kind === 'before_after' && item.before_url
      ? baHtml(item)
      : '<img class="card-img" src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" loading="lazy">';
    return '<article class="card"><div class="card-media">' + srcBadge(item) + media + '</div><div class="card-body">' +
      '<div><span class="chip">' + esc(catName || 'Portofolio') + '</span></div>' +
      '<h3 style="margin:0">' + esc(item.title) + '</h3>' +
      (item.description ? '<p class="muted small" style="margin:0">' + esc(item.description) + '</p>' : '') +
      '<div class="spacer"></div>' +
      '<button class="btn secondary small" data-lightbox="' + item.id + '">Lihat Detail</button>' +
      '</div></article>';
  }

  function serviceRow(settings, s) {
    const tpl = (s.wa_template && s.wa_template.trim())
      ? s.wa_template.replace('{nama_layanan}', s.name)
      : 'Halo FNATIX, aku tertarik dengan layanan ' + s.name + '. Aku ingin konsultasi kebutuhan edit dan estimasi biayanya.';
    return '<div class="svc-row"><div><h3>' + esc(s.name) + '</h3>' +
      (s.description ? '<p class="muted" style="margin:4px 0 0">' + esc(s.description) + '</p>' : '') +
      '<div class="meta" style="margin-top:6px">' +
      (s.price_from !== null && s.price_from !== undefined
        ? '<span class="price">Mulai ' + rp(s.price_from) + '</span>'
        : '<span class="muted">Hubungi untuk penawaran</span>') +
      (s.estimate_text ? '<span class="muted small">Estimasi: ' + esc(s.estimate_text) + '</span>' : '') +
      '</div></div><div>' + waCta(settings, tpl, 'Pesan via WhatsApp', 'small') + '</div></div>';
  }

  function serviceCard(settings, s) {
    const tpl = (s.wa_template && s.wa_template.trim())
      ? s.wa_template.replace('{nama_layanan}', s.name)
      : 'Halo FNATIX, aku tertarik dengan layanan ' + s.name + '. Aku ingin konsultasi kebutuhan edit dan estimasi biayanya.';
    return '<article class="card">' +
      (s.image_url ? '<img class="card-img" src="' + esc(s.image_url) + '" alt="' + esc(s.name) + '" loading="lazy">' : '') +
      '<div class="card-body"><h3 style="margin:0">' + esc(s.name) + '</h3>' +
      (s.description ? '<p class="muted" style="margin:0">' + esc(s.description) + '</p>' : '') +
      (s.price_from !== null && s.price_from !== undefined
        ? '<p class="price" style="margin:0">Mulai ' + rp(s.price_from) + '</p>'
        : '<p class="muted" style="margin:0">Hubungi untuk penawaran</p>') +
      (s.estimate_text ? '<p class="small muted" style="margin:0">Estimasi: ' + esc(s.estimate_text) + '</p>' : '') +
      (s.revision_limit !== null && s.revision_limit !== undefined ? '<p class="small muted" style="margin:0">Revisi hingga ' + s.revision_limit + ' kali</p>' : '') +
      '<div class="spacer"></div>' + waCta(settings, tpl, 'Pesan via WhatsApp', 'small') +
      '</div></article>';
  }

  function productCard(p) {
    return '<article class="card prod-card">' +
      (p.image_url ? '<img class="card-img" src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy">' : '') +
      '<div class="card-body"><h3 style="margin:0">' + esc(p.name) + '</h3>' +
      (p.tagline ? '<p class="muted" style="margin:0">' + esc(p.tagline) + '</p>' : '') +
      (p.price !== null && p.price !== undefined ? '<p class="price" style="margin:0">' + rp(p.price) + '</p>' : '') +
      '<div class="spacer"></div>' +
      '<a class="btn secondary small" href="/produk/' + esc(p.slug) + '">Lihat Detail</a>' +
      '</div></article>';
  }

  // ---------- Halaman ----------
  function homePage(ctx) {
    const { settings, portfolio, services, products, testimonials, catName } = ctx;
    const feat = portfolio.filter(p => p.featured).slice(0, 6);
    const shownFeat = (feat.length ? feat : portfolio.slice(0, 6));
    const featServices = services.filter(s => s.featured);
    const shownServices = (featServices.length ? featServices : services).slice(0, 3);
    const featProducts = products.filter(p => p.featured);
    const shownProducts = (featProducts.length ? featProducts : products).slice(0, 3);
    let h = header(settings, '/') + '<main>';
    // Hero (layout Dens: judul raksasa kiri, panel warna kanan)
    const waNum = String(settings.whatsapp || '').replace(/\D/g, '');
    const waDisp = waNum ? '0' + waNum.slice(2, 5) + '-' + waNum.slice(5, 9) + '-' + waNum.slice(9) : '';
    h += '<div class="hero"><div class="wrap hero-grid"><div>' +
      '<p class="eyebrow">Jasa Edit Foto · Sejak 2019</p>' +
      '<h1 class="hero-brand">FNATIX<span class="dash">-ID</span></h1>' +
      '<p class="hero-lead">' + esc(settings.hero_title || 'Edit foto untuk momen yang ingin kamu simpan.') + '</p>' +
      (settings.hero_text ? '<p class="muted hero-sub">' + esc(settings.hero_text) + '</p>' : '') +
      (waNum ? '<div class="cmd-box"><span class="cmd-dollar">$</span><span class="cmd-text">pesan via WhatsApp · ' + waDisp + '</span><button type="button" class="cmd-copy" data-copy="' + waNum + '">Salin</button></div>' : '') +
      '<div class="btn-row"><a class="btn" href="/portofolio">Lihat Portofolio &#8594;</a>' + waCta(settings, null, 'Pesan via WhatsApp', 'secondary') + '</div>' +
      '</div>' +
      '<div class="hero-comp">' +
      '<svg class="hero-svg" viewBox="0 0 664 704" aria-hidden="true">' +
      '<rect width="664" height="704" rx="88" fill="#0c0b0b"/>' +
      '<g transform="translate(32 32)">' +
      '<defs><clipPath id="topClip"><path d="M0,56 A56,56 0 0 1 56,0 H544 A56,56 0 0 1 600,56 V300 A72,72 0 0 1 528,372 H96 A112,112 0 0 0 0,426.312 Z"/></clipPath>' +
      '<linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#031414" stop-opacity="0"/><stop offset="1" stop-color="#031414" stop-opacity="0.55"/></linearGradient></defs>' +
      '<path d="M0,56 A56,56 0 0 1 56,0 H544 A56,56 0 0 1 600,56 V300 A72,72 0 0 1 528,372 H96 A112,112 0 0 0 0,426.312 Z" fill="#0088D2"/>' +
      (settings.hero_image_url ? '<image href="' + esc(settings.hero_image_url) + '" x="0" y="0" width="600" height="484" preserveAspectRatio="xMidYMid slice" clip-path="url(#topClip)"/><rect x="0" y="0" width="600" height="484" fill="url(#topShade)" clip-path="url(#topClip)"/>' : '') +
      '<path d="M0,484 A96,96 0 0 1 96,388 H236 A56,56 0 0 1 292,444 V584 A56,56 0 0 1 236,640 H56 A56,56 0 0 1 0,584 Z" fill="#BFE3F8"/>' +
      '<path d="M308,444 A56,56 0 0 1 364,388 H528 A88,88 0 0 0 600,350.596 V584 A56,56 0 0 1 544,640 H364 A56,56 0 0 1 308,584 Z" fill="#FFD11A"/>' +
      '</g></svg>' +
      '<div class="hero-overlay">' +
      '<div class="hp-card"><div class="hp-card-head"><b>Alur pemesanan</b><span class="hp-pill">4 langkah</span></div>' +
      '<ol class="hp-steps"><li>Pesan via WhatsApp</li><li>Foto diproses</li><li>Revisi bila perlu</li><li>Hasil dikirim</li></ol></div>' +
      '<div class="hp-title"><b>Hasil Edit Pilihan</b><span>Jasa Edit Foto · Sejak 2019</span></div>' +
      '<a class="hp-lab hp-lab-l" href="/produk"><span class="hp-mono">Canvas Gemini</span><b>Produk Digital</b><span class="hp-mono">Mulai Rp30.000</span></a>' +
      '<a class="hp-lab hp-lab-r" href="/layanan"><span class="hp-mono">Via WhatsApp</span><b>Jasa Edit Foto</b><span class="hp-mono">Sejak 2019</span></a>' +
      '</div></div>' +
      '<div class="wrap hero-pair"><span class="muted small">Kategori populer:</span>' +
      ['Wisuda', 'Keluarga', 'Pas Foto', 'Prewedding/Wedding', 'Edit Custom'].map(c => '<a class="pair-chip" href="/portofolio">' + c + '</a>').join('') +
      '</div></div>';
    // Karya terbaik
    if (shownFeat.length) {
      h += '<section class="block"><div class="wrap"><div class="section-head"><p class="eyebrow">Portofolio</p><div class="row"><h2>Pilihan Karya Terbaik</h2><a href="/portofolio">Lihat semua</a></div></div>' +
        '<div class="grid cols-3 feature-first">' + shownFeat.map(p => portfolioCard(p, catName(p.category_id))).join('') + '</div></div></section>';
    }
    // Layanan unggulan
    if (shownServices.length) {
      h += '<section class="block"><div class="wrap"><div class="section-head"><p class="eyebrow">Layanan</p><div class="row"><h2>Layanan Unggulan</h2><a href="/layanan">Lihat semua layanan</a></div></div>' +
        '<div class="svc-rows">' + shownServices.map(s => serviceRow(settings, s)).join('') + '</div></div></section>';
    }
    // Produk digital
    if (shownProducts.length) {
      h += '<section class="block"><div class="wrap"><div class="section-head"><p class="eyebrow">Produk Digital</p><div class="row"><h2>Produk Digital</h2><a href="/produk">Lihat semua produk</a></div></div>' +
        '<div class="grid cols-3">' + shownProducts.map(productCard).join('') + '</div></div></section>';
    }
    // Cara pesan
    h += '<section class="block"><div class="wrap"><div class="section-head"><p class="eyebrow">Alur Pemesanan</p><div class="row"><h2>Cara Pesan Jasa Edit</h2></div></div><div class="steps">' +
      ['Pilih layanan yang kamu butuhkan.',
       'Hubungi kami via WhatsApp.',
       'Kirim foto dan ceritakan kebutuhanmu.',
       'Sepakati biaya dan waktu pengerjaan.',
       'Proses edit dan revisi sesuai kesepakatan.',
       'Terima hasil akhir lewat chat.']
        .map((t, i) => '<div class="step"><span class="n">' + (i + 1) + '</span><p>' + t + '</p></div>').join('') +
      '</div></div></section>';
    // Testimoni
    if (testimonials.length) {
      h += '<section class="block"><div class="wrap"><div class="section-head"><p class="eyebrow">Testimoni</p><div class="row"><h2>Kata Mereka</h2></div></div><div class="grid cols-3">' +
        testimonials.slice(0, 6).map(t => '<article class="card"><div class="card-body"><p style="margin:0">&ldquo;' + esc(t.content) + '&rdquo;</p><p class="muted small" style="margin:0">' + esc(t.display_name) + '</p></div></article>').join('') +
        '</div></div></section>';
    }
    // CTA
    h += '<section class="block"><div class="wrap"><div class="cta-band center"><h2>Siap mengedit fotomu?</h2>' +
      '<p>Ceritakan kebutuhanmu, kami bantu carikan solusi edit yang pas.</p>' +
      waCta(settings, null, 'Chat via WhatsApp') + '</div></div></section>';
    h += '</main>' + footer(settings);
    return { html: h, mount: function (root) {
      mountBa(root); mountLightbox(root, ctx);
      const cp = root.querySelector('[data-copy]');
      if (cp) cp.addEventListener('click', function () {
        const done = function () { cp.textContent = 'Tersalin'; setTimeout(function () { cp.textContent = 'Salin'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cp.getAttribute('data-copy')).then(done, done);
        else done();
      });
    } };
  }

  function mountLightbox(root, ctx) {
    root.querySelectorAll('[data-lightbox]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = ctx.portfolio.find(p => p.id === btn.getAttribute('data-lightbox'));
        if (!item) return;
        const svc = item.service_id ? ctx.services.find(s => s.id === item.service_id) : null;
        const tpl = svc
          ? 'Halo FNATIX, aku tertarik dengan layanan ' + svc.name + '. Aku ingin konsultasi kebutuhan edit dan estimasi biayanya.'
          : (ctx.settings.wa_template_general || '');
        const ov = document.createElement('div');
        ov.className = 'overlay';
        ov.innerHTML = '<div class="dialog wide" role="dialog" aria-modal="true" aria-label="' + esc(item.title) + '">' +
          '<div class="dialog-head"><h3 style="margin:0">' + esc(item.title) + '</h3>' +
          '<button class="btn ghost small x" data-close>Tutup</button></div>' +
          (item.kind === 'before_after' && item.before_url ? baHtml(item) : '<img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" style="border-radius:12px">') +
          (item.description ? '<p style="margin-top:12px">' + esc(item.description) + '</p>' : '') +
          '<p><span class="chip">' + esc(ctx.catName(item.category_id) || 'Portofolio') + '</span> ' + srcBadge(item, true) + '</p>' +
          '<p class="muted small">' + esc(srcLabel(item)) + '</p>' +
          (item.sumber === 'produk'
            ? waCta(ctx.settings, 'Halo FNATIX ID, aku mau tanya produk digital ' + (item.produk_nama || item.title) + '.', 'Tanya Produk Ini via WhatsApp')
            : waCta(ctx.settings, tpl, 'Pesan Layanan Ini via WhatsApp')) +
          '</div>';
        document.body.appendChild(ov);
        mountBa(ov);
        function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
        function onKey(e) { if (e.key === 'Escape') close(); }
        document.addEventListener('keydown', onKey);
        ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-close')) close(); });
        ov.querySelector('[data-close]').focus();
      });
    });
  }

  const PAGE = 12;
  function portfolioPage(ctx, query) {
    const { settings, portfolio, categories, catName } = ctx;
    const cats = categories.filter(c => c.type === 'portofolio');
    const activeCat = query.get('kategori') || '';
    const activeSrc = query.get('sumber') || '';
    let items = portfolio.slice();
    if (activeSrc) items = items.filter(p => (p.sumber || 'jasa') === activeSrc);
    if (activeCat) items = items.filter(p => {
      const c = categories.find(x => x.id === p.category_id);
      return c && c.slug === activeCat;
    });
    let shown = PAGE;
    let h = header(settings, '/portofolio') + '<main><section class="block"><div class="wrap">' +
      '<h1>Portofolio</h1><p class="muted">Hasil edit pilihan. Geser garis pada karya before–after untuk membandingkan.</p>' +
      '<div class="filters" role="group" aria-label="Filter kategori">' +
      '<button data-cat="" class="' + (!activeCat ? 'active' : '') + '">Semua</button>' +
      cats.map(c => '<button data-cat="' + esc(c.slug) + '" class="' + (activeCat === c.slug ? 'active' : '') + '">' + esc(c.name) + '</button>').join('') +
      '</div>' +
      '<div class="filters" role="group" aria-label="Filter sumber hasil">' +
      '<button data-src="" class="' + (!activeSrc ? 'active' : '') + '">Semua Sumber</button>' +
      '<button data-src="jasa" class="' + (activeSrc === 'jasa' ? 'active' : '') + '">Jasa Edit</button>' +
      '<button data-src="produk" class="' + (activeSrc === 'produk' ? 'active' : '') + '">Produk Digital</button>' +
      '</div><div id="folio-grid"></div><div id="folio-more" class="center" style="margin-top:16px"></div>' +
      '</div></section></main>' + footer(settings);
    return {
      html: h,
      mount: function (root) {
        const grid = root.querySelector('#folio-grid');
        const more = root.querySelector('#folio-more');
        function render() {
          const slice = items.slice(0, shown);
          grid.innerHTML = slice.length
            ? '<div class="grid cols-3">' + slice.map(p => portfolioCard(p, catName(p.category_id))).join('') + '</div>'
            : '<div class="empty">Belum ada karya pada kategori ini.</div>';
          more.innerHTML = items.length > shown
            ? '<button class="btn secondary" id="btn-more">Lihat Berikutnya (' + (items.length - shown) + ' lagi)</button>' : '';
          mountBa(grid);
          mountLightbox(root, ctx);
          const b = root.querySelector('#btn-more');
          if (b) b.addEventListener('click', function () { shown += PAGE; render(); });
        }
        render();
        function go(cat, src) {
          const qs = new URLSearchParams();
          if (cat) qs.set('kategori', cat);
          if (src) qs.set('sumber', src);
          history.pushState({}, '', '/portofolio' + (qs.toString() ? '?' + qs.toString() : ''));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        root.querySelectorAll('[data-cat]').forEach(function (b) {
          b.addEventListener('click', function () { go(b.getAttribute('data-cat'), activeSrc); });
        });
        root.querySelectorAll('[data-src]').forEach(function (b) {
          b.addEventListener('click', function () { go(activeCat, b.getAttribute('data-src')); });
        });
      }
    };
  }

  function servicesPage(ctx) {
    const { settings, services } = ctx;
    let h = header(settings, '/layanan') + '<main><section class="block"><div class="wrap">' +
      '<h1>Layanan Edit Foto</h1><p class="muted">Pilih layanan, lalu konsultasikan kebutuhanmu via WhatsApp.</p>' +
      (services.length
        ? '<div class="grid cols-3">' + services.map(s => serviceCard(settings, s)).join('') + '</div>'
        : '<div class="empty">Layanan belum tersedia. Silakan kembali lagi nanti.</div>') +
      '</div></section></main>' + footer(settings);
    return { html: h, mount: function () {} };
  }

  function productsPage(ctx) {
    const { settings, products } = ctx;
    let h = header(settings, '/produk') + '<main><section class="block"><div class="wrap">' +
      '<h1>Produk Digital</h1><p class="muted">Produk digital FNATIX. Pembelian dan akses dilakukan di halaman produk tujuan.</p>' +
      (products.length
        ? '<div class="grid cols-3">' + products.map(productCard).join('') + '</div>'
        : '<div class="empty">Produk belum tersedia. Silakan kembali lagi nanti.</div>') +
      '</div></section></main>' + footer(settings);
    return { html: h, mount: function () {} };
  }

  function productDetailPage(ctx, slug) {
    const { settings, products } = ctx;
    const p = products.find(x => x.slug === slug);
    if (!p) return null;
    const gallery = Array.isArray(p.gallery) ? p.gallery : [];
    let h = header(settings, '/produk') + '<main><section class="block"><div class="wrap">' +
      '<p><a href="/produk">&larr; Semua produk</a></p>' +
      '<div class="hero-grid" style="display:grid;gap:24px">' +
      '<div>' + (p.image_url ? '<img class="hero-photo" src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" style="border-radius:14px;width:100%">' : '') +
      (gallery.length ? '<div class="grid" style="margin-top:12px;grid-template-columns:repeat(2,1fr)">' + gallery.map(g => '<img src="' + esc(g) + '" alt="Contoh hasil ' + esc(p.name) + '" loading="lazy" style="border-radius:10px">').join('') + '</div>' : '') +
      '</div><div>' +
      '<h1>' + esc(p.name) + '</h1>' +
      (p.price !== null && p.price !== undefined ? '<p class="price" style="font-size:1.2rem">' + rp(p.price) + '</p>' : '') +
      (p.tagline ? '<p>' + esc(p.tagline) + '</p>' : '') +
      (validHttpUrl(p.external_url)
        ? '<p><a class="btn" href="' + esc(p.external_url) + '" target="_blank" rel="noopener noreferrer">Lihat Produk</a></p>'
        : '<p class="muted">Tautan produk belum tersedia.</p>') +
      (p.detail ? '<h3>Fitur dan Isi Paket</h3><p style="white-space:pre-line">' + esc(p.detail) + '</p>' : '') +
      (p.how_to ? '<h3>Cara Pakai</h3><p style="white-space:pre-line">' + esc(p.how_to) + '</p>' : '') +
      (p.requirements ? '<h3>Aplikasi yang Diperlukan</h3><p style="white-space:pre-line">' + esc(p.requirements) + '</p>' : '') +
      (p.terms ? '<h3>Ketentuan Penggunaan</h3><p style="white-space:pre-line">' + esc(p.terms) + '</p>' : '') +
      '</div></div></div></section></main>' + footer(settings);
    return { html: h, mount: function () {} };
  }

  window.Public = { homePage, portfolioPage, servicesPage, productsPage, productDetailPage, header, footer, waCta, mountBa };
})();
