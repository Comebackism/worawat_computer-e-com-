import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ArrowRight, Monitor } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page they were trying to visit, or home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  };

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
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 focus:bg-white transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">{t('login.password')}</label>
              <a href="#" className="text-sm font-semibold text-primary hover:underline focus:outline-none">{t('login.forgot')}</a>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50 focus:bg-white transition-colors"
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
                setError('Google Login failed. Please try again.');
              }
            }}
            onError={() => {
              setError('Google Login was unsuccessful.');
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
