import React, { useEffect, useState } from "react";
import { Shield, GraduationCap, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from '@/hooks/web3/useWallet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, disconnect, openModal } = useWallet(); 

  const [surveyData, setSurveyData] = useState({
    age: '',
    trustTraditional: '',
    blockchainFamiliarity: '',
    retirementConcern: '',
    hasRetirementPlan: '',
    valuesInRetirement: '',
    interestedInBlockchain: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    const allFieldsFilled = Object.values(surveyData).every(value => value !== '');
    if (!allFieldsFilled) {
      setError('Por favor completa todas las preguntas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la encuesta');
      }

      setSuccess(true);
      setSurveyData({
        age: '',
        trustTraditional: '',
        blockchainFamiliarity: '',
        retirementConcern: '',
        hasRetirementPlan: '',
        valuesInRetirement: '',
        interestedInBlockchain: ''
      });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la encuesta. Por favor intenta nuevamente.');
      console.error('Survey error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSurveyData({ ...surveyData, [field]: value });
    if (error) setError('');
  };

  return (
    <div className="pt-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-800 to-green-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Financial Freedom in your hands
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            Secure Your tomorrow with the decision you make today
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

      {/* Survey Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Ayúdanos a conocerte mejor
            </h2>
            <p className="text-lg text-gray-600">
              Tu opinión es valiosa. Responde estas 7 preguntas y ayúdanos a crear el mejor sistema de retiro para ti.
            </p>
          </div>

          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">¡Gracias por tu participación!</h3>
                  <p className="text-green-700 text-sm">
                    Tus respuestas nos ayudarán a mejorar nuestro servicio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSurveySubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Pregunta 1: Edad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. ¿Cuál es tu rango de edad? *
              </label>
              <div className="space-y-2">
                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((option) => (
                  <label key={option} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="age"
                      value={option}
                      checked={surveyData.age === option}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option} años</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 2: Confianza en sistemas tradicionales */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. ¿Confías en los Sistemas Tradicionales de Pensiones/Retiro? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'totally', label: 'Sí, totalmente' },
                  { value: 'partially', label: 'Parcialmente' },
                  { value: 'little', label: 'Muy poco' },
                  { value: 'not', label: 'No confío' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="trustTraditional"
                      value={option.value}
                      checked={surveyData.trustTraditional === option.value}
                      onChange={(e) => handleInputChange('trustTraditional', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 3: Familiaridad con Blockchain */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3. ¿Cuál es tu nivel de familiaridad con Blockchain/Criptomonedas? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'expert', label: 'Experto - Las uso regularmente' },
                  { value: 'intermediate', label: 'Intermedio - Conozco y he invertido' },
                  { value: 'beginner', label: 'Principiante - He escuchado pero no uso' },
                  { value: 'none', label: 'Ninguno - No las conozco' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="blockchainFamiliarity"
                      value={option.value}
                      checked={surveyData.blockchainFamiliarity === option.value}
                      onChange={(e) => handleInputChange('blockchainFamiliarity', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 4: Preocupación sobre el retiro */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4. ¿Qué te preocupa más sobre tu Retiro? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'insufficient', label: 'No estar ahorrando lo suficiente' },
                  { value: 'distrust', label: 'Desconfianza en las instituciones' },
                  { value: 'transparency', label: 'Falta de transparencia' },
                  { value: 'fees', label: 'Comisiones elevadas' },
                  { value: 'inflation', label: 'Inflación que erosiona mis ahorros' },
                  { value: 'control', label: 'No tener control sobre mis inversiones' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="retirementConcern"
                      value={option.value}
                      checked={surveyData.retirementConcern === option.value}
                      onChange={(e) => handleInputChange('retirementConcern', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 5: Plan de retiro actual */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                5. ¿Tienes algún Plan de Retiro actualmente? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'yes-regular', label: 'Sí, aporto regularmente' },
                  { value: 'yes-occasional', label: 'Sí, pero aporto ocasionalmente' },
                  { value: 'no-want', label: 'No, pero me gustaría tener uno' },
                  { value: 'no-interest', label: 'No, no me interesa por ahora' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="hasRetirementPlan"
                      value={option.value}
                      checked={surveyData.hasRetirementPlan === option.value}
                      onChange={(e) => handleInputChange('hasRetirementPlan', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 6: Qué valoras más */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                6. ¿Qué valoras más de un Sistema de Retiro? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'returns', label: 'Rendimientos altos' },
                  { value: 'transparency', label: 'Transparencia total' },
                  { value: 'control', label: 'Control sobre mis inversiones' },
                  { value: 'security', label: 'Seguridad y privacidad' },
                  { value: 'low-fees', label: 'Bajas comisiones' },
                  { value: 'education', label: 'Educación financiera incluida' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="valuesInRetirement"
                      value={option.value}
                      checked={surveyData.valuesInRetirement === option.value}
                      onChange={(e) => handleInputChange('valuesInRetirement', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pregunta 7: Interés en blockchain */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                7. ¿Te interesaría crear tu Propio Fondo de Retiro con Transparencia Blockchain? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'very-interested', label: 'Muy interesado - Lo probaría ahora' },
                  { value: 'interested', label: 'Interesado - Me gustaría saber más' },
                  { value: 'neutral', label: 'Neutral - Necesito más información' },
                  { value: 'not-interested', label: 'No muy interesado' },
                  { value: 'not-at-all', label: 'No me interesa' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="interestedInBlockchain"
                      value={option.value}
                      checked={surveyData.interestedInBlockchain === option.value}
                      onChange={(e) => handleInputChange('interestedInBlockchain', e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Enviar Encuesta
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              * Todas las preguntas son obligatorias. Tus respuestas son anónimas.
            </p>
          </form>
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