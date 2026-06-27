import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA] py-12 px-4 sm:px-6 lg:px-8 page-fade">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 space-y-6">
        
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <ShieldCheck size={24} className="text-[#1A3A6B]" />
            <span className="text-xl font-extrabold text-[#1A1A2E] font-poppins">CivicAlign</span>
          </Link>
          <h2 className="text-xl font-extrabold text-gray-900 font-poppins mt-2">Reset Your Password</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-[#C0392B] text-sm p-3.5 rounded-xl font-medium">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-xs text-[#5A6A7A] leading-relaxed">
              Enter your registered email address below, and we will transmit a 6-digit verification OTP code to reset your credentials.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="gov-input"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="gov-btn-primary w-full h-11 text-sm font-bold mt-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Requesting OTP…' : 'Transmit OTP Code'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="bg-[#1A3A6B]/5 border border-[#1A3A6B]/15 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-[#1A3A6B] leading-relaxed">
                An OTP has been dispatched to <span className="font-bold">{email}</span>. Please verify the code and set your new passcode.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A6A7A] uppercase tracking-wider mb-1.5">OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="gov-input"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A6A7A] uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="gov-input"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="gov-input"
                placeholder="Repeat new password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="gov-btn-primary w-full h-11 text-sm font-bold mt-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Resetting Passcode…' : 'Update Credentials'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 text-[#0F7B6C] text-sm p-4 rounded-xl font-bold">
              Passcode updated successfully!
            </div>
            <Link
              to="/login"
              className="gov-btn-primary w-full h-11 text-sm font-bold"
            >
              Back to Login
            </Link>
          </div>
        )}

        {step !== 'done' && (
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-bold text-[#1A3A6B] hover:underline"
            >
              Cancel and go back
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
