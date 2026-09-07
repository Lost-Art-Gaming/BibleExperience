import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const ROOT = new URL('.', document.baseURI);
const STORAGE = {
  progress: 'be-progress',
  bookmarks: 'be-bookmarks',
  theme: 'be-theme',
};

const state = {
  screen: 'home',
  episodes: [],
  timeline: [],
  activeEpisode: null,
  query: '',
  bookmarks: JSON.parse(localStorage.getItem(STORAGE.bookmarks) || '[]'),
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const titleCase = value => value.replace(/\b\w/g, c => c.toUpperCase());
const isDone = id => localStorage.getItem(`be-episode-${id}`) === 'done';
const doneCount = () => state.episodes.filter(e => isDone(e.id)).length;
const progress = () => state.episodes.length ? Math.round((doneCount() / state.episodes.length) * 100) : 0;

function saveBookmarks() {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(state.bookmarks));
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
  state.episodes = index.episodes;
  state.timeline = timeline;
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
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.spark}"/></svg>`;
}

function nav() {
  const items = [
    ['home', 'Home'],
    ['journey', 'Journey'],
    ['explore', 'Explore'],
    ['timeline', 'Timeline'],
    ['library', 'Library'],
  ];
  return `<nav class="bottom-nav" aria-label="Primary navigation">${items.map(([id, label]) => `
    <button class="nav-item ${state.screen === id ? 'active' : ''}" data-nav="${id}" aria-label="${label}">${icon(id === 'explore' ? 'map' : id)}<span>${label}</span></button>`).join('')}</nav>`;
}

function header() {
  return `<header class="topbar">
    <button class="brand" data-nav="home" aria-label="The Bible Experience home">
      <img src="assets/logo.svg" alt="" />
      <span><strong>THE BIBLE EXPERIENCE</strong><small>See. Understand. Believe.</small></span>
    </button>
    <div class="top-actions">
      <button class="round-btn" id="themeBtn" aria-label="Toggle theme">${icon('moon')}</button>
      <button class="round-btn" id="searchBtn" aria-label="Search">${icon('search')}</button>
    </div>
  </header>`;
}

