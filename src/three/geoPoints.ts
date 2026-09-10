import type { GeoPoint } from '../lib/types';

/**
 * The six Genesis waypoints, ported verbatim from the legacy `geographyPoints`
 * array in `app.js`. Order matters: it defines the route Eden → Ararat → Babel
 * → Ur → Haran → Canaan drawn by the relief map. Positions are `[x, y, z]` in
 * scene units; only `x`/`z` place a waypoint on the map, while the terrain
 * supplies the surface height (`y`) at render time.
 */
export const GEO_POINTS: GeoPoint[] = [
  { id: 'eden', name: 'Eden', description: 'The garden setting introduced in Genesis 2–3.', position: [-7, 0.28, 4.5] },
  { id: 'ararat', name: 'Ararat', description: 'The mountains where the ark came to rest after the Deluge.', position: [-3.4, 0.28, 2.1] },
  { id: 'babel', name: 'Babel', description: 'The plain of Shinar, where mankind gathered and built the tower.', position: [-0.4, 0.28, 0.4] },
  { id: 'ur', name: 'Ur', description: 'Abram’s starting point before the household moved north.', position: [2.8, 0.28, -1.8] },
  { id: 'haran', name: 'Haran', description: 'The northern crossroads where Terah settled and Abram later departed from.', position: [1.2, 0.28, 2.1] },
  { id: 'canaan', name: 'Canaan', description: 'The land Jehovah promised to Abram’s offspring.', position: [-0.3, 0.28, 4.6] },
];
