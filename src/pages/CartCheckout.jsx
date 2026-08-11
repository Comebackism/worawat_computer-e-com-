import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, QrCode, Trash2, ArrowRight, Plus, Minus, Truck, MapPin, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function CartCheckout() {
  const { t } = useLanguage();
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [shippingMode, setShippingMode] = useState('now');
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [paymentSlip, setPaymentSlip] = useState(null);
  const navigate = useNavigate();

  const shipping = 0; // Free shipping
  const tax = cartTotal * 0.07; // 7% VAT
  const total = cartTotal + shipping + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Validation for shipping details removed per user request

    if (paymentMethod === 'qr' && !paymentSlip) {
      alert("Please upload your payment slip.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const hasAddressData = formData.address || formData.city || formData.postalCode;
      const fullAddress = (shippingMode === 'now' && hasAddressData)
        ? `${formData.firstName} ${formData.lastName}, ${formData.address}, ${formData.city} ${formData.postalCode}`.replace(/^[\s,]+|[\s,]+$/g, '')
        : '';
      
      const form = new FormData();
      form.append('customer_id', user?.id || '');
      form.append('total', total);
      if (fullAddress) form.append('shipping_address', fullAddress);
      form.append('payment_method', paymentMethod);
      form.append('items', JSON.stringify(cartItems.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price }))));
      
      if (paymentSlip) {
        form.append('payment_slip', paymentSlip);
      }

      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        body: form
      });
      
      if (response.ok) {
        clearCart();
        navigate('/orders');
      } else {
        alert("Checkout failed. Please try again.");
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
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 flex items-center gap-2"><Truck className="w-6 h-6 text-primary"/> {t('checkout.orderItems')}</h2>
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-6 items-center">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-50 border border-slate-100" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-slate-500 font-medium">{t('checkout.qty')}:</span>
                      <div className="flex items-center bg-slate-100 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-slate-500 hover:text-primary transition-colors focus:outline-none">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-slate-500 hover:text-primary transition-colors focus:outline-none">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
            <div className="flex flex-wrap items-center justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> {t('checkout.shippingInfo')}</h2>
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setShippingMode('now')} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors focus:outline-none ${shippingMode === 'now' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('checkout.shippingModeNow')}
                </button>
                <button 
                  onClick={() => setShippingMode('later')} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors focus:outline-none ${shippingMode === 'later' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('checkout.shippingModeLater')}
                </button>
              </div>
            </div>

            {shippingMode === 'now' ? (
              <div className="grid grid-cols-2 gap-6 animate-fadeIn">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.firstName')}</label>
                  <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" placeholder="John" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.lastName')}</label>
                  <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" placeholder="Doe" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.address')}</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" placeholder="123 Hardware Street" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.city')}</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" placeholder="Bangkok" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.postalCode')}</label>
                  <input type="text" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" placeholder="10110" />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center animate-fadeIn flex flex-col items-center gap-3">
                <Clock className="w-10 h-10 text-amber-500 mb-2" />
                <p className="font-semibold text-amber-800 text-lg">{t('checkout.shippingModeLater')}</p>
                <p className="text-amber-700/80 text-sm">{t('checkout.shippingModeLaterDesc')}</p>
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              {t('checkout.paymentMethod')} - {t('checkout.qrPromptPay')}
            </h2>

            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
              <div className="mb-4 text-center">
                <img src={`https://promptpay.io/0828072613/${total}.png`} alt="QR Code PromptPay" className="w-56 h-auto mx-auto rounded-lg shadow-sm bg-white" />
                <p className="mt-4 font-bold text-lg text-slate-800">นาย วรวัฒน์ บุญเรือง</p>
                <p className="text-sm font-medium text-slate-500">PromptPay: 082 807 2613</p>
                <p className="mt-2 text-sm text-slate-500">Scan to pay: ฿{Number(Math.round(total)).toLocaleString()}</p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold text-slate-700">Upload Slip</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => setPaymentSlip(e.target.files[0])} />
              </label>
              {paymentSlip && <p className="mt-2 text-xs text-green-600 font-medium">{paymentSlip.name} selected</p>}
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-surface rounded-2xl shadow-ambient p-8 border border-slate-100 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.orderSummary')}</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.subtotal')}</span>
                <span>฿{Number(cartTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.shipping')}</span>
                <span className="text-green-600 font-bold">{t('checkout.free')}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('checkout.tax')}</span>
                <span>฿{Number(Math.round(tax)).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-slate-800">{t('checkout.total')}</span>
                <span className="text-3xl font-extrabold text-primary">฿{Number(Math.round(total)).toLocaleString()}</span>
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
