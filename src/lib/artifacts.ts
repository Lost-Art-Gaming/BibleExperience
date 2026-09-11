import { isDone } from './storage';

/**
 * Artifacts — the geography and buildings of Genesis, modelled as miniature
 * dioramas. Each is *uncovered* by completing the episode that tells its
 * story, so the Explore collection grows with the journey.
 *
 * This module is deliberately free of three.js imports: the collection grid,
 * gating and legends render without pulling the 3D bundle, which loads only
 * when a diorama is actually opened.
 */

export interface ArtifactLegendItem {
  /** Swatch colour (matches the material in the scene). */
  color: string;
  label: string;
  note: string;
}

export interface Artifact {
  id: string;
  name: string;
  kind: 'place' | 'building';
  /** Completing this episode uncovers the artifact. */
  episode: string;
  /** Scripture the model is built from. */
  citation: string;
  blurb: string;
  legend: ArtifactLegendItem[];
  /** Label for the cutaway toggle, when the model has one. */
  cutaway?: string;
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'eden',
    name: 'Eden',
    kind: 'place',
    episode: 'ep2',
    citation: 'Genesis 2:8-14',
    blurb:
      'A garden planted eastward, with a river that parted into four heads — and at its centre, two trees that would decide everything.',
    legend: [
      { color: '#d8b04a', label: 'The tree of life', note: 'at the middle of the garden.' },
      { color: '#c4452f', label: 'The tree of knowledge', note: 'of good and bad — the one command.' },
      { color: '#2f6f7a', label: 'The river', note: 'rising in Eden and parting into four heads.' },
      { color: '#4f7a3a', label: 'Every tree pleasing', note: 'to the sight and good for food.' },
    ],
  },
  {
    id: 'ark',
    name: 'The Ark',
    kind: 'building',
    episode: 'ep6',
    citation: 'Genesis 6:14-16',
    blurb:
      'Three hundred cubits by fifty by thirty — a chest of gopher wood, sealed inside and out with tar, built in three decks.',
    legend: [
      { color: '#6b452a', label: 'Gopher wood', note: '300 × 50 × 30 cubits — roughly 135 × 22 × 13 metres.' },
      { color: '#2e2823', label: 'Tar, inside and out', note: 'sealed against the waters.' },
      { color: '#7a4b2b', label: 'Three decks', note: 'lower, second and third.' },
      { color: '#e3d3ad', label: 'The door in its side', note: 'and a window finished to a cubit above.' },
      { color: '#3a3f4a', label: 'Figures for scale', note: 'the vessel dwarfs them.' },
    ],
    cutaway: 'Decks',
  },
  {
    id: 'noah-altar',
    name: 'The Altar & the Bow',
    kind: 'building',
    episode: 'ep8',
    citation: 'Genesis 8:20; 9:12-16',
    blurb:
      'On washed ground Noah built an altar and offered up burnt offerings — and a bow was set in the cloud, pointed away from the earth.',
    legend: [
      { color: '#cbb98d', label: 'An altar of stones', note: 'the first act on a cleansed earth.' },
      { color: '#ff6a1e', label: 'Burnt offering', note: 'a restful, pleasing aroma.' },
      { color: '#7a9fd8', label: 'The bow in the cloud', note: 'the sign of the covenant, for all generations.' },
      { color: '#2f6f7a', label: 'Receding water', note: 'pools still standing on the drying ground.' },
    ],
  },
  {
    id: 'babel',
    name: 'The Tower of Babel',
    kind: 'building',
    episode: 'ep9',
    citation: 'Genesis 11:3-4',
    blurb:
      'On the plain of Shinar they made bricks and baked them, using tar for mortar — a tower with its top in the heavens, to make a name.',
    legend: [
      { color: '#b07348', label: 'Baked brick', note: '"Let us make bricks and bake them with fire."' },
      { color: '#2e2823', label: 'Tar for mortar', note: 'bitumen from the plain.' },
      { color: '#8d5a38', label: 'Receding stages', note: 'a ziggurat climbing toward the heavens.' },
      { color: '#7a4b2b', label: 'Unfinished summit', note: 'scaffolding at the top — the work stops here.' },
      { color: '#3a3f4a', label: 'The builders', note: 'one people, one language — until they were scattered.' },
    ],
  },
];

export function getArtifact(id: string): Artifact | undefined {
  return ARTIFACTS.find((a) => a.id === id);
}

/** Artifacts uncovered by a given episode (rendered inside the reader). */
export function artifactsForEpisode(episodeId: string): Artifact[] {
  return ARTIFACTS.filter((a) => a.episode === episodeId);
}

/** An artifact is uncovered once the episode that tells its story is complete. */
export function isArtifactUnlocked(artifact: Artifact, done: (id: string) => boolean = isDone): boolean {
  return done(artifact.episode);
}

export function unlockedCount(done: (id: string) => boolean = isDone): number {
  return ARTIFACTS.filter((a) => isArtifactUnlocked(a, done)).length;
}
