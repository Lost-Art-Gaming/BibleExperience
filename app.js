import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const ROOT = new URL('.', document.baseURI);
const STORAGE = { progress: 'be-progress', bookmarks: 'be-bookmarks', theme: 'be-theme' };

const state = {
  screen: 'home',
  episodes: [],
  timeline: [],
  episodeData: new Map(),
  activeEpisode: null,
  bookmarks: JSON.parse(localStorage.getItem(STORAGE.bookmarks) || '[]'),
  routeDepth: 0,
  routeKey: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const cleanTitle = (value = '') => value.replace(/[“”]/g, '');
const EPISODE_ART = ['ep01-beginning.jpg','ep02-eden.jpg','ep03-serpent.jpg','ep04-east-of-eden.jpg','ep05-adams-story.jpg','ep06-noah.jpg','ep07-deluge.jpg','ep08-bow.jpg','ep09-babel.jpg','ep10-abraham.jpg'];
const episodeArt = index => `assets/${EPISODE_ART[index]}`;
const isDone = id => localStorage.getItem(`be-episode-${id}`) === 'done';
const doneCount = () => state.episodes.filter(episode => isDone(episode.id)).length;
const progress = () => state.episodes.length ? Math.round((doneCount() / state.episodes.length) * 100) : 0;

function saveBookmarks() {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(state.bookmarks));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE.theme, theme);
}

function currentTheme() {
  return document.documentElement.dataset.theme || 'dark';
}

function toast(message) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('show'), 2200);
}

