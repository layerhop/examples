import assert from "node:assert/strict";
import { test } from "node:test";
import type { LayerHop } from "@layerhop/sdk";
import { createApp } from "./app.js";
import { Store } from "./store.js";
import { signWebhookPayload } from "./verify-webhook.js";

// Offline: a stub stands in for the LayerHop client, so nothing leaves the machine.
const SECRET = "whsec_test";
const created: unknown[] = [];
const stub = {
  depositAddresses: {
    create: async (p: unknown) => {
      created.push(p);
      return {
        id: "da_1", address: "0xdeposit", chainId: 8453, token: "0xusdc", dstChainId: 42161, dstToken: "0xusdcarb",
        livemode: false, createdAt: "2026-10-19T00:00:00.000Z", estimate: { amount: "100000000", dstAmount: "99700000", dstAmountMin: "99000000", estimatedSeconds: 30 },
      };
    },
    get: async () => ({ label: null }),
  },
} as unknown as LayerHop;

const app = createApp(
  { apiKey: "lh_test_x", webhookSecret: SECRET, srcChain: "base", srcToken: "USDC", dstChain: "arbitrum", dstToken: "USDC", recipient: "0xtreasury" },
  new Store(),
  stub,
);

const webhook = (body: object, secret = SECRET) => {
  const raw = JSON.stringify(body);
  return app.request("/webhooks/layerhop", { method: "POST", body: raw, headers: { "LayerHop-Signature": signWebhookPayload(secret, raw) } });
};

test("creates one deposit address per user, labelled with the user id", async () => {
  const first = await app.request("/users/alice/deposit-address", { method: "POST", body: JSON.stringify({ refundTo: "0xalice" }) });
  assert.equal(first.status, 201);
  const again = await app.request("/users/alice/deposit-address", { method: "POST", body: JSON.stringify({ refundTo: "0xalice" }) });
  assert.equal(((await again.json()) as { created: boolean }).created, false);
  assert.equal(created.length, 1);
  assert.equal((created[0] as { label: string }).label, "alice");
});

test("credits order.filled once and rejects bad signatures", async () => {
  const event = {
    id: "evt_1", type: "order.filled", livemode: false, createdAt: "2026-10-19T00:01:00.000Z",
    data: { order: { quoteId: "dep_1", status: "filled", depositAddressId: "da_1", dstChainId: 42161, dstToken: "0xusdcarb", dstAmount: "99700000", srcTxHash: "0xa", dstTxHash: "0xb" } },
  };
  assert.equal((await webhook(event, "wrong")).status, 400);
  assert.equal((await webhook(event)).status, 200);
  assert.equal((await webhook(event)).status, 200); // retry: deduplicated
  assert.equal((await webhook({ ...event, id: "evt_2" })).status, 200); // same order, new event id: still credited once
  const user = (await (await app.request("/users/alice")).json()) as { balances: Record<string, string> };
  assert.deepEqual(user.balances, { "42161:0xusdcarb": "99700000" });
});
