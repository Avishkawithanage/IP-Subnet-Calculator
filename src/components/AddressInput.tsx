import { FormEvent } from 'react';
import { splitCombined } from '../lib/validation';

interface Props {
  address: string;
  prefix: string;
  onAddress: (v: string) => void;
  onPrefix: (v: string) => void;
  onSubmit: (address?: string, prefix?: string) => void;
  onClear: () => void;
  error: { field: string; message: string } | null;
}

const PRESETS = ['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12', '192.168.10.25/26', '10.1.2.3/31', '8.8.8.8/32'];

export function AddressInput({ address, prefix, onAddress, onPrefix, onSubmit, onClear, error }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  // Pasting "ip/prefix" into the address box fills both fields.
  const handleAddress = (v: string) => {
    if (v.includes('/')) {
      const sp = splitCombined(v);
      if (sp) {
        onAddress(sp.address);
        onPrefix(sp.prefix);
        return;
      }
    }
    onAddress(v);
  };
  const addrErr = error && error.field === 'address' ? error.message : null;
  const preErr = error && error.field === 'prefix' ? error.message : null;
  const generic = error && error.field !== 'address' && error.field !== 'prefix' ? error.message : null;

  return (
    <form className="card" onSubmit={submit} noValidate aria-labelledby="calc-title">
      <h2 id="calc-title">IPv4 / CIDR calculator</h2>
      <p className="sub">Enter an address and prefix, or paste a combined value like 192.168.10.25/24.</p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="ip">IPv4 address</label>
          <input
            id="ip"
            className="input"
            value={address}
            onChange={(e) => handleAddress(e.target.value)}
            placeholder="192.168.10.25"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!addrErr}
            aria-describedby={addrErr ? 'ip-err' : undefined}
          />
          {addrErr && (
            <div className="error" id="ip-err" role="alert">
              {addrErr}
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="prefix">Prefix (/0–/32)</label>
          <input
            id="prefix"
            className="input"
            value={prefix}
            onChange={(e) => onPrefix(e.target.value)}
            placeholder="24"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!preErr}
            aria-describedby={preErr ? 'prefix-err' : undefined}
          />
          {preErr && (
            <div className="error" id="prefix-err" role="alert">
              {preErr}
            </div>
          )}
        </div>
      </div>
      {generic && (
        <div className="error" role="alert">
          {generic}
        </div>
      )}
      <div className="actions">
        <button type="submit" className="btn primary">
          Calculate
        </button>
        <button type="button" className="btn" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="chips" aria-label="Preset examples">
        <span className="label">Try:</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="chip"
            onClick={() => {
              const sp = splitCombined(p)!;
              onAddress(sp.address);
              onPrefix(sp.prefix);
              onSubmit(sp.address, sp.prefix);
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </form>
  );
}
