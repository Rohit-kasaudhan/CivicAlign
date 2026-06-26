import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/auth';

const inputClass =
  'block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-civic-blue focus:border-transparent';

const ForgotPassword = () => {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow border border-gray-200 space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you an OTP to recover your password.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-md text-white bg-civic-blue hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                An OTP has been sent to <span className="font-bold">{email}</span>. Please enter it below along with your new password to reset.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={inputClass}
                placeholder="Enter 6-digit OTP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Repeat password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-md text-white bg-civic-blue hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Resetting Password…' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-md">
              Password reset successfully!
            </div>
            <Link
              to="/login"
              className="block text-sm font-semibold text-civic-blue hover:text-blue-700"
            >
              Back to Login
            </Link>
          </div>
        )}

        {step !== 'done' && (
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-civic-blue hover:text-blue-700"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


export default ForgotPassword;
