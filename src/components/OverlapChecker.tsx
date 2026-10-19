import { FormEvent, useState } from 'react';
import { checkOverlap } from '../features/calculator/subnet';
import { InputError, OverlapResult } from '../features/calculator/types';
import { errorMessage } from '../lib/validation';

export function OverlapChecker() {
  const [a, setA] = useState('10.0.0.0/16');
  const [b, setB] = useState('10.0.5.0/24');
  const [res, setRes] = useState<OverlapResult | null>(null);
  const [err, setErr] = useState<{ field: string; message: string } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    try {
      setRes(checkOverlap(a, b));
      setErr(null);
    } catch (ex) {
      setRes(null);
      setErr({ field: ex instanceof InputError ? ex.field : 'x', message: errorMessage(ex) });
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="ov-title">
      <h2 id="ov-title">Range &amp; overlap checker</h2>
      <p className="sub">Compare two CIDR networks to see whether they overlap or contain one another.</p>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="ov-a">Network A</label>
          <input id="ov-a" className="input" value={a} onChange={(e) => setA(e.target.value)} aria-invalid={err?.field === 'a'} spellCheck={false} />
          {err?.field === 'a' && <div className="error" role="alert">{err.message}</div>}
        </div>
        <div className="field">
          <label htmlFor="ov-b">Network B</label>
          <input id="ov-b" className="input" value={b} onChange={(e) => setB(e.target.value)} aria-invalid={err?.field === 'b'} spellCheck={false} />
          {err?.field === 'b' && <div className="error" role="alert">{err.message}</div>}
        </div>
      </div>
      <div className="actions">
        <button className="btn primary" type="submit">Check</button>
      </div>
      {res && (
        <div className={`note ${res.overlaps ? 'warn' : 'ok'} fade-in`} role="status">
          <strong>{res.overlaps ? 'Overlap detected.' : 'No overlap.'}</strong> {res.explanation}
          {res.intersection && <> Intersection: <code>{res.intersection}</code>.</>}
        </div>
      )}
    </form>
  );
}
