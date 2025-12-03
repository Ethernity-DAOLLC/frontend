import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useContractAddresses } from './contracts/addresses'; 
import { useWallet } from './hooks/web3/useWallet'; 
import { useRetirementPlan } from './context/RetirementContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/common/LoadingScreen';

const HomePage = lazy(() => import('./pages/Public/HomePage'));
const CalculatorPage = lazy(() => import('./pages/Public/CalculatorPage'));
const ContactPage = lazy(() => import('./pages/Public/ContactPage'));
const DashboardPage = lazy(() => import('./pages/User/DashboardPage'));
const CreateContractPage = lazy(() => import('./pages/User/CreateContractPage'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const ContactMessages = lazy(() => import('./pages/Admin/ContactMessages'));
const ContractsManagement = lazy(() => import('./pages/Admin/ContractsManagement'));
const GovernanceManagement = lazy(() => import('./pages/Admin/GovernanceManagement'));
const TokenManagement = lazy(() => import('./pages/Admin/TokenManagement'));
const TreasuryManagement = lazy(() => import('./pages/Admin/TreasuryManagement'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <AppContent />
      </Suspense>
    </Router>
  );
}

function AppContent() {
  const { address } = useAccount();
  const { isConnected } = useWallet(); 
  const addresses = useContractAddresses(); 
  const { planData, clearPlanData } = useRetirementPlan();

  const contracts = {
    personalFundAddress: addresses.factory, 
    tokenAddress: addresses.token,
    treasuryAddress: addresses.treasury,
    governanceAddress: addresses.governance,
    personalFundFactoryAddress: addresses.factory,
    usdcAddress: addresses.usdc,
    isReady: true,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* User routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute isConnected={isConnected}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/create-contract" 
              element={
                <ProtectedRoute isConnected={isConnected}>
                  <CreateContractPage
                    contracts={contracts}
                    calculatedPlan={planData}
                    onSuccess={() => {
                      clearPlanData();
                      window.location.href = '/dashboard';
                    }}
                  />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/treasury" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <TreasuryManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/contracts" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <ContractsManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/governance" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <GovernanceManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/tokens" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <TokenManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/contact" 
              element={
                <ProtectedRoute isConnected={isConnected} requireAdmin>
                  <ContactMessages />
                </ProtectedRoute>
              } 
            />

            {/* Redirects */}
            <Route path="/governance" element={<Navigate to="/dashboard" replace />} />
            <Route path="/fund" element={<Navigate to="/create-contract" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  isConnected: boolean;
  requireAdmin?: boolean;
}

function ProtectedRoute({ children, isConnected, requireAdmin = false }: ProtectedRouteProps) {
  const { address } = useAccount();

  if (!isConnected) {
    return (
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Wallet Connection Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin) {
    const adminAddresses = [
      import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase(),
    ].filter(Boolean);

    const isAdmin = adminAddresses.includes(address?.toLowerCase() || '');

    if (!isAdmin) {
      return (
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8">
              <div className="text-6xl mb-4">⛔</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this page. Admin privileges required.
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default App;
