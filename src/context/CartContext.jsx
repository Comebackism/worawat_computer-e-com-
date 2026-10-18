/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const { user } = useAuth();
  const key = storageKey(user?.email);
  const [cartItems, setCartItems] = useState(() => readCart(key));
  const activeKey = useRef(key);

  // Carts are per account, so switching users swaps the basket instead of
  // leaking one shopper's items into another one's checkout.
  useEffect(() => {
    if (activeKey.current === key) return;
    activeKey.current = key;
    setCartItems(readCart(key));
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(cartItems));
  }, [key, cartItems]);

  const addToCart = (product, quantityToAdd = 1) => {
    const limit = Number.isFinite(product?.stock) ? product.stock : Infinity;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantityToAdd, limit) }
            : item,
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantityToAdd, limit) }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const limit = Number.isFinite(item.stock) ? item.stock : Infinity;
      return { ...item, quantity: Math.min(quantity, limit) };
    }));
  };

  const clearCart = () => setCartItems([]);

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
