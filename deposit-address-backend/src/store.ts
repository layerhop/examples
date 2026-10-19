import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A deliberately small store: in memory, optionally saved to a JSON file after every change.
 * Good for a demo or a single instance. Use your database (one row per credit, unique on quoteId)
 * before running more than one instance.
 */

export interface UserAddress {
  id: string;
  userId: string;
  address: string;
  chainId: number;
  token: string;
  dstChainId: number;
  dstToken: string;
  livemode: boolean;
  createdAt: string;
}

export interface Credit {
  quoteId: string;
  userId: string;
  depositAddressId: string;
  /** `${dstChainId}:${dstToken}` */
  asset: string;
  /** Base units, integer string. */
  amount: string;
  srcTxHash: string | null;
  dstTxHash: string | null;
  creditedAt: string;
}

interface Data {
  addresses: Record<string, UserAddress>;
  credits: Record<string, Credit>;
  seenEvents: string[];
}

export class Store {
  private data: Data = { addresses: {}, credits: {}, seenEvents: [] };

  constructor(private readonly file?: string) {
    if (file && existsSync(file)) this.data = { ...this.data, ...(JSON.parse(readFileSync(file, "utf8")) as Partial<Data>) };
  }

  private save(): void {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, this.file); // atomic replace
  }

  addressesOf(userId: string): UserAddress[] {
    return Object.values(this.data.addresses).filter((a) => a.userId === userId);
  }

  getAddress(id: string): UserAddress | undefined {
    return this.data.addresses[id];
  }

  putAddress(a: UserAddress): void {
    this.data.addresses[a.id] = a;
    this.save();
  }

  /** Returns false when the event was already handled (deliveries are retried with the same id). */
  markEventSeen(eventId: string): boolean {
    if (this.data.seenEvents.includes(eventId)) return false;
    this.data.seenEvents = [...this.data.seenEvents.slice(-9_999), eventId];
    this.save();
    return true;
  }

  /** Credit a deposit once: a second call for the same order (quoteId) is a no-op. */
  credit(c: Credit): boolean {
    if (this.data.credits[c.quoteId]) return false;
    this.data.credits[c.quoteId] = c;
    this.save();
    return true;
  }

  creditsOf(userId: string): Credit[] {
    return Object.values(this.data.credits).filter((c) => c.userId === userId);
  }

  /** Per-asset balance in base units. */
  balancesOf(userId: string): Record<string, string> {
    const out: Record<string, bigint> = {};
    for (const c of this.creditsOf(userId)) out[c.asset] = (out[c.asset] ?? 0n) + BigInt(c.amount);
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.toString()]));
  }
}
