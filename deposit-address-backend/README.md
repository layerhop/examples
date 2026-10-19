# Deposit address backend

A small Hono service that gives every user of your app their own LayerHop
[deposit address](https://docs.layerhop.com/guides/deposit-addresses) and credits their balance when a
deposit settles. Users send USDC on Base (or any route you configure) from any wallet or exchange
withdrawal; LayerHop converts and delivers it to your treasury on the destination chain, and the
`order.filled` webhook tells you whose deposit it was.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fdeposit-address-backend&env=LAYERHOP_API_KEY,LAYERHOP_WEBHOOK_SECRET,DEPOSIT_RECIPIENT,INTERNAL_API_TOKEN&envDescription=A%20LayerHop%20API%20key%2C%20your%20webhook%20signing%20secret%2C%20your%20treasury%20address%20and%20a%20token%20for%20your%20own%20API&envLink=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fdeposit-address-backend%23environment-variables&project-name=layerhop-deposits&repository-name=layerhop-deposits)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/layerhop/examples/tree/main/deposit-address-backend)

The store is in memory (optionally saved to a JSON file). That is fine on one Docker container with a
volume; on Vercel (serverless) or with several instances, swap `src/store.ts` for your database first.

## API

| Route | What it does |
|---|---|
| `POST /users/:userId/deposit-address` `{ "refundTo": "0x…" }` | The user's address, created on first call with `label = userId`. Reusable: any amount, any number of times. `refundTo` is the user's own address on the source chain (never an exchange deposit address). |
| `GET /users/:userId` | Balances credited so far (per asset, base units), the address and every credited deposit |
| `POST /users/:userId/refresh` | "I sent it": asks LayerHop to look for the deposit now |
| `POST /webhooks/layerhop` | Webhook endpoint: verifies `LayerHop-Signature`, deduplicates on `event.id`, credits `order.filled` once per order (`quoteId`) |
| `POST /dev/deposit-addresses/:id/simulate` `{ "amount": "25000000" }` | Test keys only: records a fake deposit (amounts ending in `4001` refund, `4002` fail) |
| `GET /healthz` | Liveness |

Set `INTERNAL_API_TOKEN` and the `/users` and `/dev` routes require `Authorization: Bearer <token>`.
In a real app, call them from your backend with your own auth instead.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `LAYERHOP_API_KEY` | yes | From the [dashboard](https://dashboard.layerhop.com). Start with a test key (`lh_test_…`): fake addresses, no funds move. |
| `LAYERHOP_WEBHOOK_SECRET` | yes | Signing secret of a webhook endpoint pointed at `https://<your-host>/webhooks/layerhop` |
| `DEPOSIT_RECIPIENT` | yes | Your treasury on the destination chain: every deposit is delivered there |
| `SRC_CHAIN`, `SRC_TOKEN`, `DST_CHAIN`, `DST_TOKEN` | no | The route. Default: USDC on Base → USDC on Arbitrum. |
| `LAYERHOP_INTEGRATOR` | no | Your partner id, so deposits carry your partner fee |
| `INTERNAL_API_TOKEN` | no | Protects your own API (see above) |
| `DATA_FILE` | no | Save the store to this JSON file (`/data/store.json` in Docker) |
| `PORT` | no | Default `8080` |

## Run locally

```bash
cp .env.example .env         # use a test key
npm install
npm run dev                  # http://localhost:8080
npm test                     # offline tests: address per user, signed webhook, credit once
```

Try the whole loop in test mode:

```bash
curl -X POST localhost:8080/users/alice/deposit-address -H 'content-type: application/json' \
  -d '{"refundTo":"0xAliceOnBase"}'                       # → { "id": "da_…", "address": "0x…" }
curl -X POST localhost:8080/dev/deposit-addresses/da_…/simulate -H 'content-type: application/json' \
  -d '{"amount":"25000000"}'                              # a fake 25 USDC deposit
curl localhost:8080/users/alice                          # credited once the order.filled webhook arrives
```

To receive webhooks on your machine, run `npx @layerhop/cli listen --forward-to localhost:8080/webhooks/layerhop`.

## Docker

```bash
docker build -t layerhop-deposits .
docker run --env-file .env -p 8080:8080 -v deposits:/data layerhop-deposits
```

Docs: [Deposit addresses](https://docs.layerhop.com/guides/deposit-addresses) · [Webhooks](https://docs.layerhop.com/guides/webhooks) · [Test mode](https://docs.layerhop.com/guides/test-mode)
