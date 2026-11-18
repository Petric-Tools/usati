// Ušati - YouTube Real-Time Face Tracking & Ear Overlay
(function () {
  'use strict';

  let config = {
    enabled: true,
    earType: 'donkey', // donkey, bunny, ogre, horns, dog
    earScale: 1.35,
    earTwitch: true,
    triggerMode: 'always', // always, vucic_only
    soundMute: false
  };

  let classifier = null;
  let canvas = null;
  let ctx = null;
  let offCanvas = null;
  let offCtx = null;
  let videoEl = null;
  let isRunning = false;
  let smoothedFace = null;
  let earImage = new Image();
  let detectionInterval = null;

  // Load saved config
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(config, (items) => {
      config = Object.assign(config, items);
      loadEarAsset();
    });

    chrome.storage.onChanged.addListener((changes) => {
      for (let key in changes) {
        config[key] = changes[key].newValue;
      }
      loadEarAsset();
    });
  } else {
    loadEarAsset();
  }

  function loadEarAsset() {
    const assetMap = {
      donkey: 'assets/donkey_ears.svg',
      bunny: 'assets/bunny_ears.svg',
      ogre: 'assets/ogre_ears.svg',
      horns: 'assets/devil_horns.svg',
      dog: 'assets/dog_ears.svg'
    };
    const file = assetMap[config.earType] || assetMap.donkey;
    earImage.src = chrome.runtime.getURL(file);
  }

  // Initialize Classifier
  function initClassifier() {
    if (typeof getPicoClassifier === 'function') {
      try {
        classifier = getPicoClassifier();
        console.log('[Ušati] Pico cascade classifier loaded successfully');
      } catch (e) {
        console.error('[Ušati] Error initializing cascade:', e);
      }
    }
  }

  function setupCanvas(video) {
    const container = video.closest('.html5-video-player') || video.parentElement;
    if (!container) return;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'usati-overlay-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '40';
      container.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }

    if (!offCanvas) {
      offCanvas = document.createElement('canvas');
      offCtx = offCanvas.getContext('2d');
    }

    syncCanvasSize();
  }

  function syncCanvasSize() {
    if (!canvas || !videoEl) return;
    const rect = videoEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
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

  // Downscaled detection loop (runs ~12 times a sec for minimal CPU footprint)
  function runFaceDetection() {
    if (!config.enabled || !videoEl || videoEl.paused || videoEl.ended || !classifier) {
      return;
    }

    // Downscale target for fast processing
    const dw = 320;
    const dh = Math.round(dw * (videoEl.videoHeight / (videoEl.videoWidth || 1)) || 180);
    offCanvas.width = dw;
    offCanvas.height = dh;

    try {
      offCtx.drawImage(videoEl, 0, 0, dw, dh);
      const imgData = offCtx.getImageData(0, 0, dw, dh);
      const gray = rgbaToGrayscale(imgData.data, dh, dw);

      const image = {
        pixels: gray,
        nrows: dh,
        ncols: dw,
        ldim: dw
      };

      const params = {
        shiftfactor: 0.1,
        minsize: 30,
        maxsize: 260,
        scalefactor: 1.15
      };

      let dets = pico.run_cascade(image, classifier, params);
      dets = pico.cluster_detections(dets, 0.2);

      // Filter strong detections
      const validDets = dets.filter(d => d[3] > 25.0);

      if (validDets.length > 0) {
        // Pick largest / most prominent face
        validDets.sort((a, b) => b[2] - a[2]);
        const best = validDets[0]; // [r, c, s, q]

        const scaleX = canvas.width / dw;
        const scaleY = canvas.height / dh;

        const targetFace = {
          x: best[1] * scaleX,
          y: best[0] * scaleY,
          size: best[2] * scaleX,
          seen: Date.now()
        };

        // Smooth with EMA
        if (!smoothedFace) {
          smoothedFace = Object.assign({}, targetFace);
        } else {
          const alpha = 0.35;
          smoothedFace.x = smoothedFace.x * (1 - alpha) + targetFace.x * alpha;
          smoothedFace.y = smoothedFace.y * (1 - alpha) + targetFace.y * alpha;
          smoothedFace.size = smoothedFace.size * (1 - alpha) + targetFace.size * alpha;
          smoothedFace.seen = Date.now();
        }
      }
    } catch (e) {
      // Ignore frame draw errors on tainted canvas or DRM
    }
  }

  // Smooth 60 FPS Render loop
  function renderLoop() {
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (config.enabled && smoothedFace && (Date.now() - smoothedFace.seen < 800)) {
        const { x, y, size } = smoothedFace;
        const earW = size * config.earScale;
        const earH = earW * 0.6; // 400x240 aspect ratio

        // Calculate twitch / wiggle
        let twitchAngle = 0;
        if (config.earTwitch) {
          twitchAngle = Math.sin(Date.now() / 200) * 0.04;
        }

        // Draw centered above head
        const earX = x;
        const earY = y - size * 0.46;

        ctx.save();
        ctx.translate(earX, earY);
        ctx.rotate(twitchAngle);

        if (earImage.complete && earImage.naturalWidth > 0) {
          ctx.drawImage(earImage, -earW / 2, -earH, earW, earH);
        }
        ctx.restore();
      }
    }

    requestAnimationFrame(renderLoop);
  }

  function attachToVideo() {
    const video = document.querySelector('video.video-stream, video');
    if (video && video !== videoEl) {
      videoEl = video;
      setupCanvas(videoEl);
      window.addEventListener('resize', syncCanvasSize);

      if (!detectionInterval) {
        detectionInterval = setInterval(runFaceDetection, 70); // ~14 fps detection
      }
    }
  }

  // Start polling for YouTube video element
  initClassifier();
  setInterval(attachToVideo, 1000);
  requestAnimationFrame(renderLoop);

  console.log('[Ušati] YouTube funny ears engine initialized!');
})();
