import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Shield, Truck, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-20 text-center font-bold text-xl">{t('product.loading')}</div>;
  if (!product) return <div className="max-w-7xl mx-auto px-6 py-20 text-center font-bold text-xl text-red-500">{t('product.notFound')}</div>;

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
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
              <span className="text-slate-500 text-sm font-medium">(24 {t('product.reviews')})</span>
            </div>
            <div className="price-lg text-4xl mb-6">฿{product.price.toLocaleString()}</div>
            <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => {
                addToCart(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              disabled={added}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 select-none focus:outline-none ${added ? 'bg-green-500 text-white cursor-default' : 'bg-primary hover:bg-blue-700 text-white'}`}
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
                  <ul className="list-disc list-inside space-y-1">
                    {product.specs.map((spec, i) => (
                      <li key={i}>{spec}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
