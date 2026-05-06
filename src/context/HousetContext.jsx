import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations.js';
import { loadStripe } from '@stripe/stripe-js';

const HousetContext = createContext();

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const HousetProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const t = translations[lang] || translations['fr'];

  // 🛒 Lógica de Carrito
  const addToCart = (product) => {
    setCartItems(prev => [...prev, product]);
    setCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  // 💳 Checkout Seguro
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          originUrl: window.location.origin + window.location.pathname
        })
      });

      const { id, error } = await response.json();
      if (error) throw new Error(error);

      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (err) {
      console.error("Error al iniciar checkout:", err);
      alert("No se pudo iniciar el pago.");
      setIsCheckingOut(false);
    }
  };

  // 📜 Scroll Monitor
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [qweenOffers, setQweenOffers] = useState([
    { id: 'q1', name: "Analyse d'Intérieur IA Qween", type: "Gratuit", icon: "✨" },
    { id: 'q2', name: "Consultation Style Luxembourg", type: "Gratuit", icon: "👑" }
  ]);

  const claimQweenOffer = (id) => {
    console.log(`💎 Oferta Qween Reclamada: ${id}`);
    alert("¡Felicidades! Has activado un beneficio Qween Gratuito.");
  };

  const value = {
    lang, setLang,
    t,
    cartItems, addToCart, removeFromCart, cartTotal,
    isCartOpen, setCartOpen,
    isCheckingOut, handleCheckout,
    isScrolled,
    qweenOffers, claimQweenOffer,
    API_URL
  };

  return <HousetContext.Provider value={value}>{children}</HousetContext.Provider>;
};

export const useHouset = () => useContext(HousetContext);
