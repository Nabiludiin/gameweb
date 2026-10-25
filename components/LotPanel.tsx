"use client";

import type { Lot } from "@/lib/lots";

export default function LotPanel({
  lot,
  onClose,
  onPlay,
}: {
  lot: Lot;
  onClose: () => void;
  onPlay: () => void;
}) {
  const winRate = lot.plays ? Math.round((lot.wins / lot.plays) * 100) : 0;

  const action =
    lot.kind === "web"
      ? { label: "▶ Play", run: onPlay }
      : lot.kind === "external"
        ? {
            label: `↗ ${lot.externalLabel ?? "Buka game"}`,
            run: () => window.open(lot.externalUrl!, "_blank", "noopener,noreferrer"),
          }
        : null;

  return (
    <aside className="absolute bottom-4 right-4 top-4 z-20 w-[340px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-black/10 bg-white/90 p-5 shadow-xl backdrop-blur">
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
          className="mt-3 w-full rounded-xl border border-black/10"
        />
      )}

      {action ? (
        <button
          onClick={(e) => {
            e.currentTarget.blur();
            action.run();
          }}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 text-lg font-bold text-neutral-900 shadow-sm transition hover:brightness-95"
        >
          {action.label}
        </button>
      ) : (
        <button
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-xl border border-black/10 bg-neutral-100 py-3 text-base font-semibold text-neutral-400"
        >
          Sewa lahan · segera hadir
        </button>
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