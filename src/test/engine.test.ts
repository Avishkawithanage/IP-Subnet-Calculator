import { describe, expect, it } from 'vitest';
import { formatIpv4, parseIpv4, toBinaryOctets } from '../features/calculator/ipv4';
import { maskToPrefix, prefixToMaskString } from '../features/calculator/subnet-mask';
import { calculateSubnet, checkOverlap, parseCidr, splitSubnet } from '../features/calculator/subnet';
import { allocateVlsm, prefixForHosts } from '../features/calculator/vlsm';
import { csvEscape, exportFilename, toCsv } from '../features/export/export-results';

describe('ipv4 parse/format', () => {
  it('round-trips, including first octet >= 128', () => {
    for (const ip of ['0.0.0.0', '10.0.0.1', '128.0.0.1', '192.168.10.25', '255.255.255.255']) {
      expect(formatIpv4(parseIpv4(ip))).toBe(ip);
    }
    expect(parseIpv4('255.255.255.255')).toBe(4294967295);
  });
  it('rejects malformed input', () => {
    for (const bad of ['', '1.2.3', '1.2.3.4.5', '256.1.1.1', '-1.1.1.1', 'a.b.c.d', '1.2.3.01', '1..2.3', '1.2.3.4/24']) {
      expect(() => parseIpv4(bad)).toThrow();
    }
  });
  it('trims whitespace', () => expect(parseIpv4('  10.0.0.1 ')).toBe(167772161));
  it('binary grouping', () => expect(toBinaryOctets(parseIpv4('192.168.10.25'))).toBe('11000000.10101000.00001010.00011001'));
});

describe('mask conversion', () => {
  it('prefix <-> mask for all prefixes', () => {
    for (let p = 0; p <= 32; p++) expect(maskToPrefix(prefixToMaskString(p))).toBe(p);
  });
  it('rejects non-contiguous masks', () => {
    expect(() => maskToPrefix('255.0.255.0')).toThrow(/contiguous/);
    expect(() => maskToPrefix('255.255.255.1')).toThrow();
  });
});

describe('calculateSubnet', () => {
  it('192.168.10.25/24', () => {
    const r = calculateSubnet('192.168.10.25', 24);
    expect(r).toMatchObject({
      subnetMask: '255.255.255.0',
      wildcardMask: '0.0.0.255',
      networkAddress: '192.168.10.0',
      broadcastAddress: '192.168.10.255',
      firstUsableAddress: '192.168.10.1',
      lastUsableAddress: '192.168.10.254',
      totalAddresses: 256,
      usableHostCount: 254,
    });
  });
  it('/8 and /16', () => {
    expect(calculateSubnet('10.0.0.1', 8).subnetMask).toBe('255.0.0.0');
    expect(calculateSubnet('172.16.5.10', 16).networkAddress).toBe('172.16.0.0');
  });
  it('/30', () => {
    const r = calculateSubnet('192.168.1.10', 30);
    expect(r.totalAddresses).toBe(4);
    expect(r.usableHostCount).toBe(2);
    expect(r.networkAddress).toBe('192.168.1.8');
  });
  it('/31 point-to-point', () => {
    const r = calculateSubnet('10.0.0.1', 31);
    expect(r.usableHostCount).toBe(2);
    expect(r.firstUsableAddress).toBe('10.0.0.0');
    expect(r.lastUsableAddress).toBe('10.0.0.1');
  });
  it('/32 single address', () => {
    const r = calculateSubnet('10.1.2.3', 32);
    expect(r.totalAddresses).toBe(1);
    expect(r.usableHostCount).toBe(1);
    expect(r.networkAddress).toBe('10.1.2.3');
    expect(r.broadcastAddress).toBe('10.1.2.3');
  });
  it('/0', () => {
    const r = calculateSubnet('8.8.8.8', 0);
    expect(r.subnetMask).toBe('0.0.0.0');
    expect(r.networkAddress).toBe('0.0.0.0');
    expect(r.broadcastAddress).toBe('255.255.255.255');
    expect(r.totalAddresses).toBe(2 ** 32);
    expect(r.usableHostCount).toBe(2 ** 32 - 2);
  });
  it('high first octet', () => {
    const r = calculateSubnet('200.100.50.25', 20);
    expect(r.networkAddress).toBe('200.100.48.0');
    expect(r.broadcastAddress).toBe('200.100.63.255');
  });
  it('rejects bad prefix', () => {
    for (const p of ['', '33', '-1', '2.5', 'abc']) expect(() => calculateSubnet('1.1.1.1', p)).toThrow();
  });
  it('invariants hold for many inputs', () => {
    for (let p = 0; p <= 32; p++) {
      for (const ip of ['0.0.0.0', '1.2.3.4', '127.255.255.255', '172.31.255.1', '255.255.255.255']) {
        const r = calculateSubnet(ip, p);
        const mask = parseIpv4(r.subnetMask);
        const net = parseIpv4(r.networkAddress);
        const bc = parseIpv4(r.broadcastAddress);
        expect((net & mask) >>> 0).toBe(net);
        expect((bc & mask) >>> 0).toBe(net);
        expect(net).toBeLessThanOrEqual(bc);
        expect(bc - net + 1).toBe(r.totalAddresses);
      }
    }
  });
});

