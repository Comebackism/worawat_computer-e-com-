import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, LayoutGrid, Monitor, HardDrive, 
  Database, SquareTerminal, BatteryCharging, 
  Box, Wind, Fan, Mouse, Keyboard, Headphones,
  Gamepad, Code, CheckCircle2, ShoppingCart, Trash2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cpu', icon: Cpu, nameKey: 'cat.cpu', apiCategory: 'CPU' },
  { id: 'mobo', icon: LayoutGrid, nameKey: 'cat.mobo', apiCategory: 'Motherboard' },
  { id: 'gpu', icon: Monitor, nameKey: 'cat.gpu', apiCategory: 'GPU' },
  { id: 'ram', icon: Database, nameKey: 'cat.ram', apiCategory: 'RAM' },
  { id: 'hdd', icon: HardDrive, nameKey: 'cat.hdd', apiCategory: 'Storage' },
  { id: 'ssd', icon: HardDrive, nameKey: 'cat.ssd', apiCategory: 'Storage' },
  { id: 'm2', icon: SquareTerminal, nameKey: 'cat.m2', apiCategory: 'Storage' },
  { id: 'psu', icon: BatteryCharging, nameKey: 'cat.psu', apiCategory: 'Power Supply' },
  { id: 'case', icon: Box, nameKey: 'cat.case', apiCategory: 'Case' },
  { id: 'cooler', icon: Wind, nameKey: 'cat.cooler', apiCategory: 'Cooling' },
  { id: 'aircooler', icon: Fan, nameKey: 'cat.aircooler', apiCategory: 'Cooling' },
  { id: 'fan', icon: Fan, nameKey: 'cat.fan', apiCategory: 'Cooling' },
  { id: 'mouse', icon: Mouse, nameKey: 'cat.mouse', apiCategory: 'Peripherals' },
  { id: 'keyboard', icon: Keyboard, nameKey: 'cat.keyboard', apiCategory: 'Peripherals' },
  { id: 'monitor', icon: Monitor, nameKey: 'cat.monitor', apiCategory: 'Monitor' },
  { id: 'accessories', icon: Headphones, nameKey: 'cat.accessories', apiCategory: 'Peripherals' },
  { id: 'gear', icon: Gamepad, nameKey: 'cat.gear', apiCategory: 'Peripherals' },
  { id: 'software', icon: Code, nameKey: 'cat.software', apiCategory: 'Software' },
];

