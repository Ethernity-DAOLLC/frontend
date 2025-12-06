// App.tsx - CORRECCIÓN COMPLETA

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useWallet } from './hooks/web3/useWallet';
import { useSecureAdmin } from './hooks';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

const HomePage = lazy(() => import('./pages/Public/HomePage'));
const CalculatorPage = lazy(() => import('./pages/Public/CalculatorPage'));
const ContactPage = lazy(() => import('./pages/Public/ContactPage'));
const DashboardPage = lazy(() => import('./pages/User/DashboardPage'));
const CreateContractPage = lazy(() => import('./pages/User/CreateContractPage'));
const ContractCreatedPage = lazy(() => import('./pages/User/ContractCreatedPage'));
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
  const { isConnected } = useWallet();
  const { isAdmin } = useSecureAdmin(); // ✅ CORRECTO

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
                <ProtectedRoute requireAuth>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-contract" 
              element={
                <ProtectedRoute requireAuth>
                  <CreateContractPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/contract-created" 
              element={
                <ProtectedRoute requireAuth>
                  <ContractCreatedPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes - ✅ CORREGIDO: isAdmin en lugar de isAuth */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/treasury" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <TreasuryManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/contracts" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <ContractsManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/governance" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <GovernanceManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/tokens" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
                  <TokenManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/contact" 
              element={
                <ProtectedRoute requireAuth requireAdmin>
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

export default App;
