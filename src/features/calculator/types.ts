export interface SubnetResult {
  inputAddress: string;
  prefix: number;
  cidr: string;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  totalAddresses: number;
  usableHostCount: number;
  firstUsableAddress: string | null;
  lastUsableAddress: string | null;
  hostCountNote: string;
  ipClass: string;
  scope: string;
  binary: { address: string; mask: string; network: string };
}

export interface ChildSubnet {
  index: number;
  networkAddress: string;
  prefix: number;
  cidr: string;
  subnetMask: string;
  broadcastAddress: string;
  totalAddresses: number;
  usableHostCount: number;
  firstUsableAddress: string | null;
  lastUsableAddress: string | null;
}

export interface VlsmRequirement {
  id: string;
  name: string;
  requiredHosts: number;
}

export interface VlsmAllocation {
  requirementId: string;
  name: string;
  requiredHosts: number;
  networkAddress: string;
  prefix: number;
  cidr: string;
  subnetMask: string;
  broadcastAddress: string;
  totalAddresses: number;
  usableHostCount: number;
  firstUsableAddress: string | null;
  lastUsableAddress: string | null;
}

export interface VlsmFailure {
  requirementId: string;
  name: string;
  requiredHosts: number;
  reason: string;
}

export interface VlsmResult {
  parent: string;
  allocations: VlsmAllocation[];
  failures: VlsmFailure[];
  unused: { cidr: string; totalAddresses: number }[];
  usedAddresses: number;
  parentAddresses: number;
}

export interface OverlapResult {
  relation: 'identical' | 'a-contains-b' | 'b-contains-a' | 'disjoint';
  overlaps: boolean;
  intersection: string | null;
  explanation: string;
}

export class InputError extends Error {
  field: string;
  constructor(message: string, field = 'input') {
    super(message);
    this.name = 'InputError';
    this.field = field;
  }
}
