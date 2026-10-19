import { formatUnits, product } from "@/lib/layerhop";
import { findSettlementToken, getChain } from "@layerhop/sdk";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const p = product();
  const chain = getChain(p.settleChain);
  const token = chain ? findSettlementToken(chain.id, p.settleToken) : undefined;
  const price = token ? `${formatUnits(p.amount, token.decimals)} ${token.symbol}` : `${p.amount} (base units)`;

  return (
    <main className="card">
      <p className="eyebrow">{p.merchantName}</p>
      <h1>{p.name}</h1>
      <p className="price">{price}</p>
      <p className="muted">
        Pay with any token on any chain LayerHop routes. You receive {token?.symbol ?? p.settleToken} on {chain?.name ?? p.settleChain}.
      </p>

      <form action="/api/checkout" method="post" className="actions">
        <button className="primary" name="mode" value="hosted">Pay on the hosted page</button>
        <button name="mode" value="embedded">Pay on this site</button>
      </form>

      {error && <p className="error">Could not start the checkout: {error}</p>}
      <p className="muted small">
        Use a test key (<code>lh_test_…</code>) while you build: sessions are sandboxed and no funds move.
      </p>
    </main>
  );
}
