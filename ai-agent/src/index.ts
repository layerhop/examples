import { LayerHop } from "@layerhop/sdk";
import { generateText, isStepCount } from "ai";
import { createLayerHop, createLayerHopTools, type PreparedSwap } from "./tools.js";

/**
 * A swap agent: ask in plain words, get a quote and an unsigned transaction to sign yourself.
 *
 *   npm start -- "Bridge 25 USDC from Base to Arbitrum for 0xYourAddress"
 *   npm run demo     # no AI key needed: calls the tools directly
 */

const lh = new LayerHop({
  integrator: process.env.LAYERHOP_INTEGRATOR?.trim() || undefined, // your partner fee, if registered
  apiKey: process.env.LAYERHOP_API_KEY?.trim() || undefined, // optional for quotes
});

const prepared: PreparedSwap[] = [];
const tools = createLayerHopTools(lh, (s) => prepared.push(s));

function printPrepared() {
  for (const p of prepared) {
    console.log("\n--- Unsigned transaction (review, then sign in YOUR wallet) ---");
    console.log(JSON.stringify(p.tx, null, 2));
    if (p.tx.vm === "evm" && p.tx.approval) console.log(`Send the ERC-20 approval first: ${p.tx.approval.amount} of ${p.tx.approval.token} to ${p.tx.approval.spender}.`);
    if (p.tx.vm === "svm" && p.tx.submitViaApi) console.log("Solana: sign only, then submit the signed tx with lh.submit(quoteId, signedTx).");
    console.log(`After broadcasting, report it: lh.reportSubmitted("${p.quote.quoteId}", txHash)`);
    console.log(`Or open the same swap prefilled: ${p.deepLink}`);
  }
}

async function demo() {
  const sender = process.env.DEMO_ADDRESS?.trim() || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // any address works for a quote
  const params = { srcChain: "base", srcToken: "USDC", amount: "25", dstChain: "arbitrum", dstToken: "USDC", sender, recipient: sender };
  const api = createLayerHop(lh);
  console.log("Quote:", (await api.quote(params)).summary);
  prepared.push(await api.prepare(params));
  printPrepared();
}

async function agent(prompt: string) {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    console.error("Set AI_GATEWAY_API_KEY (Vercel AI Gateway), or run `npm run demo` to try the tools without a model.");
    process.exit(1);
  }
  const { text } = await generateText({
    model: process.env.AI_MODEL?.trim() || "anthropic/claude-sonnet-5.5",
    tools,
    stopWhen: isStepCount(6),
    system: [
      "You help users swap and bridge tokens with LayerHop.",
      "Quote first and explain the output, fees and time. Build the unsigned transaction only when the user clearly wants to swap and gave their address.",
      "You can never sign or send. Never ask for private keys or seed phrases. Amounts are in normal units.",
    ].join(" "),
    prompt,
  });
  console.log(text);
  printPrepared();
}

const args = process.argv.slice(2);
const run = args.includes("--no-llm") ? demo() : agent(args.join(" ").trim() || "What would I get for 100 USDC on Base bridged to SOL on Solana? My Base address is 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 and my Solana address is 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM.");
run.catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
