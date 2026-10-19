import { FormEvent, useState } from 'react';
import { VlsmRequirement, VlsmResult } from '../features/calculator/types';
import { allocateVlsm } from '../features/calculator/vlsm';
import { fmtNum } from '../lib/format';
import { errorMessage } from '../lib/validation';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
let seq = 4;
const newId = () => `r${++seq}`;

interface Row {
  id: string;
  name: string;
  hosts: string;
}

export function VlsmPlanner() {
  const [parent, setParent] = useState('192.168.0.0/24');
  const [rows, setRows] = useState<Row[]>([
    { id: 'r1', name: 'Sales', hosts: '100' },
    { id: 'r2', name: 'Engineering', hosts: '50' },
    { id: 'r3', name: 'Management', hosts: '20' },
    { id: 'r4', name: 'WAN link', hosts: '2' },
  ]);
  const [p2p, setP2p] = useState(false);
  const [res, setRes] = useState<VlsmResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const reqs: VlsmRequirement[] = rows.map((r) => {
        const t = r.hosts.trim();
        return { id: r.id, name: r.name, requiredHosts: /^\d+$/.test(t) ? Number(t) : NaN };
      });
      setRes(allocateVlsm(parent, reqs, { useSlash31ForTwoHosts: p2p }));
      setErr(null);
    } catch (ex) {
      setRes(null);
      setErr(errorMessage(ex));
    }
  };

  const colorOf = (id: string) => COLORS[rows.findIndex((r) => r.id === id) % COLORS.length];

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="vl-title">
      <h2 id="vl-title">VLSM planner</h2>
      <p className="sub">Allocate variable-sized subnets from one parent network, largest first, on aligned boundaries.</p>
      <div className="field" style={{ maxWidth: 360 }}>
        <label htmlFor="vl-parent">Parent network (CIDR)</label>
        <input id="vl-parent" className="input" value={parent} onChange={(e) => setParent(e.target.value)} spellCheck={false} />
      </div>

      <div style={{ marginTop: 18 }} role="group" aria-label="Network requirements">
        {rows.map((r, i) => (
          <div className="req-row" key={r.id}>
            <input className="input" style={{ fontFamily: 'inherit' }} value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} aria-label={`Network ${i + 1} name`} placeholder="Name" />
            <input className="input" value={r.hosts} onChange={(e) => update(r.id, { hosts: e.target.value })} aria-label={`Network ${i + 1} required hosts`} inputMode="numeric" placeholder="Hosts" />
            <button type="button" className="btn icon-btn" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} aria-label={`Remove ${r.name || 'network'}`}>✕</button>
          </div>
        ))}
        <button type="button" className="btn small" onClick={() => setRows((rs) => [...rs, { id: newId(), name: `Network ${rs.length + 1}`, hosts: '10' }])}>+ Add network</button>
      </div>

      <label className="check">
        <input type="checkbox" checked={p2p} onChange={(e) => setP2p(e.target.checked)} />
        Use /31 for 2-host point-to-point links (RFC 3021)
      </label>
      {err && <div className="error" role="alert" style={{ marginTop: 12 }}>{err}</div>}
      <div className="actions">
        <button className="btn primary" type="submit">Allocate</button>
      </div>

      {res && (
        <div className="fade-in" style={{ marginTop: 20 }} aria-live="polite">
          <div className="bar" role="img" aria-label={`${fmtNum(res.usedAddresses)} of ${fmtNum(res.parentAddresses)} addresses allocated`}>
            {res.allocations.map((a) => (
              <i key={a.requirementId} title={`${a.name} ${a.cidr}`} style={{ width: `${(a.totalAddresses / res.parentAddresses) * 100}%`, background: colorOf(a.requirementId) }} />
            ))}
          </div>
          <div className="sub" style={{ margin: '0 0 12px' }}>
            {fmtNum(res.usedAddresses)} of {fmtNum(res.parentAddresses)} addresses allocated in {res.parent} ({((res.usedAddresses / res.parentAddresses) * 100).toFixed(1)}%).
          </div>

          {res.failures.length > 0 && (
            <div className="note err" role="alert">
              <strong>{res.failures.length} requirement{res.failures.length === 1 ? '' : 's'} could not be allocated:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                {res.failures.map((f) => (
                  <li key={f.requirementId}>{f.name} ({fmtNum(f.requiredHosts)} hosts): {f.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {res.allocations.length > 0 && (
            <div className="scroll" style={{ marginTop: 12 }}>
              <table className="dtable">
                <thead>
                  <tr><th>Name</th><th>Needed</th><th>Subnet</th><th>Mask</th><th>First host</th><th>Last host</th><th>Broadcast</th><th>Usable</th></tr>
                </thead>
                <tbody>
                  {res.allocations.map((a) => (
                    <tr key={a.requirementId}>
                      <td className="name"><span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, marginRight: 8, background: colorOf(a.requirementId) }} />{a.name}</td>
                      <td>{fmtNum(a.requiredHosts)}</td>
                      <td><span className="pill">{a.cidr}</span></td>
                      <td>{a.subnetMask}</td>
                      <td>{a.firstUsableAddress}</td>
                      <td>{a.lastUsableAddress}</td>
                      <td>{a.broadcastAddress}</td>
                      <td>{fmtNum(a.usableHostCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ margin: '18px 0 8px', fontSize: '0.95rem' }}>Unused address space</h3>
          {res.unused.length === 0 ? (
            <p className="empty">None — the parent network is fully allocated.</p>
          ) : (
            <div className="chips" style={{ marginTop: 0 }}>
              {res.unused.map((u) => (
                <span className="chip" key={u.cidr} style={{ cursor: 'default' }}>{u.cidr} · {fmtNum(u.totalAddresses)}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
