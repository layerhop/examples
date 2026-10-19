import type { WebhookEventPayload } from "@layerhop/sdk";
import { webhookSecret } from "@/lib/layerhop";
import { fulfil, markEventSeen } from "@/lib/store";
import { verifyWebhookSignature } from "@/lib/verify-webhook";

/**
 * POST /api/webhooks/layerhop: add this URL as a webhook endpoint in the LayerHop dashboard.
 * Verify the signature on the raw body, deduplicate on event.id, fulfil, answer 2xx quickly.
 */
export async function POST(req: Request) {
  const raw = await req.text(); // the raw body: never JSON.parse before verifying
  const ok = await verifyWebhookSignature(webhookSecret(), req.headers.get("LayerHop-Signature"), raw);
  if (!ok) return new Response("bad signature", { status: 400 });

  const event = JSON.parse(raw) as WebhookEventPayload;
  if (!markEventSeen(event.id)) return new Response("ok (duplicate)");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.session;
      if (session?.status === "paid") {
        // Fulfil here: this is the trustworthy signal (delivery verified on chain).
        fulfil({
          sessionId: session.id,
          reference: session.reference ?? null,
          amount: session.amount,
          paidAt: session.payment?.paidAt ?? event.createdAt,
          eventId: event.id,
        });
        console.log(`[webhook] paid ${session.id} (${session.reference ?? "no reference"}, livemode=${event.livemode})`);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.payment_failed":
      console.log(`[webhook] ${event.type} ${event.data.session?.id ?? ""}`);
      break;
    default:
      // Other events (order.*, webhook.test, ...) are acknowledged and ignored.
      break;
  }
  return new Response("ok");
}
