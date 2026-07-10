import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, QrCode, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function CartCheckout() {
  const { t } = useLanguage();
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const shipping = 0; // Free shipping
  const tax = cartTotal * 0.07; // 7% VAT
  const total = cartTotal + shipping + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: total,
          items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
        })
      });
      
      if (response.ok) {
        clearCart();
        navigate('/orders');
      }
    } catch (err) {
      console.error('Checkout failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center select-none">
        <h1 className="text-3xl font-extrabold mb-6">{t('cart.empty')}</h1>
        <button onClick={() => navigate('/products')} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2 select-none focus:outline-none">
          {t('cart.startShopping')} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold mb-10">{t('checkout.title')}</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Column: Cart & Shipping */}
        <div className="flex-grow space-y-8">
          
          {/* Cart Items */}
          <section className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.orderItems')}</h2>
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-6 items-center">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-50 border border-slate-100" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <div className="text-slate-500 font-medium">{t('checkout.qty')}: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="price-lg text-xl mb-1">฿{(item.price * item.quantity).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600 text-sm flex items-center justify-end gap-1 font-medium transition-colors ml-auto select-none focus:outline-none">
                      <Trash2 className="w-4 h-4" /> {t('checkout.remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping Form */}
          <section className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.shippingInfo')}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.firstName')}</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="John" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.lastName')}</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Doe" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.address')}</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="123 Hardware Street" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.city')}</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Bangkok" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.postalCode')}</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="10110" />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.paymentMethod')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none focus:outline-none ${paymentMethod === 'credit' ? 'border-primary bg-blue-50/50 text-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                <CreditCard className="w-8 h-8" />
                <span className="font-bold">{t('checkout.creditCard')}</span>
              </label>
              <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none focus:outline-none ${paymentMethod === 'qr' ? 'border-primary bg-blue-50/50 text-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} />
                <QrCode className="w-8 h-8" />
                <span className="font-bold">{t('checkout.qrPromptPay')}</span>
              </label>
            </div>

            {paymentMethod === 'credit' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.cardNumber')}</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.expiryDate')}</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.cvc')}</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono" placeholder="123" />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.orderSummary')}</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.subtotal')}</span>
                <span>฿{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.shipping')}</span>
                <span className="text-green-600 font-bold">{t('checkout.free')}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.tax')}</span>
                <span>฿{Math.round(tax).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-slate-800">{t('checkout.total')}</span>
                <span className="text-3xl font-extrabold text-primary">฿{Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 select-none focus:outline-none ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white'}`}
            >
              {isSubmitting ? t('checkout.processing') : t('checkout.confirmPayment')}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              {t('checkout.terms')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