export default function Builder() {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [products, setProducts] = useState([]);
  const [buildParts, setBuildParts] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch products for the active category
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:4000/api/products')
      .then(res => res.json())
      .then(data => {
        // Filter by the generic category our API uses
        const filtered = data.filter(p => p.category === activeCategory.apiCategory);
        setProducts(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeCategory]);

  const handleSelectPart = (product) => {
    setBuildParts(prev => ({
      ...prev,
      [activeCategory.id]: product
    }));
  };

  const handleRemovePart = (categoryId) => {
    setBuildParts(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };

  const totalPrice = Object.values(buildParts).reduce((sum, item) => sum + (item?.price || 0), 0);

  const handleAddAllToCart = () => {
    const parts = Object.values(buildParts);
    if (parts.length === 0) return;
    
    parts.forEach(part => {
      addToCart(part);
    });
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-slate-900">{t('builder.title')}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar: Categories & Total */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-surface rounded-2xl shadow-ambient border border-slate-100 overflow-hidden lg:sticky lg:top-24 flex flex-col h-[70vh] lg:h-[80vh]">
            
            {/* Total Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center z-10 shadow-sm">
              <span className="font-bold text-slate-700">{t('builder.total')}</span>
              <span className="text-xl font-extrabold text-red-600">฿{totalPrice.toLocaleString()}</span>
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto flex-grow p-3 space-y-1 custom-scrollbar">
              {CATEGORIES.map(cat => {
                const isSelected = activeCategory.id === cat.id;
                const Icon = cat.icon;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all focus:outline-none select-none mb-1
                      ${isSelected ? 'bg-primary/5 border-l-4 border-primary text-primary font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-500'}`} />
                      <span className="text-sm text-left">{t(cat.nameKey)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add to Cart Footer */}
            <div className="p-4 border-t border-slate-100 bg-white z-10">
              <button 
                onClick={handleAddAllToCart}
                disabled={Object.keys(buildParts).length === 0}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none select-none
                  ${Object.keys(buildParts).length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                <ShoppingCart className="w-5 h-5" /> {t('builder.addCart')}
              </button>
            </div>
            
          </div>
        </aside>

{/* Preview Pane (visible on large screens) */}
<aside className="hidden lg:block w-64 flex-shrink-0">
  <div className="bg-surface rounded-2xl shadow-ambient border border-slate-100 p-4 h-full overflow-y-auto">
    <h2 className="font-semibold text-slate-800 mb-4">{t('builder.preview')}</h2>
    <div className="space-y-4">
      {Object.entries(buildParts).map(([catId, part]) => (
        <div key={catId} className="flex items-center gap-2">
          <img src={part.image} alt={part.name} className="w-12 h-12 object-cover rounded" />
          <span className="text-sm font-medium text-slate-700">{t(`cat.${catId}`)}</span>
        </div>
      ))}
      {Object.keys(buildParts).length === 0 && (
        <p className="text-slate-500 text-sm">{t('builder.noSelection')}</p>
      )}
    </div>
  </div>
</aside>

{/* Main Area: Product Selection */}
        {/* Main Area: Product Selection */}
        <div className="flex-grow">
          
          {/* Current Selection Banner */}
          <div className="bg-surface rounded-2xl shadow-ambient border border-slate-100 p-6 mb-8 flex items-center gap-6">
            <div className="p-4 bg-slate-100 rounded-xl text-primary">
               <activeCategory.icon className="w-8 h-8" />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-slate-800">{t(activeCategory.nameKey)}</h2>
              
              {buildParts[activeCategory.id] ? (
                <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <img src={buildParts[activeCategory.id].image} alt="part" className="w-12 h-12 object-cover rounded-md bg-white border border-slate-200" />
                    <div>
                      <p className="font-bold text-slate-800">{buildParts[activeCategory.id].name}</p>
                      <p className="text-primary font-bold">฿{buildParts[activeCategory.id].price.toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemovePart(activeCategory.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 mt-1">{t('builder.selectPrompt')}</p>
              )}
            </div>
          </div>

          {/* Product List for Active Category */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-700 mb-2">{t('products.noFound')}</h3>
              <p className="text-slate-500">{t('builder.addingSoon')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {
                const isSelected = buildParts[activeCategory.id]?.id === product.id;
                
                return (
                  <div key={product.id} className={`bg-white rounded-lg border transition-all flex flex-col ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                    
                    {/* Product Image */}
                    <div className="p-4 flex justify-center items-center h-48 bg-white rounded-t-lg">
                      <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    
                    {/* Details */}
                    <div className="p-4 flex flex-col flex-grow border-t border-slate-100">
                      <h3 className="font-medium text-xs text-slate-800 mb-4 line-clamp-2 uppercase tracking-wide min-h-[2rem]">
                        {product.name}
                      </h3>
                      
                      {/* Specs */}
                      <div className="space-y-1 mb-4 mt-auto">
                        {product.specs?.slice(0, 2).map((spec, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-2 text-[10px] sm:text-xs">
                            <span className="text-slate-400 whitespace-nowrap">{t('builder.spec')} {idx + 1}</span>
                            <span className="text-slate-700 font-semibold text-right truncate">{spec}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Price & Add Button */}
                      <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-slate-50">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        <button 
                          onClick={() => handleSelectPart(product)}
                          className={`w-8 h-8 shrink-0 rounded flex items-center justify-center transition-colors focus:outline-none ${isSelected ? 'bg-primary text-white border-primary' : 'border border-red-500 text-red-500 hover:bg-red-50'}`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-lg leading-none">+</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
