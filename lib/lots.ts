export type LotKind = "empty" | "web" | "external";

export type Lot = {
  id: number;
  kind: LotKind;
  tier: string;
  title: string;
  description: string;
  owner: string;
  updated: string;
  capacity: number;
  plays: number;
  wins: number;
  likes: number;
  gameUrl: string | null;
  externalUrl: string | null;
  externalLabel: string | null;
  posterUrl: string | null;
  color: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
};

export const GRID = 9; // 9 x 9 blok
export const PITCH = 40; // jarak antar pusat blok
export const ROAD = 10; // lebar jalan

const PALETTE = ["#8fe000", "#00b8e6", "#ff4fa3", "#ffb000", "#8b5cff", "#ff7a1a"];
const EMPTY = "Lot ini masih kosong. Nanti kreator bisa menyewanya dan menaruh game di sini.";

// angka acak yang selalu sama setiap dijalankan (supaya kota tidak berubah-ubah)
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tierOf(h: number) {
  if (h >= 30) return "GIANT TOWER";
  if (h >= 20) return "LARGE TOWER";
  if (h >= 12) return "TOWER";
  return "SMALL BLOCK";
}

// lot di dekat plaza tengah yang sudah kita isi
const OVERRIDES: Record<string, Partial<Lot>> = {
  "5,4": {
    kind: "web",
    title: "Klik Cepat",
    description: "Game demo: klik kotak hijau sebanyak mungkin dalam 20 detik.",
    owner: "kamu",
    updated: "hari ini",
    gameUrl: "/games/demo/index.html",
    tier: "TOWER",
    w: 18, d: 18, h: 16,
    color: "#8fe000",
  },
  "3,4": {
    kind: "web",
    title: "Snake Neon",
    description: "Game ular klasik. Pakai panah atau WASD, spasi untuk mulai ulang.",
    owner: "kamu",
    updated: "hari ini",
    gameUrl: "/games/snake/index.html",
    tier: "LARGE TOWER",
    w: 18, d: 18, h: 22,
    color: "#00b8e6",
  },
  "4,3": {
    kind: "external",
    title: "Brick Builder",
    description:
      "Contoh game PC yang tidak bisa dimainkan di browser. Lot ini hanya menampilkan poster, dan tombolnya mengarahkan pemain ke halaman game-nya.",
    owner: "Studio Contoh",
    updated: "hari ini",
    externalUrl: "https://store.steampowered.com/",
    externalLabel: "Buka di Steam",
    posterUrl: "/posters/brick-builder.svg",
    tier: "LARGE TOWER",
    w: 22, d: 16, h: 26,
    color: "#ff4fa3",
  },
};

const rand = rng(20261025);
const mid = (GRID - 1) / 2;

export const LOTS: Lot[] = [];
let nextId = 1;

for (let gj = 0; gj < GRID; gj++) {
  for (let gi = 0; gi < GRID; gi++) {
    if (gi === mid && gj === mid) continue; // tengah = plaza

    const w = 14 + Math.floor(rand() * 13);
    const d = 14 + Math.floor(rand() * 13);
    const h = Math.round(8 + Math.pow(rand(), 1.6) * 30);
    const color = PALETTE[Math.floor(rand() * PALETTE.length)];

    const lot: Lot = {
      id: nextId,
      kind: "empty",
      tier: tierOf(h),
      title: `Lot kosong #${nextId}`,
      description: EMPTY,
      owner: "belum dimiliki",
      updated: "-",
      capacity: 8,
      plays: 0,
      wins: 0,
      likes: 0,
      gameUrl: null,
      externalUrl: null,
      externalLabel: null,
      posterUrl: null,
      color,
      x: (gi - mid) * PITCH,
      z: (gj - mid) * PITCH,
      w,
      h,
      d,
    };

    const o = OVERRIDES[`${gi},${gj}`];
    LOTS.push(o ? { ...lot, ...o } : lot);
    nextId++;
  }
}

// dipakai partikel supaya tidak tembus gedung
export function isInsideLot(x: number, y: number, z: number, margin = 0) {
  for (const l of LOTS) {
    if (
      Math.abs(x - l.x) < l.w / 2 + margin &&
      Math.abs(z - l.z) < l.d / 2 + margin &&
      y < l.h + margin
    ) {
      return true;
    }
  }
  return false;
}