import "server-only";
import { LayerHop } from "@layerhop/sdk";

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  return v;
}

/** Server-side client: the API key never reaches the browser. */
export function layerhop(): LayerHop {
  return new LayerHop({ apiKey: required("LAYERHOP_API_KEY"), channel: "api" });
}

export const product = () => ({
  name: process.env.PRODUCT_NAME?.trim() || "Pro plan, 1 month",
  merchantName: process.env.MERCHANT_NAME?.trim() || "Acme",
  amount: process.env.PRODUCT_AMOUNT?.trim() || "49000000",
  settleChain: process.env.SETTLE_CHAIN?.trim() || "base",
  settleToken: process.env.SETTLE_TOKEN?.trim() || "USDC",
});

export const merchantRecipient = () => required("MERCHANT_RECIPIENT");
export const webhookSecret = () => required("LAYERHOP_WEBHOOK_SECRET");

/** "49000000" with 6 decimals → "49". */
export function formatUnits(amount: string, decimals: number): string {
  const v = BigInt(amount);
  const unit = 10n ** BigInt(decimals);
  const frac = (v % unit).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${v / unit}${frac ? `.${frac}` : ""}`;
}
