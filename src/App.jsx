import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import CartCheckout from './pages/CartCheckout';
import OrderHistory from './pages/OrderHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import Builder from './pages/Builder';
import AdminDashboard from './pages/AdminDashboard';
import { ShoppingCart, Monitor, History, LogIn, User, LogOut, Globe, Menu, X, Hammer, Shield } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  
  const closeMenu = () => setIsMobileMenuOpen(false);
  
  return (
    <nav className="bg-surface shadow-ambient sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight select-none focus:outline-none">
          <Monitor className="w-6 h-6" />
          Worawat_computer
        </Link>
        <div className="flex gap-4 md:gap-6 items-center">
          <button onClick={toggleLanguage} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg select-none focus:outline-none hidden md:flex">
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'EN' : 'TH'}
          </button>
          
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/products" className="text-slate-600 hover:text-primary transition-colors font-medium select-none focus:outline-none">{t('nav.products')}</Link>
            <Link to="/builder" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium select-none focus:outline-none"><Hammer className="w-4 h-4" /> {t('nav.builder')}</Link>
            
            {user ? (
              <>
                <Link to="/orders" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium select-none focus:outline-none">
                  <History className="w-4 h-4" /> {t('nav.orders')}
                </Link>
                <Link to="/admin" className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium select-none focus:outline-none">
                  <Shield className="w-4 h-4" /> {t('admin.title')}
                </Link>
                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1 select-none"><User className="w-4 h-4 text-primary" /> {user.name}</span>
                  <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-bold select-none focus:outline-none">
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 select-none focus:outline-none">
                <LogIn className="w-4 h-4" /> {t('nav.login')}
              </Link>
            )}
          </div>

          <Link to="/cart" onClick={closeMenu} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 font-medium select-none focus:outline-none relative">
            <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 md:static bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
            )}
          </Link>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-slate-600 hover:text-primary focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-slate-100 px-6 py-4 flex flex-col gap-4 shadow-lg absolute w-full left-0">
          <button onClick={() => { toggleLanguage(); closeMenu(); }} className="text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-2 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-3 py-3 rounded-lg select-none focus:outline-none w-full">
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'Switch to Thai (TH)' : 'Switch to English (EN)'}
          </button>
          
          <Link to="/products" onClick={closeMenu} className="text-slate-600 hover:text-primary transition-colors font-medium select-none focus:outline-none py-2 border-b border-slate-50">{t('nav.products')}</Link>
          <Link to="/builder" onClick={closeMenu} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 font-medium select-none focus:outline-none py-2 border-b border-slate-50"><Hammer className="w-5 h-5" /> {t('nav.builder')}</Link>
          
          {user ? (
            <>
              <Link to="/orders" onClick={closeMenu} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 font-medium select-none focus:outline-none py-2 border-b border-slate-50">
                <History className="w-5 h-5" /> {t('nav.orders')}
              </Link>
              <Link to="/admin" onClick={closeMenu} className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 font-medium select-none focus:outline-none py-2 border-b border-slate-50">
                <Shield className="w-5 h-5" /> {t('admin.title')}
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2 select-none py-2"><User className="w-5 h-5 text-primary" /> {user.name}</span>
                <button onClick={() => { logout(); closeMenu(); }} className="text-left text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-bold select-none focus:outline-none py-2">
                  <LogOut className="w-5 h-5" /> {t('nav.logout')}
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu} className="bg-primary hover:bg-blue-700 text-white px-4 py-3 text-center rounded-lg font-bold transition-all flex items-center justify-center gap-2 select-none focus:outline-none mt-2">
              <LogIn className="w-5 h-5" /> {t('nav.login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-background font-sans text-slate-800 select-none focus:outline-none print:bg-white print:min-h-0">
              <Navbar />
            <main className="flex-grow w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <CartCheckout />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-center text-slate-500 print:hidden">
              <p>&copy; 2026 Worawat_computer. All rights reserved.</p>
            </footer>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
