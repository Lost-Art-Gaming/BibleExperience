import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Figure } from '../Diorama';
import { MAT } from '../dioramaMaterials';

// 1 cubit ≈ 0.45 scene units, so 300 × 50 × 30 cubits reads at true proportion.
const C = 0.45;
const L = 300 * C; // 135 — length
const W = 50 * C; // 22.5 — breadth
const H = 30 * C; // 13.5 — height
const BASE = 1.2; // ground surface
const T = 1; // timber thickness

/**
 * The Ark — a chest of gopher wood, 300 × 50 × 30 cubits, sealed with tar
 * inside and out and built in three decks. Genesis 6:14-16.
 *
 * The cutaway lifts the roof and dissolves the near hull so the three decks
 * read from outside, the way the reference diorama opens its house.
 */
export default function Ark({ cutaway = false }: { cutaway?: boolean }) {
  // clones so fading these never touches the shared palette
  const nearMat = useMemo(() => {
    const m = MAT.gopher.clone();
    m.transparent = true;
    return m;
  }, []);
  const roofMat = useMemo(() => {
    const m = MAT.gopher.clone();
    m.transparent = true;
    return m;
  }, []);
  const pitchNear = useMemo(() => {
    const m = MAT.bitumen.clone();
    m.transparent = true;
    return m;
  }, []);

  const roof = useRef<THREE.Group>(null);
  const inner = useRef<THREE.PointLight>(null);
  const inner2 = useRef<THREE.PointLight>(null);
  const p = useRef(0);
  useFrame(() => {
    p.current += ((cutaway ? 1 : 0) - p.current) * 0.09;
    const o = 1 - p.current;
    nearMat.opacity = o;
    pitchNear.opacity = o;
    roofMat.opacity = o;
    nearMat.depthWrite = p.current < 0.5;
    pitchNear.depthWrite = p.current < 0.5;
    if (roof.current) {
      roof.current.position.y = p.current * 26;
      roof.current.visible = p.current < 0.985;
    }
    if (inner.current) inner.current.intensity = p.current * 26;
    if (inner2.current) inner2.current.intensity = p.current * 26;
  });

  const midY = BASE + H / 2;
  const deckYs = [BASE + 0.9, BASE + H * 0.36, BASE + H * 0.69];

  return (
    <group>
      {/* hull floor */}
      <mesh position={[0, BASE + 0.5, 0]} material={MAT.gopherDk} receiveShadow castShadow>
        <boxGeometry args={[L, T, W]} />
      </mesh>

      {/* far side, ends — the opaque backdrop of the cutaway */}
      <mesh position={[0, midY, -W / 2]} material={MAT.gopher} castShadow receiveShadow>
        <boxGeometry args={[L, H, T]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * L) / 2, midY, 0]} material={MAT.gopher} castShadow receiveShadow>
          <boxGeometry args={[T, H, W]} />
        </mesh>
      ))}

      {/* Three decks: lower, second and third. Each upper deck stops short of
          the bow end, so once the hull is opened all three read at once
          instead of the top one hiding the two beneath it. */}
      {deckYs.map((y, i) => {
        const len = (L - 2 * T) * (1 - i * 0.26);
        return (
          <group key={i}>
            <mesh position={[-(L - 2 * T - len) / 2, y, 0]} material={MAT.deck} receiveShadow castShadow>
              <boxGeometry args={[len, 0.6, W - 2 * T]} />
            </mesh>
            {/* the deck's edge, where it is cut through */}
            {i > 0 && (
              <mesh position={[len - (L - 2 * T) / 2, y - 1.1, 0]} material={MAT.gopherDk}>
                <boxGeometry args={[0.5, 2.6, W - 2 * T]} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* compartments — "You will make the ark with rooms" */}
      {[-0.34, -0.1, 0.16].map((f, i) => (
        <mesh key={i} position={[L * f, BASE + H * 0.2, 0]} material={MAT.gopherDk} receiveShadow>
          <boxGeometry args={[0.6, H * 0.3, W - 2 * T]} />
        </mesh>
      ))}

      {/* A soft fill inside the hull so the decks read once it is opened. It
          is kept short-range, or it washes the ground the ark sits on. */}
      <pointLight ref={inner} color={0xffe0b4} intensity={0} distance={150} decay={0.8} position={[L * 0.22, BASE + H * 1.25, 0]} />
      <pointLight ref={inner2} color={0xffe0b4} intensity={0} distance={150} decay={0.8} position={[-L * 0.28, BASE + H * 1.25, 0]} />

      {/* near side — dissolves for the cutaway */}
      <mesh position={[0, midY, W / 2]} material={nearMat} castShadow receiveShadow>
        <boxGeometry args={[L, H, T]} />
      </mesh>
      {/* the door in its side */}
      <mesh position={[L * 0.12, BASE + H * 0.3, W / 2 + 0.5]} material={nearMat} castShadow>
        <boxGeometry args={[9, 10, 0.5]} />
      </mesh>

      {/* tar, inside and out — a waterline band around the hull */}
      <mesh position={[0, BASE + H * 0.16, -W / 2 - 0.35]} material={MAT.bitumen}>
        <boxGeometry args={[L + 0.6, H * 0.32, 0.5]} />
      </mesh>
      <mesh position={[0, BASE + H * 0.16, W / 2 + 0.35]} material={pitchNear}>
        <boxGeometry args={[L + 0.6, H * 0.32, 0.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (L + 0.7)) / 2, BASE + H * 0.16, 0]} material={MAT.bitumen}>
          <boxGeometry args={[0.5, H * 0.32, W + 0.6]} />
        </mesh>
      ))}

      {/* roof, and the window finished to a cubit above — lifts away */}
      <group ref={roof}>
        <mesh position={[0, BASE + H + 0.6, 0]} material={roofMat} castShadow>
          <boxGeometry args={[L + 2, 1.2, W + 2]} />
        </mesh>
        <mesh position={[0, BASE + H + 1.6, 0]} material={roofMat} castShadow>
          <boxGeometry args={[L * 0.5, 0.9, W * 0.5]} />
        </mesh>
      </group>
      {/* the window band, just under the roofline */}
      <mesh position={[0, BASE + H - 1.2, -W / 2 - 0.3]} material={MAT.stone}>
        <boxGeometry args={[L * 0.86, 1.1, 0.4]} />
      </mesh>

      {/* plank courses, for the grain of the thing */}
      {[0.22, 0.46, 0.7].map((f, i) => (
        <mesh key={i} position={[0, BASE + H * f, -W / 2 - 0.32]} material={MAT.gopherDk}>
          <boxGeometry args={[L + 0.4, 0.45, 0.35]} />
        </mesh>
      ))}

      {/* figures — the vessel dwarfs them */}
      {[
        [-52, 30],
        [-38, 26],
        [10, 28],
        [46, 25],
        [-64, -24],
        [30, -26],
      ].map(([x, z], i) => (
        <Figure key={i} position={[x, BASE, z]} />
      ))}

      {/* stacked timber waiting to go in */}
      {[
        [-70, 34],
        [-62, 36],
        [58, -34],
      ].map(([x, z], i) => (
        <group key={i} position={[x, BASE, z]}>
          {[0, 1.4, 2.8].map((y, j) => (
            <mesh key={j} position={[0, y + 0.7, 0]} material={MAT.cedar} castShadow>
              <boxGeometry args={[14, 1.2, 4]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
