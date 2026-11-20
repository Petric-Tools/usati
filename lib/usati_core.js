// Ušati - zajednicko jezgro: ucitavanje modela, prepoznavanje lica i crtanje usiju.
// Sve se racuna lokalno u pregledacu (face-api.js, MIT). Nista se ne salje na mrezu.
const Usati = (() => {
  'use strict';

  // Udaljenost opisa lica do referentnog opisa ispod koje se lice smatra Vucicevim.
  // Mjereno na 47 lica iz 44 fotografije: njegova lica uglavnom 0,25-0,42; nagnuta glava ili sitna slicica do 0,51.
  const PRAG = 0.48;
  const PRAG2 = 0.53, RAZMAK2 = 0.08;

  const ASSETS = {
    donkey: 'assets/donkey_ears.svg',
    bunny: 'assets/bunny_ears.svg',
    ogre: 'assets/ogre_ears.svg',
    horns: 'assets/devil_horns.svg',
    dog: 'assets/dog_ears.svg'
  };

  const DEFAULTS = {
    enabled: true,
    earType: 'donkey',
    earScale: 1.35,
    earTwitch: true,
    filterKeywords: true,   // true = samo Vucic (prepoznavanje), false = sva lica
    allFaces: false,
    disabledSites: []
  };

  let spremno = null;
  const earImg = new Image();
  let earTip = null;
  const naUcitavanje = new Set();

  function ucitajUsi(tip) {
    const t = ASSETS[tip] ? tip : 'donkey';
    if (t === earTip) return;
    earTip = t;
    earImg.onload = () => naUcitavanje.forEach(fn => { try { fn(); } catch (e) { /* prazno */ } });
    earImg.src = chrome.runtime.getURL(ASSETS[t]);
  }

  function kadSeUsiUcitaju(fn) { naUcitavanje.add(fn); }

  function usiSpremne() { return earImg.complete && earImg.naturalWidth > 0; }

  function init() {
    if (spremno) return spremno;
    spremno = (async () => {
      const tf = faceapi.tf;
      // WASM pozadina se ne isporucuje: bez nje tf ne pokusava da je ucita
      try { tf.removeBackend('wasm'); } catch (e) { /* nema je */ }
      try { await tf.setBackend('webgl'); await tf.ready(); } catch (e) { /* nema WebGL-a */ }
      if (tf.getBackend() !== 'webgl') { await tf.setBackend('cpu'); await tf.ready(); }
      const baza = chrome.runtime.getURL('models');
      await faceapi.nets.tinyFaceDetector.loadFromUri(baza);
      await faceapi.nets.faceLandmark68Net.loadFromUri(baza);
      await faceapi.nets.faceRecognitionNet.loadFromUri(baza);
      return true;
    })();
    return spremno;
  }

  // Vrati lica sa tackama lica i, ako treba, procjenom da li je to Vucic.
  async function lica(ulaz, velicina, saIdentitetom, pragDetekcije) {
    const opcije = new faceapi.TinyFaceDetectorOptions({ inputSize: velicina, scoreThreshold: pragDetekcije || 0.45 });
    const upit = faceapi.detectAllFaces(ulaz, opcije).withFaceLandmarks();
    const rez = saIdentitetom ? await upit.withFaceDescriptors() : await upit;
    const lica = rez.map(r => {
      const dist = saIdentitetom ? faceapi.euclideanDistance(r.descriptor, USATI_VUCIC_REF) : null;
      return {
        box: r.detection.box,
        tacke: r.landmarks.positions.map(p => ({ x: p.x, y: p.y })),
        dist: dist,
        vucic: saIdentitetom ? dist < PRAG : false
      };
    });
    // Drugi stepen: sitno ili nagnuto lice zna da padne tik iznad praga (0,50-0,51 na Mondu, Informeru, GB).
    // Prihvata se samo najblize lice na slici, i samo kad je jasno odvojeno od svih ostalih.
    if (saIdentitetom && lica.length && !lica.some(l => l.vucic)) {
      const poredana = lica.slice().sort((a, b) => a.dist - b.dist);
      const prvo = poredana[0], drugo = poredana[1];
      if (prvo.dist < PRAG2 && (!drugo || drugo.dist >= prvo.dist + RAZMAK2)) prvo.vucic = true;
    }
    return lica;
  }

  function prosjek(tacke, od, doo) {
    let x = 0, y = 0;
    for (let i = od; i <= doo; i++) { x += tacke[i].x; y += tacke[i].y; }
    const n = doo - od + 1;
    return { x: x / n, y: y / n };
  }

  // Polozaj usiju iz 68 tacaka lica: vrh glave, nagib i sirina lica.
  function poza(lice) {
    const t = lice.tacke;
    const lo = prosjek(t, 36, 41), ro = prosjek(t, 42, 47);
    const ugao = Math.atan2(ro.y - lo.y, ro.x - lo.x);
    const sredOci = { x: (lo.x + ro.x) / 2, y: (lo.y + ro.y) / 2 };
    const brada = t[8];
    const visina = Math.hypot(brada.x - sredOci.x, brada.y - sredOci.y);
    const sirina = Math.hypot(t[16].x - t[0].x, t[16].y - t[0].y);
    const gore = { x: Math.sin(ugao), y: -Math.cos(ugao) };
    const k = visina * 0.95;
    return { x: sredOci.x + gore.x * k, y: sredOci.y + gore.y * k, ugao: ugao, sirina: sirina };
  }

  // Nacrtaj usi: p su koordinate u prostoru kanvasa.
  function nacrtaj(ctx, p, skala, mrdanje) {
    if (!usiSpremne()) return;
    const w = p.sirina * skala;
    const h = w * 0.6;
    let ugao = p.ugao;
    if (mrdanje) ugao += Math.sin(Date.now() / 200) * 0.04;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ugao);
    ctx.drawImage(earImg, -w / 2, -h + h * 0.18, w, h);
    ctx.restore();
  }

  function visinaUsiju(p, skala) { return p.sirina * skala * 0.6; }

  function ucitajPodesavanja(cb) {
    if (typeof chrome === 'undefined' || !chrome.storage) { cb(Object.assign({}, DEFAULTS)); return; }
    chrome.storage.sync.get(DEFAULTS, items => cb(Object.assign({}, DEFAULTS, items)));
  }

  function sajtIskljucen(cfg) {
    return Array.isArray(cfg.disabledSites) && cfg.disabledSites.includes(location.hostname);
  }

  // Popup pita sadrzajnu skriptu za ime sajta (bez dozvole "tabs").
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((poruka, posiljalac, odgovor) => {
      if (poruka && poruka.type === 'usati-host') { odgovor({ host: location.hostname }); }
    });
  }

  function dbg(...a) { try { if (localStorage.getItem('usatiDebug')) console.warn('[Ušati]', ...a); } catch (e) { /* prazno */ } }

  return { dbg, init, lica, poza, nacrtaj, visinaUsiju, ucitajUsi, kadSeUsiUcitaju, usiSpremne,
           ucitajPodesavanja, sajtIskljucen, DEFAULTS, PRAG };
})();
