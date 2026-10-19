import { SubnetResult as Result } from '../features/calculator/types';
import { fmtNum } from '../lib/format';
import { BinaryView } from './BinaryView';
import { ExportControls } from './ExportControls';
import { ResultTable } from './ResultTable';

interface Props {
  result: Result;
  onCopy: (text: string, label: string) => void;
  onNotify: (msg: string, bad?: boolean) => void;
  onShare: () => void;
}

export function SubnetResult({ result: r, onCopy, onNotify, onShare }: Props) {
  return (
    <div className="fade-in" aria-live="polite">
      <section className="hero" aria-label="Result summary">
        <div className="k">Network</div>
        <div className="v">{r.cidr}</div>
        <div className="hero-tags">
          <span className="tag">Mask {r.subnetMask}</span>
          <span className="tag">Class {r.ipClass}</span>
          <span className="tag">{r.scope}</span>
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <div className="k">Total addresses</div>
          <div className="v">{fmtNum(r.totalAddresses)}</div>
        </div>
        <div className="stat">
          <div className="k">Usable hosts</div>
          <div className="v">{fmtNum(r.usableHostCount)}</div>
        </div>
        <div className="stat">
          <div className="k">Host bits</div>
          <div className="v">{32 - r.prefix}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h2>Details</h2>
          <button className="btn small" onClick={onShare}>
            Copy share link
          </button>
        </div>
        <ResultTable result={r} onCopy={onCopy} />
        <div className={`note ${r.prefix >= 31 ? 'warn' : ''}`}>{r.hostCountNote}</div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Binary view</h2>
        <p className="sub">32-bit representation grouped by octet.</p>
        <BinaryView result={r} />
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Copy &amp; export</h2>
        <p className="sub">Exports come straight from the validated result.</p>
        <ExportControls result={r} onCopy={onCopy} onNotify={onNotify} />
      </div>
    </div>
  );
}
