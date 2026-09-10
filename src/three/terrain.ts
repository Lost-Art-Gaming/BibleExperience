import * as THREE from 'three';
import { GEO_POINTS } from './geoPoints';

/**
 * Default terrain footprint. The map lives in the XZ plane (Y is height); these
 * are the full width (X) and depth (Z) of the plane in scene units.
 */
export const TERRAIN_WIDTH = 28;
export const TERRAIN_DEPTH = 20;

// The Genesis route projected onto the ground plane (x, z pairs). Used to carve
// a gentle valley channel that the waypoint path follows.
const ROUTE_XZ: Array<[number, number]> = GEO_POINTS.map((p) => [p.position[0], p.position[2]]);

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

// Squared distance from point (px,pz) to the line segment (ax,az)-(bx,bz).
function distSqToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  let t = lenSq > 0 ? ((px - ax) * dx + (pz - az) * dz) / lenSq : 0;
  t = clamp(t, 0, 1);
  const cx = ax + t * dx;
  const cz = az + t * dz;
  const ex = px - cx;
  const ez = pz - cz;
  return ex * ex + ez * ez;
}

// Shortest distance from (x,z) to the route polyline.
function distanceToRoute(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < ROUTE_XZ.length - 1; i++) {
    const [ax, az] = ROUTE_XZ[i];
    const [bx, bz] = ROUTE_XZ[i + 1];
    const d = distSqToSegment(x, z, ax, az, bx, bz);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// Two crossing sine ridge systems for a rolling, non-repetitive surface.
function ridges(x: number, z: number): number {
  return (
    Math.sin(x * 0.42 + 0.6) * Math.cos(z * 0.38) * 0.85 +
    Math.sin(x * 0.9 - z * 0.35) * 0.45 +
    Math.cos(x * 0.25 + z * 0.55) * 0.3
  );
}

/**
 * Deterministic procedural height at world coordinates (x, z). Combines a
 * north/east uplift (mountains), layered sine ridges, a radial edge falloff
 * that dips the borders into a low sea basin, and a shallow valley channel
 * that follows the Genesis route. No randomness — stable across renders.
 *
 * The returned value is smooth and bounded to roughly [-2.2, 2.7].
 */
export function sampleHeight(x: number, z: number): number {
  // Mountains rise toward the north/east (increasing x and z).
  const ne = clamp((x / (TERRAIN_WIDTH / 2)) * 0.55 + (z / (TERRAIN_DEPTH / 2)) * 0.5, -1, 1);
  const uplift = 1.7 * Math.pow(ne * 0.5 + 0.5, 1.5);

  // Rolling ridge detail.
  const detail = ridges(x, z) * 0.55;

  // Radial falloff — edges sink toward a low sea basin.
  const nx = x / (TERRAIN_WIDTH / 2);
  const nz = z / (TERRAIN_DEPTH / 2);
  const rad = Math.min(1, Math.sqrt(nx * nx + nz * nz));
  const edge = -1.4 * rad * rad;

  // Shallow river valley following the route.
  const d = distanceToRoute(x, z);
  const trench = -0.7 * Math.exp(-(d * d) / (2 * 1.1 * 1.1));

  return uplift + detail + edge + trench;
}

/**
 * Build a flat-lying (XZ) plane geometry whose vertices are displaced upward by
 * {@link sampleHeight} to form a stylized raised-relief map. Normals are
 * computed so the surface lights correctly.
 *
 * @param width  X extent of the plane (default {@link TERRAIN_WIDTH}).
 * @param depth  Z extent of the plane (default {@link TERRAIN_DEPTH}).
 * @param segX   Horizontal subdivisions.
 * @param segZ   Depth subdivisions.
 */
export function buildTerrain(
  width = TERRAIN_WIDTH,
  depth = TERRAIN_DEPTH,
  segX = 128,
  segZ = 96,
): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(width, depth, segX, segZ);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  // Plane is authored in its local XY plane (z = 0). Local x maps to world x;
  // local y maps to world -z (once we rotate the plane flat below). Displace
  // the local z coordinate by the sampled height.
  for (let i = 0; i < position.count; i++) {
    const worldX = position.getX(i);
    const worldZ = -position.getY(i);
    position.setZ(i, sampleHeight(worldX, worldZ));
  }
  position.needsUpdate = true;

  // Rotate so the plane lies flat: local z (height) becomes world Y.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();

  return geometry;
}
