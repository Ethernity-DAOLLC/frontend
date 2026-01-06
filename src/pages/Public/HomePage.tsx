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
    
    // Validate all fields are complete
    if (!surveyData.age) {
      setError('Please select your age range');
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
      setError('Please answer all questions');
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
      setError(err.message || 'Error submitting survey. Please try again.');
      console.error('Survey error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followUpData.wantsMoreInfo) {
      setError('Please indicate if you want to receive more information');
      return;
    }
    
    if (followUpData.wantsMoreInfo === 'yes' && !followUpData.email) {
      setError('Please enter your email to receive information');
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
      
      // Reset everything after 5 seconds
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
      setError(err.message || 'Error submitting. Please try again.');
      console.error('Follow-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const RatingButtons = ({ value, onChange, name }: { value: number; onChange: (val: number) => void; name: string }) => {
    const ratings = [
      { val: -2, icon: ThumbsDown, label: 'Strongly Disagree', color: 'red' },
      { val: -1, icon: ThumbsDown, label: 'Disagree', color: 'orange' },
      { val: 0, icon: Meh, label: 'Neutral', color: 'gray' },
      { val: 1, icon: ThumbsUp, label: 'Agree', color: 'blue' },
      { val: 2, icon: ThumbsUp, label: 'Strongly Agree', color: 'green' }
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
            Financial Freedom in Your Hands
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            Secure Your Tomorrow with the Decision You Make Today
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
              Help Us Get to Know You Better
            </h2>
            <p className="text-lg text-gray-600">
              Your opinion is valuable. Answer these questions and help us create the best retirement system for you.
            </p>
          </div>

          {finalSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">Thank you so much for your time!</h3>
                  <p className="text-green-700 text-sm">
                    {followUpData.wantsMoreInfo === 'yes' 
                      ? 'We will contact you soon with more information about Ethernity DAO.' 
                      : 'Your responses will help us improve our service.'}
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
              {/* Question 1: Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  1. What is your age range? *
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
                      {option} years
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Trust in traditional systems */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  2. I Trust Traditional Pension/Retirement Systems *
                </label>
                <RatingButtons
                  value={surveyData.trustTraditional}
                  onChange={(val) => setSurveyData({ ...surveyData, trustTraditional: val })}
                  name="trustTraditional"
                />
              </div>

              {/* Question 3: Blockchain familiarity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  3. I Am Familiar with Blockchain/Cryptocurrencies *
                </label>
                <RatingButtons
                  value={surveyData.blockchainFamiliarity}
                  onChange={(val) => setSurveyData({ ...surveyData, blockchainFamiliarity: val })}
                  name="blockchainFamiliarity"
                />
              </div>

              {/* Question 4: Retirement concern */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  4. I Am Worried About Not Having Enough Money for Retirement *
                </label>
                <RatingButtons
                  value={surveyData.retirementConcern}
                  onChange={(val) => setSurveyData({ ...surveyData, retirementConcern: val })}
                  name="retirementConcern"
                />
              </div>

              {/* Question 5: Current retirement plan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  5. I Currently Have an Active Retirement Plan *
                </label>
                <RatingButtons
                  value={surveyData.hasRetirementPlan}
                  onChange={(val) => setSurveyData({ ...surveyData, hasRetirementPlan: val })}
                  name="hasRetirementPlan"
                />
              </div>

              {/* Question 6: Values transparency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  6. I Value Transparency and Control Over My Retirement Investments *
                </label>
                <RatingButtons
                  value={surveyData.valuesInRetirement}
                  onChange={(val) => setSurveyData({ ...surveyData, valuesInRetirement: val })}
                  name="valuesInRetirement"
                />
              </div>

              {/* Question 7: Interest in blockchain */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  7. I Would Be Interested in Creating My Own Retirement Fund with Blockchain Transparency *
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Submit Survey
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                * All questions are required. Your responses are anonymous.
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
                    <h3 className="font-semibold text-green-800 mb-1">Survey submitted successfully!</h3>
                    <p className="text-green-700 text-sm">
                      Thank you for your time. Two more questions and we are done.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="space-y-6">
                {/* Question A */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Would you like to receive more information about Ethernity DAO? *
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
                      ✅ Yes, I am interested
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
                      Not right now
                    </button>
                  </div>
                </div>

                {/* Email field (conditional) */}
                {followUpData.wantsMoreInfo === 'yes' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What is your email? *
                    </label>
                    <input
                      type="email"
                      required
                      value={followUpData.email}
                      onChange={(e) => setFollowUpData({ ...followUpData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-300 focus:border-green-500 transition"
                      placeholder="your@email.com"
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Finish
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