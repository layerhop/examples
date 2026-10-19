import { SOLANA_CHAIN_ID, TOKENS, getChain } from "@layerhop/sdk";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";

/** EVM chains wagmi can switch to. Their ids match LayerHop's chain ids. */
export const EVM_CHAINS = [mainnet, base, arbitrum, optimism, polygon, bsc] as const;

/** The chains offered in the pickers (the SDK's built-in token list covers all of them). */
export const CHAIN_IDS = [...EVM_CHAINS.map((c) => c.id), SOLANA_CHAIN_ID] as const;

export const chainName = (id: number) => getChain(id)?.name ?? String(id);
type Token = (typeof TOKENS)[number];

export const isSolana = (id: number) => id === SOLANA_CHAIN_ID;

export const tokensOn = (chainId: number): Token[] => TOKENS.filter((t) => t.chainId === chainId);

export function explorerTx(chainId: number, hash: string): string | undefined {
  const c = getChain(chainId);
  return c ? `${c.explorerTx}${hash}` : undefined;
}

const integrator = process.env.NEXT_PUBLIC_LAYERHOP_INTEGRATOR?.trim();

/** Options for the LayerHop client. `integrator` makes every quote carry your partner fee. */
export const LAYERHOP_OPTIONS = {
  baseUrl: process.env.NEXT_PUBLIC_LAYERHOP_API_URL?.trim() || undefined,
  integrator: integrator && /^[a-z0-9-]{1,32}$/.test(integrator) ? integrator : undefined,
};

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
