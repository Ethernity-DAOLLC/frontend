import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface FaucetHistoryItem {
  id: number;
  transaction_hash: string | null;
  amount_sent: number | null;
  status: string;
  created_at: string;
  current_age: number;
  retirement_age: number;
  desired_monthly_payment: number;
  monthly_deposit: number;
  initial_amount: number;
}

export function useFaucetHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState<FaucetHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FAUCET_API_URL = import.meta.env.VITE_FAUCET_API_URL || 'https://usdc-faucet-production.up.railway.app';

  const fetchHistory = async () => {
    if (!address) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${FAUCET_API_URL}/api/history/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [address]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}