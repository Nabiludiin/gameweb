"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import City from "@/components/City";
import Player, { type FlyTo } from "@/components/Player";
import Lots from "@/components/Lots";
import LotPanel from "@/components/LotPanel";
import GameModal from "@/components/GameModal";
import { LOTS, type Lot } from "@/lib/lots";

const TALLEST = Math.max(...LOTS.map((l) => l.h));

export default function World() {
  const obstacles = useRef<THREE.Group>(null);
  const [flying, setFlying] = useState(true);
  const [selected, setSelected] = useState<Lot | null>(null);
  const [playing, setPlaying] = useState<Lot | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF" && !e.repeat) setFlying((f) => !f);
      if (e.code === "Escape") {
        setPlaying(null);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (lot: Lot) => {
    setSelected(lot);
    setFlyTo({ x: lot.x, z: lot.z, top: lot.h, cruise: TALLEST + 4 });
  };

  return (
    <div className="absolute inset-0">
      <Canvas
        frameloop={playing ? "never" : "always"}
        camera={{ position: [0, 9, 16], fov: 50, near: 0.5, far: 1200 }}
      >
        <color attach="background" args={["#f3f3f2"]} />
        <fog attach="fog" args={["#f3f3f2", 90, 320]} />

        <ambientLight intensity={0.8} />
        <directionalLight position={[40, 80, 30]} intensity={1.2} />
        <Environment preset="city" />

        <City />

        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[700, 0.5, 700]} position={[0, -0.5, 0]} />
            </RigidBody>

            <Lots groupRef={obstacles} selectedId={selected?.id ?? null} onSelect={handleSelect} />
            <Player flying={flying} obstacles={obstacles} flyTo={flyTo} />
          </Physics>
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 select-none rounded-xl bg-white/70 px-4 py-3 text-center text-xs leading-relaxed text-neutral-600 shadow backdrop-blur">
        <p className="font-semibold text-neutral-900">
          Mode: {flying ? "Terbang" : "Jalan"}{" "}
          <span className="font-normal text-neutral-500">(F untuk ganti)</span>
        </p>
        <p>WASD gerak · Shift cepat · {flying ? "Space naik · Q turun" : "Space lompat"}</p>
        <p>Panah / klik-tahan-geser: putar kamera · Scroll: zoom · Klik lot: terbang ke atapnya · Esc: tutup</p>
      </div>

      {selected && (
        <LotPanel lot={selected} onClose={() => setSelected(null)} onPlay={() => setPlaying(selected)} />
      )}
      {playing && <GameModal lot={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}