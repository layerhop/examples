import { LayerHop, LayerHopApiError, type WebhookEventPayload } from "@layerhop/sdk";
import { Hono, type MiddlewareHandler } from "hono";
import type { Store } from "./store.js";
import { verifyWebhookSignature } from "./verify-webhook.js";

export interface Config {
  apiKey: string;
  webhookSecret: string;
  srcChain: string;
  srcToken: string;
  dstChain: string;
  dstToken: string;
  /** Your treasury on the destination chain: every deposit is delivered here. */
  recipient: string;
  integrator?: string;
  internalToken?: string;
}

const USER_ID = /^[A-Za-z0-9_.:-]{1,64}$/; // also a valid deposit-address label (1–64 chars)

export function createApp(cfg: Config, store: Store, lh = new LayerHop({ apiKey: cfg.apiKey, integrator: cfg.integrator })) {
  const app = new Hono();
  const testMode = cfg.apiKey.startsWith("lh_test_");

  /** Your own API: protect it. Here a shared bearer token; in production, your app's auth. */
  const internal: MiddlewareHandler = async (c, next) => {
    if (cfg.internalToken && c.req.header("authorization") !== `Bearer ${cfg.internalToken}`) return c.json({ error: "unauthorized" }, 401);
    await next();
  };

  app.onError((err, c) => {
    if (err instanceof LayerHopApiError) return c.json({ error: err.code, message: err.message, requestId: err.requestId }, 502);
    console.error(err);
    return c.json({ error: "internal_error" }, 500);
  });

  app.get("/healthz", (c) => c.json({ ok: true, testMode }));

  /**
   * POST /users/:userId/deposit-address  { "refundTo": "0x…" }
   * Returns the user's address for the configured route, creating it on first call. Reusable
   * addresses accept any amount, any number of times, so one per user is enough.
   */
  app.post("/users/:userId/deposit-address", internal, async (c) => {
    const userId = c.req.param("userId");
    if (!USER_ID.test(userId)) return c.json({ error: "invalid userId" }, 400);
    const body = (await c.req.json().catch(() => ({}))) as { refundTo?: unknown };
    if (typeof body.refundTo !== "string" || !body.refundTo.trim()) {
      return c.json({ error: "refundTo is required: the user's own address on the source chain (never an exchange deposit address)" }, 400);
    }

    const existing = store.addressesOf(userId)[0];
    if (existing) return c.json({ ...existing, created: false });

    const da = await lh.depositAddresses.create({
      srcChain: cfg.srcChain,
      srcToken: cfg.srcToken,
      dstChain: cfg.dstChain,
      dstToken: cfg.dstToken,
      recipient: cfg.recipient,
      refundTo: body.refundTo.trim(),
      label: userId, // filterable in the dashboard and in depositAddresses.list({ label })
      metadata: { userId },
    });
    const row = {
      id: da.id,
      userId,
      address: da.address,
      chainId: da.chainId,
      token: da.token,
      dstChainId: da.dstChainId,
      dstToken: da.dstToken,
      livemode: da.livemode,
      createdAt: da.createdAt,
    };
    store.putAddress(row);
    return c.json({ ...row, created: true, estimate: da.estimate }, 201);
  });

  /** GET /users/:userId — balances credited from filled deposits, the address and the deposit history. */
  app.get("/users/:userId", internal, (c) => {
    const userId = c.req.param("userId");
    return c.json({ userId, balances: store.balancesOf(userId), addresses: store.addressesOf(userId), deposits: store.creditsOf(userId) });
  });

  /** POST /users/:userId/refresh — "I sent it": ask LayerHop to look for the deposit now. */
  app.post("/users/:userId/refresh", internal, async (c) => {
    const addresses = store.addressesOf(c.req.param("userId"));
    await Promise.all(addresses.map((a) => lh.depositAddresses.refresh(a.id)));
    return c.json({ refreshed: addresses.length });
  });

  /** Test keys only: record a fake deposit (amounts ending in 4001 refund, 4002 fail). */
  app.post("/dev/deposit-addresses/:id/simulate", internal, async (c) => {
    if (!testMode) return c.json({ error: "simulate works with test keys (lh_test_…) only" }, 400);
    const { amount } = (await c.req.json().catch(() => ({}))) as { amount?: unknown };
    if (typeof amount !== "string" || !/^\d+$/.test(amount)) return c.json({ error: "amount: integer string in base units" }, 400);
    return c.json(await lh.depositAddresses.simulate(c.req.param("id"), { amount }));
  });

  /**
   * POST /webhooks/layerhop — point a webhook endpoint here. Verify, deduplicate, credit on
   * `order.filled`. The order carries `depositAddressId`; the label (your userId) is the fallback
   * when the address is not in this store (e.g. created elsewhere).
   */
  app.post("/webhooks/layerhop", async (c) => {
    const raw = await c.req.text();
    if (!verifyWebhookSignature(cfg.webhookSecret, c.req.header("LayerHop-Signature"), raw)) return c.text("bad signature", 400);
    const event = JSON.parse(raw) as WebhookEventPayload;
    if (!store.markEventSeen(event.id)) return c.text("ok (duplicate)");

    const order = event.data.order;
    if (event.type === "order.filled" && order?.depositAddressId) {
      let userId = store.getAddress(order.depositAddressId)?.userId;
      if (!userId) userId = (await lh.depositAddresses.get(order.depositAddressId).catch(() => null))?.label ?? undefined;
      if (!userId) {
        console.warn(`[webhook] filled deposit ${order.quoteId} for unknown address ${order.depositAddressId}`);
        return c.text("ok (unknown address)");
      }
      const credited = store.credit({
        quoteId: order.quoteId,
        userId,
        depositAddressId: order.depositAddressId,
        asset: `${order.dstChainId}:${order.dstToken}`,
        amount: order.dstAmount,
        srcTxHash: order.srcTxHash,
        dstTxHash: order.dstTxHash,
        creditedAt: new Date().toISOString(),
      });
      console.log(`[webhook] ${credited ? "credited" : "already credited"} ${order.dstAmount} to ${userId} (${order.quoteId}, livemode=${event.livemode})`);
    } else if (order?.depositAddressId && (event.type === "order.refunded" || event.type === "order.failed")) {
      console.log(`[webhook] deposit ${order.quoteId} ${order.status}: nothing to credit`);
    }
    return c.text("ok");
  });

  return app;
}
