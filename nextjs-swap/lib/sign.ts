import type { EvmTx, SignResult, SvmTx } from "@layerhop/react";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { VersionedTransaction, type Connection } from "@solana/web3.js";
import { erc20Abi, type Address, type Hex } from "viem";
import type { Config } from "wagmi";
import { getAccount, readContract, sendTransaction, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";

/**
 * Wallet signers for `useSwap`. Everything is signed in the user's own wallet, in the browser:
 * this app never sees a private key and never sends anything on its own.
 */

const toBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));

/** EVM: switch chain, approve the exact amount if the allowance is too low, then send the swap. */
export async function signEvm(config: Config, tx: EvmTx): Promise<SignResult> {
  const account = getAccount(config);
  if (!account.address) throw new Error("Connect an EVM wallet first.");
  if (account.chainId !== tx.chainId) await switchChain(config, { chainId: tx.chainId });

  if (tx.approval) {
    const token = tx.approval.token as Address;
    const spender = tx.approval.spender as Address;
    const amount = BigInt(tx.approval.amount);
    const allowance = await readContract(config, {
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, spender],
      chainId: tx.chainId,
    });
    if (allowance < amount) {
      const approveHash = await writeContract(config, {
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
        chainId: tx.chainId,
      });
      await waitForTransactionReceipt(config, { hash: approveHash, chainId: tx.chainId });
    }
  }

  const hash = await sendTransaction(config, {
    to: tx.to as Address,
    data: tx.data as Hex,
    value: BigInt(tx.value),
    chainId: tx.chainId,
  });

  // Follow-up calls (e.g. a fee transfer) go out after the main transaction confirms.
  if (tx.extraTxs?.length) {
    await waitForTransactionReceipt(config, { hash, chainId: tx.chainId });
    for (const call of tx.extraTxs) {
      const h = await sendTransaction(config, { to: call.to as Address, data: call.data as Hex, value: BigInt(call.value), chainId: tx.chainId });
      await waitForTransactionReceipt(config, { hash: h, chainId: tx.chainId });
    }
  }
  return hash;
}

/** Solana: sign only when LayerHop must submit (`submitViaApi`), otherwise sign and send. */
export async function signSvm(wallet: WalletContextState, connection: Connection, tx: SvmTx): Promise<SignResult> {
  if (!wallet.publicKey) throw new Error("Connect a Solana wallet first.");
  const vtx = VersionedTransaction.deserialize(toBytes(tx.serializedTx));
  if (tx.submitViaApi) {
    if (!wallet.signTransaction) throw new Error("This wallet cannot sign without sending.");
    const signed = await wallet.signTransaction(vtx);
    return { signedTransaction: toBase64(signed.serialize()) };
  }
  return wallet.sendTransaction(vtx, connection);
}
