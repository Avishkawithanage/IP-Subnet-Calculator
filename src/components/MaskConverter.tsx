import { useState } from 'react';
import { maskToPrefix, parsePrefix, prefixToMaskString } from '../features/calculator/subnet-mask';
import { errorMessage } from '../lib/validation';

export function MaskConverter() {
  const [prefix, setPrefix] = useState('24');
  const [mask, setMask] = useState('255.255.255.0');
  const [prefixErr, setPrefixErr] = useState<string | null>(null);
  const [maskErr, setMaskErr] = useState<string | null>(null);

  const onPrefix = (v: string) => {
    setPrefix(v);
    try {
      setMask(prefixToMaskString(parsePrefix(v)));
      setPrefixErr(null);
      setMaskErr(null);
    } catch (e) {
      setPrefixErr(errorMessage(e));
    }
  };
  const onMask = (v: string) => {
    setMask(v);
    try {
      setPrefix(String(maskToPrefix(v)));
      setMaskErr(null);
      setPrefixErr(null);
    } catch (e) {
      setMaskErr(errorMessage(e));
    }
  };

  return (
    <section className="card" aria-labelledby="mask-title">
      <h2 id="mask-title">Subnet mask converter</h2>
      <p className="sub">Type in either field. Non-contiguous masks such as 255.0.255.0 are rejected.</p>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="conv-prefix">CIDR prefix</label>
          <input id="conv-prefix" className="input" value={prefix} onChange={(e) => onPrefix(e.target.value)} aria-invalid={!!prefixErr} inputMode="numeric" />
          {prefixErr && <div className="error" role="alert">{prefixErr}</div>}
        </div>
        <div className="field">
          <label htmlFor="conv-mask">Subnet mask</label>
          <input id="conv-mask" className="input" value={mask} onChange={(e) => onMask(e.target.value)} aria-invalid={!!maskErr} spellCheck={false} />
          {maskErr && <div className="error" role="alert">{maskErr}</div>}
        </div>
      </div>
    </section>
  );
}
