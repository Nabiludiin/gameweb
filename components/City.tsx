"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Grid, Line } from "@react-three/drei";
import { GRID, PITCH, ROAD } from "@/lib/lots";

const LEN = GRID * PITCH + ROAD;
const roadCenters = Array.from({ length: GRID + 1 }, (_, k) => (k - GRID / 2) * PITCH);

function Landmark() {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);

  useFrame((state, dt) => {
    if (outer.current) {
      outer.current.rotation.x += dt * 0.15;
      outer.current.rotation.y += dt * 0.22;
      outer.current.position.y = 16 + Math.sin(state.clock.elapsedTime * 0.8) * 0.8;
    }
    if (inner.current) {
      inner.current.rotation.x -= dt * 0.3;
      inner.current.rotation.z += dt * 0.25;
    }
  });

  return (
    <group ref={outer} position={[0, 16, 0]}>
      <lineSegments geometry={edges} scale={10}>
        <lineBasicMaterial color="#111111" />
      </lineSegments>
      <group ref={inner}>
        <lineSegments geometry={edges} scale={5}>
          <lineBasicMaterial color="#111111" />
        </lineSegments>
        <lineSegments geometry={edges} scale={2.2}>
          <lineBasicMaterial color="#111111" />
        </lineSegments>
      </group>
    </group>
  );
}

export default function City() {
  return (
    <>
      {/* tanah */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshBasicMaterial color="#efefed" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        infiniteGrid
        cellSize={10}
        cellThickness={0.6}
        cellColor="#dcdcd9"
        sectionSize={40}
        sectionThickness={1}
        sectionColor="#c9c9c6"
        fadeDistance={420}
        fadeStrength={1.2}
      />

      {/* jalan + marka putus-putus */}
      {roadCenters.map((c) => (
        <group key={c}>
          <mesh rotation-x={-Math.PI / 2} position={[c, 0.03, 0]}>
            <planeGeometry args={[ROAD, LEN]} />
            <meshBasicMaterial color="#e6e6e4" polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, c]}>
            <planeGeometry args={[LEN, ROAD]} />
            <meshBasicMaterial color="#e6e6e4" polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <Line
            points={[[c, 0.06, -LEN / 2], [c, 0.06, LEN / 2]]}
            color="#bdbdba"
            lineWidth={1.5}
            dashed
            dashSize={3}
            gapSize={3}
          />
          <Line
            points={[[-LEN / 2, 0.06, c], [LEN / 2, 0.06, c]]}
            color="#bdbdba"
            lineWidth={1.5}
            dashed
            dashSize={3}
            gapSize={3}
          />
        </group>
      ))}

      {/* plaza tengah */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <ringGeometry args={[8.5, 9.5, 72]} />
        <meshBasicMaterial color="#8fe000" polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      <Landmark />
    </>
  );
}