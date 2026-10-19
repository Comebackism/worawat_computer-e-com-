/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const storageKey = (email) => `worawat_computer_cart_${email || 'guest'}`;

function readCart(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, loading } = useAuth();
  const key = storageKey(user?.email);

  // The key and its items are stored together so the cart is never written
  // under a key it does not belong to (the session resolves a moment after the
  // first render, which used to briefly flash the guest basket).
  const [cart, setCart] = useState({ key: 'guest', items: [] });

  useEffect(() => {
    if (loading) return;
    setCart((prev) => (prev.key === key ? prev : { key, items: readCart(key) }));
  }, [key, loading]);

  useEffect(() => {
    if (loading || cart.key !== key) return;
    localStorage.setItem(cart.key, JSON.stringify(cart.items));
  }, [cart, key, loading]);

  const addToCart = (product, quantityToAdd = 1) => {
    const limit = Number.isFinite(product?.stock) ? product.stock : Infinity;
    setCart((prev) => {
      const existing = prev.items.find((item) => item.id === product.id);
      const items = existing
        ? prev.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantityToAdd, limit) }
              : item,
          )
        : [...prev.items, { ...product, quantity: Math.min(quantityToAdd, limit) }];
      return { ...prev, items };
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const limit = Number.isFinite(item.stock) ? item.stock : Infinity;
        return { ...item, quantity: Math.min(quantity, limit) };
      }),
    }));
  };

  const clearCart = () => setCart((prev) => ({ ...prev, items: [] }));

  const cartItems = cart.items;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, storageKey: key }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);