/* Production artwork runtime. The local repository assets are the source of truth. */
const ART_VERSION = '11';
const ART = {
  hero: `assets/hero-origins-production.webp?v=${ART_VERSION}`,
  map: `assets/map-exodus.webp?v=10`,
  library: `assets/library-manuscript.webp?v=10`,
  episodes: [
    `assets/ep1-beginning.webp?v=10`, `assets/ep2-eden.webp?v=10`, `assets/ep3-serpent-seed.webp?v=10`,
    `assets/ep4-east-eden.webp?v=10`, `assets/ep5-adam-story.webp?v=10`, `assets/ep6-noah.webp?v=10`,
    `assets/ep7-deluge.webp?v=10`, `assets/ep8-bow.webp?v=10`, `assets/ep9-babel.webp?v=10`, `assets/ep10-abraham.webp?v=10`
  ]
};

function applyArt(node, src) {
  if (!node || node.dataset.artSource === src) return;
  node.dataset.artSource = src;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    node.style.setProperty('--production-art', `url("${src}")`);
    node.classList.remove('art-missing');
    node.classList.add('art-ready');
  };
  image.onerror = () => node.classList.add('art-missing');
  image.src = src;
}

function decorate(root = document) {
  applyArt(root.querySelector('.hero-home'), ART.hero);
  applyArt(root.querySelector('.season-card'), ART.hero);
  applyArt(root.querySelector('.map-feature'), ART.map);
  applyArt(root.querySelector('.timeline-feature'), ART.hero);
  applyArt(root.querySelector('.journey-feature'), ART.library);
  applyArt(root.querySelector('.quote-card'), ART.library);
  applyArt(root.querySelector('.scene-card'), ART.map);

  root.querySelectorAll('.episode-card').forEach((card, index) => applyArt(card.querySelector('.episode-art'), ART.episodes[index]));

  const reader = root.querySelector('.reader-head');
  if (reader) {
    const title = reader.querySelector('h1')?.textContent?.toLowerCase() || '';
    const index = ['beginning','eden','serpent','east of eden','adam','noah','deluge','bow','babel','abraham']
      .findIndex(key => title.includes(key));
    if (index >= 0) applyArt(reader, ART.episodes[index]);
  }
}

function startArtworkRuntime() {
  const app = document.querySelector('#app');
  if (!app) return;
  decorate(app);
  new MutationObserver(() => decorate(app)).observe(app, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startArtworkRuntime, { once: true });
else startArtworkRuntime();
