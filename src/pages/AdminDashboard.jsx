import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, ShoppingBag, Users, Package, TrendingUp, Download, Plus, Edit, Trash2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockSalesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 },
  { name: 'May', sales: 6000 },
  { name: 'Jun', sales: 8000 },
];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', brand: '', price: '', stock: '', description: '', image: '' });
  
  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', date: '', spent: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          fetch('http://localhost:4000/api/products'),
          fetch('http://localhost:4000/api/orders'),
          fetch('http://localhost:4000/api/customers')
        ]);
        
        if (productsRes.ok) setProducts(await productsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (customersRes.ok) setCustomers(await customersRes.json());
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddEditProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingProduct ? `http://localhost:4000/api/products/${editingProduct.id}` : 'http://localhost:4000/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      
      if (res.ok) {
        const savedProduct = await res.json();
        if (editingProduct) {
          setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
        } else {
          setProducts([savedProduct, ...products]);
        }
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct(product);
    } else {
      setEditingProduct(null);
      setNewProduct({ name: '', category: '', brand: '', price: '', stock: '', description: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const handleEditOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editingOrder.status })
      });
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders(orders.map(o => o.id === savedOrder.id ? savedOrder : o));
        setIsOrderModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrderModal = (order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleAddEditCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCustomer ? `http://localhost:4000/api/customers/${editingCustomer.id}` : 'http://localhost:4000/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      
      if (res.ok) {
        const savedCustomer = await res.json();
        if (editingCustomer) {
          setCustomers(customers.map(c => c.id === savedCustomer.id ? savedCustomer : c));
        } else {
          setCustomers([savedCustomer, ...customers]);
        }
        setIsCustomerModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCustomerModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setNewCustomer(customer);
    } else {
      setEditingCustomer(null);
      setNewCustomer({ name: '', email: '', date: new Date().toISOString().split('T')[0], spent: 0 });
    }
    setIsCustomerModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/orders/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders(orders.map(o => o.id === id ? savedOrder : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Order ID,Date,Customer,Total,Status\n";

    orders.forEach(order => {
      const row = [
        order.id,
        order.date,
        order.customer || t('admin.guest'),
        order.total,
        order.status
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'overview', name: t('admin.overview'), icon: LayoutDashboard },
    { id: 'products', name: t('admin.products'), icon: Package },
    { id: 'orders', name: t('admin.orders'), icon: ShoppingBag },
    { id: 'customers', name: t('admin.customers'), icon: Users },
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-xl text-slate-500">Loading Dashboard...</div>;
  }

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

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
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {tabs.find(t => t.id === activeTab)?.name}
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

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('admin.totalSales'), value: `฿${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
                { label: t('admin.totalOrders'), value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: t('admin.activeProducts'), value: products.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
                { label: t('admin.totalCustomers'), value: customers.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
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
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSalesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} tickFormatter={(val) => `฿${val}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">{t('admin.recentOrders')}</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-primary text-sm font-medium hover:underline select-none focus:outline-none">{t('admin.viewAll')}</button>
                </div>
                <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                  {orders.slice(0, 4).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{order.id}</p>
                        <p className="text-xs text-slate-500">{order.customer || t('admin.guest')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-sm">฿{order.total.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {t(`status.${order.status.toLowerCase()}`)}
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
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.price')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('admin.stock')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">฿{product.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
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
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.total')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">{t('orders.status')}</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{order.customer || t('admin.guest')}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">฿{order.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {t(`status.${order.status.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button onClick={() => openOrderModal(order)} className="text-slate-400 hover:text-primary transition-colors p-1" title={t('admin.edit')}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleCancelOrder(order.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2" title={t('admin.cancelOrder')}><X className="w-5 h-5" /></button>
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
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{customer.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">฿{customer.spent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{editingProduct ? t('admin.editProduct') : t('admin.addProduct')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.productName')}</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.category')}</label>
                  <input required type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <input required type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows="2" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.price')} (฿)</label>
                  <input required type="number" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.stock')}</label>
                  <input required type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.imageUrl')}</label>
                <input type="text" placeholder="https://..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                  {t('admin.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? <span className="animate-pulse">...</span> : <>{t('admin.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isOrderModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{t('admin.editOrder')}</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.status')}</label>
                <select value={editingOrder.status} onChange={e => setEditingOrder({...editingOrder, status: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white">
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
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? <span className="animate-pulse">...</span> : <>{t('admin.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{editingCustomer ? t('admin.editCustomer') : t('admin.addCustomer')}</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEditCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.customerName')}</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.email')}</label>
                <input required type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.date')}</label>
                  <input required type="date" value={newCustomer.date} onChange={e => setNewCustomer({...newCustomer, date: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.spent')} (฿)</label>
                  <input required type="number" min="0" value={newCustomer.spent} onChange={e => setNewCustomer({...newCustomer, spent: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                  {t('admin.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? <span className="animate-pulse">...</span> : <>{t('admin.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
