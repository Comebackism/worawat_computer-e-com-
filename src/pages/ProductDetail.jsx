import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Shield, Truck, ArrowLeft, Check, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';

export default function ProductDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api(`/products/${id}`)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setQuantity(1);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProduct(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-20 text-center font-bold text-xl">{t('product.loading')}</div>;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <p className="font-bold text-xl text-red-500 mb-6">{t('product.notFound')}</p>
      <Link to="/products" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
        <ArrowLeft className="w-4 h-4" /> {t('product.back')}
      </Link>
    </div>
  );

  const inStock = product.stock > 0;
  const atLimit = quantity >= product.stock;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link to="/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 font-medium transition-colors select-none focus:outline-none">
        <ArrowLeft className="w-4 h-4" /> {t('product.back')}
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Image Gallery */}
        <div className="bg-surface rounded-2xl p-8 shadow-ambient border border-slate-100 h-[500px] flex items-center justify-center">
          <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            <span className="text-sm font-bold text-primary tracking-wider uppercase mb-2 block">{product.brand}</span>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="price-lg text-4xl">฿{product.price.toLocaleString()}</span>
              <span
                className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                  inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {inStock ? `${product.stock} ${t('product.stockCount')}` : t('product.outOfStock')}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="font-semibold text-slate-700">{t('product.quantity')}:</span>
            <div className="flex items-center bg-slate-100 rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="p-2 text-slate-600 hover:text-primary transition-colors focus:outline-none disabled:opacity-40 disabled:hover:text-slate-600"
                aria-label={t('product.quantity')}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-12 text-center font-bold text-slate-800 select-none">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                disabled={!inStock || atLimit}
                className="p-2 text-slate-600 hover:text-primary transition-colors focus:outline-none disabled:opacity-40 disabled:hover:text-slate-600"
                aria-label={t('product.quantity')}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => {
                addToCart(product, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 3000);
              }}
              disabled={added || !inStock}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 select-none focus:outline-none ${
                !inStock ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : added ? 'bg-green-500 text-white cursor-default' : 'bg-primary hover:bg-blue-700 text-white'
              }`}
            >
              {added ? <><Check className="w-6 h-6" /> {t('product.addedToCart')}</> : <><ShoppingCart className="w-6 h-6" /> {t('product.addToCart')}</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">{t('product.warranty')}</div>
                <div className="text-xs text-slate-500">{t('product.distributor')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">{t('product.shipping')}</div>
                <div className="text-xs text-slate-500">{t('product.shippingTime')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-surface rounded-2xl shadow-ambient border border-slate-100 overflow-hidden mb-16">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h2 className="text-2xl font-bold">{t('product.techSpecs')}</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <th className="py-4 px-8 w-1/3 font-semibold text-slate-600 bg-slate-50/30">{t('product.category')}</th>
                <td className="py-4 px-8 tech-text text-slate-800">{product.category}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <th className="py-4 px-8 w-1/3 font-semibold text-slate-600 bg-slate-50/30">{t('product.brandLabel')}</th>
                <td className="py-4 px-8 tech-text text-slate-800">{product.brand}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <th className="py-4 px-8 w-1/3 font-semibold text-slate-600 bg-slate-50/30">{t('product.memoryLabel')}</th>
                <td className="py-4 px-8 tech-text text-slate-800">{product.memory || 'N/A'}</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <th className="py-4 px-8 w-1/3 font-semibold text-slate-600 bg-slate-50/30">{t('product.features')}</th>
                <td className="py-4 px-8 tech-text text-slate-800">
                  {(product.specs || []).length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {(product.specs || []).map((spec, i) => (
                        <li key={i}>{spec}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-500">{t('product.noSpecs')}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Cart Notification */}
      {added && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-[slideInUp_0.3s_ease-out]">
          <div className="bg-green-500 rounded-full p-2">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold">{t('product.addedToCart')}</p>
            <p className="text-slate-300 text-sm">{product.name} (x{quantity})</p>
          </div>
          <Link to="/cart" className="ml-4 bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
            {t('cart.title') || 'View Cart'}
          </Link>
        </div>
      )}
    </div>
  );
}
