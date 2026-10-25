import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { mergeLots, type Claim } from "@/lib/lots";

export function useLots() {
  const [claims, setClaims] = useState<Claim[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("lot_claims").select("*");
    if (!error && data) setClaims(data as Claim[]);
  }, []);

  useEffect(() => {
    refresh();
    // cek ulang tiap 20 detik supaya sewaan orang lain ikut muncul
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  const lots = useMemo(() => mergeLots(claims), [claims]);
  return { lots, refresh };
}