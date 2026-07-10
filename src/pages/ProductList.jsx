import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProductList() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState('default');

  const availableBrands = ['NVIDIA', 'AMD', 'Corsair', 'ASUS'];

  useEffect(() => {
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand) 
        : [...prev, brand]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setMaxPrice(100000);
    setSortBy('default');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesPrice = product.price <= maxPrice;
    
    return matchesSearch && matchesBrand && matchesPrice;
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
              max="100000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer" 
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 select-none">
              <span>฿0</span>
              <span>฿100,000</span>
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-700 mb-2">{t('products.noFound')}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="bg-surface rounded-xl overflow-hidden shadow-ambient hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-50 flex flex-col select-none focus:outline-none group">
                <div className="h-56 overflow-hidden bg-slate-50 relative p-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6 flex flex-col flex-grow border-t border-slate-50">
                  <h3 className="font-bold text-lg mb-2 text-slate-800 leading-tight">{product.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {product.specs.slice(0, 2).map((spec, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border border-blue-100">{spec}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="price-lg">฿{product.price.toLocaleString()}</span>
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
