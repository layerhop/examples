import "server-only";

/**
 * Demo store for fulfilled orders, keyed by checkout session id. It lives in memory, so it resets on
 * restart and is not shared between serverless instances: replace it with your database. The
 * success page also asks the LayerHop API directly, so the paid state shows either way.
 */
export interface Fulfilment {
  sessionId: string;
  reference: string | null;
  amount: string;
  paidAt: string;
  eventId: string;
}

type Store = { orders: Map<string, Fulfilment>; seenEvents: Set<string> };
const g = globalThis as typeof globalThis & { __layerhopStore?: Store };
const store: Store = (g.__layerhopStore ??= { orders: new Map(), seenEvents: new Set() });

/** Returns false when the event was already processed (webhooks are retried with the same id). */
export function markEventSeen(eventId: string): boolean {
  if (store.seenEvents.has(eventId)) return false;
  store.seenEvents.add(eventId);
  return true;
}

export function fulfil(f: Fulfilment): void {
  if (!store.orders.has(f.sessionId)) store.orders.set(f.sessionId, f);
}

export const getFulfilment = (sessionId: string) => store.orders.get(sessionId);
