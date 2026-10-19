# LayerHop examples

Starter templates for building on [LayerHop](https://layerhop.com): cross-chain swaps, crypto checkout,
deposit addresses, the embeddable widget and AI agents. Each folder is a standalone project that
installs the published packages from npm (`@layerhop/sdk`, `@layerhop/react`, `@layerhop/widget`), so
you can copy it anywhere, deploy it in one click, or open it in StackBlitz.

| Template | What you get | Stack | |
|---|---|---|---|
| [`nextjs-swap`](./nextjs-swap) | A swap page: quote, approve, swap and track, on EVM chains and Solana, with your partner fee | Next.js, `@layerhop/react`, wagmi + RainbowKit, Solana wallet adapter | [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-swap) · [StackBlitz](https://stackblitz.com/github/layerhop/examples/tree/main/nextjs-swap) |
| [`nextjs-checkout`](./nextjs-checkout) | Get paid in USDC/USDT: server-created checkout sessions, hosted or embedded, verified webhooks, paid state | Next.js, `@layerhop/sdk`, `@layerhop/widget` | [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fnextjs-checkout) · [StackBlitz](https://stackblitz.com/github/layerhop/examples/tree/main/nextjs-checkout) |
| [`deposit-address-backend`](./deposit-address-backend) | A deposit address per user, credited from `order.filled` webhooks, with a Dockerfile | Hono, `@layerhop/sdk` | [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fdeposit-address-backend) · [StackBlitz](https://stackblitz.com/github/layerhop/examples/tree/main/deposit-address-backend) |
| [`widget-embed`](./widget-embed) | The swap widget in a plain HTML page (script tag) and in React | HTML, Vite + React, `@layerhop/widget` | [Deploy](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fwidget-embed) · [StackBlitz](https://stackblitz.com/github/layerhop/examples/tree/main/widget-embed) |
| [`ai-agent`](./ai-agent) | An agent that quotes swaps and returns the unsigned transaction for a human to sign | Node, Vercel AI SDK, `@layerhop/sdk` | [StackBlitz](https://stackblitz.com/github/layerhop/examples/tree/main/ai-agent) |

## Ground rules every template follows

- **Non-custodial.** Users sign in their own wallets, in the browser. No template holds a private key,
  signs on a server or sends a transaction by itself.
- **Secrets stay on the server.** API keys and webhook secrets are read from environment variables
  (see each `.env.example`) and never reach the browser.
- **Test mode first.** With a test key (`lh_test_…`) checkout sessions, deposit addresses and
  webhooks are sandboxed and no funds move. See the [test mode guide](https://docs.layerhop.com/guides/test-mode).
- **Earn as a partner.** Set your partner id (`integrator`) and every swap carries your fee on top of
  LayerHop's. See [Earn fees as a partner](https://docs.layerhop.com/guides/partner-fees).

## Use one

```bash
npx degit layerhop/examples/nextjs-swap my-app
cd my-app && cp .env.example .env.local && npm install && npm run dev
```

Each template's README lists its environment variables and commands. Questions or ideas:
dev@layerhop.com or an issue on this repo.

These templates are exported from the LayerHop monorepo; contributions are applied there and synced here.
