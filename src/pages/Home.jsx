import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Cpu, Monitor, Zap, ArrowRight, Star, ShoppingCart, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

export default function Home() {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api('/products')
      .then((data) => {
        if (cancelled) return;
        setProducts((Array.isArray(data) ? data : []).slice(0, 3));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleQuickAdd = (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded((current) => (current === product.id ? null : current)), 2000);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-32">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen translate-x-1/3 -translate-y-1/4 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen -translate-x-1/3 translate-y-1/4 animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 mb-6 leading-tight tracking-tight select-none animate-[slideInDown_1s_ease-out]">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10 font-medium select-none max-w-2xl animate-[fadeIn_1.5s_ease-out]">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex gap-4 animate-[slideInUp_1s_ease-out]">
              <Link to="/products" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-1 select-none focus:outline-none group">
                {t('home.hero.cta')} 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons with Hover Effects */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 relative inline-block">
            {t('home.browse')}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-blue-600 rounded-full"></span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: t('cat.graphicsCards'), id: 'GPU', icon: <Monitor className="w-10 h-10 mb-4 text-blue-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-blue-600' },
            { name: t('cat.processors'), id: 'CPU', icon: <Cpu className="w-10 h-10 mb-4 text-indigo-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-indigo-600' },
            { name: t('cat.memory'), id: 'RAM', icon: <Zap className="w-10 h-10 mb-4 text-purple-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-purple-600' },
            { name: t('cat.motherboards'), id: 'Motherboard', icon: <Cpu className="w-10 h-10 mb-4 text-rose-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-rose-600' },
          ].map((cat, i) => (
            <Link to={`/products?category=${cat.id}`} key={i} className={`bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 select-none group hover:-translate-y-2 ${cat.color}`}>
              {cat.icon}
              <span className="font-bold text-slate-700 group-hover:text-white transition-colors duration-300">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended Products with Glassmorphism and Glow */}
      <section className="max-w-7xl mx-auto px-6 py-16 mb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 relative inline-block">
            {t('home.recommended')}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-indigo-600 rounded-full"></span>
          </h2>
          <Link to="/products" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 group transition-colors">
            {t('home.viewAll')} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 animate-pulse">
                <div className="h-72 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-8 w-28 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-rose-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-rose-600 font-semibold mb-4">{t('common.loadError')}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              <RotateCcw className="w-4 h-4" /> {t('common.retry')}
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-slate-500 font-semibold">{t('products.empty')}</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => {
              const outOfStock = Number(product.stock) <= 0;
              const added = justAdded === product.id;
              return (
                <Link to={`/product/${product.id}`} key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-slate-100 flex flex-col select-none focus:outline-none group relative">
                  {/* Image Container */}
                  <div className="h-72 overflow-hidden bg-slate-50 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <div className="bg-white/95 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {product.brand}
                      </div>
                      {outOfStock && (
                        <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                          {t('product.outOfStock')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow relative bg-white">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{product.category}</span>
                    </div>
                    <h3 className="font-extrabold text-xl mb-3 text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>

                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-sm text-slate-500 font-medium mb-1">{t('home.price')}</p>
                        <span className="text-2xl font-black text-slate-900">฿{Number(product.price).toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={outOfStock}
                        aria-label={t('product.addToCart')}
                        className={`p-3 rounded-xl transition-colors duration-300 shadow-md group-hover:-translate-y-1 ${
                          outOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : added
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white hover:bg-indigo-600 group-hover:shadow-indigo-500/30'
                        }`}
                      >
                        {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

