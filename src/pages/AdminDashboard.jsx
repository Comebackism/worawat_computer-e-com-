import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard, ShoppingBag, Users, Package, TrendingUp, Download,
  Plus, Edit, Trash2, X, AlertCircle, AlertTriangle, RotateCcw, QrCode, CreditCard,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';

const EMPTY_PRODUCT = {
  name: '', category: '', brand: '', price: '', stock: '',
  memory: '', description: '', image: '', specs: '',
};

const STATUS_STYLES = {
  Delivered: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-700',
  Pending: 'bg-orange-100 text-orange-700',
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Add/Edit Product State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);

  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', date: '', spent: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productList, orderList, customerList, statsData] = await Promise.all([
        api('/products'),
        api('/orders'),
        api('/customers'),
        api('/stats'),
      ]);
      setProducts(Array.isArray(productList) ? productList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
      setCustomers(Array.isArray(customerList) ? customerList : []);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll, reloadKey]);

  const runAction = async (action, fallbackMessage) => {
    setActionError('');
    setIsSubmitting(true);
    try {
      return await action();
    } catch (err) {
      setActionError(err.message || fallbackMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEditProduct = async (event) => {
    event.preventDefault();

    const payload = {
      name: newProduct.name,
      category: newProduct.category,
      brand: newProduct.brand,
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      memory: newProduct.memory,
      description: newProduct.description,
      image: newProduct.image,
      specs: String(newProduct.specs || '')
        .split(',')
        .map((spec) => spec.trim())
        .filter(Boolean),
    };

    const saved = await runAction(
      () => api(editingProduct ? `/products/${editingProduct.id}` : '/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: payload,
      }),
      t('admin.saveError'),
    );

    if (!saved) return;
    setProducts((prev) => (editingProduct
      ? prev.map((p) => (p.id === saved.id ? saved : p))
      : [saved, ...prev]));
    setIsModalOpen(false);
  };

  const openProductModal = (product = null) => {
    setActionError('');
    if (product) {
      setEditingProduct(product);
      setNewProduct({
        ...EMPTY_PRODUCT,
        ...product,
        price: product.price ?? '',
        stock: product.stock ?? '',
        specs: Array.isArray(product.specs) ? product.specs.join(', ') : '',
      });
    } else {
      setEditingProduct(null);
      setNewProduct(EMPTY_PRODUCT);
    }
    setIsModalOpen(true);
  };

  const handleEditOrder = async (event) => {
    event.preventDefault();
    const saved = await runAction(
      () => api(`/orders/${editingOrder.id}`, { method: 'PUT', body: { status: editingOrder.status } }),
      t('admin.saveError'),
    );
    if (!saved) return;
    setOrders((prev) => prev.map((o) => (o.id === saved.id ? saved : o)));
    setIsOrderModalOpen(false);
  };

  const openOrderModal = (order) => {
    setActionError('');
    setEditingOrder({ ...order });
    setIsOrderModalOpen(true);
  };

  const handleAddEditCustomer = async (event) => {
    event.preventDefault();
    const payload = {
      name: newCustomer.name,
      email: newCustomer.email,
      date: newCustomer.date,
      spent: Number(newCustomer.spent) || 0,
    };
    const saved = await runAction(
      () => api(editingCustomer ? `/customers/${editingCustomer.id}` : '/customers', {
        method: editingCustomer ? 'PUT' : 'POST',
        body: payload,
      }),
      t('admin.saveError'),
    );
    if (!saved) return;
    setCustomers((prev) => (editingCustomer
      ? prev.map((c) => (c.id === saved.id ? saved : c))
      : [saved, ...prev]));
    setIsCustomerModalOpen(false);
  };

  const openCustomerModal = (customer = null) => {
    setActionError('');
    if (customer) {
      setEditingCustomer(customer);
      setNewCustomer({ ...customer, spent: customer.spent ?? 0 });
    } else {
      setEditingCustomer(null);
      setNewCustomer({ name: '', email: '', date: new Date().toISOString().split('T')[0], spent: 0 });
    }
    setIsCustomerModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteProduct'))) return;
    const done = await runAction(() => api(`/products/${id}`, { method: 'DELETE' }), t('admin.saveError'));
    if (!done) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm(t('admin.confirmCancelOrder'))) return;
    const saved = await runAction(
      () => api(`/orders/${id}`, { method: 'PUT', body: { status: 'Cancelled' } }),
      t('admin.saveError'),
    );
    if (!saved) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? saved : o)));
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteCustomer'))) return;
    const done = await runAction(() => api(`/customers/${id}`, { method: 'DELETE' }), t('admin.saveError'));
    if (!done) return;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleExportReport = () => {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Payment', 'Total', 'Status'],
      ...orders.map((order) => [
        order.id,
        order.date,
        order.customerName || t('admin.guest'),
        order.customerEmail || '',
        order.paymentMethod === 'qr' ? 'PromptPay QR' : 'Credit Card',
        order.total,
        order.status,
      ]),
    ];

    const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', name: t('admin.overview'), icon: LayoutDashboard },
    { id: 'products', name: t('admin.products'), icon: Package },
    { id: 'orders', name: t('admin.orders'), icon: ShoppingBag },
    { id: 'customers', name: t('admin.customers'), icon: Users },
  ];

  const money = (value) => `฿${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  // Stats come from the API; the fallbacks keep the dashboard usable if it fails.
  const totals = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'Cancelled');
    return {
      totalSales: stats?.totalSales ?? active.reduce((sum, o) => sum + Number(o.total || 0), 0),
      totalOrders: stats?.totalOrders ?? orders.length,
      totalCustomers: stats?.totalCustomers ?? customers.length,
      activeProducts: stats?.activeProducts ?? products.length,
      lowStock: stats?.lowStock ?? products.filter((p) => Number(p.stock) <= 5).length,
      monthly: stats?.monthly ?? [],
    };
  }, [stats, orders, customers, products]);

  const lowStockProducts = products.filter((p) => Number(p.stock) <= 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-xl text-slate-500">
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="flex items-center gap-2 text-rose-600 font-bold text-lg">
          <AlertCircle className="w-6 h-6" /> {t('common.loadError')}
        </p>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-primary text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> {t('common.retry')}
        </button>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors';
  const emptyRow = (message) => (
    <tr>
      <td colSpan={6} className="px-6 py-14 text-center text-slate-500 font-medium">{message}</td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-8 px-2">{t('admin.title')}</h2>
        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors select-none focus:outline-none ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {lowStockProducts.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-1">
              <AlertTriangle className="w-4 h-4" /> {t('admin.lowStock')}
            </p>
            <p className="text-xs text-amber-700">
              {lowStockProducts.length} {t('admin.lowStockHint')}
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {tabs.find((tab) => tab.id === activeTab)?.name}
          </h1>
          {activeTab === 'overview' && (
            <button onClick={handleExportReport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm select-none focus:outline-none">
              <Download className="w-4 h-4" /> {t('admin.exportReport')}
            </button>
          )}
          {activeTab === 'products' && (
            <button onClick={() => openProductModal()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm select-none focus:outline-none">
              <Plus className="w-4 h-4" /> {t('admin.addProduct')}
            </button>
          )}
          {activeTab === 'customers' && (
            <button onClick={() => openCustomerModal()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm select-none focus:outline-none">
              <Plus className="w-4 h-4" /> {t('admin.addCustomer')}
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {actionError}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('admin.totalSales'), value: money(totals.totalSales), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
                { label: t('admin.totalOrders'), value: totals.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: t('admin.activeProducts'), value: totals.activeProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
                { label: t('admin.totalCustomers'), value: totals.totalCustomers, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={`${kpi.bg} ${kpi.color} p-4 rounded-xl`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
                      <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">{t('admin.salesChart')}</h3>
                <div className="h-80 w-full">
                  {totals.monthly.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                      {t('admin.noData')}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={totals.monthly}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val) => `฿${Math.round(val / 1000)}k`} />
                        <Tooltip
                          formatter={(value) => money(value)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">{t('admin.recentOrders')}</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-primary text-sm font-medium hover:underline select-none focus:outline-none">{t('admin.viewAll')}</button>
                </div>
                <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                  {orders.length === 0 && <p className="text-slate-500 text-sm">{t('admin.noOrders')}</p>}
                  {orders.slice(0, 4).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{order.id}</p>
                        <p className="text-xs text-slate-500 truncate">{order.customerName || t('admin.guest')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 text-sm">{money(order.total)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {t(`status.${String(order.status).toLowerCase()}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.productName')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.category')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.brand')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.price')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.stock')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.length === 0 && emptyRow(t('admin.noProducts'))}
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{product.brand}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{money(product.price)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {product.stock > 0 ? `${product.stock} ${t('admin.unitsInStock')}` : t('admin.outOfStock')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <button onClick={() => openProductModal(product)} className="text-slate-400 hover:text-primary transition-colors p-1" title={t('admin.edit')}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2" title={t('admin.delete')}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.id')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.date')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.customerName')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.payment')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.total')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.status')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 && emptyRow(t('admin.noOrders'))}
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <span className="block font-medium text-slate-800">{order.customerName || t('admin.guest')}</span>
                        {order.customerEmail && <span className="block text-xs text-slate-400">{order.customerEmail}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          {order.paymentMethod === 'qr' ? <QrCode className="w-4 h-4 text-primary" /> : <CreditCard className="w-4 h-4 text-slate-400" />}
                          {order.paymentMethod === 'qr' ? t('checkout.qrPromptPay') : t('checkout.creditCard')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{money(order.total)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {t(`status.${String(order.status).toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <button onClick={() => openOrderModal(order)} className="text-slate-400 hover:text-primary transition-colors p-1" title={t('admin.edit')}><Edit className="w-4 h-4" /></button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={order.status === 'Cancelled'}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={t('admin.cancelOrder')}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.customerName')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.email')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.date')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.spent')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 && emptyRow(t('admin.noCustomers'))}
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{customer.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{money(customer.spent)}</td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <button onClick={() => openCustomerModal(customer)} className="text-slate-400 hover:text-primary transition-colors p-1" title={t('admin.edit')}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCustomer(customer.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2" title={t('admin.delete')}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{editingProduct ? t('admin.editProduct') : t('admin.addProduct')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.productName')}</label>
                <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.category')}</label>
                  <input required type="text" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.brand')}</label>
                  <input required type="text" value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.memory')}</label>
                <input type="text" value={newProduct.memory} onChange={(e) => setNewProduct({ ...newProduct, memory: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.description')}</label>
                <textarea rows="2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className={`${inputClass} resize-none`}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.price')} (฿)</label>
                  <input required type="number" min="0" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.stock')}</label>
                  <input required type="number" min="0" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.specs')}</label>
                <input type="text" value={newProduct.specs} onChange={(e) => setNewProduct({ ...newProduct, specs: e.target.value })} className={inputClass} placeholder="24GB GDDR6X, 16384 CUDA Cores" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.imageUrl')}</label>
                <input type="text" placeholder="/images/gpu.png" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} className={inputClass} />
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                  {t('admin.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70">
                  {isSubmitting ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isOrderModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{t('admin.editOrder')}</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditOrder} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-3 font-mono">{editingOrder.id}</p>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.status')}</label>
                <select value={editingOrder.status} onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })} className={`${inputClass} bg-white`}>
                  <option value="Pending">{t('status.pending')}</option>
                  <option value="Processing">{t('status.processing')}</option>
                  <option value="Shipped">{t('status.shipped')}</option>
                  <option value="Delivered">{t('status.delivered')}</option>
                  <option value="Cancelled">{t('status.cancelled')}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                  {t('admin.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70">
                  {isSubmitting ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{editingCustomer ? t('admin.editCustomer') : t('admin.addCustomer')}</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEditCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.customerName')}</label>
                <input required type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.email')}</label>
                <input required type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.date')}</label>
                  <input required type="date" value={newCustomer.date} onChange={(e) => setNewCustomer({ ...newCustomer, date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.spent')} (฿)</label>
                  <input required type="number" min="0" value={newCustomer.spent} onChange={(e) => setNewCustomer({ ...newCustomer, spent: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                  {t('admin.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70">
                  {isSubmitting ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}