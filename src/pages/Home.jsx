import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Cpu, ArrowRight, Star, ShoppingCart, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import GpuAnatomy from '../components/GpuAnatomy';

const BANNERS = ['/images/banner1.png', '/images/banner2.png', '/images/banner3.png'];
const CAMPAIGN = [
  { titleKey: 'home.campaign.1Title', bodyKey: 'home.campaign.1Body' },
  { titleKey: 'home.campaign.2Title', bodyKey: 'home.campaign.2Body' },
  { titleKey: 'home.campaign.3Title', bodyKey: 'home.campaign.3Body' },
];
const SLIDE_DURATION = 5000;
const CATEGORIES = [
  { id: 'GPU', image: '/images/gpu.png', nameKey: 'cat.graphicsCards' },
  { id: 'CPU', image: '/images/cpu.png', nameKey: 'cat.processors' },
  { id: 'RAM', image: '/images/ram.png', nameKey: 'cat.memory' },
  { id: 'Motherboard', image: '/images/motherboard.png', nameKey: 'cat.motherboards' },
];

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

  const handleQuickAdd = (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded((current) => (current === product.id ? null : current)), 2000);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      {/* Campaign: square artwork stays uncropped beside its offer */}
      <section
        className="bg-midnight text-white"
        aria-roledescription="carousel"
        aria-label={t('home.bannerAlt')}
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        onFocus={() => setCarouselPaused(true)}
        onBlur={() => setCarouselPaused(false)}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:px-6 md:gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:py-12">
          <Link
            to="/products"
            className="group relative block aspect-square w-full overflow-hidden rounded-3xl bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-midnight"
            aria-label={t(CAMPAIGN[currentSlide].titleKey)}
          >
            {BANNERS.map((banner, index) => (
              <img
                key={banner}
                src={banner}
                alt=""
                aria-hidden={index !== currentSlide}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </Link>

          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold leading-[1.4] sm:text-4xl">
              {t(CAMPAIGN[currentSlide].titleKey)}
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-white/65 sm:text-lg">
              {t(CAMPAIGN[currentSlide].bodyKey)}
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
              >
                {t('home.campaign.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <button
                type="button"
                onClick={() => goToSlide(currentSlide - 1)}
                aria-label={t('home.prevSlide')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex flex-1 gap-2">
                {BANNERS.map((banner, index) => (
                  <button
                    key={banner}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`${t('home.goToSlide')} ${index + 1}`}
                    aria-current={index === currentSlide}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-midnight ${index === currentSlide ? 'bg-white' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goToSlide(currentSlide + 1)}
                aria-label={t('home.nextSlide')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero: the flagship card gets a quiet stage — one hue, no decoration */}
      <section className="border-t border-white/[0.06] bg-gradient-to-b from-slate-900 to-midnight text-white">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-12 lg:pt-20 lg:pb-16">
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
            </div>

            {/* The photo stays the only loud thing; its studio backdrop is tinted into the ground */}
            <figure className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
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

          {/* Proof stated once, quietly, with the repeat path into the catalogue */}
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/60 lg:mt-16">
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

      <GpuAnatomy />

      {/* Shop by part: real product renders instead of icons */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-2xl font-semibold text-slate-900 md:text-3xl">
            {t('home.browse')}
          </h2>
          <Link
            to="/products"
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('home.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-colors duration-300 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-4">
                <span className="font-display text-base font-medium text-slate-900">
                  {t(category.nameKey)}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended products */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-2xl font-semibold text-slate-900 md:text-3xl">
            {t('home.recommended')}
          </h2>
          <Link
            to="/products"
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('home.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="space-y-4 p-5">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-6 w-3/4 rounded bg-slate-200" />
                  <div className="h-8 w-28 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-rose-100 bg-white p-12 text-center">
            <p className="mb-4 font-semibold text-rose-600">{t('common.loadError')}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90">
              <RotateCcw className="w-4 h-4" /> {t('common.retry')}
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
            <p className="font-medium text-slate-500">{t('products.empty')}</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {products.map((product) => {
              const outOfStock = Number(product.stock) <= 0;
              const added = justAdded === product.id;
              return (
                <Link to={`/product/${product.id}`} key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-300 hover:border-slate-300 hover:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 backdrop-blur">
                        {product.brand}
                      </span>
                      {outOfStock && (
                        <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white">
                          {t('product.outOfStock')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 font-display text-lg font-medium leading-[1.45] text-slate-900 transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                      <div>
                        <p className="text-xs text-slate-500">{t('home.price')}</p>
                        <span className="font-display text-xl font-medium tabular-nums text-slate-900">
                          ฿{Number(product.price).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={outOfStock}
                        aria-label={t('product.addToCart')}
                        className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-200 ${
                          outOfStock
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : added
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Closing argument: hand the build to a technician */}
      <section className="bg-midnight text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_auto]">
            <div>
              <h2 className="max-w-2xl font-display text-3xl font-semibold leading-[1.4] md:text-4xl">
                {t('home.build.title')}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-[1.75] text-white/65">
                {t('home.build.body')}
              </p>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
                {['home.hero.f1Title', 'home.hero.f2Title', 'home.hero.f3Title', 'home.hero.f4Title'].map((key) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-white/45" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/builder"
              className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-primary px-7 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight lg:justify-self-end"
            >
              {t('home.build.cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

