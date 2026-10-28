import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth, AuthError } from '../context/AuthContext';
import NotificationBanner from '../components/NotificationBanner';
import BackendStatusIndicator from '../components/BackendStatusIndicator';

type AuthMode = 'login' | 'register' | 'verify-otp';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // 6-digit OTP state
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  const { login, register, verifyOtp, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Handle resend countdown timer
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto-focus first OTP input when entering OTP mode
  useEffect(() => {
    if (mode === 'verify-otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  const validate = (): boolean => {
    setValidationError(null);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return false;
    }
    if (mode === 'register') {
      if (!username.trim()) {
        setValidationError('Please provide a username for your account.');
        return false;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match. Please verify.');
        return false;
      }
    }
    return true;
  };

  // Submit Login or Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessBanner(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const response = await register({
          userName: username.trim(),
          email: email.trim(),
          Password: password,
        });

        const targetEmail = response.email || email.trim();
        setOtpEmail(targetEmail);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessBanner(
          response.message || 'Registration successful. A 6-digit verification code has been sent to your email.'
        );
        setResendCountdown(60);
        setMode('verify-otp');
      } else {
        await login({ email: email.trim(), Password: password });
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      // If backend returns 403 Forbidden: "Account not verified", automatically open OTP verification
      if (err instanceof AuthError && (err.isUnverified || err.status === 403)) {
        setOtpEmail(email.trim());
        setOtpDigits(['', '', '', '', '', '']);
        setValidationError('Account not verified. Please verify your 6-digit code first.');
        setMode('verify-otp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP 6-box Input Handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, ''); // only numeric digits
    if (!cleanVal && val !== '') return;

    const newDigits = [...otpDigits];
    const char = cleanVal.slice(-1); // take the last typed character
    newDigits[index] = char;
    setOtpDigits(newDigits);

    // Auto-advance to next input box
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move back to previous box and clear it
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digitsOnly.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = digitsOnly[i] || '';
      }
      setOtpDigits(newDigits);

      // Focus the next empty box or the 6th box
      const nextFocus = Math.min(digitsOnly.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // Submit OTP Verification (POST /verify-code)
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setValidationError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp({
        email: otpEmail,
        otp: fullCode,
      });

      // Verification successful: show banner and transition to Login with prefilled email
      setSuccessBanner(res.message || 'Email verified successfully! You can now log in.');
      setEmail(otpEmail);
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(['', '', '', '', '', '']);
      setMode('login');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    clearError();
    setValidationError(null);
    setIsSubmitting(true);
    try {
      // Re-trigger registration or dispatch
      await register({
        userName: username.trim() || 'User',
        email: otpEmail,
        Password: password || 'Password123!',
      });
      setSuccessBanner(`A new 6-digit verification code has been dispatched to ${otpEmail}.`);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (type: 'test' | 'admin') => {
    if (type === 'test') {
      setEmail('developer@example.com');
      setPassword('password123');
      setUsername('TestDeveloper');
      setConfirmPassword('password123');
    } else {
      setEmail('admin@metersaas.com');
      setPassword('admin123456');
      setUsername('SaaSAdmin');
      setConfirmPassword('admin123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Live Indicator */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">MeterPulse</span>
        </div>
        <BackendStatusIndicator />
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mode === 'verify-otp'
                ? 'Verify Your Email'
                : mode === 'register'
                ? 'Create MeterPulse Account'
                : 'Welcome to MeterPulse'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              {mode === 'verify-otp'
                ? 'Two-step security verification for your metering tenant'
                : mode === 'register'
                ? 'Deploy real-time usage-based billing in minutes'
                : 'Manage your real-time metering, keys, and invoices'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
            {/* Tab switch for Login / Register when not in OTP mode */}
            {mode !== 'verify-otp' ? (
              <div className="flex rounded-xl bg-slate-950/80 p-1 mb-6 border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setValidationError(null);
                    setSuccessBanner(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setValidationError(null);
                    setSuccessBanner(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setValidationError(null);
                    clearError();
                  }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Register / Edit Email</span>
                </button>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]">
                  Step 2 of 2
                </span>
              </div>
            )}

            {/* Success Banner */}
            {successBanner && (
              <div className="mb-5">
                <NotificationBanner
                  type="success"
                  message={successBanner}
                  onDismiss={() => setSuccessBanner(null)}
                />
              </div>
            )}

            {/* Error Banner */}
            {(error || validationError) && (
              <div className="mb-5">
                <NotificationBanner
                  type="error"
                  message={validationError || error || 'Authentication failed.'}
                  onDismiss={() => {
                    setValidationError(null);
                    clearError();
                  }}
                />
              </div>
            )}

            {/* 3 Modes Rendering */}
            {mode === 'verify-otp' ? (
              /* OTP VERIFICATION VIEW */
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Enter 6-Digit Code</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    We sent a 6-digit verification code to{' '}
                    <span className="font-semibold text-indigo-300 font-mono block mt-0.5 break-all">
                      {otpEmail}
                    </span>
                  </p>
                </div>

                {/* 6-box Segmented Input */}
                <div className="space-y-2">
                  <label className="block text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Verification Code
                  </label>
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold text-white bg-slate-950 rounded-xl border transition-all shadow-inner focus:outline-none ${
                          digit
                            ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-950/20'
                            : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40'
                        }`}
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 text-center pt-1">
                    Tip: You can paste the full 6-digit code directly into the boxes.
                  </p>
                </div>

                {/* Submit OTP Verification Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify &amp; Continue to Login</span>
                    </>
                  )}
                </button>

                {/* Resend and Switch Options */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCountdown > 0 || isSubmitting}
                    className="hover:text-indigo-300 disabled:opacity-50 transition-colors flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>
                      {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend verification code'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setValidationError(null);
                      clearError();
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors font-medium underline underline-offset-2"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN & REGISTER VIEW */
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="acme_developer"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@metersaas.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Sign Up & Send Code' : 'Sign In to Dashboard'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Pre-fill helper */}
            {mode !== 'verify-otp' && (
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    Quick Fill Credentials:
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('test')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-slate-300 transition-colors text-center"
                  >
                    developer@example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-slate-300 transition-colors text-center"
                  >
                    admin@metersaas.com
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <TrendingUp className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-300">Real-Time</p>
              <p className="text-[10px] text-slate-500">Live event aggregation</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-300">Tiered Pricing</p>
              <p className="text-[10px] text-slate-500">Graduated bracket engine</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/30">
              <Receipt className="h-4 w-4 text-violet-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-300">PDF Invoices</p>
              <p className="text-[10px] text-slate-500">Instant cycle settlements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        MeterPulse Micro-SaaS &bull; Usage-Based Metering &amp; Invoicing Engine &bull; Port 3000
      </footer>
    </div>
  );
};

export default AuthPage;
