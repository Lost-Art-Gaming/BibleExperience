import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const ROOT = new URL('.', document.baseURI);
const state = { screen: 'home', episodes: [], timeline: [], activeEpisode: null, progress: Number(localStorage.getItem('bible-experience-progress') || 12), bookmarks: JSON.parse(localStorage.getItem('bible-experience-bookmarks') || '[]') };
const $ = (s) => document.querySelector(s);
const esc = (v='') => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const toast = (m) => { const el=$('#toast'); el.textContent=m; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); };

async function loadData(){
  const get = async p => (await fetch(new URL(p, ROOT))).json();
  const index = await get('data/Genesis/index.json');
  state.episodes = index.episodes;
  state.timeline = await get('data/timeline.json');
}

function icon(name){
  const paths={home:'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z',book:'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zm0 0v17',map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15',clock:'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 4v5l3 2',users:'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm5-6a3 3 0 0 1 0 6m1 3h1a4.5 4.5 0 0 1 4.5 4.5V20',search:'M20 20l-4-4m1-5.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z',bookmark:'M6 3h12v18l-6-3-6 3z',play:'M8 5l11 7-11 7z',arrow:'M5 12h14m-6-6 6 6-6 6',spark:'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z'};
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.spark}"/></svg>`;
}

function nav(){
 return `<nav class="nav"><button data-nav="home" class="${state.screen==='home'?'active':''}">${icon('home')}<span>Home</span></button><button data-nav="journey" class="${state.screen==='journey'?'active':''}">${icon('book')}<span>Journey</span></button><button data-nav="explore" class="${state.screen==='explore'?'active':''}">${icon('map')}<span>Explore</span></button><button data-nav="timeline" class="${state.screen==='timeline'?'active':''}">${icon('clock')}<span>Timeline</span></button><button data-nav="library" class="${state.screen==='library'?'active':''}">${icon('users')}<span>Library</span></button></nav>`;
}

function shell(content){ $('#app').innerHTML=`<div class="app"><header class="top"><div class="brand"><img src="assets/logo.svg"/><div><strong>THE BIBLE EXPERIENCE</strong><small>See. Understand. Believe.</small></div></div><button class="icon-btn" id="searchBtn">${icon('search')}</button></header><main>${content}</main>${nav()}</div>`; bind(); }

function home(){
 const next=state.episodes.find(e=>!isDone(e.id))||state.episodes[0];
 shell(`<section class="hero"><div class="hero-art"><div class="stars"></div><div class="mountains"></div><div class="figure"></div><span class="hero-chip">SEASON 1 · ORIGINS</span><div class="hero-copy"><p class="eyebrow">GO DEEPER</p><h1>See the<br/><em>bigger picture.</em></h1><p>An interactive journey through Jehovah's Word—connecting Scripture, history, geography and prophecy.</p><button class="primary" data-episode="${next.id}">${icon('play')} Continue your journey</button></div></div></section><section class="section"><div class="section-head"><div><span class="eyebrow">YOUR JOURNEY</span><h2>Walk through the Bible</h2></div><span class="percent">${state.progress}%</span></div><div class="progress"><i style="width:${state.progress}%"></i></div><div class="stats"><span><b>${doneCount()}</b> Episodes</span><span><b>${state.timeline.length}</b> Timeline events</span><span><b>${state.bookmarks.length}</b> Saved</span></div></section><section class="section"><div class="section-head"><div><span class="eyebrow">EXPLORE</span><h2>Go beyond the page</h2></div></div><div class="feature-grid"><button data-nav="explore" class="feature"><div class="feature-art map-art">${icon('map')}</div><b>Biblical Geography</b><span>Walk the places of Scripture</span></button><button data-nav="timeline" class="feature"><div class="feature-art time-art">${icon('clock')}</div><b>Biblical Timeline</b><span>See Jehovah's purpose unfold</span></button><button data-nav="journey" class="feature"><div class="feature-art book-art">${icon('book')}</div><b>Scripture Journey</b><span>Read, reflect and discover</span></button></div></section><section class="section themes"><div class="section-head"><div><span class="eyebrow">THEMES UNFOLDING</span><h2>Threads through Scripture</h2></div></div><div class="theme-list"><span>The Seed <b>78%</b></span><span>Jehovah's Kingdom <b>61%</b></span><span>Sacrifice & Atonement <b>64%</b></span><span>Jehovah's Sovereignty <b>59%</b></span></div></section>`);
}

