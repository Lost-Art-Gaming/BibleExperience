/* Deterministic production artwork wiring. Every episode gets its own explicit image. */
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

  const applyCardArt = () => {
    document.querySelectorAll('.episode-card[data-episode]').forEach(card => {
      const asset = ART[card.dataset.episode];
      const art = card.querySelector('.episode-art');
      if (!asset || !art) return;
      art.style.backgroundImage = `url("${new URL(asset, ROOT).href}")`;
      art.dataset.artwork = asset;
    });
  };

  const titleToId = {
    'IN THE BEGINNING': 'ep1',
    'EDEN': 'ep2',
    'THE SERPENT AND THE SEED': 'ep3',
    'EAST OF EDEN': 'ep4',
    'THE BOOK OF ADAMS STORY': 'ep5',
    'THE DAYS OF NOAH': 'ep6',
    'THE DELUGE': 'ep7',
    'THE BOW IN THE CLOUD': 'ep8',
    'BABEL': 'ep9',
    'GO FROM YOUR LAND': 'ep10',
  };

  const applyReaderArt = () => {
    const head = document.querySelector('.reader-head');
    if (!head) return;
    const heading = head.querySelector('h1');
    if (!heading) return;
    const normalized = heading.textContent
      .replace(/[“”]/g, '')
      .replace(/’/g, "'")
      .toUpperCase()
      .replace(/ADAM’S/g, "ADAM'S")
      .replace(/[^A-Z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const id = titleToId[normalized];
    const asset = id && ART[id];
    if (!asset) return;
    head.dataset.episodeArtwork = id;
    head.style.setProperty('--reader-art', `url("${new URL(asset, ROOT).href}")`);
    head.style.backgroundImage = `linear-gradient(180deg,rgba(3,8,13,.05),rgba(3,8,13,.92)), var(--reader-art)`;
  };

  const applyAll = () => { applyCardArt(); applyReaderArt(); };
  new MutationObserver(applyAll).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', applyAll);
  applyAll();
})();
