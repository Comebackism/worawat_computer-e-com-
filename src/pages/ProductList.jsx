import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';

const PRICE_CEILING = 100000;

export default function ProductList() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);
  const [sortBy, setSortBy] = useState('default');

  // Filters are built from the live catalogue so new admin products show up.
  const availableBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const availableCategories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api('/products')
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
  }, [categoryParam]);

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand) 
        : [...prev, brand]
    );
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
    // Keep the URL in sync when the category that came from the URL is cleared.
    if (category === categoryParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMaxPrice(PRICE_CEILING);
    setSortBy('default');
    if (searchParams.has('category')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    }
  };

  const filteredProducts = products.filter(product => {
    const brandStr = product.brand || '';
    const categoryStr = product.category || '';
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brandStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(brandStr);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(categoryStr);
    const matchesPrice = product.price <= maxPrice;
    
    return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'lowToHigh') {
      return a.price - b.price;
    } else if (sortBy === 'highToLow') {
      return b.price - a.price;
    }
    return 0; // default (no sorting by price, keep original order)
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-surface p-6 rounded-xl shadow-ambient border border-slate-100 md:sticky md:top-24">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">{t('products.filters')}</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-slate-700">{t('products.category')}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {availableCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" 
                  />
                  <span className="text-slate-600 select-none">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-slate-700">{t('products.brand')}</h3>
            <div className="space-y-2">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" 
                  />
                  <span className="text-slate-600 select-none">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-slate-700">{t('products.maxPrice')}: ฿{maxPrice.toLocaleString()}</h3>
            <input 
              type="range" 
              min="0"
              max={PRICE_CEILING}
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer" 
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 select-none">
              <span>฿0</span>
              <span>฿{PRICE_CEILING.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={handleResetFilters}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg transition-colors select-none focus:outline-none"
          >
            {t('products.reset')}
          </button>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('products.title')}</h1>
          {!loading && !error && (
            <p className="text-sm font-semibold text-slate-500 md:mx-auto">
              {filteredProducts.length} {t('products.results')}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('products.search')}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full bg-white"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap hidden sm:block">{t('products.sortBy')}</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-700 cursor-pointer w-full sm:w-auto appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1em 1em'
                }}
              >
                <option value="default">{t('products.sortDefault')}</option>
                <option value="lowToHigh">{t('products.sortLowHigh')}</option>
                <option value="highToLow">{t('products.sortHighLow')}</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(n => (
              <div key={n} className="h-96 bg-slate-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-surface rounded-xl border border-red-100">
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('common.error')}</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> {t('common.retry')}
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('products.noFound')}</h3>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-2 text-primary font-bold hover:underline"
            >
              <RotateCcw className="w-4 h-4" /> {t('products.reset')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="bg-surface rounded-xl overflow-hidden shadow-ambient hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-50 flex flex-col select-none focus:outline-none group">
                <div className="h-56 overflow-hidden bg-slate-50 relative p-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6 flex flex-col flex-grow border-t border-slate-50">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{product.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(product.specs || []).slice(0, 2).map((spec, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border border-blue-100">{spec}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="price-lg">฿{product.price.toLocaleString()}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {product.stock > 0 ? t('product.inStock') : t('product.outOfStock')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
