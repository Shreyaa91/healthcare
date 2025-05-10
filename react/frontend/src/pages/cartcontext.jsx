import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };
  

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(p => p.id === item.id);
      if (existingItem) {
        return prev.map(p => p.id === item.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  const updateQuantity = (index, quantity) => {
    setCart(prevCart =>
      prevCart.map((item, i) =>
        i === index ? { ...item, quantity } : item
      )
    );
  };
  
  

  return (
    <CartContext.Provider value={{ cart, addToCart,updateQuantity,removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);