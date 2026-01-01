import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useBalance, useChainId, usePublicClient } from 'wagmi';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { formatCurrency, formatNumber } from '@/lib';
import { AlertCircle, ArrowLeft, CheckCircle, DollarSign, Loader2, Wallet } from 'lucide-react';
import { encodeFunctionData, parseUnits } from 'viem';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';
import { ERC20_ABI } from '@/config/abis'; // Assume this exists or import from somewhere

const FACTORY_ADDRESS = import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS as `0x${string}`;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const EXPECTED_CHAIN_ID = 421614;
const TREASURY_FEE_PERCENT = 0.03;
const GAS_BUFFER_MULTIPLIER = 1.2; // 20% buffer for gas fluctuations
const USDC_DECIMALS = 6;

interface FormData {
  initialDeposit: string;
  monthlyDeposit: string;
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

interface GasEstimate {
  approvalGas: bigint;
  createFundGas: bigint;
  totalGasEstimate: bigint;
  estimatedCostEth: string;
  estimatedCostUsd: string;
}

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { planData } = useRetirementPlan();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);

  // USDC Balance
  const { balance: usdcBalanceStr, balanceRaw: usdcBalanceRaw, isLoading: isUsdcLoading } = useTokenBalance({
    tokenAddress: USDC_ADDRESS,
    tokenAbi: ERC20_ABI,
    decimals: USDC_DECIMALS,
    enabled: !!address,
  });
  const usdcBalance = parseFloat(usdcBalanceStr) || 0;

  // ETH Balance
  const { data: ethBalanceData } = useBalance({ address });
  const ethBalance = ethBalanceData ? parseFloat(ethBalanceData.formatted) : 0;

  useEffect(() => {
    if (!planData || !isConnected) {
      navigate('/calculator', { replace: true });
      return;
    }
    setFormData(planData);
  }, [planData, isConnected, navigate]);

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (err) {
        console.error('Failed to fetch ETH price:', err);
        setEthPrice(0); // Fallback to 0 if fetch fails
      }
    };
    fetchEthPrice();
  }, []);

  // Estimate gas when formData and address are ready
  useEffect(() => {
    if (!formData || !address || !publicClient || chainId !== EXPECTED_CHAIN_ID) return;

    const estimateGasCosts = async () => {
      setIsEstimating(true);
      setError(null);

      try {
        const initialDepositBigInt = parseUnits(formData.initialDeposit, USDC_DECIMALS);
        const monthlyDepositBigInt = parseUnits(formData.monthlyDeposit, USDC_DECIMALS);
        const desiredMonthlyIncomeBigInt = parseUnits(formData.desiredMonthlyIncome.toString(), USDC_DECIMALS);

        const args = [
          initialDepositBigInt,
          monthlyDepositBigInt,
          BigInt(formData.currentAge),
          BigInt(formData.retirementAge),
          desiredMonthlyIncomeBigInt,
          BigInt(formData.yearsPayments),
          BigInt(Math.round(formData.interestRate * 100)),
          BigInt(formData.timelockYears),
        ];

        // Estimate gas for USDC approval
        const approvalData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [FACTORY_ADDRESS, initialDepositBigInt],
        });
        const approvalGas = await publicClient.estimateGas({
          account: address,
          to: USDC_ADDRESS,
          data: approvalData,
        });

        // Estimate gas for createPersonalFund
        const createData = encodeFunctionData({
          abi: PersonalFundFactoryABI,
          functionName: 'createPersonalFund',
          args,
        });
        const createFundGas = await publicClient.estimateGas({
          account: address,
          to: FACTORY_ADDRESS,
          data: createData,
        });

        const totalGasEstimate = approvalGas + createFundGas;
        const gasPrice = await publicClient.getGasPrice();
        const estimatedCostWei = totalGasEstimate * gasPrice;
        const estimatedCostEth = Number(estimatedCostWei) / 1e18;
        const estimatedCostUsd = ethPrice > 0 ? (estimatedCostEth * ethPrice).toFixed(2) : 'N/A';

        setGasEstimate({
          approvalGas,
          createFundGas,
          totalGasEstimate,
          estimatedCostEth: estimatedCostEth.toFixed(6),
          estimatedCostUsd,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to estimate gas costs');
      } finally {
        setIsEstimating(false);
      }
    };

    estimateGasCosts();
  }, [formData, address, publicClient, chainId, ethPrice]);

  // Check balances
  useEffect(() => {
    if (!formData || !gasEstimate || isUsdcLoading) return;

    const requiredUsdc = parseFloat(formData.initialDeposit);
    const requiredEth = parseFloat(gasEstimate.estimatedCostEth) * GAS_BUFFER_MULTIPLIER;

    const sufficientUsdc = usdcBalance >= requiredUsdc;
    const sufficientEth = ethBalance >= requiredEth;

    setHasSufficientBalance(sufficientUsdc && sufficientEth);

    if (!sufficientUsdc) {
      setError(`Insufficient USDC balance. Required: ${formatCurrency(requiredUsdc)}, Available: ${formatCurrency(usdcBalance)}`);
    } else if (!sufficientEth) {
      setError(`Insufficient ETH balance for gas. Required: ~${requiredEth.toFixed(6)} ETH, Available: ${ethBalance.toFixed(6)} ETH`);
    } else {
      setError(null);
    }
  }, [formData, gasEstimate, usdcBalance, ethBalance, isUsdcLoading]);

  if (chainId !== EXPECTED_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Red Incorrecta</h1>
          <p className="text-xl text-gray-700 mb-8">
            Por favor cambia a <strong>Arbitrum Sepolia</strong> para crear tu fondo.
          </p>
          <button
            onClick={() => navigate('/calculator')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-5 px-10 rounded-2xl text-xl transition"
          >
            Volver a la Calculadora
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const initialDepositNum = parseFloat(formData.initialDeposit);
  const totalFee = initialDepositNum * TREASURY_FEE_PERCENT;
  const netToFund = initialDepositNum - totalFee;

  const handleConfirm = () => {
    if (!hasSufficientBalance || !gasEstimate) return;

    navigate('/contract-created', {
      state: {
        planData: formData,
        factoryAddress: FACTORY_ADDRESS,
        gasEstimate,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full border border-purple-200">
        <button
          onClick={() => navigate('/calculator')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <h1 className="text-3xl font-black text-indigo-800 mb-8">Revisar y Confirmar Tu Fondo</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Review Data */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Detalles del Plan</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Edad Actual:</strong> {formData.currentAge} años</p>
                <p><strong>Edad de Retiro:</strong> {formData.retirementAge} años</p>
                <p><strong>Ingreso Mensual Deseado:</strong> {formatCurrency(formData.desiredMonthlyIncome)}</p>
                <p><strong>Años de Pagos:</strong> {formData.yearsPayments} años</p>
                <p><strong>Tasa de Interés:</strong> {formData.interestRate}%</p>
                <p><strong>Años de Timelock:</strong> {formData.timelockYears} años</p>
                <p><strong>Depósito Mensual:</strong> {formatCurrency(parseFloat(formData.monthlyDeposit))}</p>
              </div>
            </div>

            {/* Balances */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Balances de Wallet</h2>
              {isUsdcLoading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                <div className="space-y-2">
                  <p><strong>USDC Disponible:</strong> {formatCurrency(usdcBalance)}</p>
                  <p><strong>ETH Disponible:</strong> {ethBalance.toFixed(6)} ETH</p>
                </div>
              )}
            </div>
          </div>

          {/* Fees and Estimates */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Depósito Inicial</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Total Depósito Inicial:</strong> {formatCurrency(initialDepositNum)}</p>
                <p><strong>Fee (3%):</strong> {formatCurrency(totalFee)}</p>
                <p><strong>Neto al Fondo (97%):</strong> {formatCurrency(netToFund)}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Estimación de Gas</h2>
              {isEstimating ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : gasEstimate ? (
                <div className="space-y-2 text-gray-700">
                  <p><strong>Costo Estimado en ETH:</strong> ~{gasEstimate.estimatedCostEth} ETH</p>
                  <p><strong>Costo Estimado en USD:</strong> ~${gasEstimate.estimatedCostUsd}</p>
                </div>
              ) : (
                <p>Error estimando gas</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!hasSufficientBalance || isEstimating || isUsdcLoading || !!error}
          className="mt-8 w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2"
        >
          <Wallet size={24} />
          Confirmar y Depositar
          <ArrowLeft size={24} className="rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default CreateContractPage;