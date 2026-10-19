import { SubnetResult } from '../features/calculator/types';

function Bits({ value, prefix, label }: { value: string; prefix: number; label: string }) {
  const octets = value.split('.');
  let index = 0;
  return (
    <div className="bin-row">
      <div className="lbl">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bin" role="img" aria-label={`${label}: ${value}. First ${prefix} bits are network bits, remaining ${32 - prefix} are host bits.`}>
        {octets.map((o, oi) => (
          <span className="octet" key={oi}>
            {o.split('').map((b) => {
              const net = index++ < prefix;
              return (
                <span key={index} className={`bit ${net ? 'net' : 'host'}`}>
                  {b}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BinaryView({ result }: { result: SubnetResult }) {
  const { prefix, binary } = result;
  return (
    <div>
      <Bits value={binary.address} prefix={prefix} label="IP address" />
      <Bits value={binary.mask} prefix={prefix} label="Subnet mask" />
      <Bits value={binary.network} prefix={prefix} label="Network address" />
      <div className="legend">
        <span>Network bits ({prefix}) — bold, solid underline</span>
        <span className="h">Host bits ({32 - prefix}) — light, dotted underline</span>
      </div>
    </div>
  );
}
