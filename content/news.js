// Ušati - News Portals Image Scanner & Funny Ears Stamper
(function () {
  'use strict';

  let config = {
    enabled: true,
    earType: 'donkey',
    earScale: 1.35,
    filterKeywords: true, // Only if Vučić mentioned
    allFaces: false
  };

  const VUCIC_KEYWORDS = [
    'vucic', 'vučić', 'вучић',
    'vucica', 'vučića', 'вучића',
    'vucicu', 'vučiću', 'вучићу',
    'predsednik srbije', 'председник србије',
    'predsednik aleksandar', 'aleksandar vucic'
  ];

  let classifier = null;
  const processedImages = new WeakSet();
  let earImage = new Image();

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(config, (items) => {
      config = Object.assign(config, items);
      loadEarAsset();
      scanPage();
    });

    chrome.storage.onChanged.addListener((changes) => {
      for (let k in changes) config[k] = changes[k].newValue;
      loadEarAsset();
      // Reprocess
      document.querySelectorAll('.usati-ear-overlay').forEach(el => el.remove());
      scanPage();
    });
  } else {
    loadEarAsset();
    scanPage();
  }

  function loadEarAsset() {
    const assetMap = {
      donkey: 'assets/donkey_ears.svg',
      bunny: 'assets/bunny_ears.svg',
      shrek: 'assets/shrek_ears.svg',
      horns: 'assets/devil_horns.svg',
      dog: 'assets/dog_ears.svg'
    };
    const file = assetMap[config.earType] || assetMap.donkey;
    earImage.src = chrome.runtime.getURL(file);
  }

  function isVucicRelated(img) {
    if (config.allFaces) return true;

    const textToSearch = [
      img.alt || '',
      img.title || '',
      img.src || '',
      img.closest('figure')?.innerText || '',
      img.closest('article')?.querySelector('h1, h2, h3, a')?.innerText || '',
      img.parentElement?.innerText || ''
    ].join(' ').toLowerCase();

    return VUCIC_KEYWORDS.some(kw => textToSearch.includes(kw));
  }

  function rgbaToGrayscale(rgba, nrows, ncols) {
    const gray = new Uint8Array(nrows * ncols);
    for (let r = 0; r < nrows; ++r) {
      for (let c = 0; c < ncols; ++c) {
        const idx = r * 4 * ncols + 4 * c;
        gray[r * ncols + c] = (2 * rgba[idx] + 7 * rgba[idx + 1] + 1 * rgba[idx + 2]) / 10;
      }
    }
    return gray;
  }

  function processImage(img) {
    if (!config.enabled || processedImages.has(img)) return;
    if (!img.complete || img.naturalWidth < 80 || img.naturalHeight < 80) return;

    if (!isVucicRelated(img)) return;
    processedImages.add(img);

    // Create offscreen canvas to detect faces
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const w = Math.min(480, img.naturalWidth);
    const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
    c.width = w;
    c.height = h;

    try {
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const gray = rgbaToGrayscale(imgData.data, h, w);

      const image = { pixels: gray, nrows: h, ncols: w, ldim: w };
      const params = { shiftfactor: 0.1, minsize: 35, maxsize: 300, scalefactor: 1.15 };

      let dets = pico.run_cascade(image, classifier, params);
      dets = pico.cluster_detections(dets, 0.2);

      // Filter faces
      const validFaces = dets.filter(d => d[3] > 30.0);
      if (validFaces.length === 0) return;

      console.log(`[Ušati] Found ${validFaces.length} face(s) in Vučić photo on news portal!`);

      // Attach overlay canvas on top of image
      overlayEarsOnImage(img, validFaces, w, h);
    } catch (e) {
      // Cross-origin image taint fallback
    }
  }

  function overlayEarsOnImage(img, faces, procW, procH) {
    const parent = img.parentElement;
    if (!parent) return;

    // Ensure parent allows absolute positioning
    const parentPos = window.getComputedStyle(parent).position;
    if (parentPos === 'static') {
      parent.style.position = 'relative';
    }

    const overlay = document.createElement('canvas');
    overlay.className = 'usati-ear-overlay';
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '15';

    function alignOverlay() {
      overlay.style.top = img.offsetTop + 'px';
      overlay.style.left = img.offsetLeft + 'px';
      overlay.width = img.clientWidth;
      overlay.height = img.clientHeight;

      const oCtx = overlay.getContext('2d');
      oCtx.clearRect(0, 0, overlay.width, overlay.height);

      const scaleX = overlay.width / procW;
      const scaleY = overlay.height / procH;

      faces.forEach(face => {
        const x = face[1] * scaleX;
        const y = face[0] * scaleY;
        const size = face[2] * scaleX;

        const earW = size * config.earScale;
        const earH = earW * 0.6; // 400x240
        const earX = x - earW / 2;
        const earY = y - size * 0.46 - earH;

        if (earImage.complete) {
          oCtx.drawImage(earImage, earX, earY, earW, earH);
        }
      });
    }

    alignOverlay();
    parent.appendChild(overlay);

    // Re-align on resize
    window.addEventListener('resize', alignOverlay);
  }

  function scanPage() {
    if (!classifier && typeof getPicoClassifier === 'function') {
      classifier = getPicoClassifier();
    }
    if (!classifier) return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        processImage(img);
      } else {
        img.addEventListener('load', () => processImage(img), { once: true });
      }
    });
  }

  // MutationObserver for dynamic infinite scroll
  const observer = new MutationObserver((mutations) => {
    let hasNewImgs = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        hasNewImgs = true;
        break;
      }
    }
    if (hasNewImgs) scanPage();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPage);
  } else {
    scanPage();
  }

  console.log('[Ušati] News portal scanner active!');
})();
