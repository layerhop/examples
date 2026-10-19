# Widget embed

The LayerHop swap widget on your own site, two ways:

- **`index.html`**: plain HTML. One `<div data-layerhop-widget>` and one script tag from unpkg. No
  build step: open the file, or upload it anywhere.
- **`react.html` + `src/App.tsx`**: the `<LayerHopWidget>` React component from
  [`@layerhop/widget`](https://docs.layerhop.com/widget-reference), with typed props and event callbacks.

The widget runs on layerhop.com in an iframe: wallets connect there and your page never handles keys.
Pass your partner id as `integrator` and you earn your partner fee on every swap.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flayerhop%2Fexamples%2Ftree%2Fmain%2Fwidget-embed&env=VITE_LAYERHOP_INTEGRATOR&envDescription=Your%20LayerHop%20partner%20id%20(optional)&project-name=layerhop-widget&repository-name=layerhop-widget)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/layerhop/examples/tree/main/widget-embed)

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `VITE_LAYERHOP_INTEGRATOR` | no | React version: your [partner id](https://docs.layerhop.com/guides/partner-fees). In `index.html`, add `data-integrator="your-id"` to the widget element instead. |

## Run locally

```bash
cp .env.example .env         # optional
npm install
npm run dev                  # http://localhost:5173 (plain HTML) and /react.html
npm run build                # type-checks, then builds both pages into dist/
```

## Customize

Every option works as a data attribute (`data-src-chain`, `data-preset`, `data-lock-dst`, …) or a React
prop (`srcChain`, `preset`, `lockDst`, …): theme presets, colors, fonts, allowed chains and tokens,
locked amounts or recipients, and gas on arrival. Design yours in the
[widget builder](https://layerhop.com/developers/widget) and paste the result.

Docs: [Embed the widget](https://docs.layerhop.com/guides/embed-widget) · [Widget reference](https://docs.layerhop.com/widget-reference)
