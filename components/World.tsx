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
import AuthModal from "@/components/AuthModal";
import LotForm from "@/components/LotForm";
import { LOTS, type Lot } from "@/lib/lots";
import { useLots } from "@/lib/useLots";
import { useUser } from "@/lib/useUser";
import { isTyping } from "@/lib/useKeys";
import { supabase } from "@/lib/supabase";

const TALLEST = Math.max(...LOTS.map((l) => l.h));

type FormState = { lotId: number; mode: "rent" | "edit" } | null;

export default function World() {
  const obstacles = useRef<THREE.Group>(null);
  const { lots, refresh } = useLots();
  const user = useUser();

  const [flying, setFlying] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [form, setForm] = useState<FormState>(null);

  const selected = lots.find((l) => l.id === selectedId) ?? null;
  const playing = lots.find((l) => l.id === playingId) ?? null;
  const formLot = form ? (lots.find((l) => l.id === form.lotId) ?? null) : null;
  const userName = user
    ? String(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "pemain")
    : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setPlayingId(null);
        setSelectedId(null);
        setAuthOpen(false);
        setForm(null);
        return;
      }
      if (isTyping(e)) return;
      if (e.code === "KeyF" && !e.repeat) setFlying((f) => !f);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (lot: Lot) => {
    setSelectedId(lot.id);
    setFlyTo({ x: lot.x, z: lot.z, top: lot.h, cruise: TALLEST + 4 });
  };

  const release = async (lot: Lot) => {
    if (!supabase) return;
    if (!window.confirm(`Lepas lot "${lot.title}"? Isinya akan dihapus.`)) return;
    const { error } = await supabase.from("lot_claims").delete().eq("lot_id", lot.id);
    if (error) window.alert(error.message);
    await refresh();
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

            <Lots
              lots={lots}
              groupRef={obstacles}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />
            <Player flying={flying} obstacles={obstacles} flyTo={flyTo} />
          </Physics>
        </Suspense>
      </Canvas>

      {/* akun */}
      {supabase && (
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
          {user ? (
            <>
              <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm shadow backdrop-blur">
                ● {userName}
              </span>
              <button
                onClick={() => supabase?.auth.signOut()}
                className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm shadow backdrop-blur hover:bg-white"
              >
                Keluar
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white shadow"
            >
              Masuk
            </button>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 select-none rounded-xl bg-white/70 px-4 py-3 text-center text-xs leading-relaxed text-neutral-600 shadow backdrop-blur">
        <p className="font-semibold text-neutral-900">
          Mode: {flying ? "Terbang" : "Jalan"}{" "}
          <span className="font-normal text-neutral-500">(F untuk ganti)</span>
        </p>
        <p>WASD gerak · Shift cepat · {flying ? "Space naik · Q turun" : "Space lompat"}</p>
        <p>Panah / klik-tahan-geser: putar kamera · Scroll: zoom · Klik lot: terbang ke atapnya · Esc: tutup</p>
      </div>

      {selected && (
        <LotPanel
          lot={selected}
          user={user}
          accountsEnabled={!!supabase}
          onClose={() => setSelectedId(null)}
          onPlay={() => setPlayingId(selected.id)}
          onLogin={() => setAuthOpen(true)}
          onRent={() => setForm({ lotId: selected.id, mode: "rent" })}
          onEdit={() => setForm({ lotId: selected.id, mode: "edit" })}
          onRelease={() => release(selected)}
        />
      )}

      {playing && <GameModal lot={playing} onClose={() => setPlayingId(null)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {form && formLot && user && (
        <LotForm
          key={`${form.lotId}-${form.mode}`}
          lot={formLot}
          user={user}
          mode={form.mode}
          onClose={() => setForm(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}