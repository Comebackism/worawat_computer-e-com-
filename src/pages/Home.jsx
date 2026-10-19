import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Cpu, Monitor, Zap, ArrowRight, Star, ShoppingCart, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

const BANNERS = ['/images/banner1.png', '/images/banner2.png', '/images/banner3.png'];
const SLIDE_DURATION = 5000;

export default function Home() {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [justAdded, setJustAdded] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

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

  // Auto-advance the hero carousel, pausing on hover/focus so shoppers can read a banner
  useEffect(() => {
    if (carouselPaused) return undefined;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [carouselPaused, currentSlide]);

  const goToSlide = (index) => setCurrentSlide(((index % BANNERS.length) + BANNERS.length) % BANNERS.length);

  const handleQuickAdd = (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded((current) => (current === product.id ? null : current)), 2000);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      {/* Hero Carousel */}
      <section
        className="relative w-full h-[200px] sm:h-[280px] md:h-[400px] lg:h-[450px] overflow-hidden bg-slate-900 group"
        aria-roledescription="carousel"
        aria-label={t('home.bannerAlt')}
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        onFocus={() => setCarouselPaused(true)}
        onBlur={() => setCarouselPaused(false)}
      >
        {BANNERS.map((banner, index) => (
          <div
            key={banner}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            aria-hidden={index !== currentSlide}
          >
            <img
              src={banner}
              alt={`${t('home.bannerAlt')} ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={() => goToSlide(currentSlide - 1)}
          aria-label={t('home.prevSlide')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <button
          type="button"
          onClick={() => goToSlide(currentSlide + 1)}
          aria-label={t('home.nextSlide')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {BANNERS.map((banner, index) => (
            <button
              key={banner}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`${t('home.goToSlide')} ${index + 1}`}
              aria-current={index === currentSlide}
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 focus:outline-none ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </section>

      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-32">
        {/* Animated Background Elements */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div aria-hidden="true" className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen translate-x-1/3 -translate-y-1/4 animate-[pulse_8s_ease-in-out_infinite]" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen -translate-x-1/3 translate-y-1/4 animate-[pulse_10s_ease-in-out_infinite_reverse]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div className="animate-fadeIn">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-blue-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              {t('home.hero.eyebrow')}
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 leading-[1.1] tracking-tight">
              {t('home.hero.title')}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 font-medium max-w-xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4 animate-slideInUp">
              <Link to="/products" className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-[0_10px_40px_-12px_rgba(79,70,229,0.9)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                {t('home.hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/builder" className="group inline-flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white px-7 py-3.5 rounded-xl font-bold backdrop-blur transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                <Cpu className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
                {t('home.hero.ctaSecondary')}
              </Link>
            </div>
            <ul className="mt-10 space-y-3">
              {['home.hero.feature1', 'home.hero.feature2', 'home.hero.feature3'].map((key) => (
                <li key={key} className="flex items-center gap-3 text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/30">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm md:text-base font-medium">{t(key)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-8">
              {[
                { value: '22+', key: 'home.hero.statProducts' },
                { value: '15+', key: 'home.hero.statBrands' },
                { value: '3 ปี', key: 'home.hero.statWarranty' },
              ].map((stat) => (
                <div key={stat.key}>
                  <dt className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</dt>
                  <dd className="mt-1 text-xs md:text-sm text-slate-400">{t(stat.key)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Showcase panel */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-slideInUp">
            <div aria-hidden="true" className="absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-purple-500/30 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-3 backdrop-blur-xl shadow-2xl shadow-blue-950/50">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(59,130,246,0.4),transparent_60%)]" />
                <img
                  src="/images/rtx4090.png"
                  alt={t('home.hero.showcase')}
                  className="relative z-10 h-[70%] w-auto object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)]"
                />
                <span className="absolute left-4 top-4 z-20 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur">
                  {t('home.hero.showcase')}
                </span>
              </div>
            </div>
            <div className="absolute -left-3 bottom-8 z-20 hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur sm:flex">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-white">{t('home.hero.rating')}</p>
                <p className="text-[11px] text-slate-400">{t('home.hero.reviews')}</p>
              </div>
            </div>
            <div className="absolute -right-3 top-8 z-20 hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur sm:flex">
              <Zap className="w-5 h-5 text-blue-400" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-white">{t('home.hero.freeBuild')}</p>
                <p className="text-[11px] text-slate-400">{t('home.hero.byTechnician')}</p>
              </div>
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

