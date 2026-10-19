import { isValidIntegrator } from "@layerhop/widget";
import { LayerHopWidget, type StatusEvent } from "@layerhop/widget/react";
import { useState } from "react";

const rawIntegrator = import.meta.env.VITE_LAYERHOP_INTEGRATOR?.trim() ?? "";
/** Your partner id: registered partners earn their fee on every swap made in this widget. */
const integrator = rawIntegrator && isValidIntegrator(rawIntegrator) ? rawIntegrator : undefined;

const DESTINATIONS = [
  { label: "SOL on Solana", dstChain: "solana", dstToken: "SOL" },
  { label: "USDC on Arbitrum", dstChain: "arbitrum", dstToken: "USDC" },
  { label: "ETH on Base", dstChain: "base", dstToken: "ETH" },
] as const;

export function App() {
  const [dest, setDest] = useState(0);
  const [last, setLast] = useState<StatusEvent | null>(null);
  const d = DESTINATIONS[dest] ?? DESTINATIONS[0];

  return (
    <main>
      <h1>Swap widget in React</h1>
      <div className="tabs" role="tablist" aria-label="Destination">
        {DESTINATIONS.map((x, i) => (
          <button key={x.label} role="tab" aria-selected={i === dest} onClick={() => setDest(i)}>
            {x.label}
          </button>
        ))}
      </div>

      {/* Props map 1:1 to widget options; callbacks receive typed events. */}
      <LayerHopWidget
        srcChain="base"
        srcToken="USDC"
        dstChain={d.dstChain}
        dstToken={d.dstToken}
        theme="auto"
        preset="ocean"
        gasOnArrival
        integrator={integrator}
        onStatus={setLast}
        onError={(e) => console.warn("[layerhop]", e.code, e.message)}
      />

      <p className="muted">
        {last ? `Order ${last.state} (${last.provider})` : "Events show up here once a swap is submitted."}
        {integrator ? ` · partner ${integrator}` : ""}
      </p>
      <p><a href="./index.html">← Plain HTML version</a></p>
    </main>
  );
}
