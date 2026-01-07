import React, { useEffect, useState } from "react";
import { Shield, GraduationCap, TrendingUp, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from '@/hooks/web3/useWallet';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, disconnect, openModal } = useWallet();
  const { t } = useTranslation();

  const [surveyData, setSurveyData] = useState({
    age: '',
    trustTraditional: null,
    blockchainFamiliarity: null,
    retirementConcern: null,
    hasRetirementPlan: null,
    valuesInRetirement: null,
    interestedInBlockchain: null
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
    
    if (!surveyData.age) {
      setError(t('survey.selectAge'));
      return;
    }
    
    const allRatingsSet = [
      surveyData.trustTraditional,
      surveyData.blockchainFamiliarity,
      surveyData.retirementConcern,
      surveyData.hasRetirementPlan,
      surveyData.valuesInRetirement,
      surveyData.interestedInBlockchain
    ].every(rating => rating !== null && rating !== undefined);
    
    if (!allRatingsSet) {
      setError(t('survey.answerAll'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/survey/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: surveyData.age,
          trust_traditional: surveyData.trustTraditional,
          blockchain_familiarity: surveyData.blockchainFamiliarity,
          retirement_concern: surveyData.retirementConcern,
          has_retirement_plan: surveyData.hasRetirementPlan,
          values_in_retirement: surveyData.valuesInRetirement,
          interested_in_blockchain: surveyData.interestedInBlockchain
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error submitting survey' }));
        throw new Error(errorData.detail || 'Error submitting survey');
      }
      const data = await response.json();
      console.log('Survey submitted:', data);
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
      setError(t('followUp.pleaseIndicate'));
      return;
    }
    
    if (followUpData.wantsMoreInfo === 'yes' && !followUpData.email) {
      setError(t('followUp.enterEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/survey/surveys/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wants_more_info: followUpData.wantsMoreInfo === 'yes',
          email: followUpData.email || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error submitting follow-up' }));
        throw new Error(errorData.detail || 'Error submitting follow-up');
      }

      const data = await response.json();
      console.log('Follow-up submitted:', data);
      setFinalSuccess(true);
      setShowFollowUp(false);
      
      setTimeout(() => {
        setFinalSuccess(false);
        setSuccess(false);
        setSurveyData({
          age: '',
          trustTraditional: null,
          blockchainFamiliarity: null,
          retirementConcern: null,
          hasRetirementPlan: null,
          valuesInRetirement: null,
          interestedInBlockchain: null
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
      { val: -2, icon: ThumbsDown, label: t('survey.rating.stronglyDisagree'), color: 'red' },
      { val: -1, icon: ThumbsDown, label: t('survey.rating.disagree'), color: 'orange' },
      { val: 0, icon: Meh, label: t('survey.rating.neutral'), color: 'gray' },
      { val: 1, icon: ThumbsUp, label: t('survey.rating.agree'), color: 'blue' },
      { val: 2, icon: ThumbsUp, label: t('survey.rating.stronglyAgree'), color: 'green' }
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
  const ageOptions = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

  return (
    <div className="pt-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-800 to-green-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            {t('hero.subtitle')}
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center gap-2 mx-auto shadow-lg"
          >
            {isConnected ? t('hero.ctaConnected') : t('hero.ctaDisconnected')}
          </button>
        </div>
      </section>
      {/* Survey Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {t('survey.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('survey.subtitle')}
            </p>
          </div>
          {finalSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">{t('followUp.thankYou')}</h3>
                  <p className="text-green-700 text-sm">
                    {followUpData.wantsMoreInfo === 'yes' 
                      ? t('followUp.willContact')
                      : t('followUp.helpImprove')}
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
                  <h3 className="font-semibold text-red-800 mb-1">{t('survey.errorTitle')}</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          {!success && !showFollowUp && (
            <form onSubmit={handleSurveySubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  1. {t('survey.question1')} *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ageOptions.map((option) => (
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
                      {t(`survey.ageOptions.${option}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  2. {t('survey.question2')} *
                </label>
                <RatingButtons
                  value={surveyData.trustTraditional}
                  onChange={(val) => setSurveyData({ ...surveyData, trustTraditional: val })}
                  name="trustTraditional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  3. {t('survey.question3')} *
                </label>
                <RatingButtons
                  value={surveyData.blockchainFamiliarity}
                  onChange={(val) => setSurveyData({ ...surveyData, blockchainFamiliarity: val })}
                  name="blockchainFamiliarity"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  4. {t('survey.question4')} *
                </label>
                <RatingButtons
                  value={surveyData.retirementConcern}
                  onChange={(val) => setSurveyData({ ...surveyData, retirementConcern: val })}
                  name="retirementConcern"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  5. {t('survey.question5')} *
                </label>
                <RatingButtons
                  value={surveyData.hasRetirementPlan}
                  onChange={(val) => setSurveyData({ ...surveyData, hasRetirementPlan: val })}
                  name="hasRetirementPlan"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  6. {t('survey.question6')} *
                </label>
                <RatingButtons
                  value={surveyData.valuesInRetirement}
                  onChange={(val) => setSurveyData({ ...surveyData, valuesInRetirement: val })}
                  name="valuesInRetirement"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  7. {t('survey.question7')} *
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
                    {t('survey.submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {t('survey.submit')}
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                * {t('survey.required')}
              </p>
            </form>
          )}
          {success && showFollowUp && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">{t('followUp.successTitle')}</h3>
                    <p className="text-green-700 text-sm">
                      {t('followUp.successMessage')}
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleFollowUpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    {t('followUp.question1')} *
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
                      ✅ {t('followUp.yesInterested')}
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
                      {t('followUp.notNow')}
                    </button>
                  </div>
                </div>
                {followUpData.wantsMoreInfo === 'yes' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('followUp.question2')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={followUpData.email}
                      onChange={(e) => setFollowUpData({ ...followUpData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-300 focus:border-green-500 transition"
                      placeholder={t('followUp.emailPlaceholder')}
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
                      {t('survey.submitting')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {t('followUp.finish')}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <Shield className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {t('features.security.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.security.description')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <GraduationCap className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {t('features.education.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.education.description')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
              <TrendingUp className="text-green-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {t('features.fees.title')}
              </h3>
              <p className="text-gray-600">
                {t('features.fees.description')}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">
            {t('about.title')}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {t('about.description')}
          </p>
        </div>
      </section>
    </div>
  );
};
export default HomePage;
