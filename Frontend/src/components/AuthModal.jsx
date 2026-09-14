import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '8700404392-ce6khm9cklapb7ej03mr73ojnb8bfsiu.apps.googleusercontent.com';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView); // 'login' | 'register' | 'forgot'
  const { login, register, loginWithGoogle } = useAuth();

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const googleBtnRef = useRef(null);

  // Sync initialView when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError('');
      setPhoneError('');
      setPasswordError('');
      setForgotSuccess(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialView]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isOpen || view === 'forgot') return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              try {
                setLoading(true);
                setError('');
                await loginWithGoogle(response.credential);
                onClose();
              } catch (err) {
                setError(err.message || 'Google Sign-In failed.');
              } finally {
                setLoading(false);
              }
            },
          });

          // Render Google button inside container
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            text: view === 'login' ? 'continue_with' : 'signup_with',
            width: googleBtnRef.current.offsetWidth || 340,
          });
        } catch (err) {
          console.warn('Google One Tap init notice:', err);
        }
      }
    };

    // Retry briefly if SDK is still downloading
    const timer = setTimeout(initGoogle, 150);
    return () => clearTimeout(timer);
  }, [isOpen, view, loginWithGoogle, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // ── Handlers ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(loginForm.email, loginForm.password);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhoneError('');
    setPasswordError('');

    const cleanPhone = registerForm.phoneNumber.trim();
    if (cleanPhone && !/^0\d{9}$/.test(cleanPhone)) {
      setPhoneError('Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)');
      setError('Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)');
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await register({
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        phoneNumber: cleanPhone || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_ENDPOINTS.auth}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        setForgotSuccess(true);
      } else {
        throw new Error('Could not submit password reset request.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all';
  const labelCls = 'block text-xs font-bold text-gray-700 mb-1';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* ── Dark Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* ── Modal Dialog ── */}
      <div
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Sashrika" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-gray-900 tracking-tight">
              Sashrika<span className="text-emerald-600"> Real Estate</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: LOGIN
             ══════════════════════════════════════════════════════════════════ */}
          {view === 'login' && (
            <div>
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-gray-900">Welcome Back</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sign in to manage your property listings & inquiries.
                </p>
              </div>

              {/* Google Sign-In Container */}
              <div className="mb-4 flex justify-center">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <span className="bg-white px-2">OR CONTINUE WITH EMAIL</span>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className={labelCls}>Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setError('');
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-gray-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setError('');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Sign Up Free
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: REGISTER
             ══════════════════════════════════════════════════════════════════ */}
          {view === 'register' && (
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-extrabold text-gray-900">Create Free Account</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Join Sashrika to post, edit, and track your property ads.
                </p>
              </div>

              {/* Google Sign-In Container */}
              <div className="mb-3 flex justify-center">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
              </div>

              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <span className="bg-white px-2">OR REGISTER WITH EMAIL</span>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Praneeth"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Nawarathna"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Phone Number <span className="font-normal text-gray-400">(for WhatsApp inquiries)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="0771234567"
                    value={registerForm.phoneNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setRegisterForm((prev) => ({ ...prev, phoneNumber: digits }));
                      if (digits.length > 0 && !/^0\d{9}$/.test(digits)) {
                        setPhoneError('Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)');
                      } else {
                        setPhoneError('');
                      }
                    }}
                    onBlur={() => {
                      const cleanPhone = registerForm.phoneNumber.trim();
                      if (cleanPhone && !/^0\d{9}$/.test(cleanPhone)) {
                        setPhoneError('Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)');
                      } else {
                        setPhoneError('');
                      }
                    }}
                    className={`${inputCls} ${phoneError ? 'border-red-400 bg-red-50/30' : ''}`}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{phoneError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls}>Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="At least 8 chars"
                      value={registerForm.password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegisterForm((prev) => ({ ...prev, password: val }));
                        if (val.length > 0 && val.length < 8) {
                          setPasswordError('Password must be at least 8 characters long');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      onBlur={() => {
                        if (registerForm.password.length > 0 && registerForm.password.length < 8) {
                          setPasswordError('Password must be at least 8 characters long');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      className={`${inputCls} ${passwordError ? 'border-red-400 bg-red-50/30' : ''}`}
                    />
                    {passwordError && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{passwordError}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || registerForm.password.length < 8 || Boolean(phoneError)}
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: FORGOT PASSWORD
             ══════════════════════════════════════════════════════════════════ */}
          {view === 'forgot' && (
            <div>
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your account email to receive a password reset link.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-extrabold text-base text-gray-900">Reset Link Sent</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    If an account with <span className="font-semibold text-gray-800">{forgotEmail}</span> exists, we've sent instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setForgotSuccess(false);
                    }}
                    className="mt-3 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Registered Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      ← Back to Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
