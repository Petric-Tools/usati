// Ušati - Popup Settings & Live Preview Controller
document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggleEnabled');
  const earButtons = document.querySelectorAll('.ear-btn');
  const earScale = document.getElementById('earScale');
  const toggleTwitch = document.getElementById('toggleTwitch');
  const toggleFilter = document.getElementById('toggleFilter');
  const previewEarsImg = document.getElementById('previewEarsImg');

  const assetMap = {
    donkey: '../assets/donkey_ears.svg',
    bunny: '../assets/bunny_ears.svg',
    shrek: '../assets/shrek_ears.svg',
    horns: '../assets/devil_horns.svg',
    dog: '../assets/dog_ears.svg'
  };

  let currentSettings = {
    enabled: true,
    earType: 'donkey',
    earScale: 1.35,
    earTwitch: true,
    filterKeywords: true,
    allFaces: false
  };

  // Load from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(currentSettings, (items) => {
      currentSettings = Object.assign(currentSettings, items);
      updateUI();
    });
  } else {
    updateUI();
  }

  function saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set(currentSettings);
    }
    updatePreview();
  }

  function updateUI() {
    toggleEnabled.checked = currentSettings.enabled;
    earScale.value = currentSettings.earScale;
    toggleTwitch.checked = currentSettings.earTwitch;
    toggleFilter.checked = currentSettings.filterKeywords;

    earButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === currentSettings.earType);
    });

    updatePreview();
  }

  function updatePreview() {
    previewEarsImg.src = assetMap[currentSettings.earType] || assetMap.donkey;
    const baseW = 95;
    const baseH = 60;
    const s = currentSettings.earScale / 1.35;
    previewEarsImg.style.width = (baseW * s) + 'px';
    previewEarsImg.style.height = (baseH * s) + 'px';
    previewEarsImg.style.top = (-26 - (s - 1) * 20) + 'px';
    previewEarsImg.style.opacity = currentSettings.enabled ? '1' : '0.25';
  }

  // Event Listeners
  toggleEnabled.addEventListener('change', (e) => {
    currentSettings.enabled = e.target.checked;
    saveSettings();
  });

  earButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      earButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSettings.earType = btn.dataset.type;
      saveSettings();
    });
  });

  earScale.addEventListener('input', (e) => {
    currentSettings.earScale = parseFloat(e.target.value);
    saveSettings();
  });

  toggleTwitch.addEventListener('change', (e) => {
    currentSettings.earTwitch = e.target.checked;
    saveSettings();
  });

  toggleFilter.addEventListener('change', (e) => {
    currentSettings.filterKeywords = e.target.checked;
    currentSettings.allFaces = !e.target.checked;
    saveSettings();
  });

  // Fun idle ear wiggle in preview
  setInterval(() => {
    if (currentSettings.earTwitch && currentSettings.enabled) {
      const rot = (Math.random() - 0.5) * 6;
      previewEarsImg.style.transform = `translateX(-50%) rotate(${rot}deg)`;
    } else {
      previewEarsImg.style.transform = 'translateX(-50%) rotate(0deg)';
    }
  }, 350);
});
