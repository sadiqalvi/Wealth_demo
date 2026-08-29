/**
 * Cross-tab demo bridge: Consumer writes NP_DEMO_EVENT; Admin listens via window "storage"
 * (same-origin, other tabs only — the writing tab does not receive the event).
 */

export const NP_DEMO_EVENT_KEY = "NP_DEMO_EVENT";
export const NP_DEMO_CROSS_TAB_ACTIVITIES_KEY = "NP_DEMO_CROSS_TAB_ACTIVITIES";

export type NPDemoKycEvent = {
  type: "SAHULAT_KYC";
  id: string;
  name: string;
  timestamp: string;
  status: "RECEIVED";
  broker_name?: string;
  user_id?: string;
};

export type NPDemoActivityItem = {
  id: string;
  title: string;
  detail: string;
  tone: "success" | "pending";
  createdAt: string;
};

export function broadcastNPDemoKycEvent(payload: NPDemoKycEvent): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(NP_DEMO_EVENT_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function readPersistedCrossTabActivities(): NPDemoActivityItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(NP_DEMO_CROSS_TAB_ACTIVITIES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (row): row is NPDemoActivityItem =>
        row &&
        typeof row === "object" &&
        typeof (row as NPDemoActivityItem).id === "string" &&
        typeof (row as NPDemoActivityItem).title === "string" &&
        typeof (row as NPDemoActivityItem).detail === "string" &&
        ((row as NPDemoActivityItem).tone === "success" || (row as NPDemoActivityItem).tone === "pending") &&
        typeof (row as NPDemoActivityItem).createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function persistCrossTabActivitiesAppend(items: NPDemoActivityItem[]): void {
  if (typeof window === "undefined" || !items.length) {
    return;
  }
  try {
    const existing = readPersistedCrossTabActivities();
    const map = new Map(existing.map((i) => [i.id, i]));
    items.forEach((i) => map.set(i.id, i));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    localStorage.setItem(NP_DEMO_CROSS_TAB_ACTIVITIES_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
