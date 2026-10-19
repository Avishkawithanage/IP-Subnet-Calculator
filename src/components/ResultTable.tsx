import { SubnetResult } from '../features/calculator/types';
import { fmtNum } from '../lib/format';

interface Props {
  result: SubnetResult;
  onCopy: (text: string, label: string) => void;
}

export function ResultTable({ result: r, onCopy }: Props) {
  const rows: [string, string][] = [
    ['Input address', `${r.inputAddress}/${r.prefix}`],
    ['Subnet mask', r.subnetMask],
    ['Wildcard mask', r.wildcardMask],
    ['Network address', r.networkAddress],
    ['Broadcast address', r.broadcastAddress],
    ['First usable host', r.firstUsableAddress ?? 'n/a'],
    ['Last usable host', r.lastUsableAddress ?? 'n/a'],
    ['Total addresses', fmtNum(r.totalAddresses)],
    ['Usable hosts', fmtNum(r.usableHostCount)],
    ['Address class', r.ipClass],
    ['Scope', r.scope],
  ];
  return (
    <table className="rtable">
      <caption className="sr-only">Subnet calculation details</caption>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">{k}</th>
            <td>{v}</td>
            <td className="act">
              <button className="copy-mini" onClick={() => onCopy(v, k)} aria-label={`Copy ${k}`}>
                Copy
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
