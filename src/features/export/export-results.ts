import { SubnetResult } from '../calculator/types';

export function summaryText(r: SubnetResult): string {
  return [
    `Network:     ${r.cidr}`,
    `Input IP:    ${r.inputAddress}/${r.prefix}`,
    `Subnet mask: ${r.subnetMask}`,
    `Wildcard:    ${r.wildcardMask}`,
    `Broadcast:   ${r.broadcastAddress}`,
    `First host:  ${r.firstUsableAddress ?? 'n/a'}`,
    `Last host:   ${r.lastUsableAddress ?? 'n/a'}`,
    `Addresses:   ${r.totalAddresses}`,
    `Usable:      ${r.usableHostCount} (${r.hostCountNote})`,
  ].join('\n');
}

export function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(r: SubnetResult, timestamp: string) {
  return {
    input: `${r.inputAddress}/${r.prefix}`,
    prefix: r.prefix,
    subnetMask: r.subnetMask,
    wildcardMask: r.wildcardMask,
    network: r.networkAddress,
    broadcast: r.broadcastAddress,
    firstUsable: r.firstUsableAddress ?? '',
    lastUsable: r.lastUsableAddress ?? '',
    totalAddresses: r.totalAddresses,
    usableHosts: r.usableHostCount,
    hostCountConvention: r.hostCountNote,
    timestamp,
  };
}

export function toCsv(r: SubnetResult, timestamp = new Date().toISOString()): string {
  const o = row(r, timestamp);
  return Object.keys(o).map(csvEscape).join(',') + '\r\n' + Object.values(o).map(csvEscape).join(',') + '\r\n';
}

export function toJson(r: SubnetResult, timestamp = new Date().toISOString()): string {
  return JSON.stringify(row(r, timestamp), null, 2);
}

export function exportFilename(r: SubnetResult, ext: 'csv' | 'json'): string {
  return `subnet-${r.networkAddress.replace(/\./g, '-')}-${r.prefix}.${ext}`;
}

export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