function journey(){
 const cards=state.episodes.map((e,i)=>`<button class="episode-card ${isDone(e.id)?'done':''}" data-episode="${e.id}"><div class="ep-image ep-${(i%6)+1}"><span>S${e.season}E${i+1}</span></div><div class="ep-body"><small>${esc(e.label)}</small><h3>${esc(e.title.replace(/[“”]/g,''))}</h3><p>${esc(e.subtitle)}</p><span class="card-action">${isDone(e.id)?'Completed':'Explore'} ${icon('arrow')}</span></div></button>`).join('');
 shell(`<section class="page-head"><span class="eyebrow">WALK WITH SCRIPTURE</span><h1>Origins</h1><p>From creation to the promise given to Abraham. Ten episodes, one unfolding story.</p></section><section class="season-banner"><div><small>SEASON 1 · ORIGINS</small><h2>The beginning of the story.</h2><p>Genesis 1–12 · ${state.episodes.length} experiences</p></div><div class="banner-orb"></div></section><div class="episode-grid">${cards}</div>`);
}

async function episode(id){
 const meta=state.episodes.find(e=>e.id===id); if(!meta)return;
 const data=await (await fetch(new URL(`data/Genesis/${meta.file}`,ROOT))).json(); state.activeEpisode=id;
 shell(`<section class="reader"><button class="back" data-nav="journey">← Journey</button><div class="reader-hero"><span class="hero-chip">${esc(meta.label)}</span><h1>${esc(meta.title.replace(/[“”]/g,''))}</h1><p>${esc(meta.subtitle)}</p></div><div class="reader-tools"><span>${data.sections?.length||0} sections</span><button id="bookmark">${icon('bookmark')} ${state.bookmarks.includes(id)?'Saved':'Save'}</button></div><article>${(data.sections||[]).map(s=>`<section class="reading-section"><span class="eyebrow">${esc(s.label)}</span>${s.html}</section>`).join('')}</article><button class="complete primary" id="complete">${isDone(id)?'Completed ✓':'Mark episode complete'} ${icon('arrow')}</button></section>`);
 if(state.bookmarks.includes(id)) $('#bookmark').classList.add('saved');
}

function timeline(){
 shell(`<section class="page-head"><span class="eyebrow">CHRONOLOGY</span><h1>The road through Genesis</h1><p>Explore the sequence of events and distinguish anchored dates from approximate or undated placements.</p></section><div class="legend"><span><i class="anchor"></i>Anchor</span><span><i class="derived"></i>Derived</span><span><i class="approx"></i>Approx.</span><span><i class="undated"></i>Undated</span></div><section class="timeline">${state.timeline.map((x,i)=>`<button class="tl-item ${x.kind}" data-episode="${x.ep}"><span class="tl-dot"></span><div><small>${esc(x.when)}</small><h3>${esc(x.what)}</h3><p>${esc(x.note)}</p></div><span class="tl-no">${String(i+1).padStart(2,'0')}</span></button>`).join('')}</section>`);
}

function explore(){
 shell(`<section class="page-head compact"><span class="eyebrow">BIBLICAL GEOGRAPHY</span><h1>Walk the Exodus.</h1><p>Touch and drag the scene. This MVP uses a lightweight Three.js terrain experience designed to degrade gracefully on slower phones.</p></section><section class="scene-card"><div id="threeScene"></div><div class="scene-overlay"><span class="hero-chip">EXODUS ROUTE</span><h2>From Egypt to Sinai</h2><p>Follow the journey through desert terrain.</p></div><div class="scene-controls"><button id="sceneReset">Reset view</button><button id="sceneSpin">Auto rotate</button></div></section><div class="location-grid"><button><b>Egypt</b><span>Land of slavery</span></button><button><b>Red Sea</b><span>Jehovah opens the way</span></button><button><b>Sinai</b><span>Mountain of God</span></button></div>`); initThree();
}

function library(){
 shell(`<section class="page-head"><span class="eyebrow">THE LIBRARY</span><h1>Discover more.</h1><p>People, themes, Scripture references and evidence will grow from the same data-driven foundation.</p></section><div class="library-grid"><button><span>${icon('users')}</span><b>People & Genealogy</b><small>Trace the family lines</small></button><button><span>${icon('search')}</span><b>Verse Insights</b><small>Study the text in context</small></button><button><span>${icon('map')}</span><b>Archaeological Evidence</b><small>Explore places and findings</small></button><button><span>${icon('spark')}</span><b>Original Languages</b><small>Hebrew & Greek word studies</small></button></div><div class="quote-card"><span class="eyebrow">THE CENTRAL THREAD</span><blockquote>“You are worthy, Jehovah our God, to receive the glory and the honor and the power.”</blockquote><cite>Revelation 4:11 · New World Translation</cite></div>`);
}

