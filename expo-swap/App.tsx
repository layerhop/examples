import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LayerHopCheckout, LayerHopWidget, useWalletReturn } from "@layerhop/react-native";

// A checkout session created on YOUR server with your API key (`lh.checkout.create(...)`), e.g.
// EXPO_PUBLIC_LAYERHOP_SESSION_ID=cs_test_... npx expo start. Never put an API key in the app.
const SESSION_ID = process.env.EXPO_PUBLIC_LAYERHOP_SESSION_ID;

export default function App() {
  const [tab, setTab] = useState<"swap" | "pay">("swap");
  const [log, setLog] = useState("Pick a route, connect your wallet app, swap.");

  // The user switched back from their wallet app (or a wallet redirected to layerhop-expo-swap://).
  useWalletReturn((e) => setLog(e.reason === "url" ? `Opened from ${e.url}` : "Back from the wallet"), { scheme: "layerhop-expo-swap" });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.tabs}>
          {(["swap", "pay"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === "swap" ? "Swap" : "Checkout"}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "swap" ? (
          <LayerHopWidget
            srcChain="base"
            srcToken="USDC"
            dstChain="solana"
            dstToken="SOL"
            theme="dark"
            preset="midnight"
            gasOnArrival
            autoResize={false}
            style={styles.fill}
            onQuote={(q) => setLog(`Best route: ${q.provider}`)}
            onSubmitted={(e) => setLog(`Submitted ${e.srcTxHash.slice(0, 10)}…`)}
            onStatus={(e) => setLog(`Order ${e.state}`)}
            onError={(e) => setLog(`${e.code}: ${e.message}`)}
          />
        ) : SESSION_ID ? (
          <LayerHopCheckout
            sessionId={SESSION_ID}
            autoResize={false}
            style={styles.fill}
            onStatus={(s) => setLog(`Payment ${s}`)}
            onPaid={(s) => setLog(`Paid: ${s.id}`)}
            onError={(e) => setLog(`${e.code}: ${e.message}`)}
          />
        ) : (
          <Text style={[styles.log, styles.fill]}>Set EXPO_PUBLIC_LAYERHOP_SESSION_ID to a checkout session id to try the checkout.</Text>
        )}

        <Text style={styles.log} numberOfLines={2}>
          {log}
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090d15" },
  fill: { flex: 1 },
  tabs: { flexDirection: "row", gap: 8, padding: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#19212f" },
  tabActive: { backgroundColor: "#c3f06b" },
  tabText: { color: "#9eadc2", fontWeight: "600" },
  tabTextActive: { color: "#090d15" },
  log: { color: "#9eadc2", padding: 16, fontSize: 13 },
});
