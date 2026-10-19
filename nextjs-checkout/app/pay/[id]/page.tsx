import { notFound } from "next/navigation";
import { layerhop } from "@/lib/layerhop";
import { EmbeddedCheckout } from "./embedded-checkout";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) notFound();
  const session = await layerhop().checkout.get(id).catch(() => null);
  if (!session) notFound();

  return (
    <main className="card wide">
      <h1>{session.description ?? "Checkout"}</h1>
      <EmbeddedCheckout sessionId={session.id} />
    </main>
  );
}
