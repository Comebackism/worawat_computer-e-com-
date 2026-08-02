import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ArrowRight, Monitor, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they were trying to visit, or home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasEmail = Boolean(email.trim());
    const hasPassword = Boolean(password.trim());

    if (!hasEmail || !hasPassword) {
      setFieldErrors({ email: !hasEmail, password: !hasPassword });
      setError(t('login.errorRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setFieldErrors({ email: false, password: false });

    const result = await login(email.trim(), password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setFieldErrors({ email: true, password: true });
      setError(t('login.errorInvalid'));
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: false }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: false }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-ambient border border-slate-100 p-8 select-none">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6 focus:outline-none">
            <img src="/images/logoworawat compter.png" alt="Worawat_computer" className="h-20 sm:h-24 object-contain" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{t('login.title')}</h1>
          <p className="text-slate-500">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-red-800">{t('login.errorTitle')}</p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('login.email')}</label>
            <div className="relative">
              <Mail className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-red-500' : 'text-slate-400'}`} />
              <input 
                type="email" 
                value={email}
                onChange={handleEmailChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors outline-none ${
                  fieldErrors.email 
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary'
                }`}
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-slate-700">{t('login.password')}</label>
            </div>
            <div className="relative">
              <Lock className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-500' : 'text-slate-400'}`} />
              <input 
                type="password" 
                value={password}
                onChange={handlePasswordChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors outline-none ${
                  fieldErrors.password 
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white'}`}
          >
            {isSubmitting ? t('login.submitting') : <>{t('login.submit')} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-grow"></div>
          <span className="text-slate-400 text-sm font-semibold select-none">OR</span>
          <div className="h-px bg-slate-200 flex-grow"></div>
        </div>

        <div className="flex justify-center w-full mt-4">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const res = await loginWithGoogle(credentialResponse.credential);
              if (res.success) {
                navigate(from, { replace: true });
              } else {
                setError(t('login.errorGoogle'));
              }
            }}
            onError={() => {
              setError(t('login.errorGoogle'));
            }}
            theme="outline"
            size="large"
            width="100%"
          />
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