function doneCount(){return state.episodes.filter(e=>isDone(e.id)).length}
function isDone(id){return localStorage.getItem(`episode:${id}`)==='done'}
function setScreen(s){state.screen=s; ({home,journey,timeline,explore,library}[s]||home)();}
function bind(){
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>setScreen(b.dataset.nav));
 document.querySelectorAll('[data-episode]').forEach(b=>b.onclick=()=>episode(b.dataset.episode));
 $('#searchBtn')?.addEventListener('click',()=>toast('Search is planned for the next MVP slice.'));
 $('#bookmark')?.addEventListener('click',()=>{const id=state.activeEpisode;if(state.bookmarks.includes(id))state.bookmarks=state.bookmarks.filter(x=>x!==id);else state.bookmarks.push(id);localStorage.setItem('bible-experience-bookmarks',JSON.stringify(state.bookmarks));episode(id)});
 $('#complete')?.addEventListener('click',()=>{const id=state.activeEpisode;localStorage.setItem(`episode:${id}`,'done');state.progress=Math.min(100,Math.round(doneCount()/Math.max(1,state.episodes.length)*100));localStorage.setItem('bible-experience-progress',state.progress);toast('Episode added to your journey');episode(id)});
 $('#sceneReset')?.addEventListener('click',()=>window.__three?.reset()); $('#sceneSpin')?.addEventListener('click',()=>window.__three?.toggle());
}

function initThree(){
 const host=$('#threeScene'); if(!host)return;
 const scene=new THREE.Scene(); scene.background=new THREE.Color(0x071018); scene.fog=new THREE.Fog(0x071018,18,48);
 const camera=new THREE.PerspectiveCamera(45,host.clientWidth/Math.max(1,host.clientHeight),.1,100); camera.position.set(10,7,13);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(host.clientWidth,host.clientHeight); host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xc9d8e8,0x21170f,2)); const sun=new THREE.DirectionalLight(0xffd79a,3);sun.position.set(-8,14,5);scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(55,55,40,40),new THREE.MeshStandardMaterial({color:0x4b4031,roughness:1}));ground.rotation.x=-Math.PI/2;scene.add(ground);
 for(let i=0;i<85;i++){const h=.25+Math.random()*3.2;const m=new THREE.Mesh(new THREE.ConeGeometry(.45+Math.random()*.8,h,5),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.08,.22,.16+Math.random()*.13),roughness:1}));m.position.set((Math.random()-.5)*38,h/2-0.1,(Math.random()-.5)*30);scene.add(m)}
 const path=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12,.08,8),new THREE.Vector3(-6,.08,4),new THREE.Vector3(-2,.08,6),new THREE.Vector3(3,.08,1),new THREE.Vector3(8,.08,-5)]),new THREE.LineBasicMaterial({color:0xd7aa57}));scene.add(path);
 const marker=new THREE.Mesh(new THREE.SphereGeometry(.45,16,16),new THREE.MeshStandardMaterial({color:0xe4b75e,emissive:0x6b4312,emissiveIntensity:1}));marker.position.set(-12,.45,8);scene.add(marker);
 let down=null,rot=false,az=.65; host.onpointerdown=e=>down={x:e.clientX}; host.onpointermove=e=>{if(down){az+=(e.clientX-down.x)*.006;down.x=e.clientX}};host.onpointerup=()=>down=null;
 const reset=()=>{az=.65;camera.position.set(10,7,13)}; const toggle=()=>{rot=!rot}; window.__three={reset,toggle};
 const resize=()=>{camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};new ResizeObserver(resize).observe(host);
 const tick=()=>{requestAnimationFrame(tick);if(rot)az+=.002;camera.position.x=Math.sin(az)*16;camera.position.z=Math.cos(az)*16;camera.lookAt(0,1,0);marker.position.y=.55+Math.sin(performance.now()*.003)*.12;renderer.render(scene,camera)};tick();
}

loadData().then(home).catch(err=>{console.error(err);$('#app').innerHTML='<div class="fatal">Unable to load the Library. Check that the GitHub Pages deployment includes the data folder.</div>'});
