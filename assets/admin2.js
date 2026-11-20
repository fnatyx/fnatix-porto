// admin2.js · dashboard admin FNATIX ID (bagian 2: konten, penjualan, keuangan, pengaturan).
(function () {
  const A = window.Admin;
  const { esc, rp, fmtDate, todayISO, slugify, validHttpUrl, parseMoney, downloadCsv, uid } = window.U;
  const { dialog, confirmDialog, field, input, textarea, selectHtml, formData, handle, toast, shell, mountShell } = A;
  const S = function () { return A.S; };

  async function reload() { await A.loadAll(); window.dispatchEvent(new PopStateEvent('popstate')); }

  async function uploadPublic(file, folder) {
    const path = folder + '/' + uid() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
    await DB.upload('studio-publik', path, file);
    return { path, url: DB.publicUrl('studio-publik', path) };
  }
  function imageField(name, currentUrl, hint) {
    return field('Gambar' + (hint ? ' (' + hint + ')' : ''),
      (currentUrl ? '<p><img src="' + esc(currentUrl) + '" alt="" style="max-height:120px;border-radius:8px"></p>' : '') +
      '<input type="file" name="' + name + '_file" accept="image/png,image/jpeg,image/webp">' +
      '<input name="' + name + '" value="' + esc(currentUrl || '') + '" placeholder="atau tempel URL gambar" style="margin-top:6px">');
  }
  async function resolveImage(form, data, name, folder) {
    const file = form.querySelector('[name=' + name + '_file]').files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran gambar melebihi 10 MB.');
      const up = await uploadPublic(file, folder);
      await DB.insert('studio_assets', { storage_path: up.path, bucket: 'studio-publik', public_url: up.url, visibility: 'public', mime: file.type || '', size_bytes: file.size, parent_type: folder, role: name });
      return up.url;
    }
    return data[name] || '';
  }
  function statusSelect(name, val) {
    return selectHtml(name, [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Arsip']], val || 'draft');
  }

  // ---------- Portofolio ----------
  function portfolioAdminPage() {
    const items = S().portfolio;
    const catName = id => { const c = S().categories.find(x => x.id === id); return c ? c.name : '–'; };
    let h = '<div class="admin-top"><span class="muted">' + items.length + ' karya</span><span class="spacer"></span>' +
      '<button class="btn" id="pf-new">Tambah Karya</button></div>';
    if (!items.length) h += '<div class="empty">Belum ada karya. Tambahkan karya yang sudah memiliki izin publikasi.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Judul</th><th>Kategori</th><th>Sumber</th><th>Jenis</th><th>Izin</th><th>Status</th><th>Unggulan</th><th>Urutan</th><th></th></tr></thead><tbody>' +
      items.map(function (p) {
        return '<tr><td>' + esc(p.title) + '</td><td>' + esc(catName(p.category_id)) + '</td><td>' + (p.sumber === 'produk' ? 'Produk Digital' + (p.produk_nama ? '<br><span class="small muted">' + esc(p.produk_nama) + '</span>' : '') : 'Jasa Edit') + '</td><td>' + (p.kind === 'before_after' ? 'Before–After' : 'Satu gambar') + '</td>' +
          '<td>' + (p.public_permission ? '<span class="chip ok">Ada izin</span>' : '<span class="chip bad">Belum ada izin</span>') + '</td>' +
          '<td>' + esc(p.status) + '</td><td>' + (p.featured ? 'Ya' : '–') + '</td><td>' + p.sort_order + '</td>' +
          '<td><button class="btn ghost small" data-pf-edit="' + p.id + '">Edit</button> <button class="btn ghost small" data-pf-del="' + p.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="small muted" style="margin-top:10px">Karya hanya tampil di situs publik bila status Published dan izin publikasi dicentang. File pesanan tidak otomatis menjadi portofolio; tambahkan secara eksplisit di sini.</p>';
    return {
      html: shell('/admin/portofolio', 'Kelola Portofolio', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#pf-new').addEventListener('click', function () { portfolioForm(null); });
        root.querySelectorAll('[data-pf-edit]').forEach(b => b.addEventListener('click', function () {
          portfolioForm(S().portfolio.find(p => p.id === b.getAttribute('data-pf-edit')));
        }));
        root.querySelectorAll('[data-pf-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus permanen karya ini? Tindakan ini tidak bisa dibatalkan.'))) return;
          try { await DB.remove('studio_portfolio_items', b.getAttribute('data-pf-del')); toast('Karya dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
      }
    };
  }
  function portfolioForm(existing) {
    const p = existing || {};
    const d = dialog(existing ? 'Edit Karya' : 'Tambah Karya',
      '<form id="pf-form">' +
      field('Judul *', input('title', p.title, 'required')) +
      field('Kategori', selectHtml('category_id', [['', 'Tidak dipilih']].concat(S().categories.filter(c => c.type === 'portofolio').map(c => [c.id, c.name])), p.category_id || '')) +
      field('Layanan terkait (untuk tombol WhatsApp di detail)', selectHtml('service_id', [['', 'Tidak dipilih']].concat(S().services.map(s => [s.id, s.name])), p.service_id || '')) +
      field('Jenis', selectHtml('kind', [['single', 'Satu gambar hasil'], ['before_after', 'Pasangan before–after']], p.kind || 'single')) +
      field('Sumber hasil', selectHtml('sumber', [['jasa', 'Jasa Edit FNATIX ID'], ['produk', 'Produk Digital']], p.sumber || 'jasa')) +
      field('Nama produk (bila sumber Produk Digital)', input('produk_nama', p.produk_nama, 'placeholder="cth. FNATIX Light Studio"')) +
      '<div id="pf-img-wrap">' + imageField('image_url', p.image_url, 'hasil akhir / sesudah') + '</div>' +
      '<div id="pf-before-wrap">' + imageField('before_url', p.before_url, 'sebelum (khusus before–after)') + '</div>' +
      field('Deskripsi', textarea('description', p.description)) +
      '<div class="form-grid two">' +
      field('Status', statusSelect('status', p.status)) +
      field('Urutan', input('sort_order', p.sort_order || 0, 'type="number" step="1"')) +
      '</div>' +
      '<div class="field"><label class="check"><input type="checkbox" name="featured" ' + (p.featured ? 'checked' : '') + '> Tandai sebagai karya unggulan</label></div>' +
      '<div class="field"><label class="check"><input type="checkbox" name="public_permission" ' + (p.public_permission ? 'checked' : '') + '> Saya memiliki izin publikasi dari pelanggan untuk karya ini</label></div>' +
      '<button class="btn" type="submit">Simpan</button></form>', true);
    const form = d.el.querySelector('#pf-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const imageUrl = await resolveImage(form, data, 'image_url', 'portfolio');
        const beforeUrl = data.kind === 'before_after' ? await resolveImage(form, data, 'before_url', 'portfolio') : '';
        if (!imageUrl) throw new Error('Gambar hasil wajib diisi (unggah atau tempel URL).');
        if (data.kind === 'before_after' && !beforeUrl) throw new Error('Gambar sebelum wajib diisi untuk jenis before–after.');
        const row = {
          title: data.title.trim(), category_id: data.category_id || null, service_id: data.service_id || null,
          kind: data.kind, image_url: imageUrl, before_url: beforeUrl, description: data.description || '',
          sumber: data.sumber || 'jasa', produk_nama: data.sumber === 'produk' ? (data.produk_nama || '').trim() : '',
          status: data.status, sort_order: parseInt(data.sort_order || '0', 10) || 0,
          featured: !!form.querySelector('[name=featured]').checked,
          public_permission: !!form.querySelector('[name=public_permission]').checked,
          updated_at: new Date().toISOString()
        };
        if (row.status === 'published' && !row.public_permission) throw new Error('Karya tanpa izin publikasi tidak boleh dipublikasikan.');
        if (existing) await DB.update('studio_portfolio_items', existing.id, row);
        else await DB.insert('studio_portfolio_items', row);
        toast('Karya tersimpan.');
        d.close(); await reload();
      });
    });
  }

  // ---------- Layanan ----------
  function servicesAdminPage() {
    const items = S().services;
    let h = '<div class="admin-top"><span class="muted">' + items.length + ' layanan</span><span class="spacer"></span>' +
      '<button class="btn" id="sv-new">Tambah Layanan</button></div>';
    if (!items.length) h += '<div class="empty">Belum ada layanan.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Nama</th><th>Harga mulai</th><th>Status</th><th>Unggulan</th><th>Urutan</th><th></th></tr></thead><tbody>' +
      items.map(function (s) {
        return '<tr><td>' + esc(s.name) + '</td><td>' + (s.price_from !== null && s.price_from !== undefined ? rp(s.price_from) : 'Hubungi untuk penawaran') + '</td>' +
          '<td>' + esc(s.status) + '</td><td>' + (s.featured ? 'Ya' : '–') + '</td><td>' + s.sort_order + '</td>' +
          '<td><button class="btn ghost small" data-sv-edit="' + s.id + '">Edit</button> <button class="btn ghost small" data-sv-del="' + s.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="small muted" style="margin-top:10px">Mengarsipkan layanan tidak menghapus histori pesanan yang terkait.</p>';
    return {
      html: shell('/admin/layanan', 'Kelola Layanan', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#sv-new').addEventListener('click', function () { serviceForm(null); });
        root.querySelectorAll('[data-sv-edit]').forEach(b => b.addEventListener('click', function () {
          serviceForm(S().services.find(s => s.id === b.getAttribute('data-sv-edit')));
        }));
        root.querySelectorAll('[data-sv-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus permanen layanan ini? Pesanan lama tetap menyimpan nama layanannya.'))) return;
          try { await DB.remove('studio_services', b.getAttribute('data-sv-del')); toast('Layanan dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
      }
    };
  }
  function serviceForm(existing) {
    const s = existing || {};
    const d = dialog(existing ? 'Edit Layanan' : 'Tambah Layanan',
      '<form id="sv-form">' +
      field('Nama layanan *', input('name', s.name, 'required')) +
      field('Slug (otomatis dari nama bila kosong)', input('slug', s.slug, 'placeholder="pas-foto"')) +
      field('Kategori', selectHtml('category_id', [['', 'Tidak dipilih']].concat(S().categories.filter(c => c.type === 'layanan').map(c => [c.id, c.name])), s.category_id || '')) +
      field('Deskripsi', textarea('description', s.description)) +
      '<div class="form-grid two">' +
      field('Harga mulai (Rp, kosongkan bila belum ditetapkan)', input('price_from', s.price_from !== null && s.price_from !== undefined ? s.price_from : '', 'type="number" min="0" step="1"')) +
      field('Estimasi pengerjaan', input('estimate_text', s.estimate_text, 'placeholder="cth: 1–2 hari"')) +
      field('Batas revisi (kosongkan bila tidak dibatasi)', input('revision_limit', s.revision_limit !== null && s.revision_limit !== undefined ? s.revision_limit : '', 'type="number" min="0" step="1"')) +
      field('Status', statusSelect('status', s.status)) +
      field('Urutan', input('sort_order', s.sort_order || 0, 'type="number" step="1"')) +
      '</div>' +
      imageField('image_url', s.image_url, 'contoh hasil (opsional)') +
      field('Template pesan WhatsApp (pakai {nama_layanan})', textarea('wa_template', s.wa_template, ''), 'Kosongkan untuk template bawaan: “Halo FNATIX, aku tertarik dengan layanan {nama_layanan}. Aku ingin konsultasi kebutuhan edit dan estimasi biayanya.”') +
      '<div class="field"><label class="check"><input type="checkbox" name="featured" ' + (s.featured ? 'checked' : '') + '> Layanan unggulan</label></div>' +
      '<button class="btn" type="submit">Simpan</button></form>', true);
    const form = d.el.querySelector('#sv-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const imageUrl = await resolveImage(form, data, 'image_url', 'services');
        const row = {
          name: data.name.trim(), slug: (data.slug || slugify(data.name)).trim(),
          category_id: data.category_id || null, description: data.description || '',
          price_from: parseMoney(data.price_from), estimate_text: data.estimate_text || '',
          revision_limit: data.revision_limit === '' ? null : (parseInt(data.revision_limit, 10) || 0),
          image_url: imageUrl, wa_template: data.wa_template || '',
          status: data.status, sort_order: parseInt(data.sort_order || '0', 10) || 0,
          featured: !!form.querySelector('[name=featured]').checked,
          updated_at: new Date().toISOString()
        };
        if (existing) await DB.update('studio_services', existing.id, row);
        else await DB.insert('studio_services', row);
        toast('Layanan tersimpan.');
        d.close(); await reload();
      });
    });
  }

  // ---------- Produk ----------
  function productsAdminPage() {
    const items = S().products;
    let h = '<div class="admin-top"><span class="muted">' + items.length + ' produk</span><span class="spacer"></span>' +
      '<button class="btn" id="pd-new">Tambah Produk</button></div>';
    if (!items.length) h += '<div class="empty">Belum ada produk.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Nama</th><th>Harga</th><th>URL Produk</th><th>Status</th><th>Urutan</th><th></th></tr></thead><tbody>' +
      items.map(function (p) {
        return '<tr><td>' + esc(p.name) + '</td><td>' + (p.price !== null && p.price !== undefined ? rp(p.price) : '–') + '</td>' +
          '<td>' + (validHttpUrl(p.external_url) ? '<a href="' + esc(p.external_url) + '" target="_blank" rel="noopener noreferrer">Buka</a>' : '<span class="chip bad">Belum valid</span>') + '</td>' +
          '<td>' + esc(p.status) + '</td><td>' + p.sort_order + '</td>' +
          '<td><button class="btn ghost small" data-pd-edit="' + p.id + '">Edit</button> <button class="btn ghost small" data-pd-del="' + p.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="small muted" style="margin-top:10px">Produk hanya bisa dipublikasikan bila URL produk valid (http/https). Perubahan harga katalog tidak mengubah transaksi penjualan lama.</p>';
    return {
      html: shell('/admin/produk', 'Kelola Produk Digital', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#pd-new').addEventListener('click', function () { productForm(null); });
        root.querySelectorAll('[data-pd-edit]').forEach(b => b.addEventListener('click', function () {
          productForm(S().products.find(p => p.id === b.getAttribute('data-pd-edit')));
        }));
        root.querySelectorAll('[data-pd-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus permanen produk ini? Catatan penjualan lama tetap menyimpan snapshot nama dan harganya.'))) return;
          try { await DB.remove('studio_products', b.getAttribute('data-pd-del')); toast('Produk dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
      }
    };
  }
  function productForm(existing) {
    const p = existing || {};
    const gallery = Array.isArray(p.gallery) ? p.gallery : [];
    const d = dialog(existing ? 'Edit Produk' : 'Tambah Produk',
      '<form id="pd-form">' +
      field('Nama produk *', input('name', p.name, 'required')) +
      field('Slug (otomatis dari nama bila kosong)', input('slug', p.slug)) +
      field('Ringkasan', textarea('summary', p.summary)) +
      field('Fitur / isi paket', textarea('detail', p.detail)) +
      field('Cara pakai', textarea('how_to', p.how_to)) +
      field('Aplikasi yang diperlukan', textarea('requirements', p.requirements)) +
      field('Ketentuan penggunaan', textarea('terms', p.terms)) +
      '<div class="form-grid two">' +
      field('Harga (Rp, kosongkan bila tidak ditampilkan)', input('price', p.price !== null && p.price !== undefined ? p.price : '', 'type="number" min="0" step="1"')) +
      field('URL produk eksternal *', input('external_url', p.external_url, 'placeholder="https://lynk.id/…"')) +
      field('Status', statusSelect('status', p.status)) +
      field('Urutan', input('sort_order', p.sort_order || 0, 'type="number" step="1"')) +
      '</div>' +
      imageField('cover_url', p.cover_url, 'cover produk') +
      field('Galeri contoh (satu URL per baris)', textarea('gallery', gallery.join('\n'))) +
      '<div class="field"><label class="check"><input type="checkbox" name="featured" ' + (p.featured ? 'checked' : '') + '> Produk unggulan</label></div>' +
      '<button class="btn" type="submit">Simpan</button></form>', true);
    const form = d.el.querySelector('#pd-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        if (data.status === 'published' && !validHttpUrl(data.external_url)) {
          throw new Error('Produk tanpa URL valid tidak boleh dipublikasikan. Isi URL http/https yang benar atau simpan sebagai Draft.');
        }
        if (data.external_url && !validHttpUrl(data.external_url)) {
          throw new Error('URL produk tidak valid. Hanya http/https yang diterima.');
        }
        const coverUrl = await resolveImage(form, data, 'cover_url', 'products');
        const row = {
          name: data.name.trim(), slug: (data.slug || slugify(data.name)).trim(),
          summary: data.summary || '', detail: data.detail || '', how_to: data.how_to || '',
          requirements: data.requirements || '', terms: data.terms || '',
          price: parseMoney(data.price), external_url: data.external_url || '',
          cover_url: coverUrl,
          gallery: (data.gallery || '').split('\n').map(x => x.trim()).filter(x => validHttpUrl(x)),
          status: data.status, sort_order: parseInt(data.sort_order || '0', 10) || 0,
          featured: !!form.querySelector('[name=featured]').checked,
          updated_at: new Date().toISOString()
        };
        if (existing) await DB.update('studio_products', existing.id, row);
        else await DB.insert('studio_products', row);
        toast('Produk tersimpan.');
        d.close(); await reload();
      });
    });
  }

  // ---------- Testimoni ----------
  function testimonialsAdminPage() {
    const items = S().testimonials;
    let h = '<div class="admin-top"><span class="muted">' + items.length + ' testimoni</span><span class="spacer"></span>' +
      '<button class="btn" id="ts-new">Tambah Testimoni</button></div>';
    if (!items.length) h += '<div class="empty">Belum ada testimoni. Tambahkan hanya ulasan nyata yang sudah berizin publikasi.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Nama Tampilan</th><th>Isi</th><th>Izin</th><th>Status</th><th></th></tr></thead><tbody>' +
      items.map(function (t) {
        return '<tr><td>' + esc(t.display_name) + '</td><td>' + esc(t.content) + '</td>' +
          '<td>' + (t.public_permission ? '<span class="chip ok">Ada izin</span>' : '<span class="chip bad">Belum ada izin</span>') + '</td><td>' + esc(t.status) + '</td>' +
          '<td><button class="btn ghost small" data-ts-edit="' + t.id + '">Edit</button> <button class="btn ghost small" data-ts-del="' + t.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    return {
      html: shell('/admin/testimoni', 'Kelola Testimoni', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#ts-new').addEventListener('click', function () { testimonialForm(null); });
        root.querySelectorAll('[data-ts-edit]').forEach(b => b.addEventListener('click', function () {
          testimonialForm(S().testimonials.find(t => t.id === b.getAttribute('data-ts-edit')));
        }));
        root.querySelectorAll('[data-ts-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus permanen testimoni ini?'))) return;
          try { await DB.remove('studio_testimonials', b.getAttribute('data-ts-del')); toast('Testimoni dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
      }
    };
  }
  function testimonialForm(existing) {
    const t = existing || {};
    const d = dialog(existing ? 'Edit Testimoni' : 'Tambah Testimoni',
      '<form id="ts-form">' +
      field('Nama tampilan / inisial *', input('display_name', t.display_name, 'required')) +
      field('Isi ulasan *', textarea('content', t.content, 'required')) +
      field('Layanan terkait', selectHtml('service_id', [['', 'Tidak dipilih']].concat(S().services.map(s => [s.id, s.name])), t.service_id || '')) +
      '<div class="form-grid two">' +
      field('Status', statusSelect('status', t.status)) +
      field('Urutan', input('sort_order', t.sort_order || 0, 'type="number" step="1"')) +
      '</div>' +
      '<div class="field"><label class="check"><input type="checkbox" name="public_permission" ' + (t.public_permission ? 'checked' : '') + '> Ulasan ini memiliki izin publikasi dari pemberinya</label></div>' +
      '<button class="btn" type="submit">Simpan</button></form>');
    const form = d.el.querySelector('#ts-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const row = {
          display_name: data.display_name.trim(), content: data.content.trim(),
          service_id: data.service_id || null, status: data.status,
          sort_order: parseInt(data.sort_order || '0', 10) || 0,
          public_permission: !!form.querySelector('[name=public_permission]').checked,
          updated_at: new Date().toISOString()
        };
        if (row.status === 'published' && !row.public_permission) throw new Error('Testimoni tanpa izin publikasi tidak boleh dipublikasikan.');
        if (existing) await DB.update('studio_testimonials', existing.id, row);
        else await DB.insert('studio_testimonials', row);
        toast('Testimoni tersimpan.');
        d.close(); await reload();
      });
    });
  }

  // ---------- Penjualan digital ----------
  function salesAdminPage() {
    const tz = S().settings.timezone || 'Asia/Jakarta';
    const items = S().sales;
    let h = '<div class="admin-top"><span class="muted">' + items.length + ' catatan penjualan</span><span class="spacer"></span>' +
      '<button class="btn" id="sl-new">Catat Penjualan</button></div>';
    if (!items.length) h += '<div class="empty">Belum ada penjualan digital tercatat. Klik produk oleh pengunjung tidak dihitung sebagai penjualan; catat manual di sini.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Produk</th><th>Pelanggan</th><th class="num">Total</th><th>Bayar</th><th>Kirim</th><th>Referensi</th><th></th></tr></thead><tbody>' +
      items.map(function (s) {
        const st = A.salePayStatus(s);
        const cls = st === 'Lunas' ? 'ok' : (st === 'Sebagian' ? 'warn' : 'bad');
        return '<tr><td>' + fmtDate(s.sale_date, tz) + '</td><td>' + esc(s.product_name_snapshot) + '</td><td>' + esc(s.customer_name || '–') + '</td>' +
          '<td class="num">' + rp(A.saleTotal(s)) + '</td><td><span class="chip ' + cls + '">' + st + '</span></td>' +
          '<td>' + esc(s.delivery_status) + '</td><td>' + esc(s.reference || '–') + '</td>' +
          '<td><button class="btn ghost small" data-sl-pay="' + s.id + '">Bayar</button> <button class="btn ghost small" data-sl-edit="' + s.id + '">Edit</button> <button class="btn ghost small" data-sl-del="' + s.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    return {
      html: shell('/admin/penjualan', 'Penjualan Digital', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#sl-new').addEventListener('click', function () { saleForm(null); });
        root.querySelectorAll('[data-sl-edit]').forEach(b => b.addEventListener('click', function () {
          saleForm(S().sales.find(s => s.id === b.getAttribute('data-sl-edit')));
        }));
        root.querySelectorAll('[data-sl-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus catatan penjualan ini? Pembayaran yang terkait ikut terhapus.'))) return;
          try { await DB.remove('studio_digital_sales', b.getAttribute('data-sl-del')); toast('Catatan dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
        root.querySelectorAll('[data-sl-pay]').forEach(b => b.addEventListener('click', function () {
          const s = S().sales.find(x => x.id === b.getAttribute('data-sl-pay'));
          const sisa = A.saleTotal(s) - A.salePaidNet(s.id);
          if (sisa <= 0) { toast('Penjualan ini sudah lunas.'); return; }
          const d = dialog('Catat Pembayaran Penjualan', '<form id="slp-form">' +
            field('Nominal (Rp) *', '<input name="amount" type="number" min="1" max="' + sisa + '" required>', 'Sisa tagihan: ' + rp(sisa)) +
            field('Tanggal', '<input name="pay_date" type="date" value="' + todayISO(tz) + '">') +
            field('Metode', input('method', '', 'placeholder="Transfer / QRIS / Saldo Lynk"')) +
            field('Referensi', input('reference', s.reference || '')) +
            '<button class="btn" type="submit">Simpan Pembayaran</button></form>');
          d.el.querySelector('#slp-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const data = formData(e.target);
            const amount = parseMoney(data.amount);
            if (!amount || amount <= 0 || amount > sisa) { toast('Nominal tidak valid atau melebihi sisa tagihan.', true); return; }
            try {
              await DB.insert('studio_payments', { digital_sale_id: s.id, amount, pay_date: data.pay_date || todayISO(tz), method: data.method || '', reference: data.reference || '' });
              toast('Pembayaran tercatat satu kali sebagai uang masuk.');
              d.close(); await reload();
            } catch (ex) { toast(ex.message, true); }
          });
        }));
      }
    };
  }
  function saleForm(existing) {
    const s = existing || {};
    const tz = S().settings.timezone || 'Asia/Jakarta';
    const d = dialog(existing ? 'Edit Penjualan' : 'Catat Penjualan',
      '<form id="sl-form">' +
      field('Tanggal', '<input name="sale_date" type="date" value="' + (s.sale_date || todayISO(tz)) + '">') +
      field('Produk *', selectHtml('product_id', S().products.map(p => [p.id, p.name + (p.price !== null && p.price !== undefined ? ' · ' + rp(p.price) : '')]), s.product_id || '')) +
      field('Nama produk saat transaksi (snapshot)', input('product_name_snapshot', s.product_name_snapshot, ''), 'Terisi otomatis dari produk bila dikosongkan. Perubahan katalog nanti tidak mengubah catatan ini.') +
      '<div class="form-grid two">' +
      field('Harga saat transaksi (Rp) *', input('price_snapshot', s.price_snapshot !== undefined ? s.price_snapshot : '', 'type="number" min="0" step="1" required')) +
      field('Jumlah', input('qty', s.qty || 1, 'type="number" min="1" step="1"')) +
      field('Diskon (Rp)', input('discount', s.discount || 0, 'type="number" min="0" step="1"')) +
      field('Pelanggan (opsional)', input('customer_name', s.customer_name)) +
      field('Platform tujuan', input('platform', s.platform, 'placeholder="Lynk"')) +
      field('Referensi transaksi (opsional)', input('reference', s.reference)) +
      field('Status pengiriman', selectHtml('delivery_status', ['Belum Dikirim', 'Terkirim'], s.delivery_status || 'Belum Dikirim')) +
      '</div>' +
      '<p class="small muted">Penjualan yang belum dibayar tidak menambah uang masuk. Catat pembayarannya lewat tombol Bayar setelah dana diterima.</p>' +
      '<button class="btn" type="submit">Simpan</button></form>', true);
    const form = d.el.querySelector('#sl-form');
    const prodSel = form.querySelector('[name=product_id]');
    const priceInp = form.querySelector('[name=price_snapshot]');
    prodSel.addEventListener('change', function () {
      const p = S().products.find(x => x.id === prodSel.value);
      if (p && (priceInp.value === '' || !existing)) priceInp.value = p.price !== null && p.price !== undefined ? p.price : '';
    });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const p = S().products.find(x => x.id === data.product_id);
        if (!p) throw new Error('Pilih produk dulu.');
        if (data.reference) {
          const dup = S().sales.find(x => x.reference && x.reference === data.reference && (!existing || x.id !== existing.id));
          if (dup) throw new Error('Referensi "' + data.reference + '" sudah dipakai pada catatan penjualan lain (' + (dup.product_name_snapshot || '') + '). Periksa agar tidak ganda.');
        }
        const row = {
          sale_date: data.sale_date || todayISO(tz), product_id: p.id,
          product_name_snapshot: data.product_name_snapshot || p.name,
          price_snapshot: parseMoney(data.price_snapshot) || 0,
          qty: parseInt(data.qty || '1', 10) || 1, discount: parseMoney(data.discount) || 0,
          customer_name: data.customer_name || '', platform: data.platform || '',
          reference: data.reference || '', delivery_status: data.delivery_status,
          updated_at: new Date().toISOString()
        };
        if (existing) await DB.update('studio_digital_sales', existing.id, row);
        else await DB.insert('studio_digital_sales', row);
        toast('Penjualan tercatat (snapshot nama dan harga tersimpan).');
        d.close(); await reload();
      });
    });
  }

  // ---------- Keuangan ----------
  function financePage(query) {
    const tz = S().settings.timezone || 'Asia/Jakarta';
    const from = query.get('dari') || todayISO(tz).slice(0, 8) + '01';
    const to = query.get('sampai') || todayISO(tz);
    const inRange = d => d && d >= from && d <= to;
    const pays = S().payments.filter(p => inRange(p.pay_date));
    const serviceIncome = pays.filter(p => p.order_id).reduce((a, p) => a + Number(p.amount), 0);
    const digitalIncome = pays.filter(p => p.digital_sale_id).reduce((a, p) => a + Number(p.amount), 0);
    const refundTotal = S().refunds.filter(r => inRange(r.refund_date)).reduce((a, r) => a + Number(r.amount), 0);
    const grossIn = serviceIncome + digitalIncome;
    const netIn = grossIn - refundTotal;
    const expTotal = S().expenses.filter(e => inRange(e.expense_date)).reduce((a, e) => a + Number(e.amount), 0);
    const cashflow = netIn - expTotal;
    let piutang = 0;
    S().orders.forEach(o => { if (o.status !== 'Dibatalkan') { const s2 = A.orderTotal(o) - A.orderPaidNet(o.id); if (s2 > 0) piutang += s2; } });
    S().sales.forEach(s2 => { const r = A.saleTotal(s2) - A.salePaidNet(s2.id); if (r > 0) piutang += r; });

    const stat = (v, k) => '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
    let h = '<form method="get" action="/admin/keuangan" class="form-grid two get-filter" style="margin-bottom:14px">' +
      field('Dari tanggal', '<input name="dari" type="date" value="' + esc(from) + '">') +
      field('Sampai tanggal', '<input name="sampai" type="date" value="' + esc(to) + '">') +
      '<div class="field"><label>&nbsp;</label><button class="btn secondary" type="submit">Terapkan Rentang</button></div></form>' +
      '<div class="stat-grid">' +
      stat(rp(serviceIncome), 'Pemasukan jasa (diterima)') +
      stat(rp(digitalIncome), 'Pemasukan digital (diterima)') +
      stat(rp(refundTotal), 'Refund pada rentang') +
      stat(rp(expTotal), 'Pengeluaran pada rentang') +
      stat(rp(cashflow), 'Arus kas bersih (bukan laba akuntansi)') +
      stat(rp(piutang), 'Piutang saat ini (semua periode)') +
      '</div>' +
      '<div class="admin-top"><h2 style="margin:0">Pengeluaran</h2><span class="spacer"></span>' +
      '<button class="btn secondary" id="exp-new">Tambah Pengeluaran</button> ' +
      '<button class="btn ghost" id="fin-csv">Ekspor CSV Keuangan</button></div>';
    const exps = S().expenses.filter(e => inRange(e.expense_date));
    if (!exps.length) h += '<div class="empty">Tidak ada pengeluaran pada rentang ini.</div>';
    else h += '<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Catatan</th><th class="num">Nominal</th><th></th></tr></thead><tbody>' +
      exps.map(function (e) {
        return '<tr><td>' + fmtDate(e.expense_date, tz) + '</td><td>' + esc(e.category) + '</td><td>' + esc(e.note || '–') + '</td>' +
          '<td class="num">' + rp(e.amount) + '</td>' +
          '<td><button class="btn ghost small" data-exp-edit="' + e.id + '">Edit</button> <button class="btn ghost small" data-exp-del="' + e.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="small muted" style="margin-top:12px">Setiap pembayaran tercatat satu kali sebagai pemasukan dan terhubung ke pesanan atau penjualan sumbernya. Menandai pesanan Selesai tidak menambah pemasukan. Ekspor CSV berisi pembayaran, refund, dan pengeluaran pada rentang terpilih.</p>';
    return {
      html: shell('/admin/keuangan', 'Keuangan', h),
      mount: function (root) {
        mountShell(root);
        root.querySelector('#exp-new').addEventListener('click', function () { expenseForm(null); });
        root.querySelectorAll('[data-exp-edit]').forEach(b => b.addEventListener('click', function () {
          expenseForm(S().expenses.find(e => e.id === b.getAttribute('data-exp-edit')));
        }));
        root.querySelectorAll('[data-exp-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus catatan pengeluaran ini?'))) return;
          try { await DB.remove('studio_expenses', b.getAttribute('data-exp-del')); toast('Pengeluaran dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
        root.querySelector('#fin-csv').addEventListener('click', function () {
          const rows = [['Tanggal', 'Jenis', 'Keterangan', 'Masuk', 'Keluar']];
          pays.slice().sort((a, b) => a.pay_date < b.pay_date ? -1 : 1).forEach(function (p) {
            const ord = p.order_id ? S().orders.find(o => o.id === p.order_id) : null;
            const sale = p.digital_sale_id ? S().sales.find(s => s.id === p.digital_sale_id) : null;
            rows.push([p.pay_date, p.order_id ? 'Pembayaran jasa' : 'Pembayaran digital',
              (ord ? (ord.code || '') + ' · ' + ord.customer_name : (sale ? sale.product_name_snapshot : '')) + (p.method ? ' · ' + p.method : '') + (p.reference ? ' · ' + p.reference : ''),
              Number(p.amount), '']);
          });
          S().refunds.filter(r => inRange(r.refund_date)).forEach(function (r) {
            rows.push([r.refund_date, 'Refund', r.reason || 'Refund pembayaran', '', Number(r.amount)]);
          });
          exps.forEach(function (e) {
            rows.push([e.expense_date, 'Pengeluaran: ' + e.category, e.note || '', '', Number(e.amount)]);
          });
          downloadCsv('keuangan-fnatix-' + from + '-sd-' + to + '.csv', rows);
        });
      }
    };
  }
  function expenseForm(existing) {
    const e0 = existing || {};
    const tz = S().settings.timezone || 'Asia/Jakarta';
    const d = dialog(existing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran',
      '<form id="exp-form">' +
      field('Tanggal', '<input name="expense_date" type="date" value="' + (e0.expense_date || todayISO(tz)) + '">') +
      field('Kategori', selectHtml('category', ['Software', 'Langganan', 'Promosi', 'Lainnya'], e0.category || 'Lainnya')) +
      field('Nominal (Rp) *', input('amount', e0.amount !== undefined ? e0.amount : '', 'type="number" min="1" step="1" required')) +
      field('Catatan', input('note', e0.note)) +
      '<button class="btn" type="submit">Simpan</button></form>');
    const form = d.el.querySelector('#exp-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const row = { expense_date: data.expense_date || todayISO(tz), category: data.category, amount: parseMoney(data.amount) || 0, note: data.note || '' };
        if (row.amount <= 0) throw new Error('Nominal pengeluaran tidak valid.');
        if (existing) await DB.update('studio_expenses', existing.id, row);
        else await DB.insert('studio_expenses', row);
        toast('Pengeluaran tersimpan.');
        d.close(); await reload();
      });
    });
  }

  // ---------- Pengaturan ----------
  function settingsPage() {
    const st = S().settings;
    let h = '<form id="set-form">' +
      '<h2>Identitas dan Kontak</h2><div class="form-grid two">' +
      field('Nama brand', input('brand_name', st.brand_name)) +
      field('Tagline', input('tagline', st.tagline)) +
      '</div>' +
      field('Deskripsi singkat (footer)', textarea('description', st.description)) +
      '<div class="form-grid two">' +
      field('Nomor WhatsApp (format internasional, angka saja)', input('whatsapp', st.whatsapp, 'placeholder="6281234567890"'), 'Nomor lokal 08xx otomatis diubah menjadi 628xx di tautan publik. Kosongkan untuk menonaktifkan CTA WhatsApp.') +
      field('URL Instagram', input('instagram_url', st.instagram_url, 'placeholder="https://www.instagram.com/…"')) +
      field('Zona waktu bisnis', selectHtml('timezone', ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'UTC'], st.timezone || 'Asia/Jakarta')) +
      '</div>' +
      field('Template pesan WhatsApp umum', textarea('wa_template_general', st.wa_template_general)) +
      field('Judul hero beranda', input('hero_title', st.hero_title)) +
      field('Teks hero beranda', textarea('hero_text', st.hero_text)) +
      imageField('logo_url', st.logo_url, 'logo brand') +
      imageField('hero_image_url', st.hero_image_url, 'foto hero beranda') +
      field('Teks ketentuan layanan (ditampilkan di footer/admin bila diisi)', textarea('service_terms', st.service_terms)) +
      '<button class="btn" type="submit">Simpan Pengaturan</button></form>' +
      '<h2 style="margin-top:26px">Kategori</h2>' +
      '<div class="table-wrap" style="margin-bottom:10px"><table><thead><tr><th>Nama</th><th>Tipe</th><th>Urutan</th><th></th></tr></thead><tbody>' +
      S().categories.map(function (c) {
        return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.type) + '</td><td>' + c.sort_order + '</td>' +
          '<td><button class="btn ghost small" data-cat-edit="' + c.id + '">Edit</button> <button class="btn ghost small" data-cat-del="' + c.id + '">Hapus</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<button class="btn secondary" id="cat-new">Tambah Kategori</button>' +
      '<h2 style="margin-top:26px">Akun Admin</h2>' +
      '<p class="muted">Login memakai Supabase Auth. Akun admin dibuat di Supabase Dashboard (Authentication → Users), lalu didaftarkan di tabel studio_admin_profiles. Tidak ada pendaftaran publik di situs ini.</p>';
    return {
      html: shell('/admin/pengaturan', 'Pengaturan', h),
      mount: function (root) {
        mountShell(root);
        const form = root.querySelector('#set-form');
        form.addEventListener('submit', async function (e) {
          e.preventDefault();
          await handle(form, async function (data) {
            const logo = await resolveImage(form, data, 'logo_url', 'settings');
            const hero = await resolveImage(form, data, 'hero_image_url', 'settings');
            await DB.update('studio_settings', 1, {
              brand_name: data.brand_name || 'FNATIX ID', tagline: data.tagline || '',
              description: data.description || '', whatsapp: (data.whatsapp || '').replace(/\D/g, ''),
              instagram_url: data.instagram_url || '', timezone: data.timezone || 'Asia/Jakarta',
              wa_template_general: data.wa_template_general || '', hero_title: data.hero_title || '',
              hero_text: data.hero_text || '', logo_url: logo, hero_image_url: hero,
              service_terms: data.service_terms || '', updated_at: new Date().toISOString()
            });
            toast('Pengaturan tersimpan.');
            await reload();
          });
        });
        root.querySelector('#cat-new').addEventListener('click', function () { categoryForm(null); });
        root.querySelectorAll('[data-cat-edit]').forEach(b => b.addEventListener('click', function () {
          categoryForm(S().categories.find(c => c.id === b.getAttribute('data-cat-edit')));
        }));
        root.querySelectorAll('[data-cat-del]').forEach(b => b.addEventListener('click', async function () {
          if (!(await confirmDialog('Hapus kategori ini? Item yang terkait menjadi tanpa kategori.'))) return;
          try { await DB.remove('studio_categories', b.getAttribute('data-cat-del')); toast('Kategori dihapus.'); await reload(); }
          catch (e) { toast(e.message, true); }
        }));
      }
    };
  }
  function categoryForm(existing) {
    const c = existing || {};
    const d = dialog(existing ? 'Edit Kategori' : 'Tambah Kategori',
      '<form id="cat-form">' +
      field('Nama *', input('name', c.name, 'required')) +
      field('Tipe', selectHtml('type', [['portofolio', 'Portofolio'], ['layanan', 'Layanan']], c.type || 'portofolio')) +
      field('Urutan', input('sort_order', c.sort_order || 0, 'type="number" step="1"')) +
      '<button class="btn" type="submit">Simpan</button></form>');
    const form = d.el.querySelector('#cat-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handle(form, async function (data) {
        const row = { name: data.name.trim(), slug: slugify(data.name), type: data.type, sort_order: parseInt(data.sort_order || '0', 10) || 0, updated_at: new Date().toISOString() };
        if (existing) await DB.update('studio_categories', existing.id, row);
        else await DB.insert('studio_categories', row);
        toast('Kategori tersimpan.');
        d.close(); await reload();
      });
    });
  }

  Object.assign(window.Admin, {
    portfolioAdminPage, servicesAdminPage, productsAdminPage, testimonialsAdminPage,
    salesAdminPage, financePage, settingsPage
  });
})();
