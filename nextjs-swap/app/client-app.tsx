"use client";

import dynamic from "next/dynamic";

/** Wallet libraries touch browser-only APIs (localStorage, indexedDB), so the app renders client-side. */
const App = dynamic(
  async () => {
    const [{ Providers }, { Swap }] = await Promise.all([import("./providers"), import("./swap")]);
    return function App() {
      return (
        <Providers>
          <Swap />
        </Providers>
      );
    };
  },
  { ssr: false, loading: () => <main className="card muted">Loading…</main> },
);

export function ClientApp() {
  return <App />;
}
