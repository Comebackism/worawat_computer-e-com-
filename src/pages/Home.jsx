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

      {/* Hero: midnight stage with the flagship product spotlighted */}
      <section className="relative overflow-hidden bg-midnight text-white">
        {/* Stage lighting — static spots + a masked grid (no looping animation) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div aria-hidden="true" className="absolute -top-48 right-[-12%] h-[720px] w-[720px] rounded-full bg-neon/25 blur-[130px]" />
        <div aria-hidden="true" className="absolute bottom-[-18%] left-[-12%] h-[560px] w-[560px] rounded-full bg-blue-600/25 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-14 pb-12 lg:pt-20 lg:pb-16">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fadeIn">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-tech backdrop-blur md:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-tech" />
                {t('home.hero.eyebrow')}
              </span>
              <h1 className="mt-6 bg-gradient-to-r from-blue-300 via-indigo-200 to-violet-300 bg-clip-text font-display text-4xl font-bold leading-[1.2] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
                {t('home.hero.title')}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300 md:text-xl">
                {t('home.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 animate-slideInUp">
                <Link to="/products" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 font-bold text-white shadow-[0_18px_45px_-18px_rgba(79,70,229,1)] transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight">
                  {t('home.hero.cta')}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/builder" className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-bold text-white backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight">
                  <Cpu className="w-5 h-5 text-tech transition-transform group-hover:scale-110" />
                  {t('home.hero.ctaSecondary')}
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                {['home.hero.trust1', 'home.hero.trust2', 'home.hero.trust3'].map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Check className="w-4 h-4 shrink-0 text-tech" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Showcase stage */}
            <div className="relative mx-auto w-full max-w-md animate-slideInUp lg:max-w-none">
              <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-blue-600/25 via-neon/20 to-cyan-400/20 blur-3xl" />
              <div aria-hidden="true" className="absolute inset-x-12 -bottom-1 h-12 rounded-[100%] bg-blue-500/30 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-3 shadow-2xl shadow-blue-950/60 backdrop-blur-xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-white">
                  <img
                    src="/images/rtx4090.png"
                    alt={t('home.hero.showcase')}
                    className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(37,99,235,0.35),transparent_65%)] mix-blend-multiply"
                  />
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/25 to-transparent" />
                  <span className="absolute left-4 top-4 z-20 rounded-full bg-midnight/85 px-3 py-1 font-display text-xs font-semibold tracking-wide text-tech backdrop-blur">
                    {t('home.hero.showcase')}
                  </span>
                </div>
              </div>
              {/* Social proof, floating over the product */}
              <div className="absolute -left-3 bottom-6 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-abyss/90 px-4 py-3 shadow-xl shadow-blue-950/50 backdrop-blur sm:-left-4">
                <Star className="w-5 h-5 shrink-0 fill-amber-400 text-amber-400" />
                <div className="leading-tight">
                  <p className="font-display text-sm font-bold text-white">{t('home.hero.rating')}</p>
                  <p className="text-[11px] text-slate-400">{t('home.hero.reviews')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature cards — one key message per card */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-16 lg:grid-cols-4">
            {heroFeatures.map(({ Icon, titleKey, bodyKey }) => (
              <div
                key={titleKey}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07] sm:p-5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/25 to-neon/25 text-tech ring-1 ring-inset ring-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 font-display text-sm font-semibold text-white sm:text-base">{t(titleKey)}</p>
                <p className="mt-1 hidden text-sm text-slate-400 sm:block">{t(bodyKey)}</p>
              </div>
            ))}
          </div>

          {/* Numbers + repeated CTA */}
          <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <dl className="flex flex-wrap items-center gap-x-10 gap-y-4">
              {[
                { value: `${productCount || 22}+`, key: 'home.hero.statProducts' },
                { value: '15+', key: 'home.hero.statBrands' },
                { value: t('home.hero.statWarrantyValue'), key: 'home.hero.statWarranty' },
              ].map((stat) => (
                <div key={stat.key}>
                  <dt className="font-display text-2xl font-bold text-white">{stat.value}</dt>
                  <dd className="text-xs text-slate-400 md:text-sm">{t(stat.key)}</dd>
                </div>
              ))}
            </dl>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 font-semibold text-tech transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tech focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
            >
              {t('home.hero.stripCta')}
              <ChevronRight className="h-4 w-4" />
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

