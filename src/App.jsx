import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, Menu, X, ArrowUpRight, ShoppingBag, PenTool, CheckCircle, Send, CheckCircle2, ShoppingCart } from 'lucide-react';

const Image3DCard = () => {
  const groupRef = useRef();
  
  // Load the AI-generated texture
  const texture = useTexture(import.meta.env.BASE_URL + 'luxury_house_texture.png');
  texture.colorSpace = THREE.SRGBColorSpace;

  // Entry animation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += delta * 0.1;
      // Gentle rise up effect
      if (groupRef.current.position.y < 0) {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 1.5);
      }
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
            className="hidden md:block"
          >
            <a href="#contacto" className="glass-button px-6 py-2.5 rounded-full text-xs tracking-widest font-medium uppercase hover:bg-white hover:text-black transition-all duration-500 flex items-center gap-2">
              Iniciar Proyecto
              <ArrowUpRight size={14} />
            </a>
          </motion.div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu />
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
              <PresentationControls global config={{ mass: 2, tension: 500 }} snap={{ mass: 4, tension: 1500 }} rotation={[0, 0.3, 0]} polar={[-Math.PI / 3, Math.PI / 3]} azimuth={[-Math.PI / 1.4, Math.PI / 2]}>
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                  <Suspense fallback={null}>
                    <Image3DCard />
                  </Suspense>
                </Float>
              </PresentationControls>
              <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
              <Environment preset="city" />
            </Canvas>
          </div>
          
          {/* Static Image Layered on top with blend mode (Double Exposure Effect) */}
          <img 
            src="hero-bg.png" 
            alt="Premium Architecture" 
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay scale-105 transform hover:scale-100 transition-transform duration-[20s] ease-out z-10" 
          />
          
          {/* Dark Filter Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/70 to-[#050505] z-20 pointer-events-none"></div>
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

      {/* 3D Boutique Section */}
      <section id="boutique" className="py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-6">Boutique <span className="text-gradient-gold">Curation</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto font-light">Explora nuestra selección de materiales y coordinadores. Mueve el ratón para interactuar con el catálogo.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" style={{ perspective: 1000 }}>
            {[
              { title: "Materiales & Pinturas", type: "Tienda Online", img: "store-materials.png", action: "Comprar Materiales" },
              { title: "Mobiliario de Lujo", type: "Afiliados", img: "store-furniture.png", action: "Ver Colección" },
              { title: "Red de Artesanos", type: "Subcontratación", img: "store-craftsmen.png", action: "Agendar Proyecto" }
            ].map((item, idx) => (
              <TiltCard key={idx} className="h-[480px] w-full cursor-pointer group/card">
                <div className="glass-panel w-full h-full rounded-2xl overflow-hidden relative group border-white/10 shadow-2xl">
                  <img src={item.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-105" alt={item.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-6 group-hover/card:translate-y-0 transition-transform duration-300 flex flex-col h-full justify-end">
                    <span className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold mb-2 block">{item.type}</span>
                    <h3 className="text-3xl font-display font-medium text-white mb-6">{item.title}</h3>
                    
                    <button className="glass-button px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 transform translate-y-4 group-hover/card:translate-y-0">
                      {item.action}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
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
      <footer className="py-8 text-center text-white/30 text-sm border-t border-white/5">
        <p>© {new Date().getFullYear()} HomeSetup Luxembourg. Consultoría y Boutique Online.</p>
      </footer>
    </div>
  );
};

export default App;
