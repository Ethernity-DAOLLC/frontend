import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useWallet } from '@/hooks/web3/useWallet';
import { formatCurrency, formatYears } from '@/lib';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Wallet,
  ArrowRight,
  CheckCircle,
  Info,
  Sparkles,
  AlertCircle,
} from "lucide-react";

let Chart: any = null;
let Line: any = null;

const loadChartJS = async () => {
  try {
    const ChartJS = await import('chart.js');
    const { Line: LineChart } = await import('react-chartjs-2');
    
    const {
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler,
    } = ChartJS;
    
    ChartJS.Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );
    
    Chart = ChartJS.Chart;
    Line = LineChart;
    return true;
  } catch (error) {
    console.error('Error loading Chart.js:', error);
    return false;
  }
};

interface Inputs {
  initialCapital: number;
  currentAge: number;
  retirementAge: number;
  desiredMonthly: number;
  annualRate: number;
  contributionFrequency: "monthly" | "quarterly" | "annual";
  yearsInRetirement: number;
}

interface Result {
  monthlyDeposit: number;
  totalContributed: number;
  totalInterest: number;
  futureValue: number;
  yearsToRetirement: number;
  initialDeposit: number;
  feeAmount: number;
  netToOwner: number;
}

const FormField: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
  step?: number;
  min?: number;
  error?: string;
}> = ({ label, value, onChange, icon, step = 1, min = 0, error }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
      {icon}
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition ${
        error 
          ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
          : 'border-gray-300 focus:ring-purple-300 focus:border-purple-500'
      }`}
      aria-describedby={error ? `${label}-error` : undefined}
    />
    {error && (
      <p id={`${label}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle size={14} />
        {error}
      </p>
    )}
  </div>
);

const FEE_PERCENTAGE = 0.03;

