# Next.js swap page

A cross-chain swap page built on LayerHop: pick what you pay and what you receive, see the best route
across every provider, approve if needed, swap, and follow the order until it lands. EVM chains
(Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain) connect through RainbowKit and Solana through
the Solana wallet adapter. Set your partner id and you earn your partner fee on every swap.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-swap&env=NEXT_PUBLIC_LAYERHOP_INTEGRATOR,NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID&envDescription=Your%20LayerHop%20partner%20id%20and%20a%20WalletConnect%20project%20id&envLink=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-swap%23environment-variables&project-name=layerhop-swap&repository-name=layerhop-swap)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/layerhop/examples/tree/main/nextjs-swap)

## What it shows

- `useQuote` from [`@layerhop/react`](https://docs.layerhop.com/sdks/react): live quotes that refresh before they expire.
- `useSwap`: the whole flow as a state machine (quoting → building → awaiting signature → tracking → done).
- A wallet-agnostic `sign` callback (`lib/sign.ts`): switch chain, approve the exact amount only when the
  allowance is too low, send the swap; on Solana, sign-only when LayerHop submits (`submitViaApi`).
- Partner fees: `NEXT_PUBLIC_LAYERHOP_INTEGRATOR` is sent as `integrator` on every quote.

Everything is signed in the user's wallet, in the browser. There is no server and no key.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_LAYERHOP_INTEGRATOR` | no | Your [partner id](https://docs.layerhop.com/guides/partner-fees). Registered partners earn their fee on top of LayerHop's. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | Free at [cloud.reown.com](https://cloud.reown.com). Without it only browser extension wallets are offered. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | no | Solana RPC for sending transactions. Defaults to the public, rate-limited endpoint. |
| `NEXT_PUBLIC_LAYERHOP_API_URL` | no | Defaults to `https://api.layerhop.com`. |

## Run locally

```bash
cp .env.example .env.local   # fill in what you need
npm install
npm run dev                  # http://localhost:3000
```

`npm run typecheck` and `npm run build` check everything. Quotes are real mainnet quotes, so use small
amounts while you try it: every transaction is shown in your wallet before anything is sent.

## Make it yours

- Chains and tokens: `lib/config.ts` (the SDK's built-in list; `useTokens` / `lh.tokens()` search thousands more).
- Styling: `app/globals.css`.
- Prefer a drop-in UI? See [`widget-embed`](../widget-embed).

Docs: [React hooks](https://docs.layerhop.com/sdks/react) · [Approvals](https://docs.layerhop.com/concepts/approvals) · [Order tracking](https://docs.layerhop.com/concepts/order-tracking)
