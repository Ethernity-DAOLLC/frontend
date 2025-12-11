import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getExplorerAddressUrl } from '@/config/chains';
import { useChainId } from 'wagmi';

export function ConnectWallet() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
  };

  const viewOnExplorer = () => {
    if (!address) return;
    window.open(getExplorerAddressUrl(chainId, address), '_blank');
  };

  if (!isConnected) {
    return (
      <Button onClick={() => open()} className="flex items-center gap-2">
        <Wallet size={20} />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet size={18} />
          <span className="font-mono">{formatAddress(address!)}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy size={16} className="mr-2" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={viewOnExplorer} className="cursor-pointer">
          <ExternalLink size={16} className="mr-2" />
          View on Explorer
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => disconnect()} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut size={16} className="mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
