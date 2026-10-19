"use client";

import "@rainbow-me/rainbowkit/styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

import { LayerHopProvider } from "@layerhop/react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { http, createConfig, WagmiProvider, type Config } from "wagmi";
import { injected } from "wagmi/connectors";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { EVM_CHAINS, LAYERHOP_OPTIONS, SOLANA_RPC_URL, WALLETCONNECT_PROJECT_ID } from "@/lib/config";

const transports = {
  [mainnet.id]: http(),
  [base.id]: http(),
  [arbitrum.id]: http(),
  [optimism.id]: http(),
  [polygon.id]: http(),
  [bsc.id]: http(),
};

/**
 * With a WalletConnect project id: RainbowKit's default wallet list (extensions, mobile via QR).
 * Without one: browser extension wallets only (EIP-6963 discovery), so the template runs with zero setup.
 */
const wagmiConfig: Config = WALLETCONNECT_PROJECT_ID
  ? getDefaultConfig({ appName: "LayerHop Swap", projectId: WALLETCONNECT_PROJECT_ID, chains: EVM_CHAINS, transports })
  : createConfig({ chains: EVM_CHAINS, connectors: [injected()], transports });

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ borderRadius: "medium" })}>
          {/* wallets={[]}: Phantom, Solflare, Backpack, ... register themselves via Wallet Standard. */}
          <ConnectionProvider endpoint={SOLANA_RPC_URL}>
            <WalletProvider wallets={[]} autoConnect>
              <WalletModalProvider>
                <LayerHopProvider options={LAYERHOP_OPTIONS} queryClient={queryClient}>
                  {children}
                </LayerHopProvider>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
