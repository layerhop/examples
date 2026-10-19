import { LayerHop, findToken, getChain, type BuiltTx, type Quote } from "@layerhop/sdk";
import { tool } from "ai";
import { z } from "zod";

/**
 * LayerHop as AI SDK tools. The agent can quote and build, never sign: `build_unsigned_transaction`
 * returns the transaction for a human to review and sign in their own wallet. No keys anywhere.
 */

export interface PreparedSwap {
  quote: Quote;
  tx: BuiltTx;
  /** The same swap prefilled on layerhop.com, for people who'd rather sign there. */
  deepLink: string;
}

const chain = z.union([z.string(), z.number()]).describe('Chain slug ("base", "arbitrum", "solana") or chain id');
const token = z.string().describe('Token symbol ("USDC", "ETH", "SOL") or address / mint');

export const swapInput = z.object({
  srcChain: chain,
  srcToken: token,
  amount: z.string().describe('Amount to send in normal units, e.g. "100" or "0.5"'),
  dstChain: chain,
  dstToken: token,
  sender: z.string().describe("The user's address on the source chain"),
  recipient: z.string().describe("Who receives on the destination chain (often the user's own address there)"),
});
export type SwapInput = z.infer<typeof swapInput>;

/** Human amount ("12.5") → base units, using the SDK's built-in token list. */
export function toBaseUnits(chainRef: string | number, tokenRef: string, human: string): { amount: string; decimals: number; address: string } {
  const c = getChain(chainRef);
  if (!c) throw new Error(`Unknown chain "${chainRef}"`);
  const t = findToken(c.id, tokenRef);
  if (!t) throw new Error(`Unknown token "${tokenRef}" on ${c.slug}; use a token from the built-in list (USDC, USDT, the native coin).`);
  const [whole = "0", frac = ""] = human.trim().split(".");
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(frac) || frac.length > t.decimals) throw new Error(`Invalid amount "${human}"`);
  return { amount: (BigInt(whole) * 10n ** BigInt(t.decimals) + BigInt(frac.padEnd(t.decimals, "0") || "0")).toString(), decimals: t.decimals, address: t.address };
}

export function createLayerHop(lh: LayerHop) {
  async function quote(p: SwapInput) {
    const src = toBaseUnits(p.srcChain, p.srcToken, p.amount);
    const dst = getChain(p.dstChain);
    const dstToken = dst ? findToken(dst.id, p.dstToken) : undefined;
    const res = await lh.quote({ ...p, srcToken: src.address, amount: src.amount, dstToken: dstToken?.address ?? p.dstToken });
    const b = res.best;
    return {
      best: b,
      summary: {
        quoteId: b.quoteId,
        provider: b.provider,
        dstAmount: b.dstAmount,
        dstAmountMin: b.dstAmountMin,
        dstDecimals: dstToken?.decimals,
        estimatedSeconds: b.estimatedSeconds,
        fees: b.fees,
        alternatives: res.quotes.length - 1,
        expiresAt: new Date(b.expiresAt * 1000).toISOString(),
      },
    };
  }

  /** Quote, then build the unsigned transaction. Read-only: nothing is signed or sent. */
  async function prepare(p: SwapInput): Promise<PreparedSwap> {
    const { best } = await quote(p);
    const tx = await lh.buildTx(best.quoteId);
    const link = new URL("https://layerhop.com/swap");
    for (const k of ["srcChain", "srcToken", "dstChain", "dstToken", "amount", "recipient"] as const) link.searchParams.set(k, String(p[k]));
    return { quote: best, tx, deepLink: link.toString() };
  }

  return { quote, prepare };
}

export function createLayerHopTools(lh: LayerHop, onPrepared: (s: PreparedSwap) => void = () => {}) {
  const api = createLayerHop(lh);
  return {
    get_quote: tool({
      description: "Get the best LayerHop quote for a swap or bridge: output amount (base units), fees, route and time. Read-only.",
      inputSchema: swapInput,
      execute: async (p) => (await api.quote(p)).summary,
    }),

    build_unsigned_transaction: tool({
      description:
        "Quote a swap and build the UNSIGNED transaction for it. You cannot sign or send it: the user reviews and signs it in their own wallet.",
      inputSchema: swapInput,
      execute: async (p) => {
        const s = await api.prepare(p);
        onPrepared(s);
        return {
          quoteId: s.quote.quoteId,
          vm: s.tx.vm,
          needsApproval: s.tx.vm === "evm" && Boolean(s.tx.approval),
          note: "Unsigned. The user must review and sign it in their own wallet. Never ask for a private key or seed phrase.",
          deepLink: s.deepLink,
        };
      },
    }),
  };
}
