import { useRef } from 'react';
import { HistoryItem } from '../features/history/history-storage';

interface Props {
  items: HistoryItem[];
  storageOk: boolean;
  onLoad: (cidr: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ items, storageOk, onLoad, onRemove, onClear }: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  return (
    <aside className="card" aria-labelledby="hist-title">
      <div className="card-head">
        <h2 id="hist-title">History</h2>
        {items.length > 0 && (
          <button className="btn small danger" onClick={() => dlg.current?.showModal()}>
            Clear all
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="empty">No calculations yet. Results you calculate appear here.</p>
      ) : (
        <ul className="hist">
          {items.map((i) => (
            <li key={i.id}>
              <button className="load" onClick={() => onLoad(i.cidr)} title="Load this calculation">
                {i.cidr}
              </button>
              <button className="copy-mini" onClick={() => onRemove(i.id)} aria-label={`Remove ${i.cidr} from history`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={`note ${storageOk ? '' : 'warn'}`}>
        {storageOk
          ? 'Stored only in this browser. Clearing site data removes it.'
          : 'Browser storage is unavailable, so history lasts only for this visit.'}
      </div>
      <dialog ref={dlg}>
        <h2 style={{ marginTop: 0 }}>Clear all history?</h2>
        <p className="sub">This removes every saved calculation from this browser.</p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn" onClick={() => dlg.current?.close()}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => {
              onClear();
              dlg.current?.close();
            }}
          >
            Clear
          </button>
        </div>
      </dialog>
    </aside>
  );
}
