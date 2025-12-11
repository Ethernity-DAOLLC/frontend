import { useAccount, useBalance, useChainId } from 'wagmi';
import { getChainName } from '@/config/chains';

export function WalletStatus() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  if (isConnecting) {
    return (
      <div className="text-sm text-gray-500">
        Connecting...
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="text-sm text-gray-500">
        Not connected
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Network:</span>
        <span className="font-semibold">{getChainName(chainId)}</span>
      </div>
      
      {balance && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Balance:</span>
          <span className="font-semibold">
            {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
          </span>
        </div>
      )}
    </div>
  );
}