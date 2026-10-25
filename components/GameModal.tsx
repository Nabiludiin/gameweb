"use client";

import type { Lot } from "@/lib/lots";

export default function GameModal({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  if (!lot.gameUrl) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2">
          <p className="font-semibold">{lot.title}</p>
          <div className="flex items-center gap-2">
            <a
              href={lot.gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Buka di tab baru ↗
            </a>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1 text-sm font-medium hover:bg-neutral-100"
            >
              Tutup ✕
            </button>
          </div>
        </div>
        {/* sandbox: game tidak bisa menyentuh cookie/sesi website kita */}
        <iframe
          src={lot.gameUrl}
          title={lot.title}
          sandbox="allow-scripts allow-pointer-lock"
          allow="fullscreen; gamepad"
          className="w-full flex-1 border-0"
          onLoad={(e) => e.currentTarget.contentWindow?.focus()}
        />
      </div>
    </div>
  );
}