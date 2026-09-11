import * as THREE from 'three';

/**
 * Shared palette for the miniature dioramas — earth strata, masonry, metal,
 * timber, water and flame. Module-level singletons so every artifact shares
 * the same handful of materials (and the same look) rather than allocating
 * its own.
 */
export const MAT = {
  // earth cross-section, top layer down
  grass: new THREE.MeshStandardMaterial({ color: 0x6f8a4a, roughness: 0.96 }),
  sand: new THREE.MeshStandardMaterial({ color: 0xc9ad78, roughness: 1 }),
  soil: new THREE.MeshStandardMaterial({ color: 0x8a6b45, roughness: 1 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x6d6156, roughness: 1 }),
  ground: new THREE.MeshStandardMaterial({ color: 0xcdbb8f, roughness: 0.95 }),

  // masonry & metal
  stone: new THREE.MeshStandardMaterial({ color: 0xe3d3ad, roughness: 0.7 }),
  stoneDk: new THREE.MeshStandardMaterial({ color: 0xcbb98d, roughness: 0.75 }),
  brick: new THREE.MeshStandardMaterial({ color: 0xb07348, roughness: 0.9 }),
  brickDk: new THREE.MeshStandardMaterial({ color: 0x8d5a38, roughness: 0.95 }),
  bitumen: new THREE.MeshStandardMaterial({ color: 0x2e2823, roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd8b04a, roughness: 0.28, metalness: 0.85 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0x9c7b4f, roughness: 0.4, metalness: 0.75 }),

  // timber & growth
  cedar: new THREE.MeshStandardMaterial({ color: 0x7a4b2b, roughness: 0.85 }),
  gopher: new THREE.MeshStandardMaterial({ color: 0x6b452a, roughness: 0.92 }),
  gopherDk: new THREE.MeshStandardMaterial({ color: 0x54371f, roughness: 0.95 }),
  /** Deck planking — lighter than the hull so the decks read in a cutaway. */
  deck: new THREE.MeshStandardMaterial({ color: 0xa97c4e, roughness: 0.8 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x8a6a3f, roughness: 0.9 }),
  frond: new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: 0.85, side: THREE.DoubleSide }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x557a3c, roughness: 1 }),
  fruit: new THREE.MeshStandardMaterial({ color: 0xc4452f, roughness: 0.6 }),

  // water & fire
  water: new THREE.MeshStandardMaterial({
    color: 0x2f6f7a,
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0x0d2b30,
    emissiveIntensity: 0.4,
  }),
  flame: new THREE.MeshBasicMaterial({ color: 0xff6a1e, transparent: true, opacity: 0.92 }),
  flameCore: new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 }),

  // scale figures
  person: new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.9 }),
};
