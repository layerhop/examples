# AI swap agent

A Node script that turns plain requests ("bridge 25 USDC from Base to Arbitrum for 0x…") into a
LayerHop quote and an **unsigned** transaction for a human to review and sign. Built with the
[Vercel AI SDK](https://ai-sdk.dev) and [`@layerhop/sdk`](https://docs.layerhop.com/sdk): two tools,
`get_quote` and `build_unsigned_transaction`. The agent has no keys and cannot sign or send anything.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/layerhop/examples/tree/main/ai-agent)

It is a command-line script, so there is nothing to deploy; reuse `src/tools.ts` in a chat route,
a bot or a [Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fai-agent)
function. For MCP clients (Claude, Cursor, …) use the hosted [LayerHop MCP server](https://docs.layerhop.com/guides/ai-agents) instead.

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `AI_GATEWAY_API_KEY` | for `npm start` | A [Vercel AI Gateway](https://vercel.com/ai-gateway) key: one key for every model provider |
| `AI_MODEL` | no | Gateway model id. Default `anthropic/claude-sonnet-5.5`. |
| `LAYERHOP_INTEGRATOR` | no | Your [partner id](https://docs.layerhop.com/guides/partner-fees): quotes carry your partner fee |
| `LAYERHOP_API_KEY` | no | Quotes work without a key. A test key (`lh_test_…`) returns sandbox quotes. |
| `DEMO_ADDRESS` | no | The address `npm run demo` quotes for |

## Run locally

```bash
cp .env.example .env
npm install
npm run demo                                       # no AI key: calls the tools directly
npm start -- "What do I get for 100 USDC on Base in SOL on Solana? Base 0x… Solana 9W…"
```

Both print the unsigned transaction (with the ERC-20 approval to send first, if any) and a
prefilled `layerhop.com/swap` link the user can open to sign in their wallet instead. Quotes and
built transactions are read-only API calls; nothing moves until a person signs.

Docs: [AI agents](https://docs.layerhop.com/guides/ai-agents) · [SDK reference](https://docs.layerhop.com/sdk) · [Non-custodial by design](https://docs.layerhop.com/concepts/non-custodial)
