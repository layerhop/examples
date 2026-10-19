/**
 * `verifyWebhookSignature` from the SDK checks a `LayerHop-Signature` header against the RAW body
 * (HMAC-SHA256, any `v1` may match during a secret rotation, 5-minute replay window). It uses Web
 * Crypto, so it runs on the Node and Edge runtimes alike. See docs.layerhop.com/guides/webhooks.
 */
export { verifyWebhookSignature } from "@layerhop/sdk";
