"use client";

import { LayerHopCheckout } from "@layerhop/widget/react";
import { useRouter } from "next/navigation";

/** The LayerHop checkout in an iframe on your page. The payer's wallet connects inside it. */
export function EmbeddedCheckout({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  return (
    <LayerHopCheckout
      sessionId={sessionId}
      // The UI can move on right away; fulfil on the webhook, which is verified server-side.
      onPaid={(s) => router.push(`/success?session_id=${encodeURIComponent(s.id)}`)}
      onCancel={() => router.push("/")}
    />
  );
}
