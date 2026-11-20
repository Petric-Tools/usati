// Ušati - YouTube: prati lica u videu i crta usi; podrazumijevano samo Vucicu.
(function () {
  'use strict';

  let cfg = Object.assign({}, Usati.DEFAULTS);
  let video = null, okvir = null, kanvas = null, ctx = null;
  let mali = null, maliCtx = null;
  let tragovi = [];           // { poza, vucic (0..1), vidjen }
  let radi = false;
  let trajanje = 300;         // koliko je trajala posljednja detekcija (ms)
  let prolaz = 0;             // prepoznavanje (skuplje) ide na svaki cetvrti prolaz, izmedju se lice samo prati

  function aktivno() { return cfg.enabled && !Usati.sajtIskljucen(cfg); }

  function prikaci() {
    const v = document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video');
    if (!v) return;
    const o = v.closest('.html5-video-player') || v.parentElement;
    if (v === video && o === okvir && kanvas && kanvas.isConnected) return;
    video = v; okvir = o; tragovi = [];
    if (!kanvas) {
      kanvas = document.createElement('canvas');
      kanvas.id = 'usati-overlay-canvas';
      kanvas.style.cssText = 'position:absolute;pointer-events:none;z-index:40;';
      ctx = kanvas.getContext('2d');
    }
    okvir.appendChild(kanvas);
    if (!mali) { mali = document.createElement('canvas'); maliCtx = mali.getContext('2d', { willReadFrequently: true }); }
  }

  // Kanvas tacno preko video elementa (i u pozoristu i na cijelom ekranu).
  function poravnaj() {
    if (!video || !okvir || !kanvas) return null;
    const rv = video.getBoundingClientRect(), ro = okvir.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const l = rv.left - ro.left, t = rv.top - ro.top;
    kanvas.style.left = l + 'px'; kanvas.style.top = t + 'px';
    kanvas.style.width = rv.width + 'px'; kanvas.style.height = rv.height + 'px';
    const W = Math.round(rv.width * dpr), H = Math.round(rv.height * dpr);
    if (kanvas.width !== W || kanvas.height !== H) { kanvas.width = W; kanvas.height = H; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return rv;
  }

  // Dio video elementa koji zaista zauzima slika (YouTube moze imati crne trake).
  function slikaUElementu(rv) {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return null;
    const s = Math.min(rv.width / vw, rv.height / vh);
    return { s, ox: (rv.width - vw * s) / 2, oy: (rv.height - vh * s) / 2 };
  }

  async function detekcija() {
    if (radi || !aktivno() || !video || video.readyState < 2 || !video.videoWidth) return;
    if (video.paused && tragovi.length && Date.now() - tragovi[0].vidjen < 1500) return;
    radi = true;
    try {
      await Usati.init();
      const t1 = performance.now();
      const sirina = 480;
      const visina = Math.round(sirina * video.videoHeight / video.videoWidth);
      mali.width = sirina; mali.height = visina;
      maliCtx.drawImage(video, 0, 0, sirina, visina);
      const saId = !cfg.allFaces && (prolaz++ % 4 === 0 || tragovi.length === 0);
      const nadjena = await Usati.lica(mali, 416, saId);
      const k = video.videoWidth / sirina;
      const sada = Date.now();
      const novi = nadjena.map(l => {
        const p = Usati.poza(l);
        return { poza: { x: p.x * k, y: p.y * k, ugao: p.ugao, sirina: p.sirina * k }, vucic: l.vucic ? 1 : 0 };
      });
      // spoji sa prethodnim tragovima (najblize lice), pa izgladi polozaj i odluku o identitetu
      const stari = tragovi.slice();
      tragovi = novi.map(n => {
        let najbolji = null, d = Infinity;
        stari.forEach(s => {
          const dd = Math.hypot(s.poza.x - n.poza.x, s.poza.y - n.poza.y);
          if (dd < d && dd < n.poza.sirina) { d = dd; najbolji = s; }
        });
        if (!najbolji) return { poza: n.poza, vucic: n.vucic, vidjen: sada, vx: 0, vy: 0 };
        stari.splice(stari.indexOf(najbolji), 1);
        const a = 0.5;
        const poza = {
          x: najbolji.poza.x * (1 - a) + n.poza.x * a,
          y: najbolji.poza.y * (1 - a) + n.poza.y * a,
          ugao: najbolji.poza.ugao * (1 - a) + n.poza.ugao * a,
          sirina: najbolji.poza.sirina * (1 - a) + n.poza.sirina * a
        };
        // brzina glave (px kadra u ms), izgladjena: izmedju dvije detekcije usi idu za glavom umjesto da cekaju
        // Brzina vazi samo za bliske detekcije i mali pomak: rez kadra ili spor racunar (2 s po kadru)
        // bi inace dali lazno brzo kretanje, pa bi usi odletjele u stranu. Tada je brzina nula, kao prije.
        const dt = Math.max(1, sada - najbolji.vidjen);
        const skok = Math.hypot(n.poza.x - najbolji.poza.x, n.poza.y - najbolji.poza.y);
        const pouzdano = dt <= 800 && skok <= n.poza.sirina * 0.4;
        const b = 0.5;
        const vx = pouzdano ? (najbolji.vx || 0) * (1 - b) + ((n.poza.x - najbolji.poza.x) / dt) * b : 0;
        const vy = pouzdano ? (najbolji.vy || 0) * (1 - b) + ((n.poza.y - najbolji.poza.y) / dt) * b : 0;
        return {
          poza, vx, vy,
          vucic: saId ? najbolji.vucic * 0.6 + n.vucic * 0.4 : najbolji.vucic,
          vidjen: sada
        };
      }).concat(stari.filter(s => sada - s.vidjen < Math.max(600, trajanje * 1.5)));
      trajanje = trajanje * 0.7 + (performance.now() - t1) * 0.3;
      Usati.dbg('video: lica', nadjena.length, nadjena.map(l => l.dist === null ? 'lice' : l.dist.toFixed(2)).join(' '), Math.round(trajanje), 'ms');
    } catch (e) {
      // kadar nije citljiv (DRM i sl.)
    } finally {
      radi = false;
    }
  }

  function crtaj() {
    if (kanvas && ctx) {
      const rv = poravnaj();
      if (rv) {
        ctx.clearRect(0, 0, rv.width, rv.height);
        const m = aktivno() ? slikaUElementu(rv) : null;
        if (m) {
          const sada = Date.now();
          tragovi.forEach(t => {
            if (sada - t.vidjen > Math.max(900, trajanje * 2.5)) return;
            if (!cfg.allFaces && t.vucic < 0.5) return;
            // predvidjanje: najvise 0,6 s i najvise pola sirine lica, da usi ne odlete kad se kadar promijeni
            const proslo = Math.min(sada - t.vidjen, 600), gr = t.poza.sirina * 0.5;
            const px = Math.max(-gr, Math.min(gr, (t.vx || 0) * proslo));
            const py = Math.max(-gr, Math.min(gr, (t.vy || 0) * proslo));
            const p = { x: m.ox + (t.poza.x + px) * m.s, y: m.oy + (t.poza.y + py) * m.s, ugao: t.poza.ugao, sirina: t.poza.sirina * m.s };
            // glava uz gornju ivicu kadra: spusti usi da ostanu na glavi umjesto van slike
            const h = Usati.visinaUsiju(p, cfg.earScale);
            const vrh = p.y - h * 0.82;
            if (vrh < m.oy + 2) p.y += Math.min(m.oy + 2 - vrh, h * 0.6);
            Usati.nacrtaj(ctx, p, cfg.earScale, cfg.earTwitch);
          });
        }
      }
    }
    requestAnimationFrame(crtaj);
  }

  Usati.ucitajPodesavanja(items => { cfg = items; Usati.ucitajUsi(cfg.earType); });
  chrome.storage.onChanged.addListener(promjene => {
    for (const k in promjene) cfg[k] = promjene[k].newValue;
    Usati.ucitajUsi(cfg.earType);
    if ('allFaces' in promjene || 'filterKeywords' in promjene) tragovi = [];
  });

  setInterval(prikaci, 1000);
  setInterval(detekcija, 200);
  requestAnimationFrame(crtaj);
})();
