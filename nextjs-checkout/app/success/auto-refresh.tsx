"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renders the server component every few seconds while the payment settles. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return <p className="muted small">Checking again every {seconds} s…</p>;
}
