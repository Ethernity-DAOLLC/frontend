import React, { useEffect, useState } from "react";
import { Shield, GraduationCap, TrendingUp, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from '@/hooks/web3/useWallet';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, disconnect, openModal } = useWallet(); 

  const [surveyData, setSurveyData] = useState({
    age: '',
    trustTraditional: 0,
    blockchainFamiliarity: 0,
    retirementConcern: 0,
    hasRetirementPlan: 0,
    valuesInRetirement: 0,
    interestedInBlockchain: 0
  });
  
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    wantsMoreInfo: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [finalSuccess, setFinalSuccess] = useState(false);
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
    if (!surveyData.age) {
      setError('Por favor selecciona tu rango de edad');
      return;
    }
    
    const allRatingsSet = [
      surveyData.trustTraditional,
      surveyData.blockchainFamiliarity,
      surveyData.retirementConcern,
      surveyData.hasRetirementPlan,
      surveyData.valuesInRetirement,
      surveyData.interestedInBlockchain
    ].every(rating => rating !== 0);
    
    if (!allRatingsSet) {
      setError('Por favor responde todas las preguntas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: supabaseError } = await supabase
        .from('surveys')
        .insert([
          {
            age: surveyData.age,
            trust_traditional: surveyData.trustTraditional,
            blockchain_familiarity: surveyData.blockchainFamiliarity,
            retirement_concern: surveyData.retirementConcern,
            has_retirement_plan: surveyData.hasRetirementPlan,
            values_in_retirement: surveyData.valuesInRetirement,
            interested_in_blockchain: surveyData.interestedInBlockchain,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (supabaseError) throw supabaseError;

      setSuccess(true);
      setShowFollowUp(true);
      
    } catch (err: any) {
      setError(err.message || 'Error al enviar la encuesta. Por favor intenta nuevamente.');
      console.error('Survey error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followUpData.wantsMoreInfo) {
      setError('Por favor indica si deseas recibir más información');
      return;
    }
    
    if (followUpData.wantsMoreInfo === 'yes' && !followUpData.email) {
      setError('Por favor ingresa tu email para recibir información');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: supabaseError } = await supabase
        .from('survey_follow_ups')
        .insert([
          {
            wants_more_info: followUpData.wantsMoreInfo === 'yes',
            email: followUpData.email || null,
            created_at: new Date().toISOString()
          }
        ]);

      if (supabaseError) throw supabaseError;

      setFinalSuccess(true);
      setShowFollowUp(false);
      
      // Reset todo después de 5 segundos
      setTimeout(() => {
        setFinalSuccess(false);
        setSuccess(false);
        setSurveyData({
          age: '',
          trustTraditional: 0,
          blockchainFamiliarity: 0,
          retirementConcern: 0,
          hasRetirementPlan: 0,
          valuesInRetirement: 0,
          interestedInBlockchain: 0
        });
        setFollowUpData({
          wantsMoreInfo: '',
          email: ''
        });
      }, 5000);
      
    } catch (err: any) {
      setError(err.message || 'Error al enviar. Por favor intenta nuevamente.');
      console.error('Follow-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const RatingButtons = ({ value, onChange, name }: { value: number; onChange: (val: number) => void; name: string }) => {
    const ratings = [
      { val: -2, icon: ThumbsDown, label: 'Muy en desacuerdo', color: 'red' },
      { val: -1, icon: ThumbsDown, label: 'En desacuerdo', color: 'orange' },
      { val: 0, icon: Meh, label: 'Neutral', color: 'gray' },
      { val: 1, icon: ThumbsUp, label: 'De acuerdo', color: 'blue' },
      { val: 2, icon: ThumbsUp, label: 'Muy de acuerdo', color: 'green' }
    ];

    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {ratings.map(({ val, icon: Icon, label, color }) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              value === val
                ? color === 'red' ? 'border-red-500 bg-red-50 text-red-700' :
                  color === 'orange' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                  color === 'gray' ? 'border-gray-500 bg-gray-50 text-gray-700' :
                  color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                  'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
            }`}
            title={label}
          >
            <Icon size={24} />
            <span className="text-xs whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    );
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Ayúdanos a conocerte mejor
            </h2>
            <p className="text-lg text-gray-600">
              Tu opinión es valiosa. Responde estas preguntas y ayúdanos a crear el mejor sistema de retiro para ti.
            </p>
          </div>

          {finalSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">¡Muchas gracias por tu tiempo!</h3>
                  <p className="text-green-700 text-sm">
                    {followUpData.wantsMoreInfo === 'yes' 
                      ? 'Te contactaremos pronto con más información sobre Ethernity DAO.' 
                      : 'Tus respuestas nos ayudarán a mejorar nuestro servicio.'}
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

          {!success && !showFollowUp && (
            <form onSubmit={handleSurveySubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
              {/* Pregunta 1: Edad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  1. ¿Cuál es tu rango de edad? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSurveyData({ ...surveyData, age: option })}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        surveyData.age === option
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      {option} años
                    </button>
                  ))}
                </div>
              </div>

              {/* Pregunta 2: Confianza en sistemas tradicionales */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  2. Confío en los Sistemas Tradicionales de Pensiones/Retiro *
                </label>
                <RatingButtons
                  value={surveyData.trustTraditional}
                  onChange={(val) => setSurveyData({ ...surveyData, trustTraditional: val })}
                  name="trustTraditional"
                />
              </div>

              {/* Pregunta 3: Familiaridad con Blockchain */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  3. Estoy familiarizado con Blockchain/Criptomonedas *
                </label>
                <RatingButtons
                  value={surveyData.blockchainFamiliarity}
                  onChange={(val) => setSurveyData({ ...surveyData, blockchainFamiliarity: val })}
                  name="blockchainFamiliarity"
                />
              </div>

              {/* Pregunta 4: Preocupación sobre el retiro */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  4. Me preocupa no tener suficiente dinero para mi retiro *
                </label>
                <RatingButtons
                  value={surveyData.retirementConcern}
                  onChange={(val) => setSurveyData({ ...surveyData, retirementConcern: val })}
                  name="retirementConcern"
                />
              </div>

              {/* Pregunta 5: Plan de retiro actual */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  5. Actualmente tengo un plan de retiro activo *
                </label>
                <RatingButtons
                  value={surveyData.hasRetirementPlan}
                  onChange={(val) => setSurveyData({ ...surveyData, hasRetirementPlan: val })}
                  name="hasRetirementPlan"
                />
              </div>

              {/* Pregunta 6: Valora transparencia */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  6. Valoro la transparencia y control sobre mis inversiones de retiro *
                </label>
                <RatingButtons
                  value={surveyData.valuesInRetirement}
                  onChange={(val) => setSurveyData({ ...surveyData, valuesInRetirement: val })}
                  name="valuesInRetirement"
                />
              </div>

              {/* Pregunta 7: Interés en blockchain */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  7. Me interesaría crear mi Propio Fondo de Retiro con Transparencia Blockchain *
                </label>
                <RatingButtons
                  value={surveyData.interestedInBlockchain}
                  onChange={(val) => setSurveyData({ ...surveyData, interestedInBlockchain: val })}
                  name="interestedInBlockchain"
                />
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
          )}

          {/* Follow-up Questions */}
          {success && showFollowUp && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">¡Encuesta enviada con éxito!</h3>
                    <p className="text-green-700 text-sm">
                      Gracias por tu tiempo. Dos preguntas más y habremos terminado.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="space-y-6">
                {/* Pregunta A */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    ¿Te gustaría recibir más información acerca de Ethernity DAO? *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFollowUpData({ ...followUpData, wantsMoreInfo: 'yes', email: '' })}
                      className={`p-4 rounded-lg border-2 font-medium transition-all ${
                        followUpData.wantsMoreInfo === 'yes'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      ✅ Sí, me interesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpData({ ...followUpData, wantsMoreInfo: 'no', email: '' })}
                      className={`p-4 rounded-lg border-2 font-medium transition-all ${
                        followUpData.wantsMoreInfo === 'no'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      No por ahora
                    </button>
                  </div>
                </div>

                {/* Email field (conditional) */}
                {followUpData.wantsMoreInfo === 'yes' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Cuál es tu email? *
                    </label>
                    <input
                      type="email"
                      required
                      value={followUpData.email}
                      onChange={(e) => setFollowUpData({ ...followUpData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-300 focus:border-green-500 transition"
                      placeholder="tu@email.com"
                    />
                  </div>
                )}

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
                      Finalizar
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
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