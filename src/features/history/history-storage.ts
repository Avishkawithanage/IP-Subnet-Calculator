const KEY = 'ipcalc.history.v1';
const MAX = 20;

export interface HistoryItem {
  id: string;
  cidr: string; // as typed, e.g. 192.168.10.25/24
  at: number;
}

function valid(x: unknown): x is HistoryItem {
  const o = x as HistoryItem;
  return !!o && typeof o.id === 'string' && typeof o.cidr === 'string' && typeof o.at === 'number';
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(valid).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Returns false if storage is unavailable or full. */
export function saveHistory(items: HistoryItem[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
    return true;
  } catch {
    return false;
  }
}

export function addHistory(items: HistoryItem[], cidr: string): HistoryItem[] {
  const rest = items.filter((i) => i.cidr !== cidr);
  return [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, cidr, at: Date.now() }, ...rest].slice(0, MAX);
}
