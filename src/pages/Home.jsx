import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Cpu, Monitor, Zap, ArrowRight, Star, ShoppingCart, Check, RotateCcw, ShieldCheck, MessagesSquare, Truck, Wrench } from 'lucide-react';
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
  const [productCount, setProductCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api('/products')
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setProducts(list.slice(0, 3));
        setProductCount(list.length);
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

  // Auto-advance the hero carousel, pausing on hover/focus and when the OS asks for less motion
  useEffect(() => {
    if (carouselPaused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [carouselPaused, currentSlide]);

  const goToSlide = (index) => setCurrentSlide(((index % BANNERS.length) + BANNERS.length) % BANNERS.length);

  // Four promises, one key message each — rendered as the hero feature cards
  const heroFeatures = [
    { Icon: ShieldCheck, titleKey: 'home.hero.f1Title', bodyKey: 'home.hero.f1Body' },
    { Icon: MessagesSquare, titleKey: 'home.hero.f2Title', bodyKey: 'home.hero.f2Body' },
    { Icon: Truck, titleKey: 'home.hero.f3Title', bodyKey: 'home.hero.f3Body' },
    { Icon: Wrench, titleKey: 'home.hero.f4Title', bodyKey: 'home.hero.f4Body' },
  ];

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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <button
          type="button"
          onClick={() => goToSlide(currentSlide + 1)}
          aria-label={t('home.nextSlide')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </section>

      {/* Hero: the flagship card gets a quiet stage — one hue, no decoration */}
      <section className="bg-gradient-to-b from-slate-900 to-midnight text-white">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-14 lg:pt-24 lg:pb-20">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <h1 className="font-display text-4xl font-semibold leading-[1.4] text-white sm:text-5xl lg:text-[3.2rem]">
                {t('home.hero.title')}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-[1.75] text-white/70">
                {t('home.hero.subtitle')}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                >
                  {t('home.hero.cta')}
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/builder"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 font-medium text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                >
                  <Cpu className="w-4 h-4" />
                  {t('home.hero.ctaSecondary')}
                </Link>
              </div>
              <ul className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
                {['home.hero.trust1', 'home.hero.trust2', 'home.hero.trust3'].map((key) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0 text-white/45" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            {/* The photo stays the only loud thing; its studio backdrop is tinted into the ground */}
            <figure className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="animate-settle overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
                <div className="relative aspect-[4/3] bg-white">
                  <img
                    src="/images/rtx4090.png"
                    alt={t('home.hero.showcaseAlt')}
                    className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-300 mix-blend-multiply"
                  />
                </div>
              </div>
              <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-white/60">
                <span className="font-display font-medium">{t('home.hero.showcase')}</span>
                <span className="inline-flex items-center gap-1.5 text-white/55">
                  <Star className="w-3.5 h-3.5 shrink-0 text-white/40" />
                  {t('home.hero.rating')} · {t('home.hero.reviews')}
                </span>
              </figcaption>
            </figure>
          </div>

          {/* Four promises, set as text rows rather than cards */}
          <dl className="mt-16 grid gap-x-12 border-t border-white/10 lg:mt-20 lg:grid-cols-2">
            {heroFeatures.map(({ Icon, titleKey, bodyKey }) => (
              <div
                key={titleKey}
                className="flex flex-col gap-1 border-b border-white/5 py-6 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="flex shrink-0 items-center gap-2 font-medium text-white sm:w-44">
                  <Icon className="w-4 h-4 shrink-0 text-white/45" />
                  {t(titleKey)}
                </dt>
                <dd className="text-sm leading-[1.7] text-white/60">{t(bodyKey)}</dd>
              </div>
            ))}
          </dl>

          {/* Proof stated once, quietly, with the repeat path into the catalogue */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/60">
            <span>
              {t('home.hero.statProducts')}{' '}
              <strong className="font-medium text-white/85">{productCount || 22}+</strong>
            </span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
            <span>
              {t('home.hero.statBrands')} <strong className="font-medium text-white/85">15+</strong>
            </span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
            <span>
              {t('home.hero.statWarranty')}{' '}
              <strong className="font-medium text-white/85">{t('home.hero.statWarrantyValue')}</strong>
            </span>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:ml-auto"
            >
              {t('home.hero.stripCta')}
              <ChevronRight className="w-4 h-4" />
            </Link>
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

