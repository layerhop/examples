import { createHmac } from "node:crypto";

// The SDK's verifier: RAW body, any matching `v1` (secret rotation sends two), 5-minute replay window.
export { verifyWebhookSignature } from "@layerhop/sdk";

/** Build a header value (for tests and local replays). */
export function signWebhookPayload(secret: string, rawBody: string, t = Math.floor(Date.now() / 1000)): string {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex")}`;
}
