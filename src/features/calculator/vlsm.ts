import { formatIpv4, parseIpv4 } from './ipv4';
import { blockSize, broadcastOf, hostInfo, parseBlock } from './subnet';
import { prefixToMaskString } from './subnet-mask';
import { InputError, VlsmAllocation, VlsmFailure, VlsmRequirement, VlsmResult } from './types';

export interface VlsmOptions {
  /** Use /31 for 2-host point-to-point links (RFC 3021). */
  useSlash31ForTwoHosts?: boolean;
}

/** Smallest prefix whose conventional usable host count covers `hosts`. */
export function prefixForHosts(hosts: number, opts: VlsmOptions = {}): number {
  if (!Number.isInteger(hosts) || hosts < 1) throw new InputError('Host count must be a whole number of at least 1.', 'hosts');
  if (hosts === 2 && opts.useSlash31ForTwoHosts) return 31;
  for (let p = 30; p >= 0; p--) {
    if (blockSize(p) - 2 >= hosts) return p;
  }
  throw new InputError(`${hosts} hosts cannot fit in IPv4.`, 'hosts');
}

export function validateRequirements(reqs: VlsmRequirement[]): void {
  if (reqs.length === 0) throw new InputError('Add at least one network requirement.', 'requirements');
  const seen = new Set<string>();
  for (const r of reqs) {
    const name = r.name.trim();
    if (name === '') throw new InputError('Every requirement needs a name.', 'requirements');
    const key = name.toLowerCase();
    if (seen.has(key)) throw new InputError(`Duplicate requirement name "${name}".`, 'requirements');
    seen.add(key);
    if (!Number.isInteger(r.requiredHosts) || r.requiredHosts < 1) {
      throw new InputError(`"${name}" needs a whole number of hosts (at least 1).`, 'requirements');
    }
  }
}

/** Decompose [start, end] (inclusive) into the fewest aligned CIDR blocks. */
function rangeToBlocks(start: number, end: number): { network: number; prefix: number }[] {
  const out: { network: number; prefix: number }[] = [];
  let cur = start;
  while (cur <= end) {
    let p = 32;
    while (p > 0) {
      const size = blockSize(p - 1);
      if (cur % size !== 0 || cur + size - 1 > end) break;
      p--;
    }
    out.push({ network: cur, prefix: p });
    cur += blockSize(p);
  }
  return out;
}

export function allocateVlsm(parentText: string, reqs: VlsmRequirement[], opts: VlsmOptions = {}): VlsmResult {
  const parent = parseBlock(parentText, 'parent');
  validateRequirements(reqs);
  const parentEnd = broadcastOf(parent.network, parent.prefix);

  // Stable sort: descending hosts, ties keep input order.
  const ordered = reqs
    .map((r, i) => ({ r, i }))
    .sort((x, y) => y.r.requiredHosts - x.r.requiredHosts || x.i - y.i)
    .map((x) => x.r);

  const allocations: VlsmAllocation[] = [];
  const failures: VlsmFailure[] = [];
  let cursor = parent.network;

  for (const r of ordered) {
    const fail = (reason: string) =>
      failures.push({ requirementId: r.id, name: r.name, requiredHosts: r.requiredHosts, reason });
    let prefix: number;
    try {
      prefix = prefixForHosts(r.requiredHosts, opts);
    } catch (e) {
      fail((e as Error).message);
      continue;
    }
    if (prefix < parent.prefix) {
      fail(`Needs a /${prefix}, which is larger than the parent /${parent.prefix}.`);
      continue;
    }
    const size = blockSize(prefix);
    const aligned = Math.ceil(cursor / size) * size;
    if (aligned + size - 1 > parentEnd) {
      fail(`Not enough free space for a /${prefix} (${size.toLocaleString('en-US')} addresses).`);
      continue;
    }
    const info = hostInfo(aligned, prefix);
    allocations.push({
      requirementId: r.id,
      name: r.name,
      requiredHosts: r.requiredHosts,
      networkAddress: formatIpv4(aligned),
      prefix,
      cidr: `${formatIpv4(aligned)}/${prefix}`,
      subnetMask: prefixToMaskString(prefix),
      broadcastAddress: formatIpv4(broadcastOf(aligned, prefix)),
      totalAddresses: size,
      usableHostCount: info.usable,
      firstUsableAddress: info.first,
      lastUsableAddress: info.last,
    });
    cursor = aligned + size;
  }

  // Unused space = parent minus allocations (allocations are ascending by address).
  const unused: VlsmResult['unused'] = [];
  const pushRange = (from: number, to: number) => {
    for (const b of rangeToBlocks(from, to)) {
      unused.push({ cidr: `${formatIpv4(b.network)}/${b.prefix}`, totalAddresses: blockSize(b.prefix) });
    }
  };
  let free = parent.network;
  for (const a of allocations) {
    const start = parseIpv4(a.networkAddress);
    if (start > free) pushRange(free, start - 1);
    free = start + a.totalAddresses;
  }
  if (free <= parentEnd) pushRange(free, parentEnd);

  return {
    parent: `${formatIpv4(parent.network)}/${parent.prefix}`,
    allocations,
    failures,
    unused,
    usedAddresses: allocations.reduce((s, a) => s + a.totalAddresses, 0),
    parentAddresses: blockSize(parent.prefix),
  };
}
