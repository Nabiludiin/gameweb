"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const input =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40";

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Email atau password salah.";
  if (/already registered/i.test(msg)) return "Email ini sudah terdaftar. Coba masuk.";
  if (/at least 6/i.test(msg)) return "Password minimal 6 karakter.";
  if (/rate limit/i.test(msg)) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return msg;
}

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      const display = (name.trim() || email.split("@")[0]).slice(0, 40);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: display } },
      });
      if (error) setError(friendly(error.message));
      else if (!data.session) setInfo("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");
      else onClose();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(friendly(error.message));
      else onClose();
    }
    setBusy(false);
  }

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold">{mode === "login" ? "Masuk" : "Buat akun"}</h2>

        {mode === "signup" && (
          <input
            className={input}
            placeholder="Nama tampilan"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className={input}
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={input}
          type="password"
          placeholder="Password (min. 6 karakter)"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        <button
          disabled={busy}
          className="w-full rounded-xl bg-neutral-900 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="w-full text-sm text-neutral-500 underline"
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </form>
    </div>
  );
}