const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { setPlanData } = useRetirementPlan();
  const { isConnected, openModal } = useWallet();
  const [chartReady, setChartReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [inputs, setInputs] = useState<Inputs>({
    initialCapital: 10000,
    currentAge: 30,
    retirementAge: 65,
    desiredMonthly: 4000,
    annualRate: 7,
    contributionFrequency: "monthly",
    yearsInRetirement: 25,
  });

  const [result, setResult] = useState<Result | null>(null);
  const [chartData, setChartData] = useState<{ year: number; balance: number }[]>([]);

  useEffect(() => {
    loadChartJS().then(setChartReady);
  }, []);

  useEffect(() => {
    calculatePlan();
  }, [inputs]);

  const calculatePlan = () => {
    setError('');
    
    const safeInputs = {
      initialCapital: inputs.initialCapital || 0,
      currentAge: inputs.currentAge || 0,
      retirementAge: inputs.retirementAge || 0,
      desiredMonthly: inputs.desiredMonthly || 0,
      annualRate: inputs.annualRate || 0,
      contributionFrequency: inputs.contributionFrequency,
      yearsInRetirement: inputs.yearsInRetirement || 0,
    };

    if (safeInputs.currentAge <= 0) {
      setError('Current age must be greater than 0');
      setResult(null);
      setChartData([]);
      return;
    }

    if (safeInputs.currentAge >= 100) {
      setError('Current age must be less than 100 years');
      setResult(null);
      setChartData([]);
      return;
    }

    const yearsToRetirement = safeInputs.retirementAge - safeInputs.currentAge;
    if (yearsToRetirement <= 0) {
      setError('Retirement age must be greater than current age');
      setResult(null);
      setChartData([]);
      return;
    }

    if (yearsToRetirement < 5) {
      setError('You must have at least 5 years until retirement to use this plan');
      setResult(null);
      setChartData([]);
      return;
    }

    if (safeInputs.desiredMonthly <= 0) {
      setError('Desired monthly income must be greater than 0');
      setResult(null);
      setChartData([]);
      return;
    }

    if (safeInputs.annualRate <= 0 || safeInputs.annualRate > 30) {
      setError('Interest rate must be between 0% and 30%');
      setResult(null);
      setChartData([]);
      return;
    }

    const periodsPerYear = getPeriodsPerYear(safeInputs.contributionFrequency);
    const r = safeInputs.annualRate / 100 / periodsPerYear;
    const n = yearsToRetirement * periodsPerYear;
    const totalNeededAtRetirement = safeInputs.desiredMonthly * 12 * safeInputs.yearsInRetirement;
    const fvInitial = safeInputs.initialCapital * Math.pow(1 + r, n);

    let requiredPMT = 0;
    if (r > 0) {
      requiredPMT = (totalNeededAtRetirement - fvInitial) * (r / (Math.pow(1 + r, n) - 1));
    } else {
      requiredPMT = (totalNeededAtRetirement - fvInitial) / n;
    }

    const monthlyDeposit =
      safeInputs.contributionFrequency === "monthly"
        ? requiredPMT
        : requiredPMT / (periodsPerYear / 12);

    let balance = safeInputs.initialCapital;
    const data: { year: number; balance: number }[] = [];
    const contributions: number[] = [];

    for (let year = 0; year <= yearsToRetirement; year++) {
      data.push({ year: safeInputs.currentAge + year, balance: Math.round(balance) });
      for (let period = 0; period < periodsPerYear; period++) {
        balance = balance * (1 + r) + requiredPMT;
        contributions.push(requiredPMT);
      }
    }

    const totalContributed = safeInputs.initialCapital + contributions.reduce((a, b) => a + b, 0);
    const totalInterest = balance - totalContributed;
    const initialDeposit = safeInputs.initialCapital + Math.max(0, monthlyDeposit);
    const feeAmount = initialDeposit * FEE_PERCENTAGE;
    const netToOwner = initialDeposit - feeAmount;

    setResult({
      monthlyDeposit: Math.max(0, monthlyDeposit),
      totalContributed,
      totalInterest,
      futureValue: balance,
      yearsToRetirement,
      initialDeposit,
      feeAmount,
      netToOwner,
    });
    setChartData(data);
  };

  const getPeriodsPerYear = (freq: string): number => {
    switch (freq) {
      case "monthly": return 12;
      case "quarterly": return 4;
      case "annual": return 1;
      default: return 12;
    }
  };

  const handleCreateContract = async () => {
    if (!result) return;

    if (!isConnected) {
      setIsConnecting(true);
      try {
        openModal();

        setTimeout(() => {
          setIsConnecting(false);
          if (isConnected) {
            proceedToCreateContract();
          }
        }, 1000);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setIsConnecting(false);
      }
      return;
    }

    proceedToCreateContract();
  };

  const proceedToCreateContract = () => {
    if (!result) return;

    const timelockYears = Math.max(15, Math.floor((inputs.retirementAge - inputs.currentAge) * 0.3));

    setPlanData({
      initialDeposit: result.initialDeposit.toFixed(2),
      monthlyDeposit: result.monthlyDeposit.toFixed(2),
      currentAge: inputs.currentAge,
      retirementAge: inputs.retirementAge,
      desiredMonthlyIncome: inputs.desiredMonthly,
      yearsPayments: inputs.yearsInRetirement,
      interestRate: inputs.annualRate,
      timelockYears,
    });

    navigate('/create-contract');
  };

  const chartOptions = chartReady ? {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { 
        display: true, 
        text: 'Retirement Fund Projection', 
        font: { size: 16 } 
      },
    },
    scales: {
      y: { 
        ticks: { 
          callback: (value: any) => '$' + value.toLocaleString() 
        } 
      },
    },
  } : null;

  const chartDataConfig = chartReady ? {
    labels: chartData.map(d => `Age ${d.year}`),
    datasets: [
      {
        label: 'Projected balance',
        data: chartData.map(d => d.balance),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3 sm:gap-4">
            <Calculator className="text-indigo-600" size={40} />
            <span className="hidden sm:inline">Ethernity DAO Retirement Calculator</span>
            <span className="sm:hidden">Ethernity Calculator</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Discover how much you need to save today to live comfortably tomorrow. Your financial future, on blockchain.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Data Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10">
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center gap-3">
              <Sparkles className="text-purple-600" />
              Configure Your Plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                label="Initial Capital ($)"
                value={inputs.initialCapital}
                onChange={(val) => setInputs({ ...inputs, initialCapital: val })}
                icon={<DollarSign className="w-5 h-5" />}
                min={0}
              />
              <FormField
                label="Current Age"
                value={inputs.currentAge}
                onChange={(val) => setInputs({ ...inputs, currentAge: val })}
                icon={<Calendar className="w-5 h-5" />}
                min={18}
              />
              <FormField
                label="Retirement Age"
                value={inputs.retirementAge}
                onChange={(val) => setInputs({ ...inputs, retirementAge: val })}
                icon={<Calendar className="w-5 h-5" />}
                min={inputs.currentAge + 1}
              />
              <FormField
                label="Desired Monthly Income ($)"
                value={inputs.desiredMonthly}
                onChange={(val) => setInputs({ ...inputs, desiredMonthly: val })}
                icon={<DollarSign className="w-5 h-5" />}
                min={0}
              />
              <FormField
                label="Expected Annual Rate (%)"
                value={inputs.annualRate}
                onChange={(val) => setInputs({ ...inputs, annualRate: val })}
                step={0.1}
                icon={<Percent className="w-5 h-5" />}
                min={0.1}
              />

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  Contribution Frequency
                </label>
                <select
                  value={inputs.contributionFrequency}
                  onChange={(e) => setInputs({ ...inputs, contributionFrequency: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-5 h-5" />
                  Years Receiving Income
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={inputs.yearsInRetirement}
                    onChange={(e) => setInputs({ ...inputs, yearsInRetirement: parseInt(e.target.value) })}
                    className="flex-1 h-3 bg-gray-200 rounded-lg cursor-pointer accent-purple-600"
                    aria-label="Years receiving income"
                    aria-valuemin={10}
                    aria-valuemax={40}
                    aria-valuenow={inputs.yearsInRetirement}
                  />
                  <span className="bg-purple-100 text-purple-800 font-bold px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-base sm:text-lg min-w-24 sm:min-w-32 text-center">
                    {formatYears(inputs.yearsInRetirement)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {result && (
            <div className="space-y-6 sm:space-y-8">
              {chartReady && Line && chartOptions && chartDataConfig ? (
                <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Growth Projection</h3>
                  <div className="h-64 sm:h-80 lg:h-96">
                    <Line options={chartOptions} data={chartDataConfig} />
                  </div>
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Growth Projection</h3>
                  <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading chart...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-3">
                  <Info className="w-6 h-6 sm:w-8 sm:h-8" />
                  Initial Deposit Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg text-center">
                    <p className="text-gray-600 text-xs sm:text-sm">Total Deposit</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-800 break-words">
                      {formatCurrency(result.initialDeposit)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg text-center">
                    <p className="text-gray-600 text-xs sm:text-sm">Ethernity DAO Fee (3%)</p>
                    <p className="text-2xl sm:text-3xl font-black text-orange-600 break-words">
                      {formatCurrency(result.feeAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Goes to Treasury</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg text-center">
                    <p className="text-gray-600 text-xs sm:text-sm">Net to Your Fund (97%)</p>
                    <p className="text-2xl sm:text-3xl font-black text-green-600 break-words">
                      {formatCurrency(result.netToOwner)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">For DeFi</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-6 sm:p-10 text-white text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6">
                  {isConnected ? "Your fund is ready!" : "Last step"}
                </h2>
                <p className="text-base sm:text-xl mb-6 sm:mb-8">
                  Required monthly savings: <strong className="text-2xl sm:text-3xl block sm:inline mt-2 sm:mt-0">{formatCurrency(result.monthlyDeposit)}</strong>
                </p>

                <button
                  onClick={handleCreateContract}
                  disabled={isConnecting}
                  className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed px-6 sm:px-12 py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-2xl transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-3 sm:gap-4 mx-auto"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-700"></div>
                      <span className="text-base sm:text-2xl">Connecting...</span>
                    </>
                  ) : isConnected ? (
                    <>
                      <CheckCircle size={32} className="hidden sm:block" />
                      <CheckCircle size={24} className="sm:hidden" />
                      <span className="text-base sm:text-2xl">Create My Contract</span>
                      <ArrowRight size={32} className="hidden sm:block" />
                      <ArrowRight size={24} className="sm:hidden" />
                    </>
                  ) : (
                    <>
                      <Wallet size={32} className="hidden sm:block" />
                      <Wallet size={24} className="sm:hidden" />
                      <span className="text-base sm:text-2xl">Connect Wallet</span>
                      <ArrowRight size={32} className="hidden sm:block" />
                      <ArrowRight size={24} className="sm:hidden" />
                    </>
                  )}
                </button>

                <p className="mt-4 sm:mt-6 text-indigo-100 text-sm sm:text-base">
                  {isConnected
                    ? "Your personal fund will be created on Arbitrum Sepolia"
                    : "Your wallet will open to connect"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;