export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
} as const;

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export const USDC_DECIMALS = 6;
export function getUSDCAddress(chainId: number): `0x${string}` | undefined {
  return USDC_ADDRESSES[chainId];
}

export function validateUSDCSupport(chainId: number): boolean {
  return chainId in USDC_ADDRESSES;
}

export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    421614: 'Arbitrum Sepolia',
    80002: 'Polygon Amoy',
  };
  return networks[chainId] || `Unknown Network (${chainId})`;
}