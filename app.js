const DATA_ROOT = './data/Genesis/';
const state = {
  screen: 'library',
  episodes: [],
  currentEpisode: null,
  cache: new Map(),
  notes: loadNotes(),
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadNotes() {
  try { return JSON.parse(localStorage.getItem('bibleExperience.notes') || '{}'); }
  catch { return {}; }
}
function saveNotes() {
  localStorage.setItem('bibleExperience.notes', JSON.stringify(state.notes));
}
function progressKey(id) { return `bibleExperience.done.${id}`; }
function isDone(id) { return localStorage.getItem(progressKey(id)) === '1'; }
function markDone(id) { localStorage.setItem(progressKey(id), '1'); }
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

async function loadEpisode(id) {
  if (state.cache.has(id)) return state.cache.get(id);
  const meta = state.episodes.find(e => e.id === id);
  if (!meta) throw new Error(`Unknown episode: ${id}`);
  const data = await fetchJson(`${DATA_ROOT}${meta.file}`);
  state.cache.set(id, data);
  return data;
}

function setScreen(name, push = true) {
  state.screen = name;
  $$('.screen').forEach(el => el.classList.toggle('on', el.id === `scr-${name}`));
  $$('.tb').forEach(el => el.classList.toggle('active', el.dataset.screen === name));
  if (push) history.pushState({ screen: name }, '', `#${name}`);
  const target = $(`#scr-${name}`);
  target?.focus({ preventScroll: true });
  if (name === 'library') renderLibrary();
  if (name === 'tapestry') renderTapestry();
  if (name === 'timeline') renderTimeline();
  if (name === 'archive') renderArchive();
  if (name === 'journal') renderJournal();
  scrollTop();
}

function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function renderLibrary() {
  const root = $('#library-root');
  if (!state.episodes.length) {
    root.innerHTML = `<div class="reader-loading">Opening the Library…</div>`;
    return;
  }
  const completed = state.episodes.filter(e => isDone(e.id)).length;
  const current = state.episodes.find(e => !e.sealed && !isDone(e.id));
  const continueCard = current ? `
    <button class="continue-card v2" data-open-episode="${current.id}" type="button">
      <div class="cc-left"><div class="eyebrow">Continue the journey</div><div class="cc-title">${escapeHtml(current.title)}</div><div class="cc-meta">${escapeHtml(current.subtitle)}</div></div>
      <span class="cc-cta">Continue</span>
    </button>` : '';

  root.innerHTML = `
    <div class="library-wrap">
      <div class="library-hero">
        <div class="eyebrow">The Library of Jehovah</div>
        <h1>See. Understand. Believe.</h1>
        <p>Genesis is being opened one volume at a time. The interface is now data-driven, so future seasons can be added without rebuilding the reader.</p>
      </div>
      ${continueCard}
      <div class="archive-stat" aria-label="Progress">
        <span><b>${completed}</b> completed</span>
        <span><b>${state.episodes.filter(e => !e.sealed).length}</b> available</span>
        <span><b>${state.cache.size}</b> loaded this session</span>
      </div>
      <div class="library-grid">
        ${state.episodes.map(ep => {
          const done = isDone(ep.id);
          const sealed = ep.sealed;
          return `<button class="library-card ${done ? 'done' : ''} ${sealed ? 'sealed' : ''}" ${sealed ? 'disabled' : `data-open-episode="${ep.id}"`} type="button">
            <div class="lc-num">${escapeHtml(ep.label || ep.id)}</div>
            <div class="lc-title">${escapeHtml(ep.title)}</div>
            <div class="lc-sub">${escapeHtml(ep.subtitle)}</div>
            <span class="lc-status">${sealed ? 'Sealed' : done ? 'Completed' : 'Open'}</span>
            <div class="lc-progress"><i style="width:${done ? '100%' : '0%'}"></i></div>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  bindEpisodeButtons(root);
}

function bindEpisodeButtons(root) {
  $$('[data-open-episode]', root).forEach(btn => btn.addEventListener('click', () => openEpisode(btn.dataset.openEpisode)));
}

async function openEpisode(id, addHistory = true) {
  state.currentEpisode = id;
  setScreen('episode', addHistory);
  const root = $('#episode-root');
  root.innerHTML = `<div class="reader-loading">Opening the volume…</div>`;
  try {
    const ep = await loadEpisode(id);
    renderEpisode(ep);
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div class="reader-error"><h3>This volume could not be opened</h3><p>${escapeHtml(error.message)}</p><button class="btn" id="retryEpisode">Try again</button></div>`;
    $('#retryEpisode')?.addEventListener('click', () => openEpisode(id, false));
  }
}

function renderEpisode(ep) {
  const root = $('#episode-root');
  root.innerHTML = `
    <article class="dynamic-episode" id="dynamic-episode">
      <header class="ep-head">
        <div class="eyebrow season">${escapeHtml(ep.seasonLabel)} · ${escapeHtml(ep.label)}</div>
        <h2>${escapeHtml(ep.title)}</h2>
        <p class="ep-sub">${escapeHtml(ep.subtitle)}</p>
        <div class="ornament" aria-hidden="true"></div>
      </header>
      ${ep.sections.map((section, i) => `
        <section class="dynamic-section ep-sec" data-section-index="${i}" data-rail="${escapeHtml(section.label)}">
          <div class="sec-head"><span class="eyebrow">${escapeHtml(section.label)}</span><hr class="rule"></div>
          ${section.html}
        </section>`).join('')}
      ${renderReflection(ep)}
      ${renderEpisodeFooter(ep)}
    </article>`;
  enhanceReferences(ep);
  wireReflection(ep);
  bindEpisodeCompletion(ep);
  setupReaderProgress();
}

function renderReflection(ep) {
  if (!ep.reflection?.length) return '';
  return `<section class="dynamic-section ep-sec" data-rail="Reflection">
    <div class="sec-head"><span class="eyebrow">Reflection: your journal</span><hr class="rule"></div>
    <p class="quiet">Sit with these. Your answers are kept in your Journal on this device.</p>
    ${ep.reflection.map((q, index) => `<div class="reflect-q" data-q="${escapeAttr(q)}" data-index="${index}">
      <div class="rq">${escapeHtml(q)}</div>
      <textarea placeholder="Write your thoughts…">${escapeHtml(state.notes[ep.id]?.[index] || '')}</textarea>
    </div>`).join('')}
    <div class="reflect-actions"><button class="btn ghost" id="saveReflection" type="button">Save to journal</button><span class="save-note"></span></div>
  </section>`;
}

function renderEpisodeFooter(ep) {
  const done = isDone(ep.id);
  const next = state.episodes.find(x => Number(x.id.slice(2)) === Number(ep.id.slice(2)) + 1 && !x.sealed);
  return `<section class="episode-footer" data-rail="Completion">
    <div class="eyebrow">Close the volume</div>
    <h3>${done ? 'Episode completed' : 'Mark this episode complete'}</h3>
    <p>Completion is stored locally and determines what the Library highlights next.</p>
    ${done ? `<div class="eyebrow">✓ Recorded on this device</div>` : `<button class="btn" id="completeEpisode" type="button">Complete ${escapeHtml(ep.label)}</button>`}
    ${next ? `<div class="episode-next"><span class="eyebrow dim">Next volume</span><br><br><strong>${escapeHtml(next.title)}</strong></div>` : ''}
  </section>`;
}

function enhanceReferences(ep) {
  const root = $('#dynamic-episode');
  $$('[data-ref]', root).forEach(el => {
    const refId = el.dataset.ref;
    const ref = ep.references?.[refId];
    if (!ref) return;
    el.classList.add('ref');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', event => showReference(event.currentTarget, ref));
    el.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showReference(event.currentTarget, ref); } });
  });
  document.addEventListener('click', closeReferenceOnOutside, { once: true });
}
function closeReferenceOnOutside(event) {
  const pop = $('#reference-pop');
  if (!pop.contains(event.target)) pop.hidden = true;
  if (!pop.hidden) document.addEventListener('click', closeReferenceOnOutside, { once: true });
}
function showReference(target, ref) {
  const pop = $('#reference-pop');
  pop.innerHTML = `<div class="pop-ref">${escapeHtml(ref.label)}</div><div>${escapeHtml(ref.note)}</div>${ref.url ? `<a href="${escapeAttr(ref.url)}" target="_blank" rel="noopener">Read in the NWT ↗</a>` : ''}`;
  pop.hidden = false;
  const r = target.getBoundingClientRect();
  const w = pop.offsetWidth;
  const left = Math.min(window.innerWidth - w - 15, Math.max(15, r.left));
  const top = Math.min(window.innerHeight - pop.offsetHeight - 15, r.bottom + 10);
  pop.style.left = `${left}px`; pop.style.top = `${Math.max(15, top)}px`;
}

function wireReflection(ep) {
  const btn = $('#saveReflection');
  if (!btn) return;
  btn.addEventListener('click', () => {
    state.notes[ep.id] = $$(`.reflect-q`, $('#dynamic-episode')).map(q => $('textarea', q).value);
    saveNotes();
    $('.save-note').textContent = 'Saved to your Journal.';
    showToast('Reflection saved');
    renderJournal();
  });
}

function bindEpisodeCompletion(ep) {
  $('#completeEpisode')?.addEventListener('click', () => {
    markDone(ep.id);
    renderEpisode(ep);
    renderLibrary();
    showToast(`${ep.label} completed`);
  });
}

function setupReaderProgress() {
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    $('#reader-progress').style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.removeEventListener('scroll', setupReaderProgress._handler);
  setupReaderProgress._handler = update;
  window.addEventListener('scroll', update, { passive: true });
  update();
}

async function ensureAllEpisodesLoaded() {
  const missing = state.episodes.filter(ep => !ep.sealed && !state.cache.has(ep.id));
  await Promise.all(missing.map(loadEpisode));
}

async function renderTapestry() {
  const root = $('#tapestry-root');
  root.innerHTML = `<div class="reader-loading">Weaving the threads…</div>`;
  try {
    await ensureAllEpisodesLoaded();
    const threads = state.episodes.flatMap(ep => (state.cache.get(ep.id)?.threads || []).map(thread => ({ ...thread, epLabel: ep.label })));
    root.innerHTML = `<div class="tapestry-count">${threads.length} threads recorded across ${state.cache.size} loaded volumes</div>${threads.map((t, i) => `
      <article class="tapestry-thread" data-index="${i}">
        <div class="tt-head"><span class="tt-dot"></span><div class="tt-main"><div class="tt-title">${escapeHtml(t.title)}</div><div class="tt-refs">${escapeHtml(t.refs || '')}</div></div><div class="tt-ep">${escapeHtml(t.epLabel)}</div></div>
        <div class="tt-body">${escapeHtml(t.note || '')}</div>
      </article>`).join('')}`;
    $$('.tapestry-thread', root).forEach(card => card.addEventListener('click', () => card.classList.toggle('open')));
  } catch (e) { root.innerHTML = `<div class="archive-empty">Unable to weave the threads: ${escapeHtml(e.message)}</div>`; }
}

async function renderArchive() {
  const root = $('#archive-root');
  root.innerHTML = `<div class="reader-loading">Compiling the Archive…</div>`;
  try {
    await ensureAllEpisodesLoaded();
    const refs = new Map();
    const threads = [];
    state.cache.forEach((ep) => {
      Object.entries(ep.references || {}).forEach(([id, ref]) => refs.set(id, ref));
      threads.push(...(ep.threads || []).map(t => ({...t, episode: ep.label, episodeId: ep.id})));
    });
    root.innerHTML = `
      <div class="archive-stat"><span><b>${state.cache.size}</b> volumes loaded</span><span><b>${threads.length}</b> threads</span><span><b>${refs.size}</b> NWT reference notes</span></div>
      <section class="archive-group"><h3>Threads</h3>${threads.map(t => `<div class="archive-card"><div class="ac-title">${escapeHtml(t.title)}</div><div class="ac-meta">${escapeHtml(t.episode)} · ${escapeHtml(t.refs || '')}</div><div class="ac-body">${escapeHtml(t.note || '')}</div></div>`).join('')}</section>
      <section class="archive-group"><h3>Reference notes</h3>${[...refs.values()].map(r => `<div class="archive-card"><div class="ac-title">${escapeHtml(r.label)}</div><div class="ac-body">${escapeHtml(r.note)}${r.url ? ` <a href="${escapeAttr(r.url)}" target="_blank" rel="noopener">Open NWT ↗</a>` : ''}</div></div>`).join('')}</section>`;
  } catch (e) { root.innerHTML = `<div class="archive-empty">Unable to compile the Archive: ${escapeHtml(e.message)}</div>`; }
}

async function renderTimeline() {
  const root = $('#timeline-root');
  root.innerHTML = `<div class="reader-loading">Unrolling the chronology…</div>`;
  try {
    const items = await fetchJson('./data/timeline.json');
    root.innerHTML = items.map(item => `<article class="tl-item k-${escapeAttr(item.kind)}"><div class="tl-when">${escapeHtml(item.when)} <span class="tl-kind ${item.kind === 'derived' ? 'derived' : ''}">${escapeHtml(item.kind)}</span></div><div class="tl-what">${escapeHtml(item.what)}</div><div class="tl-note">${escapeHtml(item.note || '')}</div><button class="tl-ep" type="button" data-open-episode="${escapeAttr(item.ep)}">Open episode →</button></article>`).join('');
    bindEpisodeButtons(root);
  } catch (e) { root.innerHTML = `<div class="archive-empty">Unable to load the chronology: ${escapeHtml(e.message)}</div>`; }
}

function renderJournal() {
  const root = $('#journal-root');
  const entries = [];
  Object.entries(state.notes).forEach(([epId, answers]) => {
    const ep = state.episodes.find(e => e.id === epId);
    answers.forEach((answer, i) => {
      if (answer?.trim()) entries.push({ ep, answer, i });
    });
  });
  if (!entries.length) {
    root.innerHTML = `<div class="journal-empty">Your journal is empty. Reflections from an episode will appear here.</div>`;
    return;
  }
  root.innerHTML = `<div class="journal-controls"><button id="clearJournal" type="button">Clear journal</button></div>${entries.map(({ep,answer,i}) => `<article class="journal-entry"><div class="je-q">${escapeHtml(ep?.title || ep?.id || 'Episode')} · reflection ${i + 1}</div><div class="je-a">${escapeHtml(answer)}</div><div class="je-meta">Stored locally on this device</div></article>`).join('')}`;
  $('#clearJournal').addEventListener('click', () => {
    if (!confirm('Clear all journal entries on this device?')) return;
    state.notes = {};
    saveNotes();
    renderJournal();
    showToast('Journal cleared');
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}
function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, ' '); }

function initMotes() {
  const canvas = $('#motes');
  const ctx = canvas.getContext('2d');
  const motes = Array.from({length: 35}, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + .3, s: Math.random() * .00025 + .00008, a: Math.random() * .5 + .1 }));
  const resize = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); };
  resize(); addEventListener('resize', resize);
  const tick = () => {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for (const m of motes) { m.y -= m.s; if (m.y < -.02) m.y = 1.02; ctx.globalAlpha = m.a; ctx.fillStyle = '#d9a84e'; ctx.beginPath(); ctx.arc(m.x * innerWidth, m.y * innerHeight, m.r, 0, Math.PI * 2); ctx.fill(); }
    requestAnimationFrame(tick);
  };
  tick();
}

async function bootstrap() {
  initMotes();
  try {
    const index = await fetchJson(`${DATA_ROOT}index.json`);
    state.episodes = index.episodes.filter(ep => !ep.sealed || ep.id !== 'ep11');
    renderLibrary();
    const hashScreen = location.hash.replace('#', '');
    if (hashScreen && ['library','tapestry','timeline','archive','journal'].includes(hashScreen)) setScreen(hashScreen, false);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  } catch (e) {
    $('#library-root').innerHTML = `<div class="reader-error"><h3>The Library could not be opened</h3><p>${escapeHtml(e.message)}</p></div>`;
  }
}

document.addEventListener('click', event => {
  const tab = event.target.closest('.tb');
  if (tab) setScreen(tab.dataset.screen);
  if (event.target.closest('#brand')) setScreen('library');
});

window.addEventListener('popstate', event => {
  const screen = event.state?.screen || location.hash.replace('#', '') || 'library';
  if (screen === 'episode' && state.currentEpisode) openEpisode(state.currentEpisode, false);
  else if (['library','tapestry','timeline','archive','journal'].includes(screen)) setScreen(screen, false);
  else setScreen('library', false);
});

history.replaceState({screen:'library'}, '', location.hash || '#library');
bootstrap();
