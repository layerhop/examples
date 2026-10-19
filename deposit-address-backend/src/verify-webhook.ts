import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a `LayerHop-Signature` header: `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>`.
 * Same algorithm as `verifyWebhookSignature` in the LayerHop SDKs (docs.layerhop.com/guides/webhooks):
 * verify the RAW body, accept any matching `v1` (secret rotation sends two), reject stale timestamps.
 */
export function verifyWebhookSignature(
  secret: string,
  header: string | null | undefined,
  rawBody: string,
  toleranceSec = 300,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret || !header) return false;
  let t: number | undefined;
  const v1: Buffer[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t" && /^\d+$/.test(v)) t = Number(v);
    else if (k === "v1" && /^[0-9a-f]{64}$/i.test(v)) v1.push(Buffer.from(v, "hex"));
  }
  if (t === undefined || v1.length === 0 || Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  return v1.some((got) => got.length === expected.length && timingSafeEqual(got, expected));
}

/** Build a header value (for tests and local replays). */
export function signWebhookPayload(secret: string, rawBody: string, t = Math.floor(Date.now() / 1000)): string {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex")}`;
}
