import { createApp } from "./app.js";
import { Store } from "./store.js";

function env(name: string, fallback?: string): string {
  const v = process.env[name]?.trim() || fallback;
  if (!v) throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  return v;
}

/** The Hono app, configured from the environment. `export default` is what Vercel's Hono support serves. */
const app = createApp(
  {
    apiKey: env("LAYERHOP_API_KEY"),
    webhookSecret: env("LAYERHOP_WEBHOOK_SECRET"),
    srcChain: env("SRC_CHAIN", "base"),
    srcToken: env("SRC_TOKEN", "USDC"),
    dstChain: env("DST_CHAIN", "arbitrum"),
    dstToken: env("DST_TOKEN", "USDC"),
    recipient: env("DEPOSIT_RECIPIENT"),
    integrator: process.env.LAYERHOP_INTEGRATOR?.trim() || undefined,
    internalToken: process.env.INTERNAL_API_TOKEN?.trim() || undefined,
  },
  new Store(process.env.DATA_FILE?.trim() || undefined),
);

export default app;
