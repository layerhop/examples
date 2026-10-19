/**
 * Verify a `LayerHop-Signature` header: `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>`.
 * Same algorithm as `verifyWebhookSignature` in the LayerHop SDKs (see docs.layerhop.com/guides/webhooks):
 * - always verify the RAW body, before JSON.parse;
 * - any `v1` may match (a secret rotation sends two);
 * - timestamps more than `toleranceSec` from now are rejected (replay protection).
 * Uses Web Crypto, so it runs on the Node and Edge runtimes alike.
 */
export async function verifyWebhookSignature(
  secret: string,
  header: string | null | undefined,
  rawBody: string,
  toleranceSec = 300,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!secret || !header) return false;
  let t: number | undefined;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t" && /^\d+$/.test(v)) t = Number(v);
    else if (k === "v1" && /^[0-9a-f]{64}$/i.test(v)) v1.push(v.toLowerCase());
  }
  if (t === undefined || v1.length === 0 || Math.abs(nowSec - t) > toleranceSec) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return v1.some((s) => constantTimeEqual(s, expected));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
