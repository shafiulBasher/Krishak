import React, { createContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({
    items: [],
    deliveryPreferences: {},
    cartSummary: {
      subtotal: 0,
      platformFee: 0,
      estimatedDeliveryFee: 0,
      total: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from server
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response && response.data) {
        setCart(response.data);
      }
      setError(null);
    } catch (err) {
      // Silently fail if cart doesn't exist (user might not be logged in or cart not created yet)
      console.error('Cart fetch error (this is normal if not logged in):', err);
      setError(null); // Don't show error to user
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cart on mount only if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, [fetchCart]);

  // Add item to cart
  const addToCart = useCallback(async (productId, quantity) => {
    try {
      setLoading(true);
      const response = await api.post('/cart', { productId, quantity });
      setCart(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update cart item quantity
  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      setLoading(true);
      const response = await api.put(`/cart/${productId}`, { quantity });
      setCart(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      setLoading(true);
      const response = await api.delete(`/cart/${productId}`);
      setCart(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update delivery preferences
  const updateDeliveryPreferences = useCallback(async (preferences) => {
    try {
      setLoading(true);
      const response = await api.put('/cart/preferences/delivery', preferences);
      setCart(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.delete('/cart');
      setCart(response.data);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total items in cart
  const getCartItemCount = useCallback(() => {
    return cart && cart.items ? cart.items.length : 0;
  }, [cart]);

  // Get total quantity
  const getTotalQuantity = useCallback(() => {
    return cart && cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  }, [cart]);

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    updateDeliveryPreferences,
    clearCart,
    getCartItemCount,
    getTotalQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
