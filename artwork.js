/* Deterministic production artwork wiring with graceful image-error fallbacks. */
(() => {
  const ROOT = new URL('.', document.baseURI);
  const ART = {
    ep1: 'assets/ep01-beginning.jpg',
    ep2: 'assets/ep02-eden.jpg',
    ep3: 'assets/ep03-serpent.jpg',
    ep4: 'assets/ep04-east-of-eden.jpg',
    ep5: 'assets/ep05-adams-story.jpg',
    ep6: 'assets/ep06-noah.jpg',
    ep7: 'assets/ep07-deluge.jpg',
    ep8: 'assets/ep08-bow.jpg',
    ep9: 'assets/ep09-babel.jpg',
    ep10: 'assets/ep10-abraham.jpg',
  };

  const HOME_ART = {
    '.hero-home': 'assets/hero-origins.jpg',
    '.map-feature': 'assets/explore-geography.jpg',
    '.timeline-feature': 'assets/ep07-deluge.jpg',
    '.journey-feature': 'assets/study-reflect.jpg',
    '.season-card': 'assets/ep01-beginning.jpg',
    '.quote-card': 'assets/study-reflect.jpg',
    '.scene-card': 'assets/explore-geography.jpg',
  };

  const MISSING = new Set([
    'assets/ep05-adams-story.jpg',
    'assets/ep06-noah.jpg',
    'assets/ep07-deluge.jpg',
    'assets/ep08-bow.jpg',
    'assets/ep09-babel.jpg',
    'assets/ep10-abraham.jpg',
    'assets/study-reflect.jpg',
  ]);

  const OVERLAYS = {
    '.season-card': 'linear-gradient(90deg,rgba(4,10,16,.84),rgba(4,10,16,.28))',
    '.quote-card': 'linear-gradient(rgba(3,8,13,.58),rgba(3,8,13,.78))',
    '.scene-card': 'linear-gradient(rgba(3,8,13,.15),rgba(3,8,13,.45))',
  };

  const FALLBACKS = [
    'linear-gradient(145deg,#1a2b37,#80683f)',
    'linear-gradient(145deg,#1e3840,#8b6a3d)',
    'linear-gradient(145deg,#241e25,#8e5739)',
    'linear-gradient(145deg,#263c43,#6e5035)',
    'linear-gradient(145deg,#1c2934,#5b4739)',
    'linear-gradient(145deg,#152a36,#8a6c47)',
  ];

  const LIGHT_FALLBACKS = [
    'linear-gradient(145deg,#dfe6e5,#b99a68)',
    'linear-gradient(145deg,#dce7e6,#c0a06b)',
    'linear-gradient(145deg,#e5dedb,#bd8866)',
    'linear-gradient(145deg,#dce5e3,#b59b78)',
    'linear-gradient(145deg,#e1e5e5,#ad9a84)',
    'linear-gradient(145deg,#dbe5e7,#bda47b)',
  ];

  const urlFor = asset => new URL(asset, ROOT).href;
  const fallbackFor = node => {
    const palette = document.documentElement.dataset.theme === 'light' ? LIGHT_FALLBACKS : FALLBACKS;
    return palette[Math.max(0, (Number(node?.dataset?.artFallback) || 1) - 1) % palette.length];
  };
  const overlayFor = node => Object.entries(OVERLAYS).find(([selector]) => node.matches(selector))?.[1] || '';

  const clearArt = node => {
    node.classList.remove('art-loaded');
    node.classList.add('art-fallback');
    const layers = [overlayFor(node), fallbackFor(node)].filter(Boolean);
    node.style.setProperty('background-image', layers.join(', '), 'important');
    node.dataset.artworkLoaded = 'false';
  };

  const paint = (node, asset) => {
    if (!node || !asset || node.dataset.artworkAttempted === 'true') return;
    node.dataset.artworkAttempted = 'true';
    clearArt(node);

    if (MISSING.has(asset)) return;

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!node.isConnected) return;
      const url = urlFor(asset);
      const layers = [overlayFor(node), `url("${url}")`].filter(Boolean);
      node.style.setProperty('background-image', layers.join(', '), 'important');
      node.classList.remove('art-fallback');
      node.classList.add('art-loaded');
      node.dataset.artwork = asset;
      node.dataset.artworkLoaded = 'true';
    };
    image.onerror = () => {
      node.dataset.artwork = asset;
      clearArt(node);
    };
    image.src = urlFor(asset);
  };

  const applyCardArt = () => {
    document.querySelectorAll('.episode-card[data-episode] .episode-art').forEach(node => {
      const episodeId = node.closest('.episode-card')?.dataset.episode;
      paint(node, ART[episodeId]);
    });
  };

  const applyHomeArt = () => {
    Object.entries(HOME_ART).forEach(([selector, asset]) => {
      document.querySelectorAll(selector).forEach(node => paint(node, asset));
    });
  };

  const applyReaderArt = () => {
    document.querySelectorAll('.reader-head[data-art]').forEach(node => paint(node, node.dataset.art));
  };

  const applyAll = () => {
    applyCardArt();
    applyHomeArt();
    applyReaderArt();
  };

  let scheduled = false;
  const scheduleApply = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyAll();
    });
  };

  new MutationObserver(scheduleApply).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', applyAll);
  window.addEventListener('be:themechange', applyAll);
  applyAll();
})();
