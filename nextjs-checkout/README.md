# Next.js checkout

Accept crypto payments with LayerHop checkout: your server creates a checkout session with your API
key, the customer pays with any token on any chain (on the hosted page or embedded in your site), and
you receive USDC or USDT on the chain you chose. A webhook handler verifies the signature and fulfils
the order; the success page shows the paid state.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-checkout&env=LAYERHOP_API_KEY,LAYERHOP_WEBHOOK_SECRET,MERCHANT_RECIPIENT&envDescription=A%20LayerHop%20API%20key%2C%20your%20webhook%20signing%20secret%20and%20your%20payout%20address&envLink=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-checkout%23environment-variables&project-name=layerhop-checkout&repository-name=layerhop-checkout)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/layerhop/examples/tree/main/nextjs-checkout)

## How it works

| File | What it does |
|---|---|
| `app/api/checkout/route.ts` | `POST`: creates the session with `lh.checkout.create(...)` (API key stays on the server), then redirects to the hosted page or to `/pay/<id>` |
| `app/pay/[id]/embedded-checkout.tsx` | Embeds the checkout with `<LayerHopCheckout sessionId>` from `@layerhop/widget/react` |
| `app/api/webhooks/layerhop/route.ts` | Verifies `LayerHop-Signature` on the raw body, deduplicates on `event.id`, fulfils on `checkout.session.completed` |
| `app/success/page.tsx` | Reads the session status from the API and whether the webhook fulfilled it |
| `lib/verify-webhook.ts` | The signature check (HMAC-SHA256 of `"<t>.<raw body>"`, 5-minute tolerance, rotation-safe), same algorithm as the SDK helpers |
| `lib/store.ts` | In-memory fulfilment record. Replace with your database. |

Fulfil on the webhook, not on the redirect: the redirect can be skipped or faked, the signed webhook cannot.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `LAYERHOP_API_KEY` | yes | From the [dashboard](https://dashboard.layerhop.com). Start with a test key (`lh_test_…`): sandboxed sessions, no funds move. |
| `LAYERHOP_WEBHOOK_SECRET` | yes | Signing secret of a webhook endpoint pointed at `https://<your-domain>/api/webhooks/layerhop` |
| `MERCHANT_RECIPIENT` | yes | Your payout address on the settlement chain |
| `SETTLE_CHAIN`, `SETTLE_TOKEN` | no | Default `base` / `USDC`. USDC or USDT on Ethereum, Arbitrum, Base, Optimism, BNB Chain, Polygon or Solana. |
| `PRODUCT_AMOUNT`, `PRODUCT_NAME`, `MERCHANT_NAME` | no | The demo product (amount in base units: 49 USDC = `49000000`) |
| `APP_URL` | no | Public URL for success/cancel links. Defaults to the request origin. |

## Run locally

```bash
cp .env.example .env.local   # use a test key
npm install
npm run dev                  # http://localhost:3000
```

To receive webhooks locally, forward them with the LayerHop CLI (`npx @layerhop/cli listen --forward-to localhost:3000/api/webhooks/layerhop`)
or a tunnel, and send a sample from the dashboard. In test mode, see the
[test mode guide](https://docs.layerhop.com/guides/test-mode) for amounts that pay, fail or refund.

Docs: [Checkout](https://docs.layerhop.com/guides/checkout) · [Embedded checkout](https://docs.layerhop.com/guides/embedded-checkout) · [Webhooks](https://docs.layerhop.com/guides/webhooks)
