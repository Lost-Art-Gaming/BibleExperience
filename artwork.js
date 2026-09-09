/* Deterministic production artwork wiring. One standalone asset per episode. */
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

  const titleToId = {
    'IN THE BEGINNING': 'ep1',
    'EDEN': 'ep2',
    'THE SERPENT AND THE SEED': 'ep3',
    'EAST OF EDEN': 'ep4',
    "THE BOOK OF ADAM'S STORY": 'ep5',
    'THE DAYS OF NOAH': 'ep6',
    'THE DELUGE': 'ep7',
    'THE BOW IN THE CLOUD': 'ep8',
    'BABEL': 'ep9',
    'GO FROM YOUR LAND': 'ep10',
  };

  const urlFor = asset => new URL(asset, ROOT).href;

  // CSS in the production layer deliberately uses !important for the card
  // artwork. Paint dynamically loaded assets with the same priority so the
  // deterministic episode mapping cannot be overridden by legacy art rules.
  const paint = (node, asset, extra = '') => {
    if (!node || !asset) return;
    const url = urlFor(asset);
    if (node.dataset.artwork === asset && node.dataset.artworkLoaded === 'true') return;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      node.style.setProperty(
        'background-image',
        extra ? `${extra}, url("${url}")` : `url("${url}")`,
        'important'
      );
      node.dataset.artwork = asset;
      node.dataset.artworkLoaded = 'true';
    };
    image.onerror = () => {
      node.dataset.artwork = asset;
      node.dataset.artworkLoaded = 'false';
    };
    image.src = url;
  };

  const applyCardArt = () => {
    document.querySelectorAll('.episode-card[data-episode]').forEach(card => {
      paint(card.querySelector('.episode-art'), ART[card.dataset.episode]);
    });
  };

  const applyReaderArt = () => {
    const head = document.querySelector('.reader-head');
    const heading = head?.querySelector('h1');
    if (!head || !heading) return;
    const normalized = heading.textContent
      .replace(/[“”]/g, '')
      .replace(/[’‘]/g, "'")
      .toUpperCase()
      .replace(/[^A-Z0-9' ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const id = titleToId[normalized];
    const asset = id && ART[id];
    if (!asset) return;
    head.dataset.episodeArtwork = id;
    paint(
      head,
      asset,
      'linear-gradient(180deg,rgba(3,8,13,.04),rgba(3,8,13,.18) 34%,rgba(3,8,13,.88) 78%,rgba(3,8,13,1) 100%)'
    );
  };

  const applyAll = () => { applyCardArt(); applyReaderArt(); };
  new MutationObserver(applyAll).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', applyAll);
  applyAll();
})();
