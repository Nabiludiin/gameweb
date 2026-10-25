"use client";

import type { User } from "@supabase/supabase-js";
import type { Lot } from "@/lib/lots";

type Props = {
  lot: Lot;
  user: User | null;
  accountsEnabled: boolean;
  onClose: () => void;
  onPlay: () => void;
  onLogin: () => void;
  onRent: () => void;
  onEdit: () => void;
  onRelease: () => void;
};

const mainBtn =
  "mt-4 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 text-lg font-bold text-neutral-900 shadow-sm transition hover:brightness-95";
const softBtn =
  "flex-1 rounded-lg border border-black/15 bg-white py-2 text-sm font-medium hover:bg-neutral-50";

export default function LotPanel({
  lot,
  user,
  accountsEnabled,
  onClose,
  onPlay,
  onLogin,
  onRent,
  onEdit,
  onRelease,
}: Props) {
  const winRate = lot.plays ? Math.round((lot.wins / lot.plays) * 100) : 0;
  const isOwner = !!user && lot.ownerId === user.id;

  let primary: { label: string; run: () => void } | null = null;
  if (lot.kind === "web") primary = { label: "▶ Play", run: onPlay };
  else if (lot.kind === "external") {
    primary = {
      label: `↗ ${lot.externalLabel ?? "Buka game"}`,
      run: () => {
        if (lot.externalUrl) window.open(lot.externalUrl, "_blank", "noopener,noreferrer");
      },
    };
  }

  return (
    <aside className="absolute bottom-4 right-4 top-16 z-20 w-[340px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-black/10 bg-white/90 p-5 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] tracking-[0.18em] text-neutral-500">
          LOT #{lot.id} · {lot.tier}
        </p>
        <button
          aria-label="Tutup"
          onClick={(e) => {
            e.currentTarget.blur();
            onClose();
          }}
          className="rounded-full px-2 text-lg leading-none text-neutral-500 hover:bg-neutral-100"
        >
          ✕
        </button>
      </div>

      <h2 className="mt-2 text-2xl font-bold leading-tight">{lot.title}</h2>

      {lot.posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lot.posterUrl}
          alt={`Poster ${lot.title}`}
          referrerPolicy="no-referrer"
          className="mt-3 w-full rounded-xl border border-black/10"
        />
      )}

      {primary && (
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            primary.run();
          }}
          className={mainBtn}
        >
          {primary.label}
        </button>
      )}

      {lot.kind === "empty" &&
        (!accountsEnabled ? (
          <button disabled className={`${mainBtn} cursor-not-allowed opacity-40`}>
            Sewa lahan · belum aktif
          </button>
        ) : user ? (
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onRent();
            }}
            className={mainBtn}
          >
            Sewa lahan ini
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onLogin();
            }}
            className={mainBtn}
          >
            Masuk untuk menyewa
          </button>
        ))}

      {isOwner && (
        <div className="mt-3 flex gap-2">
          <button onClick={onEdit} className={softBtn}>
            Ubah
          </button>
          <button onClick={onRelease} className={`${softBtn} text-red-600`}>
            Lepas lahan
          </button>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{lot.description}</p>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-neutral-500">Ukuran</dt>
        <dd>{lot.w} × {lot.d} m, tinggi {lot.h} m</dd>
        <dt className="text-neutral-500">Pemilik</dt>
        <dd className="font-medium">{lot.owner}</dd>
        <dt className="text-neutral-500">Diperbarui</dt>
        <dd>{lot.updated}</dd>
        <dt className="text-neutral-500">Di dalam</dt>
        <dd>0 / {lot.capacity} per sesi</dd>
        <dt className="text-neutral-500">Dimainkan</dt>
        <dd>{lot.plays} · menang {lot.wins} ({winRate}%)</dd>
      </dl>
    </aside>
  );
}