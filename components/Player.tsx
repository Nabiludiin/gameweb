"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { BallCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useKeys } from "@/lib/useKeys";
import { isInsideLot } from "@/lib/lots";

const BALL_R = 0.5; // bola chrome (visual)
const BODY_R = 1.15; // gelembung tabrakan yang membungkus kubus kawat dan orbit
const SPEED = 14;
const BOOST = 2.5;
const JUMP = 10;
const AUTO_SPEED = 38;
const N_PARTICLES = 40;
const MOVE_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyQ"];

export type FlyTo = { x: number; z: number; top: number; cruise: number };
type Auto = { phase: 0 | 1 | 2; x: number; z: number; topY: number; cruiseY: number };
type Particle = { life: number; max: number; vx: number; vy: number; vz: number; size: number };

export default function Player({
  flying,
  obstacles,
  flyTo,
}: {
  flying: boolean;
  obstacles: RefObject<THREE.Group | null>;
  flyTo: FlyTo | null;
}) {
  const body = useRef<RapierRigidBody>(null);
  const ball = useRef<THREE.Mesh>(null);
  const visual = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const orbit = useRef<THREE.Group>(null);
  const particleObjs = useRef<(THREE.LineSegments | null)[]>([]);
  const particles = useRef<Particle[]>(
    Array.from({ length: N_PARTICLES }, () => ({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 0.15 }))
  );
  const spawnAcc = useRef(0);
  const auto = useRef<Auto | null>(null);

  const keys = useKeys();
  const { camera, gl } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0.55);
  const dist = useRef(16);
  const focus = useRef(new THREE.Vector3(0, 3, 0));
  const tmp = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const axis = useRef(new THREE.Vector3());
  const idleAxis = useRef(new THREE.Vector3(0.6, 0.2, 0.8).normalize());
  const raycaster = useRef(new THREE.Raycaster());

  const cubeEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#1a1a1a" }), []);

  // klik lot -> bola terbang ke atap
  useEffect(() => {
    if (!flyTo) return;
    auto.current = {
      phase: 0,
      x: flyTo.x,
      z: flyTo.z,
      topY: flyTo.top + BODY_R + 0.1,
      cruiseY: flyTo.cruise,
    };
  }, [flyTo]);

  // putar kamera dengan drag, zoom dengan scroll
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      yaw.current -= (e.clientX - lx) * 0.005;
      pitch.current = THREE.MathUtils.clamp(pitch.current + (e.clientY - ly) * 0.005, -0.2, 1.45);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      dist.current = THREE.MathUtils.clamp(dist.current + e.deltaY * 0.02, 4, 60);
    };
    const noMenu = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", noMenu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", noMenu);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const b = body.current;
    if (!b) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const p = b.translation();

    // kamera diputar dengan tombol panah
    const turn = 1.8 * dt;
    if (k.has("ArrowLeft")) yaw.current -= turn;
    if (k.has("ArrowRight")) yaw.current += turn;
    if (k.has("ArrowUp")) pitch.current -= turn;
    if (k.has("ArrowDown")) pitch.current += turn;
    pitch.current = THREE.MathUtils.clamp(pitch.current, -0.2, 1.45);

    // tombol gerak membatalkan autopilot
    if (auto.current && MOVE_KEYS.some((c) => k.has(c))) auto.current = null;

    let vx: number;
    let vy: number;
    let vz: number;

    const a = auto.current;
    if (a) {
      // ---------- autopilot: naik -> meluncur -> mendarat di atap ----------
      let tx = p.x;
      let ty = p.y;
      let tz = p.z;
      if (a.phase === 0) {
        ty = a.cruiseY;
        if (p.y >= a.cruiseY - 0.6) a.phase = 1;
      }
      if (a.phase === 1) {
        tx = a.x;
        tz = a.z;
        ty = a.cruiseY;
        if (Math.hypot(p.x - a.x, p.z - a.z) < 1) a.phase = 2;
      }
      if (a.phase === 2) {
        tx = a.x;
        tz = a.z;
        ty = a.topY;
        if (Math.abs(p.y - a.topY) < 0.35 && Math.hypot(p.x - a.x, p.z - a.z) < 1) {
          auto.current = null;
        }
      }
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dz = tz - p.z;
      const dl = Math.hypot(dx, dy, dz) || 1;
      const sp = Math.min(AUTO_SPEED, dl * 3);
      vx = (dx / dl) * sp;
      vy = (dy / dl) * sp;
      vz = (dz / dl) * sp;
      b.setGravityScale(0, false);
    } else {
      // ---------- kontrol manual (arah relatif kamera) ----------
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      const f = (k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0);
      const r = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
      let mx = -sin * f + cos * r;
      let mz = -cos * f - sin * r;
      const len = Math.hypot(mx, mz);
      if (len > 0) {
        mx /= len;
        mz /= len;
      }

      const speed = SPEED * (k.has("ShiftLeft") || k.has("ShiftRight") ? BOOST : 1);
      const t = 1 - Math.exp(-10 * dt);
      const v = b.linvel();

      vx = v.x + (mx * speed - v.x) * t;
      vz = v.z + (mz * speed - v.z) * t;
      vy = v.y;

      if (flying) {
        const up = (k.has("Space") ? 1 : 0) - (k.has("KeyQ") ? 1 : 0);
        vy = v.y + (up * speed * 0.8 - v.y) * t;
      } else if (k.has("Space") && Math.abs(v.y) < 0.15) {
        vy = JUMP;
      }
      b.setGravityScale(flying ? 0 : 1, false);
    }

    b.setLinvel({ x: vx, y: vy, z: vz }, true);

    // ---------- animasi karakter ----------
    const time = state.clock.elapsedTime;
    const hs = Math.hypot(vx, vz);

    if (visual.current) visual.current.position.y = Math.sin(time * 2.2) * 0.12;

    if (ball.current) {
      if (hs > 0.05) {
        axis.current.set(vz, 0, -vx).normalize();
        ball.current.rotateOnWorldAxis(axis.current, (hs * dt) / BALL_R);
      }
      ball.current.rotateOnAxis(idleAxis.current, dt * 0.8);
    }
    if (shell.current) {
      shell.current.rotation.x += dt * (0.45 + Math.min(hs, 20) * 0.05);
      shell.current.rotation.y += dt * (0.7 + Math.min(hs, 20) * 0.08);
    }
    if (orbit.current) {
      orbit.current.rotation.y += dt * 1.6;
      orbit.current.rotation.x = Math.sin(time) * 0.4;
    }

    // ---------- partikel kubus kawat ----------
    const sp = Math.hypot(vx, vy, vz);
    if (sp > 1.5) spawnAcc.current += dt * Math.min(sp, 22) * 1.4;
    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;
      const i = particles.current.findIndex((q) => q.life <= 0);
      if (i < 0) break;
      const q = particles.current[i];
      const o = particleObjs.current[i];
      if (!o) continue;
      q.max = q.life = 0.8 + Math.random() * 0.8;
      q.size = 0.1 + Math.random() * 0.2;
      q.vx = -vx * 0.12 + (Math.random() - 0.5) * 1.5;
      q.vy = -vy * 0.12 + (Math.random() - 0.2) * 1.5;
      q.vz = -vz * 0.12 + (Math.random() - 0.5) * 1.5;
      o.position.set(
        p.x + (Math.random() - 0.5) * 0.8,
        p.y + (Math.random() - 0.5) * 0.8,
        p.z + (Math.random() - 0.5) * 0.8
      );
      o.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      o.scale.setScalar(q.size);
      o.visible = true;
    }
    for (let i = 0; i < particles.current.length; i++) {
      const q = particles.current[i];
      const o = particleObjs.current[i];
      if (!o) continue;
      if (q.life <= 0) {
        o.visible = false;
        continue;
      }
      q.life -= dt;
      o.position.x += q.vx * dt;
      o.position.y += q.vy * dt;
      o.position.z += q.vz * dt;
      // partikel hilang kalau menyentuh gedung atau lantai (tidak tembus)
      if (o.position.y < 0.05 || isInsideLot(o.position.x, o.position.y, o.position.z, 0.12)) {
        q.life = 0;
        o.visible = false;
        continue;
      }
      o.rotation.x += dt * 2;
      o.rotation.y += dt * 1.5;
      o.scale.setScalar((q.size * Math.max(q.life, 0)) / q.max);
    }

    // ---------- kamera ----------
    focus.current.lerp(tmp.current.set(p.x, p.y, p.z), 1 - Math.exp(-14 * dt));

    const cp = Math.cos(pitch.current);
    dir.current.set(Math.sin(yaw.current) * cp, Math.sin(pitch.current), Math.cos(yaw.current) * cp);

    let d = dist.current;
    const group = obstacles.current;
    if (group) {
      raycaster.current.set(focus.current, dir.current);
      raycaster.current.far = d;
      const hit = raycaster.current
        .intersectObjects(group.children, true)
        .find((h) => (h.object as THREE.Mesh).isMesh);
      if (hit) d = Math.max(1.5, hit.distance - 0.6);
    }

    camera.position.copy(focus.current).addScaledVector(dir.current, d);
    camera.position.y = Math.max(camera.position.y, 0.4);
    camera.lookAt(focus.current);
  });

  return (
    <>
      <RigidBody ref={body} colliders={false} position={[0, 3, 0]} ccd canSleep={false} lockRotations>
        <BallCollider args={[BODY_R]} friction={0} />

        <group ref={visual}>
          <mesh ref={ball}>
            <sphereGeometry args={[BALL_R, 48, 48]} />
            <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.08} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[BALL_R + 0.005, 0.04, 16, 64]} />
              <meshStandardMaterial color="#b8ff3d" emissive="#b8ff3d" emissiveIntensity={0.5} />
            </mesh>
          </mesh>

          <lineSegments ref={shell} geometry={cubeEdges} material={lineMat} scale={1.3} />

          <group ref={orbit}>
            <lineSegments geometry={cubeEdges} material={lineMat} position={[0.72, 0, 0]} scale={0.2} />
            <lineSegments geometry={cubeEdges} material={lineMat} position={[-0.36, 0, 0.62]} scale={0.2} />
            <lineSegments geometry={cubeEdges} material={lineMat} position={[-0.36, 0, -0.62]} scale={0.2} />
          </group>
        </group>
      </RigidBody>

      {/* partikel hidup di koordinat dunia */}
      <group>
        {Array.from({ length: N_PARTICLES }, (_, i) => (
          <lineSegments
            key={i}
            ref={(el) => {
              particleObjs.current[i] = el;
            }}
            geometry={cubeEdges}
            material={lineMat}
            visible={false}
          />
        ))}
      </group>
    </>
  );
}