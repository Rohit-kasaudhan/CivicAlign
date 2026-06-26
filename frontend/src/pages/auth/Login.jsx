import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { loginUser, adminLoginUser, googleAuth } from '../../api/auth';

const inputCls =
  'block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent transition-colors';

// Google "G" logo SVG — matches Google's brand guidelines
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();

  const [tab, setTab]         = useState('citizen');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const handleTabChange = (t) => {
    setTab(t);
    setError('');
    if (t === 'admin') {
      setEmail('admin@civicalign.com');
      setPassword('Admin@123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  // ── Email / password login ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiFn = tab === 'admin' ? adminLoginUser : loginUser;
      const { access_token, user } = await apiFn({ email, password });
      login(access_token, user);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate(tab === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth login ─────────────────────────────────────────────
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setError('');
      try {
        const { access_token: jwt, user } = await googleAuth(tokenResponse.access_token);
        login(jwt, user);
        toast.success(`Welcome, ${user.full_name}!`);
        navigate('/dashboard');
      } catch (err) {
        const msg = err?.response?.data?.error || 'Google sign-in failed. Please try again.';
        setError(msg);
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  const anyLoading = loading || gLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1 mb-4">
            <span className="text-2xl font-extrabold text-[#1e40af]">Civic</span>
            <span className="text-2xl font-extrabold text-gray-800">Align</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#1e40af] hover:text-blue-800">
              Register here
            </Link>
          </p>
        </div>

        {/* Citizen / Admin tabs */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden">
          {['citizen', 'admin'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabChange(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-[#1e40af] text-white'
                  : 'text-gray-600 bg-white hover:bg-gray-50'
              }`}
            >
              {t === 'citizen' ? 'Citizen' : 'Admin'}
            </button>
          ))}
        </div>

        {tab === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px] text-blue-500">Demo Admin Credentials</p>
            <div><strong>Email:</strong> admin@civicalign.com</div>
            <div><strong>Password:</strong> Admin@123</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Google button — citizens only */}
        {tab === 'citizen' && (
          <>
            <button
              type="button"
              onClick={() => triggerGoogleLogin()}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {gLoading ? (
                <Loader2 size={18} className="animate-spin text-gray-400" />
              ) : (
                <GoogleIcon />
              )}
              {gLoading ? 'Signing in with Google…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
              <hr className="flex-1 border-gray-200" />
            </div>
          </>
        )}

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#1e40af] hover:text-blue-800"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl text-white bg-[#1e40af] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading
              ? 'Signing in…'
              : tab === 'admin'
              ? 'Sign in as Admin'
              : 'Sign in with Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
