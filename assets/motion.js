// motion.js: gerak GSAP sesuai preset UI/UX Pro Max (reveal halus, stagger kecil).
// Tujuan gerak: mengarahkan perhatian ke foto dan alur section, bukan dekorasi.
// Tanpa GSAP atau dengan prefers-reduced-motion, konten tampil utuh tanpa animasi.
(function () {
  function init() {
    if (!window.gsap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
    // Intro hero: teks naik halus berurutan, foto menyusul.
    var heroText = document.querySelectorAll('.hero .eyebrow, .hero h1, .hero .hero-sub, .hero .btn-row');
    if (heroText.length) {
      gsap.from(heroText, { opacity: 0, y: 14, duration: 0.5, stagger: 0.08, ease: 'power1.out', clearProps: 'all' });
    }
    var heroPhoto = document.querySelector('.hero .hero-photo');
    if (heroPhoto) {
      gsap.from(heroPhoto, { opacity: 0, y: 16, duration: 0.55, delay: 0.15, ease: 'power1.out', clearProps: 'all' });
    }
    // Reveal saat scroll untuk kartu, langkah, baris layanan, dan statistik admin.
    var items = document.querySelectorAll('.card, .step, .svc-row, .stat, .board-card');
    if (items.length && window.ScrollTrigger) {
      gsap.set(items, { opacity: 0, y: 12 });
      window.ScrollTrigger.batch(items, {
        start: 'top 92%',
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power1.out', overwrite: true, clearProps: 'transform' });
        }
      });
      window.ScrollTrigger.refresh();
    }
    // Kepala section publik ikut reveal.
    var heads = document.querySelectorAll('section.block .section-head, section.block > .wrap > h1');
    if (heads.length && window.ScrollTrigger) {
      gsap.set(heads, { opacity: 0, y: 10 });
      window.ScrollTrigger.batch(heads, {
        start: 'top 94%',
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power1.out', overwrite: true, clearProps: 'transform' });
        }
      });
    }
  }
  window.Motion = { init: init };
})();
