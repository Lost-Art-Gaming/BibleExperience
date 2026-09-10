// Artwork wiring, ported from the legacy artwork.js. Asset paths are built
// relative to the Vite base URL so the app works when served from a subpath.

const BASE = import.meta.env.BASE_URL;
const asset = (file: string): string => `${BASE}assets/${file}`;

export const ART: Record<string, string> = {
  ep1: asset('ep01-beginning.jpg'),
  ep2: asset('ep02-eden.jpg'),
  ep3: asset('ep03-serpent.jpg'),
  ep4: asset('ep04-east-of-eden.jpg'),
  ep5: asset('ep05-adams-story.jpg'),
  ep6: asset('ep06-noah.jpg'),
  ep7: asset('ep07-deluge.jpg'),
  ep8: asset('ep08-bow.jpg'),
  ep9: asset('ep09-babel.jpg'),
  ep10: asset('ep10-abraham.jpg'),
};

export const HOME_ART: Record<string, string> = {
  '.hero-home': asset('hero-origins.jpg'),
  '.map-feature': asset('explore-geography.jpg'),
  '.timeline-feature': asset('ep07-deluge.jpg'),
  '.journey-feature': asset('study-reflect.jpg'),
  '.season-card': asset('ep01-beginning.jpg'),
  '.quote-card': asset('study-reflect.jpg'),
  '.scene-card': asset('explore-geography.jpg'),
};

export const OVERLAYS: Record<string, string> = {
  '.season-card': 'linear-gradient(90deg,rgba(4,10,16,.84),rgba(4,10,16,.28))',
  '.quote-card': 'linear-gradient(rgba(3,8,13,.58),rgba(3,8,13,.78))',
  '.scene-card': 'linear-gradient(rgba(3,8,13,.15),rgba(3,8,13,.45))',
};

export const FALLBACKS: string[] = [
  'linear-gradient(145deg,#1a2b37,#80683f)',
  'linear-gradient(145deg,#1e3840,#8b6a3d)',
  'linear-gradient(145deg,#241e25,#8e5739)',
  'linear-gradient(145deg,#263c43,#6e5035)',
  'linear-gradient(145deg,#1c2934,#5b4739)',
  'linear-gradient(145deg,#152a36,#8a6c47)',
];

export const LIGHT_FALLBACKS: string[] = [
  'linear-gradient(145deg,#dfe6e5,#b99a68)',
  'linear-gradient(145deg,#dce7e6,#c0a06b)',
  'linear-gradient(145deg,#e5dedb,#bd8866)',
  'linear-gradient(145deg,#dce5e3,#b59b78)',
  'linear-gradient(145deg,#e1e5e5,#ad9a84)',
  'linear-gradient(145deg,#dbe5e7,#bda47b)',
];

export function episodeArt(id: string): string {
  return ART[id] || asset('ep01-beginning.jpg');
}

export function overlayFor(key: string): string | undefined {
  return OVERLAYS[key];
}
