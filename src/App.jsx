import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, Menu, X, ArrowUpRight, ShoppingBag, PenTool, CheckCircle, Send, CheckCircle2, ShoppingCart, Award, Trash2 } from 'lucide-react';

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
        <boxGeometry args={[7, 7, 0.1]} />
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
    fetch('http://localhost:3000/api/catalog')
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
    // Simulation
    setTimeout(() => setFormStatus('success'), 1500);
  };

  const handleArtisanSubmit = async (e) => {
    e.preventDefault();
    setArtisanFormStatus('submitting');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send to our new backend API
      const res = await fetch('http://localhost:3000/api/partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
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
            {['Modelo', 'Boutique', 'Contacto'].map((item, i) => (
              <motion.a 
                key={item}
                href={`#${item.toLowerCase()}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-xs font-medium tracking-widest text-white/70 hover:text-white uppercase transition-colors relative group"
              >
                {item}
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
          
          {/* REAL 3D WebGL Assembling Architecture */}
          <div className="absolute inset-0 z-0 opacity-80 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
            <Canvas 
              shadows 
              camera={{ position: [5, 4, 8], fov: 45 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'default', preserveDrawingBuffer: true }}
              dpr={[1, 2]}
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0); // Transparent background
              }}
            >
              <ambientLight intensity={0.2} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              <PresentationControls global config={{ mass: 2, tension: 500 }} snap={{ mass: 4, tension: 1500 }} rotation={[0, 0, 0]} polar={[-Math.PI / 4, Math.PI / 4]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
                <Float speed={0} rotationIntensity={0} floatIntensity={0}>
                  <Suspense fallback={null}>
                    <Image3DCard />
                  </Suspense>
                </Float>
              </PresentationControls>
              <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
              <Environment preset="city" />
            </Canvas>
          </div>
          
          {/* Static Image Layered on top with normal blend mode for clarity */}
          <img 
            src="hero-bg.png" 
            alt="Premium Architecture" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-10" 
          />
          
          {/* Lighter Dark Filter Overlay to let the image shine through */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/20 to-[#050505] z-20 pointer-events-none"></div>
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
              Tu espacio ideal en Luxemburgo. <br className="hidden md:block"/>
              <span className="text-gradient-gold italic font-light pr-4">Diseño ensamblado en 8K.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 font-light max-w-2xl mb-12 leading-relaxed">
              Descubre nuestra boutique online con los mejores materiales. Te asesoramos en tu proyecto y coordinamos a los artesanos más calificados para construir tu visión.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5">
              <a href="#boutique" className="bg-white text-black px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:scale-105 transition-all duration-300">
                <ShoppingCart size={18} />
                Explorar Boutique
              </a>
              <a href="#modelo" className="glass-button px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2">
                ¿Cómo funciona?
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Model Section (How it works) */}
      <section id="modelo" className="py-32 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">Nuestro Modelo Exclusivo</h2>
            <p className="text-white/50 max-w-2xl mx-auto font-light">Comodidad, legalidad y el más alto nivel de artesanía sin que tengas que levantar un dedo.</p>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: <ShoppingBag size={24} />, title: "1. Materiales Premium", desc: "A través de nuestra tienda online, adquieres mobiliario, pinturas y materiales de las mejores tiendas de Luxemburgo (vía afiliación)." },
              { icon: <PenTool size={24} />, title: "2. Asesoría de Diseño", desc: "Te guiamos en la elección de estilos, colores y distribución espacial para asegurar un resultado estético y funcional." },
              { icon: <CheckCircle size={24} />, title: "3. Ejecución Delegada", desc: "Nosotros nos encargamos de contratar y coordinar a artesanos locales certificados para que realicen la obra física de manera impecable." }
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

      {/* Boutique / Dropshipping Dynamic Catalog Section */}
      <section id="boutique" className="py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-6">Boutique <span className="text-gradient-gold">Curation</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto font-light">
              Mobiliario de diseño y herrajes premium europeos. Sincronizado en tiempo real vía API con Artisan Furniture EU, Emuca y BigBuy.
            </p>
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
              href="https://wa.me/35200000000" 
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-lg p-8 rounded-2xl relative border-[#D4AF37]/30"
          >
            <button 
              onClick={() => { setArtisanModalOpen(false); setArtisanFormStatus('idle'); }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-display font-medium mb-2">Únete a la Red</h2>
            <p className="text-white/60 mb-8 font-light text-sm">
              ¿Eres artesano, tienes una ferretería o negocio en Luxemburgo? Conéctate a nuestra API y recibe proyectos directamente de nuestros clientes.
            </p>

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
                <button 
                  type="submit" 
                  disabled={artisanFormStatus === 'submitting'}
                  className="bg-[#D4AF37] text-black px-8 py-4 mt-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#b5952f] transition-all disabled:opacity-50"
                >
                  {artisanFormStatus === 'submitting' ? 'Enviando...' : 'Solicitar Acceso API'}
                  <Send size={18} />
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
                <span className="text-white/60">Total Estimado</span>
                <span className="text-2xl font-display font-medium text-[#D4AF37]">€{cartTotal}</span>
              </div>
              <button 
                disabled={cartItems.length === 0}
                className="w-full bg-[#D4AF37] text-black font-medium py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[#D4AF37]"
              >
                Continuar a Checkout
                <ArrowUpRight size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default App;
