// Ušati - portali: trazi Vuciceve fotografije i na njih stavlja usi.
(function () {
  'use strict';

  let cfg = Object.assign({}, Usati.DEFAULTS);
  const obradjene = new WeakMap();   // img -> src koji je obradjen
  const prekrivaci = new Map();      // img -> { canvas, lica, w, h }

  // Pominjanje Vucica kao cijele rijeci: Vučić, Vučića, Vučiću, Vučićem (latinica, cirilica, bez kvacica).
  // Ne pogadja Vučićević, vučica i slicno.
  const POMEN = /(^|[^\p{L}])(vu[čc]i[ćc](a|u|em)?|вучић(а|у|ем)?)(?!\p{L})/iu;
  const FUNKCIJA = /(predsednik|predsjednik|председник)[a-zа-я]*\s+(srbije|србије)/iu;

  function pominjeVucica(img) {
    const dijelovi = [
      img.alt || '', img.title || '',
      img.closest('figure') ? img.closest('figure').innerText : '',
      img.closest('a') ? (img.closest('a').innerText || img.closest('a').title || '') : '',
      img.parentElement ? img.parentElement.innerText : ''
    ];
    const clanak = img.closest('article, .post, .card, li, .item, .news, .story');
    if (clanak) {
      const n = clanak.querySelector('h1, h2, h3, h4');
      if (n) dijelovi.push(n.innerText);
    }
    // Glavna fotografija clanka: naslov stranice
    const r = img.getBoundingClientRect();
    if (r.width > 450) dijelovi.push(document.title);
    const tekst = dijelovi.join(' \n ');
    return POMEN.test(tekst) || FUNKCIJA.test(tekst);
  }

  function kandidat(img) {
    if (!img.complete || img.naturalWidth < 120 || img.naturalHeight < 90) return false;
    const r = img.getBoundingClientRect();
    if (r.width < 100 || r.height < 70) return false;
    return cfg.allFaces || pominjeVucica(img);
  }

  // Slika sa drugog domena "zaprlja" kanvas. Tada je ucitavamo preko pozadinske skripte.
  function citljiva(img) {
    try {
      const c = document.createElement('canvas'); c.width = 2; c.height = 2;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 2, 2); x.getImageData(0, 0, 1, 1);
      return true;
    } catch (e) { return false; }
  }

  function preuzmi(src) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ type: 'usati-fetch', url: src }, odg => {
          if (chrome.runtime.lastError || !odg || !odg.dataUrl) { resolve(null); return; }
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = () => resolve(null);
          im.src = odg.dataUrl;
        });
      } catch (e) { resolve(null); }
    });
  }

  let red = Promise.resolve();
  function obradi(img) {
    if (!cfg.enabled || Usati.sajtIskljucen(cfg)) return;
    const src = img.currentSrc || img.src;
    if (!src || obradjene.get(img) === src) return;
    if (!kandidat(img)) return;
    Usati.dbg('kandidat', src.slice(0, 90));
    obradjene.set(img, src);
    // jedna po jedna slika, da stranica ostane brza
    red = red.then(() => analiziraj(img, src)).catch(() => {});
  }

  async function analiziraj(img, src) {
    const t0 = performance.now();
    await Usati.init();
    Usati.dbg('modeli spremni za', Math.round(performance.now() - t0), 'ms, pozadina', faceapi.tf.getBackend());
    let ulaz = img;
    if (!citljiva(img)) {
      ulaz = await preuzmi(src);
      if (!ulaz) { Usati.dbg('nije procitana', src.slice(0, 90)); return; }
    }
    const w = ulaz.naturalWidth, h = ulaz.naturalHeight;
    const velicina = Math.max(w, h) > 900 ? 608 : 416;
    let nadjena = await Usati.lica(ulaz, velicina, !cfg.allFaces);
    // na malim slicicama (150 px) detektor zna da ne vidi lice; identitet i dalje cuva prag prepoznavanja
    if (nadjena.length === 0 && Math.max(w, h) <= 400) nadjena = await Usati.lica(ulaz, 608, !cfg.allFaces, 0.3);
    const zaUsi = cfg.allFaces ? nadjena : nadjena.filter(l => l.vucic);
    Usati.dbg('slika', src.slice(0, 90), ulaz === img ? 'direktno' : 'preko pozadine', nadjena.map(l => l.dist === null ? 'lice' : l.dist.toFixed(2)).join(' '));
    if ((img.currentSrc || img.src) !== src) return;
    if (zaUsi.length === 0) { ukloni(img); return; }
    postavi(img, zaUsi.map(Usati.poza), w, h);
  }

  function postavi(img, poze, w, h) {
    let p = prekrivaci.get(img);
    if (!p) {
      const c = document.createElement('canvas');
      c.className = 'usati-ear-overlay';
      c.style.cssText = 'position:absolute;pointer-events:none;z-index:10;margin:0;padding:0;border:0;max-width:none;max-height:none;';
      p = { canvas: c };
      prekrivaci.set(img, p);
      if (window.ResizeObserver) new ResizeObserver(() => crtaj(img)).observe(img);
    }
    Object.assign(p, { poze, w, h, kljuc: '' });
    crtaj(img);
  }

  function ukloni(img) {
    const p = prekrivaci.get(img);
    if (p) { p.canvas.remove(); prekrivaci.delete(img); }
  }

  // Kanvas prati sliku; iznad slike ostavlja mjesto za usi da ne budu odsjecene.
  function crtaj(img) {
    const p = prekrivaci.get(img);
    if (!p) return;
    if (!img.isConnected) { ukloni(img); return; }
    const r = img.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { p.canvas.style.display = 'none'; return; }
    // object-fit: cover/contain mijenja kako se slika smjesta u okvir
    const fit = getComputedStyle(img).objectFit;
    let sx = r.width / p.w, sy = r.height / p.h, ox = 0, oy = 0;
    if (fit === 'cover' || fit === 'contain') {
      const s = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
      ox = (r.width - p.w * s) / 2; oy = (r.height - p.h * s) / 2; sx = sy = s;
    }
    const kont = img.offsetParent || document.body;
    // koliko mjesta iznad slike stvarno ima prije nego sto ga kontejner sa overflow odsijece
    const mjesta = Math.max(0, r.top - granicaOdsijecanja(kont));
    const poze = p.poze.map(q => {
      const n = { x: q.x * sx + ox, y: q.y * sy + oy, ugao: q.ugao, sirina: q.sirina * sx };
      const h = Usati.visinaUsiju(n, cfg.earScale);
      const vrh = n.y - h * 0.82;
      if (vrh < 2 - mjesta) n.y += Math.min(2 - mjesta - vrh, h * 0.6);
      return n;
    });
    const gore = Math.min(Math.ceil(mjesta), Math.ceil(Math.max(0, ...poze.map(q => Usati.visinaUsiju(q, cfg.earScale) - q.y)) + 4));
    const kljuc = [r.left, r.top, r.width, r.height, window.scrollX, window.scrollY, gore, cfg.earType, cfg.earScale, Usati.usiSpremne()].join(',');
    if (kljuc === p.kljuc) return;
    p.kljuc = kljuc;
    const c = p.canvas;
    // kanvas ide u isti kontejner kao slika, da ga omotaci sa z-indexom ne prekriju
    if (c.parentElement !== kont) kont.appendChild(c);
    let baseX = window.scrollX, baseY = window.scrollY;
    if (kont !== document.body && kont !== document.documentElement) {
      const rk = kont.getBoundingClientRect();
      baseX = -rk.left - kont.clientLeft + kont.scrollLeft;
      baseY = -rk.top - kont.clientTop + kont.scrollTop;
    }
    const dpr = window.devicePixelRatio || 1;
    c.style.display = 'block';
    c.style.left = (r.left + baseX) + 'px';
    c.style.top = (r.top + baseY - gore) + 'px';
    c.style.width = r.width + 'px';
    c.style.height = (r.height + gore) + 'px';
    c.width = Math.round(r.width * dpr);
    c.height = Math.round((r.height + gore) * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height + gore);
    // usi ne smiju preci lijevu i desnu ivicu slike
    ctx.beginPath(); ctx.rect(0, 0, r.width, r.height + gore); ctx.clip();
    poze.forEach(q => Usati.nacrtaj(ctx, { x: q.x, y: q.y + gore, ugao: q.ugao, sirina: q.sirina }, cfg.earScale, false));
    try { if (localStorage.getItem('usatiDebug')) { Usati.dbg('crtam', poze.length, 'usi spremne', Usati.usiSpremne(), JSON.stringify(poze.map(q => [Math.round(q.x), Math.round(q.y), Math.round(q.sirina)]))); } } catch (e) { /* prazno */ }
  }

  // Gornja ivica najnizeg pretka (od kontejnera navise) koji odsijeca sadrzaj; kanvas je dijete kontejnera.
  function granicaOdsijecanja(kont) {
    let g = -Infinity;
    for (let e = kont; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowY !== 'visible' || s.overflowX !== 'visible') g = Math.max(g, e.getBoundingClientRect().top);
    }
    return g;
  }

  function crtajSve() { prekrivaci.forEach((_, img) => crtaj(img)); }

  function skeniraj() {
    if (!cfg.enabled || Usati.sajtIskljucen(cfg)) return;
    document.querySelectorAll('img').forEach(img => {
      if (img.complete) obradi(img);
      else img.addEventListener('load', () => obradi(img), { once: true });
    });
  }

  function ocisti() {
    prekrivaci.forEach((p) => p.canvas.remove());
    prekrivaci.clear();
  }

  let tajmer = null;
  function skenirajKasnije() {
    if (tajmer) return;
    tajmer = setTimeout(() => { tajmer = null; skeniraj(); }, 400);
  }

  Usati.kadSeUsiUcitaju(() => { prekrivaci.forEach(p => { p.kljuc = ''; }); crtajSve(); });

  Usati.ucitajPodesavanja(items => {
    cfg = items;
    Usati.ucitajUsi(cfg.earType);
    skeniraj();
  });

  chrome.storage.onChanged.addListener(promjene => {
    for (const k in promjene) cfg[k] = promjene[k].newValue;
    Usati.ucitajUsi(cfg.earType);
    if (!cfg.enabled || Usati.sajtIskljucen(cfg)) { ocisti(); return; }
    if ('allFaces' in promjene || 'filterKeywords' in promjene || 'enabled' in promjene || 'disabledSites' in promjene) {
      ocisti();
      document.querySelectorAll('img').forEach(img => obradjene.delete(img));
      skeniraj();
    } else {
      prekrivaci.forEach(p => { p.kljuc = ''; });
      crtajSve();
    }
  });

  // nove vijesti pri skrolovanju, lijeno ucitane slike i promjene rasporeda
  new MutationObserver(skenirajKasnije).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  document.addEventListener('load', e => { if (e.target && e.target.tagName === 'IMG') obradi(e.target); }, true);
  window.addEventListener('resize', crtajSve);
  window.addEventListener('scroll', skenirajKasnije, { passive: true });
  setInterval(crtajSve, 1000);
  // Karusel zna da otkrije skriveni slajd promjenom klase, bez promjene adrese slike i bez skrola, pa ga ni
  // posmatrac ni skrol ne vide (Alo). Zato se povremeno i poslije svakog prelaza traze slike tek usle u kadar.
  ['transitionend', 'animationend'].forEach(t => document.addEventListener(t, skenirajKasnije, true));
  setInterval(skeniraj, 3000);
})();
