import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff, Monitor, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError(t('register.errorRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errorPasswordMismatch'));
      return;
    }

    setIsSubmitting(true);

    const result = await register(formData);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      if (result.status === 409 || result.error?.toLowerCase().includes('already exists')) {
        setError(t('register.errorEmailExists'));
      } else {
        setError(t('register.errorFailed'));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6 bg-slate-50">
      
      <div className="mb-8 text-center select-none">
        <Link to="/" className="inline-flex items-center justify-center mb-4 focus:outline-none">
          <img src="/images/logoworawat compter.png" alt="Worawat_computer" className="h-20 sm:h-24 object-contain" />
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-4">{t('register.title')}</h1>
      </div>

      <div className="max-w-3xl w-full bg-surface rounded-2xl shadow-ambient border border-slate-100 p-8 sm:p-10 select-none">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-red-800">{t('register.errorTitle')}</p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.firstName')} <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={t('register.firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.lastName')} <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={t('register.lastName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.phone')}</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={t('register.phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.dob')}</label>
              <input 
                type="date" 
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.email')} <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder={t('register.email')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.password')} <span className="text-red-500">*</span></label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={t('register.password')}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.confirmPassword')} <span className="text-red-500">*</span></label>
            <div className="relative flex items-center">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={t('register.confirmPassword')}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white'}`}
            >
              {isSubmitting ? t('register.submitting') : t('register.submit')}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-grow"></div>
          <span className="text-slate-400 text-sm font-semibold select-none">OR</span>
          <div className="h-px bg-slate-200 flex-grow"></div>
        </div>

        <div className="flex justify-center w-full mt-4">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              // We can use the same loginWithGoogle method from AuthContext 
              // since it checks if the user exists and creates them if not.
              const res = await loginWithGoogle(credentialResponse.credential);
              if (res.success) {
                navigate('/', { replace: true });
              } else {
                setError(t('register.errorGoogle'));
              }
            }}
            onError={() => {
              setError(t('register.errorGoogle'));
            }}
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {t('register.hasAccount')} <Link to="/login" className="text-primary font-bold hover:underline focus:outline-none select-none">{t('register.signin')}</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