async function getJson(path) {
  const response = await fetch(new URL(path, ROOT));
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

async function loadData() {
  const [index, timeline] = await Promise.all([
    getJson('data/Genesis/index.json'),
    getJson('data/timeline.json'),
  ]);
  state.episodes = Array.isArray(index.episodes) ? index.episodes : [];
  state.timeline = Array.isArray(timeline) ? timeline : [];

  await Promise.all(state.episodes.map(async episode => {
    try {
      const data = await getJson(`data/Genesis/${episode.file}`);
      state.episodeData.set(episode.id, data);
    } catch {
      // Individual episode failures are surfaced only when that episode is opened.
    }
  }));
}

const icons = {
  home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z',
  journey: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zm0 0v17',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15',
  timeline: 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 4v5l3 2',
  library: 'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm5-6a3 3 0 1 1 0 6m1 3h1a4.5 4.5 0 0 1 4.5 4.5V20',
  search: 'M20 20l-4-4m1-5.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z',
  bookmark: 'M6 3h12v18l-6-3-6 3z',
  play: 'M8 5l11 7-11 7z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  spark: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z',
  moon: 'M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.8 8.8 0 1 0 12 12z',
  sun: 'M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.9 9.9 1.42 1.42M3 12h2m14 0h2m-3.36-6.36-1.42 1.42m-9.9 9.9-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.spark}"/></svg>`;
}

const NAV_ITEMS = [
  ['home', 'Home'],
  ['journey', 'Journey'],
  ['explore', 'Explore'],
  ['timeline', 'Timeline'],
  ['library', 'Library'],
];

function navMarkup(className) {
  return `<nav class="${className}" aria-label="Primary navigation">${NAV_ITEMS.map(([id, label]) => `
    <button class="nav-item ${state.screen === id ? 'active' : ''}" data-nav="${id}" aria-label="${label}" aria-current="${state.screen === id ? 'page' : 'false'}">${icon(id === 'explore' ? 'map' : id)}<span>${label}</span></button>`).join('')}</nav>`;
}

function header() {
  const theme = currentTheme();
  const themeLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  return `<header class="topbar">
    <button class="brand" data-nav="home" aria-label="The Bible Experience home">
      <img src="assets/logo.svg" alt="" />
      <span><strong>THE BIBLE EXPERIENCE</strong><small>See. Understand. Believe.</small></span>
    </button>
    ${navMarkup('desktop-nav')}
    <div class="top-actions">
      <button class="round-btn" id="themeBtn" aria-label="${themeLabel}">${icon(theme === 'light' ? 'moon' : 'sun')}</button>
      <button class="round-btn" id="searchBtn" aria-label="Search">${icon('search')}</button>
    </div>
  </header>`;
}

function shell(content, { fullBleed = false } = {}) {
  $('#app').innerHTML = `<div class="app ${fullBleed ? 'full-bleed' : ''}">${header()}<main id="main">${content}</main>${navMarkup('bottom-nav')}</div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  bindGlobal();
  focusMainHeading();
}

function focusMainHeading() {
  requestAnimationFrame(() => {
    const heading = $('#main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });
}

function artAttr(asset, fallbackIndex = 1) {
  return `data-art="${esc(asset)}" data-art-fallback="${fallbackIndex}"`;
}

function home() {
  const next = state.episodes.find(episode => !isDone(episode.id)) || state.episodes[0];
  const pct = progress();
  shell(`
    <section class="hero-home" ${artAttr('assets/hero-origins.jpg', 1)}>
      <div class="hero-glow"></div><div class="hero-mountains"></div>
      <div class="hero-content">
        <span class="eyebrow">SEASON 1 · ORIGINS</span>
        <h1>See the <em>bigger picture.</em></h1>
        <p>Experience the Bible as a connected story—Scripture, history, geography and prophecy brought together.</p>
        <button class="primary-btn" data-episode="${next?.id || ''}">${icon('play')} ${pct ? 'Continue your journey' : 'Begin the journey'}</button>
      </div>
      <div class="hero-mark">01<span>/</span>10</div>
    </section>

    <section class="content-section journey-progress">
      <div class="section-heading"><div><span class="eyebrow">YOUR JOURNEY</span><h2>Walk through the Bible</h2></div><strong>${pct}%</strong></div>
      <div class="progress-track"><i style="width:${pct}%"></i></div>
      <div class="mini-stats"><span><b>${doneCount()}</b> completed</span><span><b>${state.episodes.length}</b> experiences</span><span><b>${state.bookmarks.length}</b> saved</span></div>
    </section>

    <section class="content-section">
      <div class="section-heading"><div><span class="eyebrow">EXPLORE</span><h2>Go beyond the page</h2></div></div>
      <div class="feature-grid">
        <button class="feature-card map-feature" ${artAttr('assets/explore-geography.jpg', 2)} data-nav="explore"><span class="feature-icon">${icon('map')}</span><b>Biblical Geography</b><small>Walk the places of Scripture</small><span class="feature-arrow">${icon('arrow')}</span></button>
        <button class="feature-card timeline-feature" ${artAttr('assets/ep07-deluge.jpg', 3)} data-nav="timeline"><span class="feature-icon">${icon('timeline')}</span><b>Biblical Timeline</b><small>See Jehovah's purpose unfold</small><span class="feature-arrow">${icon('arrow')}</span></button>
        <button class="feature-card journey-feature" ${artAttr('assets/study-reflect.jpg', 4)} data-nav="journey"><span class="feature-icon">${icon('journey')}</span><b>Scripture Journey</b><small>Read, reflect and discover</small><span class="feature-arrow">${icon('arrow')}</span></button>
      </div>
    </section>`);
}

function journey() {
  const cards = state.episodes.map((episode, index) => `
    <button class="episode-card ${isDone(episode.id) ? 'done' : ''}" data-episode="${esc(episode.id)}">
      <div class="episode-art art-${(index % 6) + 1}" ${artAttr(episodeArt(index), (index % 6) + 1)}><span>${episode.season === 2 ? 'S2' : 'S1'} · ${String(index + 1).padStart(2, '0')}</span><i></i></div>
      <div class="episode-copy"><small>${esc(episode.label)}</small><h3>${esc(cleanTitle(episode.title))}</h3><p>${esc(episode.subtitle)}</p><span>${isDone(episode.id) ? 'Completed' : 'Explore'} ${icon('arrow')}</span></div>
    </button>`).join('');

  shell(`<section class="page-intro"><span class="eyebrow">WALK WITH SCRIPTURE</span><h1>Origins</h1><p>From creation to the promise given to Abraham. Ten experiences, one unfolding story.</p></section>
    <section class="season-card" ${artAttr('assets/ep01-beginning.jpg', 1)}><div><span>SEASON 1 · ORIGINS</span><h2>The beginning of the story.</h2><p>Genesis 1–12 · ${state.episodes.length} experiences</p></div><div class="season-sun"></div></section>
    <section class="episode-list">${cards}</section>`);
}

function episodeLoading(meta) {
  shell(`<section class="reader-loading" aria-live="polite"><span class="eyebrow">LOADING EXPERIENCE</span><h1>${esc(cleanTitle(meta.title))}</h1><div class="loading-indicator" role="status" aria-label="Loading episode"><span></span><span></span><span></span></div><p>Gathering the reading, context and geography for this experience.</p></section>`);
}

function episodeError(meta) {
  shell(`<section class="reader-error"><span class="eyebrow">EXPERIENCE UNAVAILABLE</span><h1>${esc(cleanTitle(meta.title))}</h1><p>This episode could not be loaded. Check your connection and try again.</p><button class="primary-btn" data-nav="journey">${icon('back')} Return to Journey</button></section>`);
}

function readerData(data) {
  return (data?.sections || []).map(section => `<section class="reading-section">${section.html}</section>`).join('');
}

function episodeFooter(index) {
  const previous = state.episodes[index - 1];
  const next = state.episodes[index + 1];
  return `<div class="reader-footer">
    <div class="reader-sequence">
      ${previous ? `<button class="secondary-btn" data-episode="${esc(previous.id)}">${icon('back')} ${esc(cleanTitle(previous.title))}</button>` : '<span></span>'}
      ${next ? `<button class="secondary-btn next-link" data-episode="${esc(next.id)}">Next ${icon('arrow')}</button>` : '<span></span>'}
    </div>
    ${next ? `<button class="primary-btn continue-btn" data-episode="${esc(next.id)}">Continue to ${esc(cleanTitle(next.title))} ${icon('arrow')}</button>` : `<button class="primary-btn" id="complete">${isDone(state.activeEpisode) ? 'Completed ✓' : 'Mark episode complete'} ${icon('arrow')}</button>`}
  </div>`;
}

async function episode(id) {
  const meta = state.episodes.find(episode => episode.id === id);
  if (!meta) {
    navigate('home', { replace: true });
    return;
  }
  state.activeEpisode = id;
  episodeLoading(meta);

  let data = state.episodeData.get(id);
  if (!data) {
    try {
      data = await getJson(`data/Genesis/${meta.file}`);
      state.episodeData.set(id, data);
    } catch {
      if (state.activeEpisode === id) episodeError(meta);
      return;
    }
  }
  if (state.activeEpisode !== id || parseRoute().kind !== 'episode') return;

  const index = state.episodes.findIndex(episode => episode.id === id);
  const saved = state.bookmarks.includes(id);
  shell(`<section class="reader-head" ${artAttr(episodeArt(index), (index % 6) + 1)}>
      <button class="back-btn" id="readerBack">${icon('back')} Journey</button>
      <span class="eyebrow">${esc(meta.label)}</span><h1>${esc(cleanTitle(meta.title))}</h1><p>${esc(meta.subtitle)}</p>
      <div class="reader-meta"><span>${data.sections?.length || 0} sections</span><button id="bookmark" class="save-btn ${saved ? 'saved' : ''}">${icon('bookmark')} ${saved ? 'Saved' : 'Save'}</button></div>
    </section>
    <article class="reader-content">${readerData(data)}</article>
    ${episodeFooter(index)}`);
}

function timeline() {
  const items = state.timeline.map((item, index) => `<button class="timeline-item ${esc(item.kind || 'undated')}" data-episode="${esc(item.ep || '')}" ${item.ep ? '' : 'disabled aria-disabled="true"'}>
    <span class="timeline-dot"></span><span class="timeline-line"></span><div class="timeline-copy"><small>${esc(item.when)}</small><h3>${esc(item.what)}</h3><p>${esc(item.note)}</p></div><strong>${String(index + 1).padStart(2, '0')}</strong>
  </button>`).join('');
  shell(`<section class="page-intro"><span class="eyebrow">CHRONOLOGY</span><h1>The road through Genesis</h1><p>Explore the sequence of events and distinguish anchored dates from approximate or undated placements.</p></section>
    <div class="legend"><span><i class="anchor"></i>Anchor</span><span><i class="derived"></i>Derived</span><span><i class="approx"></i>Approx.</span><span><i class="undated"></i>Undated</span></div>
    <section class="timeline-list">${items}</section>`);
}

const geographyPoints = [
  { id: 'eden', name: 'Eden', description: 'The garden setting introduced in Genesis 2–3.', position: [-7, 0.28, 4.5] },
  { id: 'ararat', name: 'Ararat', description: 'The mountains where the ark came to rest after the Deluge.', position: [-3.4, 0.28, 2.1] },
  { id: 'babel', name: 'Babel', description: 'The plain of Shinar, where mankind gathered and built the tower.', position: [-0.4, 0.28, 0.4] },
  { id: 'ur', name: 'Ur', description: 'Abram’s starting point before the household moved north.', position: [2.8, 0.28, -1.8] },
  { id: 'haran', name: 'Haran', description: 'The northern crossroads where Terah settled and Abram later departed from.', position: [1.2, 0.28, 2.1] },
  { id: 'canaan', name: 'Canaan', description: 'The land Jehovah promised to Abram’s offspring.', position: [-0.3, 0.28, 4.6] },
];

function explore() {
  shell(`<section class="page-intro compact"><span class="eyebrow">BIBLICAL GEOGRAPHY</span><h1>Walk the Genesis journey.</h1><p>Trace the route from Eden to Ararat, Babel, Ur, Haran and Canaan—the geography behind the first movement of Jehovah’s purpose.</p></section>
    <section class="scene-card" ${artAttr('assets/explore-geography.jpg', 2)}><div id="threeScene" aria-label="Interactive 3D Genesis geography scene"></div><div class="scene-copy"><span class="eyebrow">GENESIS ROUTE</span><h2>Eden → Ararat → Babel → Ur → Haran → Canaan</h2><p id="sceneDetail">Select a waypoint to see why it matters to the story.</p></div><div class="scene-actions"><button id="sceneReset">Reset</button><button id="sceneSpin">Auto rotate</button></div></section>
    <section class="location-list">${geographyPoints.map((point, index) => `<button data-location="${point.id}" aria-label="Focus ${esc(point.name)}"><b>${esc(point.name)}</b><small>${esc(point.description)}</small><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</section>`);
  initThree();
}

function library() {
  const saved = state.episodes.filter(episode => state.bookmarks.includes(episode.id));
  const cards = [
    ['journey', 'People & Genealogy', 'Trace the family lines'],
    ['search', 'Verse Insights', 'Study the text in context'],
    ['map', 'Places of Scripture', 'Explore geography and journeys'],
    ['spark', 'Original Languages', 'Hebrew & Greek word studies'],
  ];
  shell(`<section class="page-intro"><span class="eyebrow">THE LIBRARY</span><h1>Discover more.</h1><p>Keep your saved experiences close while the library grows into a deeper study companion.</p></section>
    <div class="library-grid">${cards.map(([ic, title, copy]) => `<article class="library-card disabled" aria-disabled="true"><span>${icon(ic)}</span><b>${title}</b><small>${copy}</small><em>Coming soon</em></article>`).join('')}</div>
    <section class="saved-section"><div class="section-heading"><div><span class="eyebrow">YOUR SAVED EXPERIENCES</span><h2>${saved.length ? `${saved.length} saved` : 'Nothing saved yet'}</h2></div></div>
      ${saved.length ? saved.map(episode => `<button class="saved-item" data-episode="${episode.id}"><span>${esc(episode.label)}</span><b>${esc(cleanTitle(episode.title))}</b>${icon('arrow')}</button>`).join('') : '<div class="empty-state">Bookmark an episode to keep it here.</div>'}
    </section>
    <section class="quote-card" ${artAttr('assets/study-reflect.jpg', 4)}><span class="eyebrow">THE CENTRAL THREAD</span><blockquote>“You are worthy, Jehovah our God, to receive the glory and the honor and the power.”</blockquote><cite>Revelation 4:11 · New World Translation</cite></section>`);
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!raw) return { kind: 'home' };
  const parts = raw.split('/').map(decodeURIComponent);
  if (parts[0] === 'episode' && parts[1]) return { kind: 'episode', id: parts[1] };
  return ['home', 'journey', 'timeline', 'explore', 'library'].includes(parts[0]) ? { kind: parts[0] } : { kind: 'home' };
}

function routeHash(route) {
  return route.startsWith('#/') ? route : `#/${route}`;
}

function navigate(route, { replace = false } = {}) {
  const target = routeHash(route);
  const current = `${location.hash || '#/home'}`;
  const parsed = target.match(/^#\/(episode\/[^/]+|home|journey|timeline|explore|library)$/) ? target : '#/home';
  if (parsed === current) {
    renderRoute();
    return;
  }
  const nextDepth = replace ? state.routeDepth : state.routeDepth + 1;
  const method = replace ? 'replaceState' : 'pushState';
  history[method]({ be: true, depth: nextDepth }, '', parsed);
  state.routeDepth = nextDepth;
  renderRoute();
}

function syncInitialHistory() {
  const target = routeHash(location.hash.replace(/^#\/?/, '') || 'home');
  const valid = target.match(/^#\/(episode\/[^/]+|home|journey|timeline|explore|library)$/) ? target : '#/home';
  history.replaceState({ be: true, depth: 0 }, '', valid);
  state.routeDepth = 0;
}

function renderRoute() {
  const route = parseRoute();
  if (route.kind === 'episode') {
    state.screen = 'episode';
    episode(route.id);
    return;
  }
  state.screen = route.kind;
  ({ home, journey, timeline, explore, library }[route.kind] || home)();
}

function goReaderBack() {
  if (state.routeDepth > 0) {
    history.back();
  } else {
    navigate('journey', { replace: true });
  }
}

function updateSearchResults(query, resultsNode) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    resultsNode.innerHTML = '<p class="search-hint">Search titles, descriptions and the text inside each episode.</p>';
    return;
  }
  const matches = state.episodes.filter(episode => {
    const data = state.episodeData.get(episode.id);
    const body = (data?.sections || []).map(section => section.html.replace(/<[^>]+>/g, ' ')).join(' ');
    const haystack = `${episode.title} ${episode.subtitle} ${episode.label} ${body}`.toLowerCase();
    return haystack.includes(normalized);
  });
  resultsNode.innerHTML = matches.slice(0, 8).map(episode => {
    const data = state.episodeData.get(episode.id);
    const body = (data?.sections || []).map(section => section.html.replace(/<[^>]+>/g, ' ')).join(' ');
    const haystack = `${episode.title} ${episode.subtitle} ${body}`.toLowerCase();
    const at = haystack.indexOf(normalized);
    const sample = at >= 0 ? body.replace(/\s+/g, ' ').trim().slice(Math.max(0, at - 45), at + normalized.length + 70) : episode.subtitle;
    return `<button data-result="${esc(episode.id)}"><small>${esc(episode.label)}</small><b>${esc(cleanTitle(episode.title))}</b><p>${esc(sample)}</p>${icon('arrow')}</button>`;
  }).join('') || '<p class="no-results">No experiences found.</p>';
  $$('[data-result]', resultsNode).forEach(button => button.addEventListener('click', () => {
    closeSearch();
    navigate(`episode/${encodeURIComponent(button.dataset.result)}`);
  }));
}

let activeSearch = null;
function closeSearch() {
  if (!activeSearch) return;
  const { overlay, opener, keydown } = activeSearch;
  document.removeEventListener('keydown', keydown);
  overlay.remove();
  activeSearch = null;
  opener?.focus({ preventScroll: true });
}

function openSearch(opener = $('#searchBtn')) {
  if (activeSearch) return;
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.innerHTML = `<div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchTitle"><button class="close-search" aria-label="Close search">×</button><span class="eyebrow">SEARCH THE EXPERIENCE</span><h2 id="searchTitle">Find an episode</h2><input id="searchInput" autocomplete="off" placeholder="Try “Eden”, “Noah”, “covenant” or “promise”…" /><div id="searchResults"></div></div>`;
  document.body.appendChild(overlay);
  const input = $('#searchInput', overlay);
  const results = $('#searchResults', overlay);
  const close = () => closeSearch();
  const keydown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = $$('button:not([disabled]), input:not([disabled])', overlay).filter(node => node.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  activeSearch = { overlay, opener, keydown };
  document.addEventListener('keydown', keydown);
  input.addEventListener('input', () => updateSearchResults(input.value, results));
  $('.close-search', overlay).addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  updateSearchResults('', results);
  requestAnimationFrame(() => input.focus());
}

function bindGlobal() {
  $$('[data-nav]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.nav)));
  $$('[data-episode]').forEach(button => button.addEventListener('click', () => navigate(`episode/${encodeURIComponent(button.dataset.episode)}`)));
  $$('[data-result]').forEach(button => button.addEventListener('click', () => navigate(`episode/${encodeURIComponent(button.dataset.result)}`)));
  $('#searchBtn')?.addEventListener('click', event => openSearch(event.currentTarget));
  $('#themeBtn')?.addEventListener('click', () => {
    setTheme(currentTheme() === 'light' ? 'dark' : 'light');
    renderRoute();
  });
  $('#bookmark')?.addEventListener('click', () => {
    const id = state.activeEpisode;
    const index = state.bookmarks.indexOf(id);
    if (index >= 0) state.bookmarks.splice(index, 1);
    else state.bookmarks.push(id);
    saveBookmarks();
    toast(index >= 0 ? 'Removed from saved experiences' : 'Saved to your library');
    renderRoute();
  });
  $('#complete')?.addEventListener('click', () => {
    const id = state.activeEpisode;
    if (!id) return;
    localStorage.setItem(`be-episode-${id}`, 'done');
    toast('Episode completed');
    renderRoute();
  });
  $('#readerBack')?.addEventListener('click', goReaderBack);

  $$('[data-location]').forEach(button => button.addEventListener('click', () => window.__beThree?.focus(button.dataset.location)));
  $('#sceneReset')?.addEventListener('click', () => window.__beThree?.reset());
  $('#sceneSpin')?.addEventListener('click', () => window.__beThree?.toggle());
}

function initThree() {
  const host = $('#threeScene');
  if (!host) return;
  try {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x071018, 15, 45);
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 100);
    camera.position.set(10, 7, 13);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb6c6ce, 0x09121a, 1.5));
    const sun = new THREE.DirectionalLight(0xf2d28d, 2.2);
    sun.position.set(8, 14, 4);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(28, 20, 10, 10), new THREE.MeshStandardMaterial({ color: 0x18252c, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const routePoints = geographyPoints.map(point => new THREE.Vector3(...point.position));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints), new THREE.LineBasicMaterial({ color: 0xd7aa57 })));

    const markers = new Map();
    geographyPoints.forEach(point => {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe4b75e, emissive: 0x6b4312, emissiveIntensity: 1 }));
      marker.position.set(...point.position);
      marker.position.y = 0.45;
      marker.userData.id = point.id;
      scene.add(marker);
      markers.set(point.id, marker);
    });

    let azimuth = 0.65;
    let dragging = false;
    let previousX = 0;
    let autoRotate = false;
    let focusId = geographyPoints[0].id;

    const lookAtRoute = id => {
      const point = geographyPoints.find(item => item.id === id) || geographyPoints[0];
      focusId = point.id;
      markers.forEach((marker, markerId) => {
        marker.scale.setScalar(markerId === focusId ? 1.35 : 1);
      });
      $('#sceneDetail').textContent = `${point.name}: ${point.description}`;
    };

    const onPointerDown = event => { dragging = true; previousX = event.clientX; host.setPointerCapture?.(event.pointerId); };
    const onPointerUp = event => { dragging = false; host.releasePointerCapture?.(event.pointerId); };
    const onPointerMove = event => {
      if (!dragging) return;
      azimuth += (event.clientX - previousX) * 0.006;
      previousX = event.clientX;
    };
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('pointermove', onPointerMove);

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    window.__beThree = {
      toggle() { autoRotate = !autoRotate; $('#sceneSpin').textContent = autoRotate ? 'Stop rotation' : 'Auto rotate'; },
      reset() { azimuth = 0.65; autoRotate = false; $('#sceneSpin').textContent = 'Auto rotate'; lookAtRoute('eden'); },
      focus(id) { lookAtRoute(id); azimuth = geographyPoints.findIndex(point => point.id === id) * 0.48 + 0.4; },
    };
    lookAtRoute('eden');

    const tick = () => {
      if (!host.isConnected) {
        resizeObserver.disconnect();
        window.__beThree = null;
        return;
      }
      if (autoRotate) azimuth += 0.0025;
      const distance = 14;
      camera.position.set(Math.sin(azimuth) * distance, 7.5, Math.cos(azimuth) * distance);
      camera.lookAt(0, 0, 1.4);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();
  } catch {
    host.innerHTML = '<div class="three-fallback"><span class="eyebrow">GEOGRAPHY VIEW</span><b>Interactive 3D is unavailable here.</b><p>Use the Genesis route cards below to move through the story.</p></div>';
  }
}

function boot() {
  setTheme(localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark');
  syncInitialHistory();
  loadData().then(renderRoute).catch(() => {
    $('#app').innerHTML = '<main class="startup-error"><h1>The Bible Experience</h1><p>The experience could not load its Genesis index. Check your connection and refresh.</p></main>';
  });
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('popstate', event => {
    state.routeDepth = Number.isFinite(event.state?.depth) ? event.state.depth : 0;
    renderRoute();
  });
}

boot();
