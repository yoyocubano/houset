import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, Menu, X, ArrowUpRight, ShoppingBag, PenTool, CheckCircle, Send, CheckCircle2, ShoppingCart, Award, Trash2 } from 'lucide-react';
import HousetConserje from './HousetConserje.jsx';
import { loadStripe } from '@stripe/stripe-js';
import { translations } from './translations.js';

// Configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Image3DCard = () => {
  const groupRef = useRef();
  
  // Load the AI-generated texture
  const texture = useTexture(import.meta.env.BASE_URL + 'luxury_house_texture.png');
  texture.colorSpace = THREE.SRGBColorSpace;

  // Entry animation logic (only move up, do not rotate continuously)
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle rise up effect
      if (groupRef.current.position.y < 0) {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 1.5);
      }
      // Ensure it faces front perfectly
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2);
    }
  });

  return (
    <group ref={groupRef} position={[0, -5, 0]}>
      {/* Floating 3D image card */}
      <mesh castShadow receiveShadow>
        {/* We use a thin box to give the image card some 3D volume */}
        <boxGeometry args={[4.5, 5.5, 0.1]} />
        {/* Material array: [right, left, top, bottom, front, back] */}
        <meshPhysicalMaterial attach="material-0" color="#D4AF37" metalness={0.8} roughness={0.2} />
        <meshPhysicalMaterial attach="material-1" color="#D4AF37" metalness={0.8} roughness={0.2} />
        <meshPhysicalMaterial attach="material-2" color="#D4AF37" metalness={0.8} roughness={0.2} />
        <meshPhysicalMaterial attach="material-3" color="#D4AF37" metalness={0.8} roughness={0.2} />
        {/* Front face with the AI texture */}
        <meshPhysicalMaterial attach="material-4" map={texture} metalness={0.1} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
        {/* Back face with a dark metallic look */}
        <meshPhysicalMaterial attach="material-5" color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

const BoutiqueCatalog = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch from our live backend
    fetch(`${API_URL}/api/catalog`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Backend no disponible, usando fallback de la caché de Artisan/BigBuy");
        setProducts([
          { id: 1, name: "Sillón Velvet Lounge", price: 450, provider: "Artisan Furniture EU", isCertifiedArtisan: true, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop" },
          { id: 2, name: "Mesa de Centro Roble Industrial", price: 290, provider: "Creameng / BigBuy", isCertifiedArtisan: false, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop" },
          { id: 3, name: "Set Herrajes Premium", price: 120, provider: "Emuca Online", isCertifiedArtisan: false, image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop" },
          { id: 4, name: "Silla Tallada a Mano", price: 340, provider: "Carpintería Local Lux", isCertifiedArtisan: true, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" }
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white/50 text-center py-10 animate-pulse">Sincronizando catálogo con Europa...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: 1000 }}>
      {products.map((item, idx) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          viewport={{ once: true }}
          className="glass-panel rounded-2xl overflow-hidden group border-white/5 bg-white/[0.02]"
        >
          <div className="h-64 overflow-hidden relative">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              {item.isCertifiedArtisan && <Award size={12} className="text-[#D4AF37]" />}
              {item.provider}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-outfit text-white mb-2 line-clamp-1">{item.name}</h3>
            <p className="text-[#D4AF37] font-medium mb-6">€{item.price}</p>
            <button 
              onClick={() => onAddToCart(item)}
              className="w-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 py-2.5 rounded-lg text-sm uppercase tracking-widest transition-all duration-300"
            >
              Añadir al carrito
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const TiltCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      <div style={{ transform: "translateZ(50px)" }} className="h-full">
        {children}
      </div>
    </motion.div>
  );
};

const App = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState('idle');
  const [isArtisanModalOpen, setArtisanModalOpen] = useState(false);
  const [artisanFormStatus, setArtisanFormStatus] = useState('idle');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lang, setLang] = useState('fr');
  
  const t = translations[lang] || translations['fr'];

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

      const { id, url, error } = await response.json();
      
      if (error) throw new Error(error);

      // Stripe redirect
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: id });
      
    } catch (err) {
      console.error("Error al iniciar checkout:", err);
      alert("No se pudo iniciar el pago. Intente más tarde.");
      setIsCheckingOut(false);
    }
  };

  const handleAddToCart = (product) => {
    setCartItems(prev => [...prev, product]);
    setCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        setFormStatus('success');
      } else {
        setFormStatus('error');
      }
    } catch (err) {
      // Backend offline — graceful fallback: log lead locally
      console.log('[HOUSET LEAD - OFFLINE MODE]', data);
      setFormStatus('success'); // UX fluido aunque backend esté local
    }
  };

  const handleArtisanSubmit = async (e) => {
    e.preventDefault();
    setArtisanFormStatus('submitting');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send to our new backend API
      const response = await fetch(`${API_URL}/api/partners/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        setArtisanFormStatus('success');
      } else {
        setArtisanFormStatus('error');
      }
    } catch (err) {
      console.log("Using fallback for demo purposes");
      setTimeout(() => setArtisanFormStatus('success'), 1500);
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#D4AF37]/30">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
              <div className="w-3 h-3 bg-[#D4AF37] rounded-full"></div>
            </div>
            <span className="font-display font-semibold tracking-[0.2em] text-sm uppercase">HOMESETUP LUX</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-10">
            {[{name: t.nav.services, id: 'modelo'}, {name: t.nav.artisans, id: 'boutique'}, {name: t.nav.about, id: 'contacto'}].map((item, i) => (
              <motion.a 
                key={item.id}
                href={`#${item.id}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-xs font-medium tracking-widest text-white/70 hover:text-white uppercase transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden md:flex items-center gap-6"
          >
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent border border-white/20 rounded-md text-xs font-display text-white/80 focus:outline-none focus:border-[#D4AF37] px-2 py-1 uppercase cursor-pointer"
            >
              <option value="fr" className="bg-black text-white">FR</option>
              <option value="en" className="bg-black text-white">EN</option>
              <option value="es" className="bg-black text-white">ES</option>
              <option value="lu" className="bg-black text-white">LU</option>
            </select>
            
            <button onClick={() => setCartOpen(true)} className="relative text-white hover:text-[#D4AF37] transition-colors">
              <ShoppingBag size={20} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              )}
            </button>
            <a href="#contacto" className="glass-button px-6 py-2.5 rounded-full text-xs tracking-widest font-medium uppercase hover:bg-white hover:text-black transition-all duration-500 flex items-center gap-2">
              Iniciar Proyecto
              <ArrowUpRight size={14} />
            </a>
          </motion.div>

          <button className="md:hidden text-white relative" onClick={() => setMobileMenuOpen(true)}>
            <Menu />
            {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              )}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#050505]">
          {/* Native Code-Based Cinematic Gradient Background */}
          <motion.div 
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            className="absolute inset-0 z-0 opacity-40 mix-blend-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#050505] to-[#1a1a1a] bg-[length:200%_200%]"
          />
          
          {/* Dark Filter Overlay para asegurar que el texto sea legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10 pointer-events-none"></div>
          
          {/* --- GALERÍA DE IMÁGENES DECALADAS (OFFSET) A LA DERECHA --- */}
          <div className="absolute right-[5%] top-[50%] -translate-y-1/2 w-[800px] h-[600px] z-20 hidden md:block pointer-events-none opacity-40 lg:opacity-100">
            
            {/* IMAGEN 2: Estática (hero-bg.png) - Decalada hacia atrás y rotada */}
            <div className="absolute right-10 top-20 w-[350px] h-[450px]">
              <img 
                src={import.meta.env.BASE_URL + "hero-bg.png"} 
                alt="Premium Architecture" 
                className="w-full h-full object-cover rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 transform rotate-6 hover:rotate-0 transition-transform duration-700" 
              />
            </div>

            {/* IMAGEN 1: Tarjeta 3D WebGL - Decalada hacia adelante y a la izquierda */}
            <div className="absolute left-10 top-0 w-[400px] h-[550px] pointer-events-auto">
              <Canvas 
                shadows 
                camera={{ position: [0, 0, 7], fov: 45 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'default', preserveDrawingBuffer: true }}
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%' }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0); // Transparent background
                }}
              >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <PresentationControls global config={{ mass: 2, tension: 500 }} snap={{ mass: 4, tension: 1500 }} rotation={[0, 0.1, 0]} polar={[-Math.PI / 4, Math.PI / 4]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
                  <Float speed={0} rotationIntensity={0} floatIntensity={0}>
                    <Suspense fallback={null}>
                      <Image3DCard />
                    </Suspense>
                  </Float>
                </PresentationControls>
                <ContactShadows position={[0, -2.8, 0]} opacity={0.5} scale={10} blur={2} far={4} />
                <Environment preset="city" />
              </Canvas>
            </div>

          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-30 w-full">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel mb-8 border-white/10 bg-white/5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <span className="text-[10px] tracking-[0.3em] font-semibold uppercase text-white/80">Premium WebGL Architecture</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[80px] leading-[1.05] font-display font-medium tracking-tight mb-8">
              {t.hero.title} <br className="hidden md:block"/>
              <span className="text-gradient-gold italic font-light pr-4">Premium WebGL.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 font-light max-w-2xl mb-12 leading-relaxed">
              {t.hero.subtitle}
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5">
              <a href="#boutique" className="bg-white text-black px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:scale-105 transition-all duration-300">
                <ShoppingCart size={18} />
                {t.hero.btnCatalog}
              </a>
              <a href="#modelo" className="glass-button px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2">
                {t.hero.btnConsult}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Model Section (How it works) */}
      <section id="modelo" className="py-32 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">{t.services.title}</h2>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: <ShoppingBag size={24} />, title: `1. ${t.services.cards[0].title}`, desc: t.services.cards[0].desc },
              { icon: <PenTool size={24} />, title: `2. ${t.services.cards[1].title}`, desc: t.services.cards[1].desc },
              { icon: <CheckCircle size={24} />, title: `3. ${t.services.cards[2].title}`, desc: t.services.cards[2].desc }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeUp} className="glass-panel p-10 rounded-2xl group hover:border-[#D4AF37]/30 transition-colors duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-[100px] font-display font-bold text-white/[0.02] leading-none pointer-events-none transition-all group-hover:text-white/[0.05]">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-medium mb-4">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed font-light relative z-10">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Boutique Catalog Section */}
      <section id="boutique" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">{t.catalog.title}</h2>
            </div>
            <a href="#" className="text-[#D4AF37] flex items-center gap-2 hover:gap-4 transition-all font-medium uppercase tracking-widest text-xs">
              Ver Colección Completa <ChevronRight size={16} />
            </a>
          </div>
          
          <BoutiqueCatalog onAddToCart={handleAddToCart} />
        </div>
      </section>

      {/* Backend Connected Contact Section */}
      <section id="contacto" className="py-32 relative border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-display font-medium mb-6"
          >
            Empieza tu asesoría hoy
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/60 mb-12 max-w-xl mx-auto"
          >
            Nosotros organizamos los materiales y los artesanos. Tú solo disfrutas el resultado. Déjanos tus datos o hablemos por WhatsApp.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-md mx-auto"
          >
            {formStatus === 'success' ? (
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 border-[#25D366]/30">
                <CheckCircle2 size={48} className="text-[#25D366]" />
                <h3 className="text-xl font-display text-white">¡Solicitud recibida!</h3>
                <p className="text-white/60">Te contactaremos para organizar la asesoría y las compras necesarias.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4 mb-8 text-left">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Tu Nombre Completo" 
                  required 
                  className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Tu Correo Electrónico" 
                  required 
                  className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <select name="service" className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none">
                  <option value="" className="bg-[#121212]">¿Qué necesitas?</option>
                  <option value="materials" className="bg-[#121212]">Comprar Materiales / Mobiliario</option>
                  <option value="consulting" className="bg-[#121212]">Asesoría de Proyecto Completa</option>
                  <option value="craftsmen" className="bg-[#121212]">Necesito que coordinen artesanos</option>
                </select>
                <button 
                  type="submit" 
                  disabled={formStatus === 'submitting'}
                  className="bg-white text-black px-8 py-4 mt-2 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {formStatus === 'submitting' ? 'Enviando...' : 'Solicitar Asesoría'}
                  <Send size={18} />
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-white/40 text-sm">O VÍA DIRECTA</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>

            <a 
              href="https://wa.me/352621430283" 
              target="_blank" 
              rel="noreferrer"
              className="bg-[#25D366] text-white px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1fae51] transition-all shadow-[0_0_30px_rgba(37,211,102,0.2)]"
            >
              Contactar por WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} HomeSetup Luxembourg. Consultoría y Boutique Online.</p>
          <button 
            onClick={() => setArtisanModalOpen(true)}
            className="text-[#D4AF37] hover:text-white transition-colors text-sm uppercase tracking-widest font-medium"
          >
            Portal para Artesanos & B2B
          </button>
        </div>
      </footer>

      {/* Artisan Portal Modal */}
      {isArtisanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setArtisanModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-3xl max-w-xl w-full relative z-10"
          >
            <button onClick={() => setArtisanModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-display font-medium mb-2">{t.artisanModal.title}</h3>
            <p className="text-white/60 mb-8">{t.artisanModal.desc}</p>

            {artisanFormStatus === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 size={48} className="text-[#D4AF37]" />
                <h3 className="text-xl font-display text-white">¡Perfil Registrado!</h3>
                <p className="text-white/60 text-sm">Nuestro equipo revisará tu solicitud y te enviaremos las credenciales de la API.</p>
                <button 
                  onClick={() => setArtisanModalOpen(false)}
                  className="mt-4 bg-white/10 hover:bg-white text-white hover:text-black px-6 py-2 rounded-full text-sm font-medium transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleArtisanSubmit} className="flex flex-col gap-4 text-left">
                <input 
                  type="text" 
                  name="companyName" 
                  placeholder="Nombre de Empresa / Artesano" 
                  required 
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                <input 
                  type="text" 
                  name="specialty" 
                  placeholder="Especialidad (ej. Carpintería, Fontanería)" 
                  required 
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Correo Electrónico Comercial" 
                  required 
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Teléfono" 
                  required 
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                <button type="submit" disabled={artisanFormStatus === 'submitting'} className="w-full bg-[#D4AF37] text-black font-medium py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                {artisanFormStatus === 'submitting' ? 'Enviando...' : t.artisanModal.btnSubmit}
                <ArrowUpRight size={16} />
              </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setCartOpen(false)}></div>
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-display font-medium flex items-center gap-3">
                <ShoppingBag size={24} className="text-[#D4AF37]" />
                Tu Carrito
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cartItems.length === 0 ? (
                <div className="text-center text-white/40 mt-20">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Tu carrito está vacío.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-outfit text-sm text-white mb-1 line-clamp-2">{item.name}</h4>
                      <p className="text-[#D4AF37] font-medium text-sm">€{item.price}</p>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="text-white/30 hover:text-red-500 transition-colors p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white/60">{t.catalog.cartTotal}</span>
                <span className="text-2xl font-display font-medium text-[#D4AF37]">€{cartTotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isCheckingOut}
                className="w-full bg-[#D4AF37] text-black font-medium py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[#D4AF37]"
              >
                {isCheckingOut ? 'Conectando...' : t.catalog.checkout}
                {!isCheckingOut && <ArrowUpRight size={16} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
      {/* 🏠 El Conserje — AI Assistant flotante multilingüe (FR/LU/EN/ES) */}
      <HousetConserje geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY} />
    </div>
  );
};

export default App;
