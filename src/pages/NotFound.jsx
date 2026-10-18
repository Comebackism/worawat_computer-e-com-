import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Compass className="w-8 h-8" />
      </div>
      <p className="text-6xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{t('notFound.title')}</h1>
      <p className="text-slate-600 mb-8">{t('notFound.hint')}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> {t('notFound.home')}
      </Link>
    </div>
  );
}