function shell(content, { fullBleed = false } = {}) {
  $('#app').innerHTML = `<div class="app ${fullBleed ? 'full-bleed' : ''}">${header()}<main id="main">${content}</main>${nav()}</div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  bindGlobal();
}

function home() {
  const next = state.episodes.find(e => !isDone(e.id)) || state.episodes[0];
  const pct = progress();
  shell(`
    <section class="hero-home">
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
        <button class="feature-card map-feature" data-nav="explore"><span class="feature-icon">${icon('map')}</span><b>Biblical Geography</b><small>Walk the places of Scripture</small><span class="feature-arrow">${icon('arrow')}</span></button>
        <button class="feature-card timeline-feature" data-nav="timeline"><span class="feature-icon">${icon('timeline')}</span><b>Biblical Timeline</b><small>See Jehovah's purpose unfold</small><span class="feature-arrow">${icon('arrow')}</span></button>
        <button class="feature-card journey-feature" data-nav="journey"><span class="feature-icon">${icon('journey')}</span><b>Scripture Journey</b><small>Read, reflect and discover</small><span class="feature-arrow">${icon('arrow')}</span></button>
      </div>
    </section>

    <section class="content-section thread-section">
      <div class="section-heading"><div><span class="eyebrow">THEMES UNFOLDING</span><h2>Threads through Scripture</h2></div></div>
      ${[['The Seed',78],['Jehovah’s Kingdom',61],['Sacrifice & Atonement',64],['Jehovah’s Sovereignty',59]].map(([name,value]) => `<div class="thread-row"><span>${name}</span><b>${value}%</b><div><i style="width:${value}%"></i></div></div>`).join('')}
    </section>`);
}

function journey() {
  const cards = state.episodes.map((episode, index) => `
    <button class="episode-card ${isDone(episode.id) ? 'done' : ''}" data-episode="${episode.id}">
      <div class="episode-art art-${(index % 6) + 1}"><span>${episode.season === 2 ? 'S2' : 'S1'} · ${String(index + 1).padStart(2, '0')}</span><i></i></div>
      <div class="episode-copy"><small>${esc(episode.label)}</small><h3>${esc(episode.title.replace(/[“”]/g, ''))}</h3><p>${esc(episode.subtitle)}</p><span>${isDone(episode.id) ? 'Completed' : 'Explore'} ${icon('arrow')}</span></div>
    </button>`).join('');

  shell(`<section class="page-intro"><span class="eyebrow">WALK WITH SCRIPTURE</span><h1>Origins</h1><p>From creation to the promise given to Abraham. Ten experiences, one unfolding story.</p></section>
    <section class="season-card"><div><span>SEASON 1 · ORIGINS</span><h2>The beginning of the story.</h2><p>Genesis 1–12 · ${state.episodes.length} experiences</p></div><div class="season-sun"></div></section>
    <section class="episode-list">${cards}</section>`);
}

async function episode(id) {
  const meta = state.episodes.find(e => e.id === id);
  if (!meta) return;
  state.activeEpisode = id;
  const data = await getJson(`data/Genesis/${meta.file}`);
  const saved = state.bookmarks.includes(id);
  const sections = (data.sections || []).map(section => `<section class="reading-section"><span class="eyebrow">${esc(section.label)}</span>${section.html}</section>`).join('');
  shell(`<section class="reader-head">
      <button class="back-btn" data-nav="journey">${icon('back')} Journey</button>
      <span class="eyebrow">${esc(meta.label)}</span><h1>${esc(meta.title.replace(/[“”]/g, ''))}</h1><p>${esc(meta.subtitle)}</p>
      <div class="reader-meta"><span>${data.sections?.length || 0} sections</span><button id="bookmark" class="save-btn ${saved ? 'saved' : ''}">${icon('bookmark')} ${saved ? 'Saved' : 'Save'}</button></div>
    </section>
    <article class="reader-content">${sections}</article>
    <div class="reader-footer"><button class="primary-btn" id="complete">${isDone(id) ? 'Completed ✓' : 'Mark episode complete'} ${icon('arrow')}</button></div>`);
}

function timeline() {
  const items = state.timeline.map((item, index) => `<button class="timeline-item ${esc(item.kind || 'undated')}" data-episode="${esc(item.ep || '')}">
    <span class="timeline-dot"></span><span class="timeline-line"></span><div class="timeline-copy"><small>${esc(item.when)}</small><h3>${esc(item.what)}</h3><p>${esc(item.note)}</p></div><strong>${String(index + 1).padStart(2, '0')}</strong>
  </button>`).join('');
  shell(`<section class="page-intro"><span class="eyebrow">CHRONOLOGY</span><h1>The road through Genesis</h1><p>Explore the sequence of events and distinguish anchored dates from approximate or undated placements.</p></section>
    <div class="legend"><span><i class="anchor"></i>Anchor</span><span><i class="derived"></i>Derived</span><span><i class="approx"></i>Approx.</span><span><i class="undated"></i>Undated</span></div>
    <section class="timeline-list">${items}</section>`);
}

function explore() {
  shell(`<section class="page-intro compact"><span class="eyebrow">BIBLICAL GEOGRAPHY</span><h1>Walk the Exodus.</h1><p>Touch and drag the scene. This lightweight 3D experience is designed for mobile browsers.</p></section>
    <section class="scene-card"><div id="threeScene"></div><div class="scene-copy"><span class="eyebrow">EXODUS ROUTE</span><h2>From Egypt to Sinai</h2><p>Follow the journey through desert terrain.</p></div><div class="scene-actions"><button id="sceneReset">Reset</button><button id="sceneSpin">Auto rotate</button></div></section>
    <section class="location-list"><button><b>Egypt</b><small>Land of slavery</small></button><button><b>Red Sea</b><small>Jehovah opens the way</small></button><button><b>Sinai</b><small>Mountain of God</small></button></section>`);
  initThree();
}

function library() {
  const saved = state.episodes.filter(e => state.bookmarks.includes(e.id));
  shell(`<section class="page-intro"><span class="eyebrow">THE LIBRARY</span><h1>Discover more.</h1><p>Keep your saved experiences close while the library grows into a deeper study companion.</p></section>
    <div class="library-grid">
      <button><span>${icon('journey')}</span><b>People & Genealogy</b><small>Trace the family lines</small></button>
      <button><span>${icon('search')}</span><b>Verse Insights</b><small>Study the text in context</small></button>
      <button><span>${icon('map')}</span><b>Places of Scripture</b><small>Explore geography and journeys</small></button>
      <button><span>${icon('spark')}</span><b>Original Languages</b><small>Hebrew & Greek word studies</small></button>
    </div>
    <section class="saved-section"><div class="section-heading"><div><span class="eyebrow">YOUR SAVED EXPERIENCES</span><h2>${saved.length ? `${saved.length} saved` : 'Nothing saved yet'}</h2></div></div>
      ${saved.length ? saved.map(e => `<button class="saved-item" data-episode="${e.id}"><span>${esc(e.label)}</span><b>${esc(e.title.replace(/[“”]/g, ''))}</b>${icon('arrow')}</button>`).join('') : '<div class="empty-state">Bookmark an episode to keep it here.</div>'}
    </section>
    <section class="quote-card"><span class="eyebrow">THE CENTRAL THREAD</span><blockquote>“You are worthy, Jehovah our God, to receive the glory and the honor and the power.”</blockquote><cite>Revelation 4:11 · New World Translation</cite></section>`);
}

function setScreen(screen) {
  state.screen = screen;
  const renderers = { home, journey, timeline, explore, library };
  (renderers[screen] || home)();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openSearch() {
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.innerHTML = `<div class="search-panel"><button class="close-search" aria-label="Close">×</button><span class="eyebrow">SEARCH THE EXPERIENCE</span><h2>Find an episode</h2><input id="searchInput" autocomplete="off" placeholder="Try “Eden”, “Noah” or “promise”…" /><div id="searchResults"></div></div>`;
  document.body.appendChild(overlay);
  const input = $('#searchInput', overlay);
  const results = $('#searchResults', overlay);
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const matches = state.episodes.filter(e => !query || `${e.title} ${e.subtitle} ${e.label}`.toLowerCase().includes(query));
    results.innerHTML = matches.slice(0, 8).map(e => `<button data-result="${e.id}"><small>${esc(e.label)}</small><b>${esc(e.title.replace(/[“”]/g, ''))}</b>${icon('arrow')}</button>`).join('') || '<p class="no-results">No experiences found.</p>';
    $$('[data-result]', results).forEach(button => button.onclick = () => { overlay.remove(); episode(button.dataset.result); });
  };
  input.addEventListener('input', render);
  $('.close-search', overlay).onclick = () => overlay.remove();
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
  render();
  input.focus();
}

function bindGlobal() {
  $$('[data-nav]').forEach(button => button.onclick = () => setScreen(button.dataset.nav));
  $$('[data-episode]').forEach(button => button.onclick = () => episode(button.dataset.episode));
  $('#searchBtn')?.addEventListener('click', openSearch);
  $('#themeBtn')?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'light';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    localStorage.setItem(STORAGE.theme, dark ? 'light' : 'dark');
  });
  $('#bookmark')?.addEventListener('click', () => {
    const id = state.activeEpisode;
    if (state.bookmarks.includes(id)) state.bookmarks = state.bookmarks.filter(x => x !== id);
    else state.bookmarks.push(id);
    saveBookmarks();
    toast(state.bookmarks.includes(id) ? 'Saved to your library' : 'Removed from your library');
    episode(id);
  });
  $('#complete')?.addEventListener('click', () => {
    const id = state.activeEpisode;
    localStorage.setItem(`be-episode-${id}`, 'done');
    toast('Episode completed');
    episode(id);
  });
  $('#sceneReset')?.addEventListener('click', () => window.__beThree?.reset());
  $('#sceneSpin')?.addEventListener('click', () => window.__beThree?.toggle());
}

function initThree() {
  const host = $('#threeScene');
  if (!host) return;
  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071018);
    scene.fog = new THREE.Fog(0x071018, 15, 45);
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 100);
    camera.position.set(10, 7, 13);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc9d8e8, 0x21170f, 1.9));
    const sun = new THREE.DirectionalLight(0xffd79a, 2.8);
    sun.position.set(-8, 14, 5);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(55, 55, 30, 30), new THREE.MeshStandardMaterial({ color: 0x4b4031, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const dunes = new THREE.Group();
    for (let i = 0; i < 70; i += 1) {
      const height = 0.25 + Math.random() * 2.8;
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.4 + Math.random() * 0.75, height, 5), new THREE.MeshStandardMaterial({ color: 0x5c4a35, roughness: 1 }));
      mesh.position.set((Math.random() - 0.5) * 38, height / 2 - 0.1, (Math.random() - 0.5) * 30);
      dunes.add(mesh);
    }
    scene.add(dunes);

    const points = [
      new THREE.Vector3(-12, 0.08, 8), new THREE.Vector3(-6, 0.08, 4),
      new THREE.Vector3(-2, 0.08, 6), new THREE.Vector3(3, 0.08, 1), new THREE.Vector3(8, 0.08, -5),
    ];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xd7aa57 })));
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe4b75e, emissive: 0x6b4312, emissiveIntensity: 1 }));
    marker.position.copy(points[0]); marker.position.y = 0.45; scene.add(marker);

    let azimuth = 0.65;
    let dragging = false;
    let previousX = 0;
    let autoRotate = false;
    host.addEventListener('pointerdown', event => { dragging = true; previousX = event.clientX; host.setPointerCapture?.(event.pointerId); });
    host.addEventListener('pointermove', event => { if (dragging) { azimuth += (event.clientX - previousX) * 0.006; previousX = event.clientX; } });
    host.addEventListener('pointerup', () => { dragging = false; });
    host.addEventListener('pointercancel', () => { dragging = false; });

    const updateCamera = () => {
      if (autoRotate) azimuth += 0.0035;
      camera.position.x = Math.sin(azimuth) * 16;
      camera.position.z = Math.cos(azimuth) * 16;
      camera.position.y = 7;
      camera.lookAt(0, 0, 0);
    };
    const resize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    new ResizeObserver(resize).observe(host);
    window.__beThree = {
      reset: () => { azimuth = 0.65; autoRotate = false; updateCamera(); },
      toggle: () => { autoRotate = !autoRotate; toast(autoRotate ? 'Auto rotate on' : 'Auto rotate off'); },
    };
    const tick = () => { if (!document.body.contains(host)) return; updateCamera(); renderer.render(scene, camera); requestAnimationFrame(tick); };
    tick();
  } catch (error) {
    host.innerHTML = '<div class="scene-fallback">3D geography is unavailable on this device. The route remains available as part of the MVP.</div>';
  }
}

async function boot() {
  const savedTheme = localStorage.getItem(STORAGE.theme);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  try {
    await loadData();
    home();
  } catch (error) {
    $('#app').innerHTML = `<div class="fatal"><h1>The Bible Experience</h1><p>Content could not be loaded. Check your connection and reload the page.</p><button class="primary-btn" onclick="location.reload()">Reload</button></div>`;
    console.error(error);
  }
}

boot();
