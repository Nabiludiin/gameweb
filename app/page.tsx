import World from "@/components/World";
import { SITE_NAME } from "@/lib/config";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <World />
      <div className="pointer-events-none absolute left-6 top-5 select-none">
        <h1 className="text-xl font-bold tracking-[0.4em]">{SITE_NAME}</h1>
      </div>
    </main>
  );
}