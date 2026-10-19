import { serve } from "@hono/node-server";
import app from "./index.js";

/** Long-running Node server (local dev, Docker). Vercel imports ./index.ts directly instead. */
const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port }, (info) => console.log(`deposit-address-backend listening on http://localhost:${info.port}`));
