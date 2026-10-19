import Link from "next/link";
import { formatUnits, layerhop } from "@/lib/layerhop";
import { getFulfilment } from "@/lib/store";
import { AutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: id } = await searchParams;
  const session = id && /^cs_[A-Za-z0-9_]+$/.test(id) ? await layerhop().checkout.get(id).catch(() => null) : null;
  if (!session) {
    return (
      <main className="card">
        <h1>Payment not found</h1>
        <Link href="/">Back to the shop</Link>
      </main>
    );
  }

  // The API is the source of truth for the status; the webhook record shows your fulfilment ran.
  const fulfilment = getFulfilment(session.id);
  const amount = `${formatUnits(session.amount, session.settlement.decimals)} ${session.settlement.symbol}`;
  const paid = session.status === "paid";

  return (
    <main className="card">
      <p className={`badge ${session.status}`}>{session.status.replace("_", " ")}</p>
      <h1>{paid ? "Thanks, you're all set" : session.status === "processing" ? "Payment on its way…" : "Payment not completed"}</h1>
      <dl className="facts">
        <dt>Amount</dt><dd>{amount}</dd>
        <dt>Session</dt><dd><code>{session.id}</code></dd>
        {session.payment?.dstTxHash && <><dt>Settlement tx</dt><dd><code>{session.payment.dstTxHash.slice(0, 14)}…</code></dd></>}
        <dt>Webhook</dt><dd>{fulfilment ? `received, fulfilled at ${new Date(fulfilment.paidAt).toLocaleString()}` : "not received by this instance yet"}</dd>
        <dt>Mode</dt><dd>{session.livemode ? "live" : "test"}</dd>
      </dl>
      {(session.status === "processing" || session.status === "open") && <AutoRefresh seconds={4} />}
      <Link href="/">Back to the shop</Link>
    </main>
  );
}
