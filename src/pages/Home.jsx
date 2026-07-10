import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Cpu, Monitor, Zap, ArrowRight, Star, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

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
            { name: t('cat.graphicsCards'), icon: <Monitor className="w-10 h-10 mb-4 text-blue-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-blue-600' },
            { name: t('cat.processors'), icon: <Cpu className="w-10 h-10 mb-4 text-indigo-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-indigo-600' },
            { name: t('cat.memory'), icon: <Zap className="w-10 h-10 mb-4 text-purple-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-purple-600' },
            { name: t('cat.motherboards'), icon: <Cpu className="w-10 h-10 mb-4 text-rose-600 group-hover:scale-110 group-hover:text-white transition-all duration-300" />, color: 'hover:bg-rose-600' },
          ].map((cat, i) => (
            <div key={i} className={`bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 select-none group hover:-translate-y-2 ${cat.color}`}>
              {cat.icon}
              <span className="font-bold text-slate-700 group-hover:text-white transition-colors duration-300">{cat.name}</span>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, i) => (
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
                    <span className="text-2xl font-black text-slate-900">฿{product.price.toLocaleString()}</span>
                  </div>
                  <button className="bg-slate-900 text-white hover:bg-indigo-600 p-3 rounded-xl transition-colors duration-300 shadow-md group-hover:shadow-indigo-500/30 group-hover:-translate-y-1">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

