# LayerHop Expo example

A minimal Expo app with the LayerHop swap widget and checkout from
[`@layerhop/react-native`](../../packages/react-native). Wallet links (WalletConnect, MetaMask,
Phantom…) open the wallet app; the app never holds keys or signs.

This folder is **not** part of the monorepo's pnpm workspace: it has its own dependencies, so
installing it never pulls Expo into the workspace.

```bash
cd examples/expo-swap
npm install
npx expo install --fix        # align versions with your Expo SDK
npx expo start                # then press i (iOS) or a (Android), or scan the QR code with Expo Go
```

To try the checkout, create a session on your server with your API key (`lh.checkout.create(...)`)
and start with `EXPO_PUBLIC_LAYERHOP_SESSION_ID=cs_test_... npx expo start`. A `lh_test_` key gives a
sandbox session.

Before `@layerhop/react-native` is on npm, build it from the monorepo and point the dependency at it:

```bash
pnpm --filter @layerhop/widget --filter @layerhop/react-native build
npm install ../../packages/react-native
```
