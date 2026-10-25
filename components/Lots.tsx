"use client";

import { Suspense, useState, type RefObject } from "react";
import * as THREE from "three";
import { Edges, Html, useTexture } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { LOTS, type Lot } from "@/lib/lots";

const NO_RAYCAST = () => null;

// poster di dinding lot bertipe eksternal
function Poster({ lot }: { lot: Lot }) {
  const tex = useTexture(lot.posterUrl!);
  const size = Math.max(3, Math.min(lot.w - 2, lot.h - 4, 12));
  return (
    <mesh position={[0, -lot.h / 2 + size / 2 + 2, lot.d / 2 + 0.06]} raycast={NO_RAYCAST}>
      <planeGeometry args={[size * 0.75, size]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function labelOf(lot: Lot) {
  if (lot.kind === "web") return "▶ playable";
  if (lot.kind === "external") return "↗ link eksternal";
  return "kosong · bisa disewa";
}

export default function Lots({
  groupRef,
  selectedId,
  onSelect,
}: {
  groupRef: RefObject<THREE.Group | null>;
  selectedId: number | null;
  onSelect: (lot: Lot) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      {/* dekorasi tanpa tabrakan: alas berwarna dan sinar vertikal */}
      <group>
        {LOTS.map((lot) => (
          <group key={`deco-${lot.id}`}>
            <mesh rotation-x={-Math.PI / 2} position={[lot.x, 0.05, lot.z]} raycast={NO_RAYCAST}>
              <planeGeometry args={[lot.w + 4, lot.d + 4]} />
              <meshBasicMaterial
                color={lot.color}
                transparent
                opacity={lot.kind === "empty" ? 0.14 : 0.35}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
              />
            </mesh>
            {lot.kind !== "empty" && (
              <mesh position={[lot.x, lot.h + 30, lot.z]} raycast={NO_RAYCAST}>
                <cylinderGeometry args={[0.5, 0.5, 60, 8, 1, true]} />
                <meshBasicMaterial
                  color={lot.color}
                  transparent
                  opacity={0.4}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* gedung lot (padat, ikut dipakai kamera untuk deteksi penghalang) */}
      <group ref={groupRef}>
        {LOTS.map((lot) => {
          const isSelected = selectedId === lot.id;
          const active = hovered === lot.id || isSelected;
          const filled = lot.kind !== "empty";

          return (
            <RigidBody
              key={lot.id}
              type="fixed"
              colliders={false}
              position={[lot.x, lot.h / 2, lot.z]}
            >
              <CuboidCollider args={[lot.w / 2, lot.h / 2, lot.d / 2]} />

              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHovered(lot.id);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  setHovered((h) => (h === lot.id ? null : h));
                  document.body.style.cursor = "auto";
                }}
                onClick={(e) => {
                  if (e.delta > 4) return; // ini drag kamera, bukan klik
                  e.stopPropagation();
                  onSelect(lot);
                }}
              >
                <boxGeometry args={[lot.w, lot.h, lot.d]} />
                <meshStandardMaterial
                  color={active ? "#ffffff" : "#f4f4f3"}
                  roughness={0.9}
                  emissive={isSelected ? lot.color : "#000000"}
                  emissiveIntensity={0.12}
                />
                <Edges color={active ? "#111111" : filled ? lot.color : "#8a8a88"} />
              </mesh>

              {/* pita warna di dinding untuk lot yang sudah terisi */}
              {filled && (
                <mesh position={[0, lot.h / 2 - 1.4, 0]}>
                  <boxGeometry args={[lot.w + 0.3, 0.7, lot.d + 0.3]} />
                  <meshStandardMaterial color={lot.color} emissive={lot.color} emissiveIntensity={0.4} />
                </mesh>
              )}

              {lot.kind === "external" && lot.posterUrl && (
                <Suspense fallback={null}>
                  <Poster lot={lot} />
                </Suspense>
              )}

              {active && (
                <Html
                  position={[0, lot.h / 2 + 2, 0]}
                  center
                  zIndexRange={[10, 0]}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="whitespace-nowrap rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs shadow">
                    <b className="uppercase tracking-wide">{lot.title}</b>
                    <span className="text-neutral-500"> · {lot.owner} · ♥ {lot.likes} · {labelOf(lot)}</span>
                  </div>
                </Html>
              )}
            </RigidBody>
          );
        })}
      </group>
    </>
  );
}