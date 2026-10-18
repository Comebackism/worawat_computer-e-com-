import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Printer, X, Monitor, AlertCircle, RotateCcw, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api, withQuery } from '../lib/api';
import { PROMPTPAY, formatPromptPayPhone } from '../lib/promptpay';

export default function OrderHistory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const placedId = searchParams.get('placed');
  const invoiceId = searchParams.get('invoice');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api(withQuery('/orders', { email: user?.email }))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        // Deep-linked invoice (used right after checkout) opens itself.
        if (invoiceId) setSelectedInvoice(list.find((o) => o.id === invoiceId) || null);
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
  }, [user?.email, invoiceId, reloadKey]);

  const openInvoice = (order) => {
    setSelectedInvoice(order);
    setSearchParams({ invoice: order.id }, { replace: true });
  };

  const closeInvoice = () => {
    setSelectedInvoice(null);
    setSearchParams(placedId ? { placed: placedId } : {}, { replace: true });
  };

  const money = (value) => `฿${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative print:p-0 print:m-0">
      <div className={`flex items-center gap-4 mb-10 ${selectedInvoice ? 'print:hidden' : ''}`}>
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t('orders.title')}</h1>
          {user?.email && (
            <p className="text-slate-500 text-sm mt-1">
              {t('orders.showingFor')} <span className="font-semibold text-slate-700">{user.email}</span>
            </p>
          )}
        </div>
      </div>

      {placedId && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-grow">
            <p className="font-bold text-emerald-800">{t('orders.placed')}</p>
            <p className="text-sm text-emerald-700 font-mono mt-0.5">{placedId}</p>
          </div>
          <button
            onClick={() => setSearchParams({}, { replace: true })}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-bold shrink-0"
          >
            {t('orders.dismiss')}
          </button>
        </div>
      )}

      {loading && (
        <div className={`space-y-6 ${selectedInvoice ? 'print:hidden' : ''}`}>
          {[1, 2].map((n) => (
            <div key={n} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={`bg-white border border-rose-100 rounded-2xl p-12 text-center shadow-sm ${selectedInvoice ? 'print:hidden' : ''}`}>
          <p className="text-rose-600 font-semibold mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" /> {t('common.loadError')}
          </p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-primary text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {t('common.retry')}
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className={`bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm ${selectedInvoice ? 'print:hidden' : ''}`}>
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">{t('orders.empty')}</h2>
          <p className="text-slate-500 mb-8">{t('orders.emptyHint')}</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            {t('cart.startShopping')}
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className={`space-y-6 ${selectedInvoice ? 'print:hidden' : ''}`}>
          {orders.map((order) => (
            <div key={order.id} className="bg-surface rounded-2xl shadow-ambient border border-slate-100 overflow-hidden">
              {/* Order Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-wrap gap-6 items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('orders.id')}</div>
                  <div className="font-mono font-bold text-slate-900">{order.id}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('orders.date')}</div>
                  <div className="font-medium text-slate-800">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('orders.payment')}</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    {order.paymentMethod === 'qr' ? <QrCode className="w-4 h-4 text-primary" /> : <CreditCard className="w-4 h-4 text-slate-500" />}
                    {order.paymentMethod === 'qr' ? t('checkout.qrPromptPay') : t('checkout.creditCard')}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('orders.total')}</div>
                  <div className="font-bold text-primary text-lg">{money(order.total)}</div>
                </div>
                <div className="ml-auto">
                  {order.status === 'Delivered' ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-200">
                      <CheckCircle className="w-4 h-4" /> {t('status.delivered')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-200">
                      <Clock className="w-4 h-4" /> {t(`status.${String(order.status).toLowerCase()}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-slate-500 border-b border-slate-100">
                      <th className="pb-3 font-semibold">{t('orders.item')}</th>
                      <th className="pb-3 font-semibold text-center w-24">{t('orders.qty')}</th>
                      <th className="pb-3 font-semibold text-right w-32">{t('orders.price')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 font-semibold text-slate-800 group-hover:text-primary transition-colors">{item.name}</td>
                        <td className="py-4 text-center font-medium text-slate-600">{item.quantity}</td>
                        <td className="py-4 text-right font-medium text-slate-600">{money(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => openInvoice(order)}
                    className="text-primary font-bold text-sm hover:underline flex items-center gap-1 select-none focus:outline-none"
                  >
                    {t('orders.invoice')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 print:static print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto custom-scrollbar flex flex-col print:rounded-none print:shadow-none print:max-w-none print:w-full print:h-auto print:overflow-visible">

            {/* Modal Actions (Hidden when printing) */}
            <div className="flex items-center justify-end gap-4 p-4 border-b border-slate-100 print:hidden bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
              >
                <Printer className="w-4 h-4" /> {t('invoice.print')}
              </button>
              <button
                onClick={closeInvoice}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                title={t('invoice.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Invoice Area */}
            <div className="p-8 sm:p-12 print:p-0 text-slate-800 flex-grow print:flex-grow-0 print:bg-white">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 border-b border-slate-200 pb-8">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight mb-2">
                    <Monitor className="w-8 h-8" />
                    Worawat_computer
                  </div>
                  <p className="text-slate-500 text-sm">123 Hardware Street, Tech City</p>
                  <p className="text-slate-500 text-sm">contact@worawatcomputer.com</p>
                  <p className="text-slate-500 text-sm">+66 2 123 4567</p>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-4xl font-black text-slate-200 tracking-widest mb-2">{t('invoice.title')}</h2>
                  <p className="text-slate-600 font-bold mb-1"><span className="text-slate-400 font-medium mr-2">{t('orders.id')}:</span> {selectedInvoice.id}</p>
                  <p className="text-slate-600 font-bold"><span className="text-slate-400 font-medium mr-2">{t('orders.date')}:</span> {new Date(selectedInvoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-12 grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t('invoice.billTo')}</h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <p className="font-bold text-lg mb-1">{selectedInvoice.customerName || t('admin.guest')}</p>
                    <p className="text-slate-600">{selectedInvoice.address || '—'}</p>
                    <p className="text-slate-600">{[selectedInvoice.city, selectedInvoice.postalCode].filter(Boolean).join(', ') || '—'}</p>
                    {selectedInvoice.customerEmail && <p className="text-slate-600 mt-1">{selectedInvoice.customerEmail}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t('invoice.paymentMethod')}</h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <p className="font-bold text-lg mb-1 flex items-center gap-2">
                      {selectedInvoice.paymentMethod === 'qr' ? <QrCode className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-slate-500" />}
                      {selectedInvoice.paymentMethod === 'qr' ? t('invoice.qr') : t('invoice.credit')}
                    </p>
                    {selectedInvoice.paymentMethod === 'qr' && (
                      <>
                        <p className="text-slate-600">{PROMPTPAY.displayName} · {formatPromptPayPhone()}</p>
                        {selectedInvoice.paymentRef && (
                          <p className="text-slate-500 text-sm font-mono mt-1">{t('checkout.reference')}: {selectedInvoice.paymentRef}</p>
                        )}
                      </>
                    )}
                    <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${selectedInvoice.paymentStatus === 'unpaid' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedInvoice.paymentStatus === 'unpaid' ? t('orders.unpaid') : t('orders.paid')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 text-sm">
                    <th className="pb-4 font-bold">{t('orders.item')}</th>
                    <th className="pb-4 font-bold text-center w-24">{t('orders.qty')}</th>
                    <th className="pb-4 font-bold text-right w-32">{t('orders.price')}</th>
                    <th className="pb-4 font-bold text-right w-32">{t('orders.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-4 text-center font-medium text-slate-600">{item.quantity}</td>
                      <td className="py-4 text-right font-medium text-slate-600">{money(item.price)}</td>
                      <td className="py-4 text-right font-bold text-slate-800">{money(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end pt-6">
                <div className="w-full sm:w-80 space-y-3">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>{t('invoice.subtotal')}</span>
                    <span>{money(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>{t('invoice.tax')}</span>
                    <span>{money(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between items-end border-t-2 border-slate-200 pt-4 mt-4">
                    <span className="text-lg font-bold text-slate-800">{t('orders.total')}</span>
                    <span className="text-3xl font-black text-primary">{money(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
                <p>{t('invoice.thankYou')}</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}