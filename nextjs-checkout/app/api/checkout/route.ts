import { LayerHopApiError } from "@layerhop/sdk";
import { NextResponse } from "next/server";
import { layerhop, merchantRecipient, product } from "@/lib/layerhop";

/**
 * POST /api/checkout (from the form on the home page): create a checkout session with the secret
 * API key, then send the payer to the hosted page or to /pay/<id> where it is embedded.
 */
export async function POST(req: Request) {
  const origin = process.env.APP_URL?.trim().replace(/\/$/, "") || new URL(req.url).origin;
  const form = await req.formData();
  const mode = form.get("mode") === "embedded" ? "embedded" : "hosted";
  const p = product();

  try {
    const session = await layerhop().checkout.create({
      amount: p.amount,
      settleChain: p.settleChain,
      settleToken: p.settleToken,
      recipient: merchantRecipient(),
      merchantName: p.merchantName,
      description: p.name,
      // Your own order id: echoed on the session and its webhooks, never shown to the payer.
      reference: `order_${crypto.randomUUID().slice(0, 8)}`,
      successUrl: `${origin}/success`, // LayerHop appends ?session_id=cs_…
      cancelUrl: `${origin}/`,
      expiresInMinutes: 60,
    });
    const next = mode === "embedded" ? `${origin}/pay/${session.id}` : session.url;
    return NextResponse.redirect(next, 303);
  } catch (e) {
    const message = e instanceof LayerHopApiError ? `${e.code}: ${e.message}` : e instanceof Error ? e.message : "Unknown error";
    console.error("[checkout] could not create a session:", message);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(message)}`, 303);
  }
}