describe('parseCidr', () => {
  it('accepts prefix and dotted mask', () => {
    expect(parseCidr('10.0.0.0/8')).toEqual({ address: '10.0.0.0', prefix: 8 });
    expect(parseCidr('10.0.0.0/255.255.0.0').prefix).toBe(16);
  });
  it('rejects junk', () => {
    for (const b of ['', '10.0.0.0', '10.0.0.0/', '10.0.0.0/40', '10.0.0.0/24/1']) expect(() => parseCidr(b)).toThrow();
  });
});

describe('splitSubnet', () => {
  it('/24 into /26', () => {
    const r = splitSubnet('192.168.10.0/24', 26);
    expect(r.totalChildren).toBe(4);
    expect(r.subnets.map((s) => s.cidr)).toEqual(['192.168.10.0/26', '192.168.10.64/26', '192.168.10.128/26', '192.168.10.192/26']);
  });
  it('rejects shorter child prefix', () => expect(() => splitSubnet('10.0.0.0/24', 16)).toThrow());
  it('paginates and reports true total', () => {
    const r = splitSubnet('10.0.0.0/8', 24, 0, 10);
    expect(r.totalChildren).toBe(65536);
    expect(r.subnets).toHaveLength(10);
    const last = splitSubnet('10.0.0.0/8', 24, 65530, 10);
    expect(last.subnets).toHaveLength(6);
    expect(last.subnets[5].cidr).toBe('10.255.255.0/24');
  });
  it('same prefix gives one subnet', () => expect(splitSubnet('10.0.0.0/24', 24).totalChildren).toBe(1));
});

describe('overlap', () => {
  it('disjoint', () => expect(checkOverlap('10.0.0.0/24', '10.0.1.0/24').overlaps).toBe(false));
  it('contains', () => {
    const r = checkOverlap('10.0.0.0/16', '10.0.5.0/24');
    expect(r.relation).toBe('a-contains-b');
    expect(r.intersection).toBe('10.0.5.0/24');
    expect(checkOverlap('10.0.5.0/24', '10.0.0.0/16').relation).toBe('b-contains-a');
  });
  it('identical, normalizing host bits', () => expect(checkOverlap('10.0.0.5/24', '10.0.0.0/24').relation).toBe('identical'));
  it('validates both inputs', () => expect(() => checkOverlap('10.0.0.0/24', 'nope')).toThrow());
});

describe('vlsm', () => {
  const req = (name: string, requiredHosts: number) => ({ id: name, name, requiredHosts });
  it('prefixForHosts accounts for reserved addresses', () => {
    expect(prefixForHosts(254)).toBe(24);
    expect(prefixForHosts(255)).toBe(23);
    expect(prefixForHosts(2)).toBe(30);
    expect(prefixForHosts(2, { useSlash31ForTwoHosts: true })).toBe(31);
    expect(prefixForHosts(1)).toBe(30);
  });
  it('classic example is aligned, inside parent and non-overlapping', () => {
    const r = allocateVlsm('192.168.0.0/24', [req('Sales', 100), req('Eng', 50), req('Mgmt', 20), req('Link', 2)]);
    expect(r.failures).toEqual([]);
    expect(r.allocations.map((a) => `${a.name}:${a.cidr}`)).toEqual([
      'Sales:192.168.0.0/25',
      'Eng:192.168.0.128/26',
      'Mgmt:192.168.0.192/27',
      'Link:192.168.0.224/30',
    ]);
    expect(r.unused.map((u) => u.cidr)).toEqual(['192.168.0.228/30', '192.168.0.232/29', '192.168.0.240/28']);
    expect(r.usedAddresses + r.unused.reduce((s, u) => s + u.totalAddresses, 0)).toBe(256);
    const spans = r.allocations.map((a) => [parseIpv4(a.networkAddress), parseIpv4(a.broadcastAddress), a.totalAddresses]);
    for (const [s, , size] of spans) expect(s % size).toBe(0);
    for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThan(spans[i - 1][1]);
  });
  it('reports requirements that do not fit', () => {
    const r = allocateVlsm('10.0.0.0/25', [req('A', 100), req('B', 100)]);
    expect(r.allocations).toHaveLength(1);
    expect(r.failures).toHaveLength(1);
    expect(r.failures[0].name).toBe('B');
  });
  it('fails requirement larger than parent', () => {
    expect(allocateVlsm('10.0.0.0/28', [req('Big', 500)]).failures).toHaveLength(1);
  });
  it('validates requirements', () => {
    expect(() => allocateVlsm('10.0.0.0/24', [])).toThrow();
    expect(() => allocateVlsm('10.0.0.0/24', [req('A', 0)])).toThrow();
    expect(() => allocateVlsm('10.0.0.0/24', [req('A', 5), req('a', 5)])).toThrow(/Duplicate/);
    expect(() => allocateVlsm('10.0.0.0/24', [req(' ', 5)])).toThrow();
  });
  it('works at the top of the address space', () => {
    const r = allocateVlsm('255.255.255.0/24', [req('A', 100), req('B', 100)]);
    expect(r.allocations.map((a) => a.cidr)).toEqual(['255.255.255.0/25', '255.255.255.128/25']);
  });
});

describe('export', () => {
  it('escapes csv', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('plain')).toBe('plain');
  });
  it('builds filename and csv from validated result', () => {
    const r = calculateSubnet('192.168.10.25', 24);
    expect(exportFilename(r, 'csv')).toBe('subnet-192-168-10-0-24.csv');
    const csv = toCsv(r, '2026-01-01T00:00:00.000Z');
    expect(csv.split('\r\n')[1]).toContain('192.168.10.25/24,24,255.255.255.0');
  });
});
