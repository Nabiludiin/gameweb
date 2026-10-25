import { SITE_NAME } from "@/lib/config";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-[0.5em] sm:text-5xl">
        {SITE_NAME}
      </h1>
      <p className="max-w-md text-center text-neutral-500">
        Kota 3D tempat kreator menaruh game dan pemain bisa jalan-jalan untuk memainkannya.
      </p>
      <button className="rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 px-8 py-3 font-semibold text-neutral-900 shadow">
        ▶ Segera hadir
      </button>
    </main>
  );
}