import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { AlertCircle, CheckCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

const USDC_ADDRESS = '0x53E691B568B87f0124bb3A88C8b9958bF8396E81';
const FACTORY_ADDRESS = '0x45DdC7b0B7b9D6A0e6039f2f5Ad32c89D1C33808';
const TEST_AMOUNT = parseUnits('1926.40', 6);

export default function USDCDebugger() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [diagnostics, setDiagnostics] = useState({
    isLoading: true,
    results: []
  });

  useEffect(() => {
    runDiagnostics();
  }, [address, chainId]);

  const runDiagnostics = async () => {
    if (!address || !publicClient) return;

    setDiagnostics({ isLoading: true, results: [] });
    const results = [];

    try {
      // 1. Check Chain
      results.push({
        test: 'Chain ID',
        status: chainId === 421614 ? 'success' : 'error',
        message: chainId === 421614 
          ? `Arbitrum Sepolia (${chainId})` 
          : `Wrong chain: ${chainId}. Expected: 421614`,
        value: chainId
      });

      // 2. Check USDC Contract exists
      try {
        const code = await publicClient.getBytecode({ address: USDC_ADDRESS });
        results.push({
          test: 'USDC Contract',
          status: code ? 'success' : 'error',
          message: code ? 'Contract exists' : 'Contract not found',
          value: USDC_ADDRESS
        });
      } catch (err) {
        results.push({
          test: 'USDC Contract',
          status: 'error',
          message: `Error: ${err.message}`,
          value: USDC_ADDRESS
        });
      }

      // 3. Check USDC is ERC20
      try {
        const symbol = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'symbol'
        });
        
        const decimals = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'decimals'
        });

        results.push({
          test: 'USDC Token Info',
          status: 'success',
          message: `${symbol} (${decimals} decimals)`,
          value: `Symbol: ${symbol}`
        });
      } catch (err) {
        results.push({
          test: 'USDC Token Info',
          status: 'error',
          message: `Cannot read token info: ${err.message}`,
          value: 'Failed'
        });
      }

      // 4. Check Balance
      try {
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address]
        });

        const balanceFormatted = formatUnits(balance, 6);
        results.push({
          test: 'USDC Balance',
          status: balance >= TEST_AMOUNT ? 'success' : 'warning',
          message: `${balanceFormatted} USDC`,
          value: balance.toString()
        });
      } catch (err) {
        results.push({
          test: 'USDC Balance',
          status: 'error',
          message: `Cannot read balance: ${err.message}`,
          value: 'Failed'
        });
      }

      // 5. Check Current Allowance
      try {
        const allowance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, FACTORY_ADDRESS]
        });

        const allowanceFormatted = formatUnits(allowance, 6);
        results.push({
          test: 'Current Allowance',
          status: 'info',
          message: `${allowanceFormatted} USDC`,
          value: allowance.toString()
        });
      } catch (err) {
        results.push({
          test: 'Current Allowance',
          status: 'error',
          message: `Cannot read allowance: ${err.message}`,
          value: 'Failed'
        });
      }

      // 6. Simulate Approval (without sending)
      try {
        const { request } = await publicClient.simulateContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [FACTORY_ADDRESS, TEST_AMOUNT],
          account: address
        });

        results.push({
          test: 'Approval Simulation',
          status: 'success',
          message: 'Simulation passed ✓',
          value: 'Will succeed'
        });
      } catch (err) {
        results.push({
          test: 'Approval Simulation',
          status: 'error',
          message: `Simulation failed: ${err.message}`,
          value: err.shortMessage || 'Failed',
          error: err
        });
      }

      // 7. Check Gas Price
      try {
        const gasPrice = await publicClient.getGasPrice();
        const gasPriceGwei = formatUnits(gasPrice, 9);
        
        results.push({
          test: 'Gas Price',
          status: 'info',
          message: `${gasPriceGwei} Gwei`,
          value: gasPrice.toString()
        });
      } catch (err) {
        results.push({
          test: 'Gas Price',
          status: 'warning',
          message: `Cannot get gas price: ${err.message}`,
          value: 'Unknown'
        });
      }

      // 8. Check ETH Balance (for gas)
      try {
        const ethBalance = await publicClient.getBalance({ address });
        const ethFormatted = formatUnits(ethBalance, 18);
        
        results.push({
          test: 'ETH Balance (Gas)',
          status: ethBalance > parseUnits('0.001', 18) ? 'success' : 'warning',
          message: `${parseFloat(ethFormatted).toFixed(6)} ETH`,
          value: ethBalance.toString()
        });
      } catch (err) {
        results.push({
          test: 'ETH Balance',
          status: 'error',
          message: `Cannot read ETH balance: ${err.message}`,
          value: 'Failed'
        });
      }

    } catch (error) {
      results.push({
        test: 'General Error',
        status: 'error',
        message: error.message,
        value: 'Fatal error'
      });
    }

    setDiagnostics({ isLoading: false, results });
  };

  const testApproval = async () => {
    if (!walletClient || !address) {
      alert('Wallet not connected');
      return;
    }

    try {
      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [FACTORY_ADDRESS, parseUnits('1', 6)], // Test with 1 USDC
        account: address
      });

      alert(`Test approval sent! Hash: ${hash}`);
    } catch (err) {
      console.error('Test approval failed:', err);
      alert(`Failed: ${err.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />;
      case 'error': return <AlertCircle className="text-red-600" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-600" size={20} />;
      default: return <AlertCircle className="text-blue-600" size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-800 mb-2">
          🔍 USDC Contract Debugger
        </h1>
        <p className="text-gray-600">
          Diagnostic tool for USDC approval issues
        </p>
      </div>

      {/* Connection Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-gray-800 mb-2">Connection</h3>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-gray-600">Wallet:</span>
            <code className="bg-gray-200 px-2 py-1 rounded">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
            <button onClick={() => copyToClipboard(address)} className="text-blue-600 hover:text-blue-800">
              <Copy size={16} />
            </button>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-gray-600">Chain:</span>
            <span className="font-mono">{chainId}</span>
          </p>
        </div>
      </div>

      {/* Diagnostics */}
      {diagnostics.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : (
        <div className="space-y-3">
          {diagnostics.results.map((result, idx) => (
            <div 
              key={idx}
              className={`border-2 rounded-xl p-4 ${
                result.status === 'success' ? 'border-green-200 bg-green-50' :
                result.status === 'error' ? 'border-red-200 bg-red-50' :
                result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{result.test}</h4>
                  <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                  {result.value && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      {result.value}
                    </p>
                  )}
                  {result.error && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">
                        View error details
                      </summary>
                      <pre className="text-xs bg-gray-800 text-white p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={runDiagnostics}
          disabled={diagnostics.isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50"
        >
          🔄 Re-run Diagnostics
        </button>
        <button
          onClick={testApproval}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          🧪 Test Approve 1 USDC
        </button>
      </div>

      {/* Useful Links */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3">Useful Links</h3>
        <div className="space-y-2 text-sm">
          <a
            href={`https://sepolia.arbiscan.io/address/${USDC_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={16} />
            View USDC Contract on Arbiscan
          </a>
          <a
            href={`https://sepolia.arbiscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={16} />
            View Your Address on Arbiscan
          </a>
          <a
            href="https://faucet.quicknode.com/arbitrum/sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={16} />
            Get Test Tokens
          </a>
        </div>
      </div>
    </div>
  );
}