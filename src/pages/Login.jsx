import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ArrowRight, Info } from 'lucide-react';

// A demo customer account so the storefront can be explored without signing up.
// The admin account is intentionally not listed here: its password comes from
// the ADMIN_PASSWORD environment variable.
const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'john.doe@example.com', password: 'demo1234' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
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
          <Link to="/" className="inline-flex items-center justify-center mb-6 focus:outline-none">
            <img src="/images/logoworawat compter.png" alt="Worawat Computer" className="h-20 sm:h-24 w-auto object-contain" />
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
                <Mail className="w-3.5 h-3.5" />
                {account.email}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {t('login.noAccount')} <Link to="/register" className="text-primary font-bold hover:underline focus:outline-none select-none">{t('login.signup')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
