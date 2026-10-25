"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isHttpsUrl, type Lot } from "@/lib/lots";

const input =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40";
const label = "mb-1 block text-xs font-semibold text-neutral-600";

export default function LotForm({
  lot,
  user,
  mode,
  onClose,
  onDone,
}: {
  lot: Lot;
  user: User;
  mode: "rent" | "edit";
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const editing = mode === "edit";
  const [kind, setKind] = useState<"web" | "external">(editing && lot.kind === "external" ? "external" : "web");
  const [title, setTitle] = useState(editing ? lot.title : "");
  const [description, setDescription] = useState(editing ? lot.description : "");
  const [gameUrl, setGameUrl] = useState(editing ? (lot.gameUrl ?? "") : "");
  const [externalUrl, setExternalUrl] = useState(editing ? (lot.externalUrl ?? "") : "");
  const [btnLabel, setBtnLabel] = useState(editing ? (lot.externalLabel ?? "Buka di Steam") : "Buka di Steam");
  const [poster, setPoster] = useState(editing ? (lot.posterUrl ?? "") : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ownerName = String(
    user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "pemain"
  ).slice(0, 40);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);

    const t = title.trim();
    if (!t) return setError("Judul wajib diisi.");
    if (kind === "web" && !isHttpsUrl(gameUrl.trim())) return setError("URL game harus diawali https://");
    if (kind === "external" && !isHttpsUrl(externalUrl.trim()))
      return setError("URL tujuan harus diawali https://");
    if (poster.trim() && !isHttpsUrl(poster.trim())) return setError("URL poster harus diawali https://");

    setBusy(true);
    const row = {
      kind,
      title: t,
      description: description.trim(),
      game_url: kind === "web" ? gameUrl.trim() : null,
      external_url: kind === "external" ? externalUrl.trim() : null,
      external_label: kind === "external" ? btnLabel.trim() || "Buka game" : null,
      poster_url: poster.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } =
      mode === "rent"
        ? await supabase
            .from("lot_claims")
            .insert({ ...row, lot_id: lot.id, owner_id: user.id, owner_name: ownerName })
        : await supabase.from("lot_claims").update(row).eq("lot_id", lot.id);

    setBusy(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Lot ini baru saja disewa orang lain."
          : error.code === "42501"
            ? "Ditolak. Satu akun maksimal 3 lot."
            : error.message
      );
      return;
    }
    await onDone();
    onClose();
  }

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold">
          {editing ? "Ubah lot" : "Sewa lot"} #{lot.id}
        </h2>
        {!editing && (
          <p className="text-xs text-neutral-500">Sewa gratis dulu (belum ada pembayaran). Maksimal 3 lot per akun.</p>
        )}

        <div>
          <label className={label}>Judul</label>
          <input className={input} required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className={label}>Deskripsi</label>
          <textarea
            className={input}
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className={label}>Jenis lot</label>
          <div className="grid grid-cols-2 gap-2">
            {(["web", "external"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  kind === k ? "border-neutral-900 bg-neutral-900 text-white" : "border-black/15 bg-white"
                }`}
              >
                {k === "web" ? "Game web (embed)" : "Poster + link"}
              </button>
            ))}
          </div>
        </div>

        {kind === "web" ? (
          <div>
            <label className={label}>URL game web (https)</label>
            <input
              className={input}
              placeholder="https://…"
              value={gameUrl}
              onChange={(e) => setGameUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Harus halaman game yang boleh ditampilkan di dalam website lain. Game yang kamu host sendiri aman dipakai.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className={label}>Link tujuan (Steam / halaman unduh)</label>
              <input
                className={input}
                placeholder="https://store.steampowered.com/…"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Teks tombol</label>
              <input
                className={input}
                maxLength={30}
                value={btnLabel}
                onChange={(e) => setBtnLabel(e.target.value)}
              />
            </div>
          </>
        )}

        <div>
          <label className={label}>URL poster (opsional)</label>
          <input
            className={input}
            placeholder="https://…/poster.png"
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">Link gambar langsung (.png / .jpg / .svg), rasio 3:4 paling pas.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-black/15 py-2.5 font-semibold"
          >
            Batal
          </button>
          <button
            disabled={busy}
            className="flex-1 rounded-xl bg-neutral-900 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : editing ? "Simpan" : "Sewa lot ini"}
          </button>
        </div>
      </form>
    </div>
  );
}