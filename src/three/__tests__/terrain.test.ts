import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildTerrain, sampleHeight, TERRAIN_WIDTH, TERRAIN_DEPTH } from '../terrain';

describe('buildTerrain', () => {
  it('returns a BufferGeometry with a position attribute of the expected vertex count', () => {
    const segX = 128;
    const segZ = 96;
    const geometry = buildTerrain(TERRAIN_WIDTH, TERRAIN_DEPTH, segX, segZ);

    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);

    const position = geometry.getAttribute('position');
    expect(position).toBeTruthy();
    // A subdivided plane has (segX + 1) * (segZ + 1) vertices.
    expect(position.count).toBe((segX + 1) * (segZ + 1));

    // Normals are computed for correct lighting.
    expect(geometry.getAttribute('normal')).toBeTruthy();
  });

  it('produces finite, bounded vertex positions', () => {
    const geometry = buildTerrain(TERRAIN_WIDTH, TERRAIN_DEPTH, 32, 24);
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;

    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
      // X/Z stay within the plane footprint.
      expect(Math.abs(x)).toBeLessThanOrEqual(TERRAIN_WIDTH / 2 + 1e-6);
      expect(Math.abs(z)).toBeLessThanOrEqual(TERRAIN_DEPTH / 2 + 1e-6);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Height (world Y) is bounded within the designed relief range.
    expect(minY).toBeGreaterThan(-5);
    expect(maxY).toBeLessThan(5);
    // The surface actually has relief (not a flat plane).
    expect(maxY - minY).toBeGreaterThan(0.5);
  });

  it('sampleHeight is deterministic and finite', () => {
    for (const [x, z] of [
      [0, 0],
      [-7, 4.5],
      [2.8, -1.8],
      [13, 9],
      [-13, -9],
    ] as Array<[number, number]>) {
      const a = sampleHeight(x, z);
      const b = sampleHeight(x, z);
      expect(a).toBe(b);
      expect(Number.isFinite(a)).toBe(true);
    }
  });
});
