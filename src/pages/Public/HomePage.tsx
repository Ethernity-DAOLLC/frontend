import React, { useEffect } from "react";
import { Shield, GraduationCap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from '@/hooks/web3/useWallet';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, disconnect, openModal } = useWallet(); 

  useEffect(() => {
    const shouldAutoDisconnect = sessionStorage.getItem('autoDisconnectHome');
    
    if (shouldAutoDisconnect === 'true' && isConnected) {
      disconnect();
      sessionStorage.removeItem('autoDisconnectHome');
    }
  }, [isConnected, disconnect]);

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/calculator');
    } else {
      openModal();
    }
  };

  return (
    <div className="pt-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-800 to-green-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Plan Your Future with Confidence
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            Secure your retirement with total control over your assets and
            secure your financial future.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center gap-2 mx-auto shadow-lg"
          >
            {isConnected ? (
              <>Go to Calculator</>
            ) : (
              <>Connect Wallet & Get Started</>
            )}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <Shield className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Zero-Knowledge Security
              </h3>
              <p className="text-gray-600">
                Your data stays private. We use advanced encryption to ensure
                your financial details are never exposed.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <GraduationCap className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Finance Education
              </h3>
              <p className="text-gray-600">
                Meet our partners and the best e-learning platforms. Get expert
                financial courses to optimize your investments.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <TrendingUp className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Transparent Fees
              </h3>
              <p className="text-gray-600">
                No hidden costs. Clear, low fees to maximize your retirement
                savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">
            About Ethernity
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            We are dedicated to helping you build a secure financial future.
            With a focus on privacy, security, and expert management, our
            retirement funds are designed to give you peace of mind. Your data
            is protected with zero-knowledge principles, ensuring your
            information remains yours alone.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;