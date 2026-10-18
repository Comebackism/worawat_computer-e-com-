import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, QrCode, Trash2, ArrowRight, Plus, Minus, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { createPaymentReference, PROMPTPAY, formatPromptPayPhone } from '../lib/promptpay';
import PromptPayQR from '../components/PromptPayQR';

const TAX_RATE = 0.07;
const round2 = (n) => Math.round(n * 100) / 100;

export default function CartCheckout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formError, setFormError] = useState(false);
  const [paymentRef, setPaymentRef] = useState(createPaymentReference);

  const [form, setForm] = useState(() => {
    const [firstName = '', ...rest] = String(user?.name || '').trim().split(' ');
    return {
      firstName,
      lastName: rest.join(' '),
      address: '',
      city: '',
      postalCode: '',
    };
  });

  // Mirrors the server's rounding so the QR amount, the summary and the stored
  // order total always agree to the satang.
  const shipping = 0;
  const tax = round2(cartTotal * TAX_RATE);
  const total = round2(cartTotal + shipping + tax);

  const shippingComplete = useMemo(
    () => Boolean(form.firstName.trim() && form.lastName.trim() && form.address.trim() && form.city.trim() && form.postalCode.trim()),
    [form],
  );

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(false);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    if (!shippingComplete) {
      setFormError(true);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: user?.email || '',
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          paymentMethod,
          paymentRef: paymentMethod === 'qr' ? paymentRef : '',
          paymentStatus: 'paid',
          total,
          items: cartItems.map((item) => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });

      clearCart();
      navigate(`/orders?placed=${order.id}`);
    } catch (error) {
      setServerError(error.message || t('checkout.serverError'));
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

  const inputClass = 'w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

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
          <section className={`bg-surface rounded-2xl shadow-ambient p-8 border ${formError ? 'border-rose-300' : 'border-slate-100'}`}>
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100">{t('checkout.shippingInfo')}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.firstName')}</label>
                <input type="text" value={form.firstName} onChange={setField('firstName')} className={inputClass} placeholder="John" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.lastName')}</label>
                <input type="text" value={form.lastName} onChange={setField('lastName')} className={inputClass} placeholder="Doe" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.address')}</label>
                <input type="text" value={form.address} onChange={setField('address')} className={inputClass} placeholder="123 Hardware Street" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.city')}</label>
                <input type="text" value={form.city} onChange={setField('city')} className={inputClass} placeholder="Bangkok" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.postalCode')}</label>
                <input type="text" value={form.postalCode} onChange={setField('postalCode')} className={inputClass} placeholder="10110" />
              </div>
            </div>
            {formError && (
              <p className="mt-5 flex items-center gap-2 text-sm font-bold text-rose-600">
                <AlertCircle className="w-4 h-4" /> {t('checkout.fillingRequired')}
              </p>
            )}
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
                  <input type="text" className={`${inputClass} font-mono`} placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.expiryDate')}</label>
                    <input type="text" className={`${inputClass} font-mono`} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t('checkout.cvc')}</label>
                    <input type="text" className={`${inputClass} font-mono`} placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <>
                <PromptPayQR
                  amount={total}
                  reference={paymentRef}
                  onRefresh={() => setPaymentRef(createPaymentReference())}
                />
                <p className="mt-4 text-sm text-slate-500">
                  {t('checkout.payTo')}: <span className="font-bold text-slate-700">{PROMPTPAY.displayName}</span>{' '}
                  <span className="font-mono">{formatPromptPayPhone()}</span>
                </p>
              </>
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
                <span>฿{tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-slate-800">{t('checkout.total')}</span>
                <span className="text-3xl font-extrabold text-primary">฿{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {serverError && (
              <p className="mb-4 flex items-start gap-2 text-sm font-bold text-rose-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {serverError}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 select-none focus:outline-none ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-primary hover:bg-blue-700 text-white'}`}
            >
              {isSubmitting ? t('checkout.processing') : paymentMethod === 'qr' ? t('checkout.confirmPaid') : t('checkout.confirmPayment')}
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