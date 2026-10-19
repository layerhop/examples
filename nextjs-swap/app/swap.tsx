"use client";

import { useQuote, useSwap, type SignFn } from "@layerhop/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useConfig } from "wagmi";
import { CHAIN_IDS, LAYERHOP_OPTIONS, chainName, explorerTx, isSolana, tokensOn } from "@/lib/config";
import { signEvm, signSvm } from "@/lib/sign";

const PHASE_LABEL: Record<string, string> = {
  idle: "Ready",
  quoting: "Getting a fresh quote…",
  building: "Building the transaction…",
  "awaiting-signature": "Confirm in your wallet…",
  submitted: "Submitted",
  tracking: "Bridging: waiting for delivery…",
  done: "Done",
  error: "Failed",
};

function safeParse(amount: string, decimals: number): string | undefined {
  try {
    const v = parseUnits(amount.trim(), decimals);
    return v > 0n ? v.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function Swap() {
  const config = useConfig();
  const evm = useAccount();
  const sol = useWallet();
  const { connection } = useConnection();

  const [srcChain, setSrcChain] = useState<number>(8453);
  const [srcSymbol, setSrcSymbol] = useState("USDC");
  const [dstChain, setDstChain] = useState<number>(7565164);
  const [dstSymbol, setDstSymbol] = useState("SOL");
  const [amount, setAmount] = useState("10");
  const [recipientOverride, setRecipientOverride] = useState("");

  const srcToken = tokensOn(srcChain).find((t) => t.symbol === srcSymbol) ?? tokensOn(srcChain)[0];
  const dstToken = tokensOn(dstChain).find((t) => t.symbol === dstSymbol) ?? tokensOn(dstChain)[0];

  const solAddress = sol.publicKey?.toBase58();
  const sender = isSolana(srcChain) ? solAddress : evm.address;
  const recipient = recipientOverride.trim() || (isSolana(dstChain) ? solAddress : evm.address);
  const baseAmount = srcToken ? safeParse(amount, srcToken.decimals) : undefined;

  const params = useMemo(
    () =>
      srcToken && dstToken && sender && recipient && baseAmount
        ? { srcChain, srcToken: srcToken.address, amount: baseAmount, dstChain, dstToken: dstToken.address, sender, recipient, slippageBps: 50 }
        : null,
    [srcChain, srcToken, dstChain, dstToken, sender, recipient, baseAmount],
  );

  const sign: SignFn = async (tx) => {
    if (tx.sandbox) throw new Error("This is a test-mode placeholder transaction; it must never be broadcast.");
    return tx.vm === "evm" ? signEvm(config, tx) : signSvm(sol, connection, tx);
  };
  const swap = useSwap({ sign });
  const quote = useQuote(params, { enabled: swap.phase === "idle" });
  const best = quote.data?.best;

  const srcTxChain = swap.tx?.vm === "evm" ? swap.tx.chainId : srcChain;
  const missing = !sender ? `Connect a ${isSolana(srcChain) ? "Solana" : "EVM"} wallet to pay from ${chainName(srcChain)}.` : !recipient ? `Connect a ${isSolana(dstChain) ? "Solana" : "EVM"} wallet or paste a recipient address.` : null;

  return (
    <main className="card">
      <header className="row between">
        <h1>Swap</h1>
        <div className="row wallets">
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          <WalletMultiButton />
        </div>
      </header>

      <fieldset disabled={swap.isBusy}>
        <label>You pay</label>
        <div className="row">
          <select value={srcChain} onChange={(e) => setSrcChain(Number(e.target.value))} aria-label="Source chain">
            {CHAIN_IDS.map((id) => <option key={id} value={id}>{chainName(id)}</option>)}
          </select>
          <select value={srcToken?.symbol} onChange={(e) => setSrcSymbol(e.target.value)} aria-label="Source token">
            {tokensOn(srcChain).map((t) => <option key={t.address}>{t.symbol}</option>)}
          </select>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
        </div>

        <label>You receive</label>
        <div className="row">
          <select value={dstChain} onChange={(e) => setDstChain(Number(e.target.value))} aria-label="Destination chain">
            {CHAIN_IDS.map((id) => <option key={id} value={id}>{chainName(id)}</option>)}
          </select>
          <select value={dstToken?.symbol} onChange={(e) => setDstSymbol(e.target.value)} aria-label="Destination token">
            {tokensOn(dstChain).map((t) => <option key={t.address}>{t.symbol}</option>)}
          </select>
          <output className="amount">{best && dstToken ? Number(formatUnits(BigInt(best.dstAmount), dstToken.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "–"}</output>
        </div>

        <label htmlFor="recipient">Recipient (optional)</label>
        <input id="recipient" placeholder={recipient ?? "Defaults to your connected wallet"} value={recipientOverride} onChange={(e) => setRecipientOverride(e.target.value)} />
      </fieldset>

      {missing && <p className="muted">{missing}</p>}
      {quote.isFetching && !best && <p className="muted">Asking every route…</p>}
      {quote.error && <p className="error">{quote.error.message}</p>}
      {best && (
        <dl className="quote">
          <dt>Route</dt><dd>{best.provider}</dd>
          <dt>Est. time</dt><dd>~{Math.max(1, Math.round(best.estimatedSeconds / 60))} min</dd>
          <dt>LayerHop fee</dt><dd>{(best.fees.ourFeeBps / 100).toFixed(2)}%</dd>
          {best.fees.integratorFeeBps ? <><dt>Partner fee ({best.fees.integrator})</dt><dd>{(best.fees.integratorFeeBps / 100).toFixed(2)}%</dd></> : null}
        </dl>
      )}

      {swap.phase === "idle" ? (
        <button className="primary" disabled={!best} onClick={() => best && void swap.start({ quote: best })}>
          {best ? "Swap" : "Enter an amount"}
        </button>
      ) : (
        <section className="status" aria-live="polite">
          <p><strong>{PHASE_LABEL[swap.phase] ?? swap.phase}</strong>{swap.status ? ` · order ${swap.status.state}` : ""}</p>
          {swap.txHash && (
            <p className="muted">
              Source tx: {explorerTx(srcTxChain, swap.txHash) ? <a href={explorerTx(srcTxChain, swap.txHash)} target="_blank" rel="noreferrer">{swap.txHash.slice(0, 10)}…</a> : swap.txHash}
            </p>
          )}
          {swap.status?.dstTxHash && <p className="muted">Delivered: {explorerTx(dstChain, swap.status.dstTxHash) ? <a href={explorerTx(dstChain, swap.status.dstTxHash)} target="_blank" rel="noreferrer">{swap.status.dstTxHash.slice(0, 10)}…</a> : swap.status.dstTxHash}</p>}
          {swap.error && <p className="error">{swap.error.message}</p>}
          {!swap.isBusy && <button onClick={swap.reset}>New swap</button>}
        </section>
      )}

      <footer className="muted small">
        Routed by LayerHop{LAYERHOP_OPTIONS.integrator ? ` · partner ${LAYERHOP_OPTIONS.integrator}` : ""}. Non-custodial: you sign every transaction in your own wallet.
      </footer>
    </main>
  );
}
