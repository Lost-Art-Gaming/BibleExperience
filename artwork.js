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

  const FALLBACKS = [
    'linear-gradient(145deg,#1a2b37,#80683f)',
    'linear-gradient(145deg,#1e3840,#8b6a3d)',
    'linear-gradient(145deg,#241e25,#8e5739)',
    'linear-gradient(145deg,#263c43,#6e5035)',
    'linear-gradient(145deg,#1c2934,#5b4739)',
    'linear-gradient(145deg,#152a36,#8a6c47)',
  ];

  const urlFor = asset => new URL(asset, ROOT).href;
  const fallbackFor = node => FALLBACKS[Math.max(0, (Number(node?.dataset?.artFallback) || 1) - 1) % FALLBACKS.length];

  const clearArt = node => {
    node.classList.remove('art-loaded');
    node.classList.add('art-fallback');
    node.style.setProperty('background-image', fallbackFor(node), 'important');
    node.dataset.artworkLoaded = 'false';
  };

  const paint = (node, asset) => {
    if (!node || !asset) return;
    if (node.dataset.artwork === asset && node.dataset.artworkLoaded === 'true') return;
    const url = urlFor(asset);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      node.classList.remove('art-fallback');
      node.classList.add('art-loaded');
      node.style.setProperty('background-image', `url("${url}")`, 'important');
      node.dataset.artwork = asset;
      node.dataset.artworkLoaded = 'true';
    };
    image.onerror = () => {
      node.dataset.artwork = asset;
      clearArt(node);
    };
    image.src = url;
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
    const head = document.querySelector('.reader-head[data-art]');
    if (!head) return;
    paint(head, head.dataset.art);
  };

  const applyAll = () => {
    applyCardArt();
    applyHomeArt();
    applyReaderArt();
  };

  new MutationObserver(applyAll).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', applyAll);
  applyAll();
})();
