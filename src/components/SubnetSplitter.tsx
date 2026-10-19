import { FormEvent, useState } from 'react';
import { splitSubnet, SplitResult } from '../features/calculator/subnet';
import { fmtNum } from '../lib/format';
import { errorMessage } from '../lib/validation';

const PAGE = 64;

export function SubnetSplitter() {
  const [parent, setParent] = useState('192.168.10.0/24');
  const [child, setChild] = useState('26');
  const [res, setRes] = useState<SplitResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = (offset: number) => {
    try {
      setRes(splitSubnet(parent, child, offset, PAGE));
      setErr(null);
    } catch (e) {
      setRes(null);
      setErr(errorMessage(e));
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(0);
  };

  const shownEnd = res ? res.offset + res.subnets.length : 0;

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="sp-title">
      <h2 id="sp-title">Subnet splitter</h2>
      <p className="sub">Divide a parent network into equal-sized child subnets.</p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sp-parent">Parent network (CIDR)</label>
          <input id="sp-parent" className="input" value={parent} onChange={(e) => setParent(e.target.value)} spellCheck={false} aria-invalid={!!err} />
        </div>
        <div className="field">
          <label htmlFor="sp-child">Child prefix</label>
          <input id="sp-child" className="input" value={child} onChange={(e) => setChild(e.target.value)} inputMode="numeric" aria-invalid={!!err} />
        </div>
      </div>
      {err && <div className="error" role="alert">{err}</div>}
      <div className="actions">
        <button className="btn primary" type="submit">Split</button>
      </div>

      {res && (
        <div className="fade-in" style={{ marginTop: 18 }} aria-live="polite">
          <div className="note ok">
            <strong>{fmtNum(res.totalChildren)}</strong> subnet{res.totalChildren === 1 ? '' : 's'} of <strong>/{res.childPrefix}</strong> inside {res.parent}.
            {res.totalChildren > PAGE && <> Showing {fmtNum(res.offset + 1)}–{fmtNum(shownEnd)} (paged, nothing is dropped).</>}
          </div>
          <div className="scroll" style={{ marginTop: 12 }}>
            <table className="dtable">
              <thead>
                <tr><th>#</th><th>Network</th><th>Mask</th><th>First host</th><th>Last host</th><th>Broadcast</th><th>Hosts</th></tr>
              </thead>
              <tbody>
                {res.subnets.map((s) => (
                  <tr key={s.index}>
                    <td>{fmtNum(s.index + 1)}</td>
                    <td><span className="pill">{s.cidr}</span></td>
                    <td>{s.subnetMask}</td>
                    <td>{s.firstUsableAddress}</td>
                    <td>{s.lastUsableAddress}</td>
                    <td>{s.broadcastAddress}</td>
                    <td>{fmtNum(s.usableHostCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {res.totalChildren > PAGE && (
            <div className="pager">
              <button type="button" className="btn small" disabled={res.offset === 0} onClick={() => run(Math.max(0, res.offset - PAGE))}>← Previous</button>
              <span>Page {Math.floor(res.offset / PAGE) + 1} of {fmtNum(Math.ceil(res.totalChildren / PAGE))}</span>
              <button type="button" className="btn small" disabled={shownEnd >= res.totalChildren} onClick={() => run(res.offset + PAGE)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
