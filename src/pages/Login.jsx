import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ArrowRight, Monitor, Info, Shield } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@worawat.com', password: 'admin1234', admin: true },
  { label: 'Customer', email: 'john.doe@example.com', password: 'demo1234', admin: false },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they were trying to visit, or home
  const from = location.state?.from?.pathname || '/';

  const submit = async (nextEmail, nextPassword) => {
    setIsSubmitting(true);
    setError('');

    const result = await login(nextEmail, nextPassword);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || t('login.invalid'));
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError(t('login.required'));
      return;
    }
    submit(email.trim(), password);
  };

  const signInAsDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    submit(account.email, account.password);
  };

  const inputClass = 'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 focus:bg-white transition-colors';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-ambient border border-slate-100 p-8 select-none">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-2xl tracking-tight mb-6 focus:outline-none">
            <Monitor className="w-8 h-8" />
            Worawat_computer
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{t('login.title')}</h1>
          <p className="text-slate-500">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('login.email')}</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">{t('login.password')}</label>
              <button
                type="button"
                onClick={() => setShowForgot((v) => !v)}
                className="text-sm font-semibold text-primary hover:underline focus:outline-none"
              >
                {t('login.forgot')}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {showForgot && (
              <p className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                {t('login.forgotHint')}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white'}`}
          >
            {isSubmitting ? t('login.submitting') : <>{t('login.submit')} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        {/* Demo accounts, so the app can be explored without signing up first */}
        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('login.demoAccounts')}</p>
          <p className="text-xs text-slate-500 mb-3">{t('login.demoHint')}</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={isSubmitting}
                onClick={() => signInAsDemo(account)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-primary hover:text-white text-slate-700 border border-slate-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {account.admin ? <Shield className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                {account.email}
              </button>
            ))}
          </div>
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-grow"></div>
          <span className="text-slate-400 text-sm font-semibold select-none">OR</span>
          <div className="h-px bg-slate-200 flex-grow"></div>
        </div>

        <button
          onClick={() => {
            loginWithGoogle();
            navigate(from, { replace: true });
          }}
          className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all border border-slate-200 hover:bg-slate-50 text-slate-700 focus:outline-none select-none"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t('login.google')}
        </button>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {t('login.noAccount')} <Link to="/register" className="text-primary font-bold hover:underline focus:outline-none select-none">{t('login.signup')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}