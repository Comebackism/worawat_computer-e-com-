import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Cpu, Monitor, Zap, ArrowRight, Star, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    "/images/banner1.png",
    "/images/banner2.png",
    "/images/banner3.png"
  ];

  useEffect(() => {
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      {/* Hero Carousel */}
      <section className="relative w-full h-[200px] sm:h-[280px] md:h-[400px] lg:h-[450px] overflow-hidden bg-slate-900 group">
        {banners.map((banner, index) => (
          <div 
            key={index} 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img src={banner} alt={`Sale Banner ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        
        {/* Navigation Arrows */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 focus:outline-none ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
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
                    <span className="text-2xl font-black text-slate-900">฿{Number(product.price).toLocaleString()}</span>
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

