import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { updateLanguage } from '../../api/auth';
import { LANGUAGES } from '../../utils/constants';

const LanguageSelect = () => {
  const { updateUser } = useAuth();
  const { changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await updateLanguage(selected);
      updateUser(data.user);
      changeLanguage(selected);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save language preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Choose Your Language</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Select the language you'd like to use in CivicAlign
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {LANGUAGES.map(({ code, native, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                selected === code
                  ? 'border-civic-blue bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg font-semibold text-gray-800 leading-snug">{native}</span>
              <span className="text-xs text-gray-500 mt-1">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full py-3 px-6 text-sm font-semibold rounded-xl text-white bg-civic-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving…' : 'Continue with selected language'}
        </button>
      </div>
    </div>
  );
};

export default LanguageSelect;

