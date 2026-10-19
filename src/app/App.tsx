import { useCallback, useEffect, useRef, useState } from 'react';
import { AddressInput } from '../components/AddressInput';
import { HistoryPanel } from '../components/HistoryPanel';
import { MaskConverter } from '../components/MaskConverter';
import { OverlapChecker } from '../components/OverlapChecker';
import { SubnetResult } from '../components/SubnetResult';
import { SubnetSplitter } from '../components/SubnetSplitter';
import { VlsmPlanner } from '../components/VlsmPlanner';
import { calculateSubnet } from '../features/calculator/subnet';
import { InputError, SubnetResult as Result } from '../features/calculator/types';
import { addHistory, HistoryItem, loadHistory, saveHistory } from '../features/history/history-storage';
import { copyText } from '../lib/clipboard';
import { errorMessage, splitCombined } from '../lib/validation';

type Tab = 'calc' | 'split' | 'vlsm' | 'overlap';
type Theme = 'light' | 'dark';
const TABS: { id: Tab; label: string }[] = [
  { id: 'calc', label: 'Calculator' },
  { id: 'split', label: 'Subnet splitter' },
  { id: 'vlsm', label: 'VLSM planner' },
  { id: 'overlap', label: 'Overlap checker' },
];

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('ipcalc.theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function hashCidr(): string | null {
  const m = /[#&]c=([^&]+)/.exec(window.location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}

export function App() {
  const [tab, setTab] = useState<Tab>('calc');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [address, setAddress] = useState('192.168.10.25');
  const [prefix, setPrefix] = useState('24');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [storageOk, setStorageOk] = useState(true);
  const [toast, setToast] = useState<{ msg: string; bad: boolean } | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ipcalc.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const notify = useCallback((msg: string, bad = false) => {
    setToast({ msg, bad });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const calculate = useCallback((a: string, p: string, record = true) => {
    try {
      const r = calculateSubnet(a, p);
      setResult(r);
      setError(null);
      if (record) {
        setHistory((h) => {
          const next = addHistory(h, `${r.inputAddress}/${r.prefix}`);
          setStorageOk(saveHistory(next));
          return next;
        });
        try {
          window.history.replaceState(null, '', `#c=${encodeURIComponent(`${r.inputAddress}/${r.prefix}`)}`);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setResult(null);
      setError({ field: e instanceof InputError ? e.field : 'input', message: errorMessage(e) });
    }
  }, []);

  // Load a shared link on first render.
  useEffect(() => {
    const c = hashCidr();
    const sp = c ? splitCombined(c) : null;
    if (sp) {
      setAddress(sp.address);
      setPrefix(sp.prefix);
      calculate(sp.address, sp.prefix, false);
    } else {
      calculate('192.168.10.25', '24', false);
    }
  }, [calculate]);

  const onCopy = async (text: string, label: string) => {
    notify((await copyText(text)) ? `${label} copied` : 'Copy failed: clipboard permission denied', false);
  };
  const onShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#c=${encodeURIComponent(`${address.trim()}/${prefix.trim()}`)}`;
    const ok = await copyText(url);
    notify(ok ? 'Share link copied' : 'Copy failed: clipboard permission denied', !ok);
  };

  const loadHistoryItem = (cidr: string) => {
    const sp = splitCombined(cidr);
    if (!sp) return;
    setAddress(sp.address);
    setPrefix(sp.prefix);
    calculate(sp.address, sp.prefix);
    setTab('calc');
  };
  const removeItem = (id: string) =>
    setHistory((h) => {
      const next = h.filter((i) => i.id !== id);
      setStorageOk(saveHistory(next));
      return next;
    });
  const clearAll = () => {
    setHistory([]);
    setStorageOk(saveHistory([]));
  };

  return (
    <div className="shell">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg viewBox="0 0 32 32" fill="#fff">
              <rect x="4" y="4" width="10" height="10" rx="3" />
              <rect x="18" y="4" width="10" height="10" rx="3" opacity=".65" />
              <rect x="4" y="18" width="10" height="10" rx="3" opacity=".65" />
              <rect x="18" y="18" width="10" height="10" rx="3" />
            </svg>
          </div>
          <div>
            <h1>IP Subnet Calculator</h1>
            <p>IPv4 · CIDR · VLSM · runs 100% in your browser</p>
          </div>
        </div>
        <button className="btn icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="tabs" role="tablist" aria-label="Tools">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} className="tab" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <main>
        {tab === 'calc' && (
          <div className="grid-main" role="tabpanel" id="panel-calc" aria-labelledby="tab-calc">
            <div className="stack">
              <AddressInput
                address={address}
                prefix={prefix}
                onAddress={setAddress}
                onPrefix={setPrefix}
                onSubmit={(a, p) => calculate(a ?? address, p ?? prefix)}
                onClear={() => {
                  setAddress('');
                  setPrefix('');
                  setResult(null);
                  setError(null);
                }}
                error={error}
              />
              {result && <SubnetResult result={result} onCopy={onCopy} onNotify={notify} onShare={onShare} />}
              <MaskConverter />
            </div>
            <div className="stack">
              <HistoryPanel items={history} storageOk={storageOk} onLoad={loadHistoryItem} onRemove={removeItem} onClear={clearAll} />
            </div>
          </div>
        )}
        {tab === 'split' && (
          <div role="tabpanel" id="panel-split" aria-labelledby="tab-split">
            <SubnetSplitter />
          </div>
        )}
        {tab === 'vlsm' && (
          <div role="tabpanel" id="panel-vlsm" aria-labelledby="tab-vlsm">
            <VlsmPlanner />
          </div>
        )}
        {tab === 'overlap' && (
          <div role="tabpanel" id="panel-overlap" aria-labelledby="tab-overlap">
            <OverlapChecker />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Calculations run locally in your browser. Nothing you enter is sent anywhere.</p>
        <p>/31 follows RFC 3021 (both addresses usable); /32 is a single host route; other prefixes reserve network and broadcast.</p>
      </footer>

      <div className={`toast ${toast ? 'show' : ''} ${toast?.bad ? 'bad' : ''}`} role="status" aria-live="polite">
        {toast?.msg}
      </div>
    </div>
  );
}
