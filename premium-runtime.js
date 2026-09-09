/* Premium artwork runtime: makes local generated WebP art the rendered source of truth. */
const ART_VERSION = '8';
const ART = {
  hero: `assets/hero-origins.webp?v=${ART_VERSION}`,
  map: `assets/map-exodus.webp?v=${ART_VERSION}`,
  library: `assets/library-manuscript.webp?v=${ART_VERSION}`,
  episodes: [
    `assets/ep1-beginning.webp?v=${ART_VERSION}`,
    `assets/ep2-eden.webp?v=${ART_VERSION}`,
    `assets/ep3-serpent-seed.webp?v=${ART_VERSION}`,
    `assets/ep4-east-eden.webp?v=${ART_VERSION}`,
    `assets/ep5-adam-story.webp?v=${ART_VERSION}`,
    `assets/ep6-noah.webp?v=${ART_VERSION}`,
    `assets/ep7-deluge.webp?v=${ART_VERSION}`,
    `assets/ep8-bow.webp?v=${ART_VERSION}`,
    `assets/ep9-babel.webp?v=${ART_VERSION}`,
    `assets/ep10-abraham.webp?v=${ART_VERSION}`,
  ]
};

const setBackground = (node, src) => {
  if (!node || node.dataset.artReady === src) return;
  node.dataset.artReady = src;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    node.style.setProperty('--production-art', `url("${src}")`);
    node.classList.add('art-ready');
  };
  image.onerror = () => node.classList.add('art-missing');
  image.src = src;
};

function decorate(root = document) {
  const hero = root.querySelector('.hero-home');
  setBackground(hero, ART.hero);

  root.querySelectorAll('.episode-card').forEach((card, index) => {
    const art = card.querySelector('.episode-art');
    setBackground(art, ART.episodes[index]);
  });

  setBackground(root.querySelector('.season-card'), ART.hero);
  setBackground(root.querySelector('.map-feature'), ART.map);
  setBackground(root.querySelector('.timeline-feature'), ART.hero);
  setBackground(root.querySelector('.journey-feature'), ART.library);
  setBackground(root.querySelector('.quote-card'), ART.library);
  setBackground(root.querySelector('.scene-card'), ART.map);

  const reader = root.querySelector('.reader-head');
  if (reader) {
    const title = reader.querySelector('h1')?.textContent?.toLowerCase() || '';
    const index = [
      'beginning', 'eden', 'serpent', 'east of eden', 'adam', 'noah',
      'deluge', 'bow', 'babel', 'abraham'
    ].findIndex(key => title.includes(key));
    if (index >= 0) setBackground(reader, ART.episodes[index]);
  }
}

function startArtworkRuntime() {
  decorate();
  const app = document.querySelector('#app');
  if (!app) return;
  new MutationObserver(() => decorate(app)).observe(app, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startArtworkRuntime, { once: true });
} else {
  startArtworkRuntime();
}
