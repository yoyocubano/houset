import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronRight, Menu, X, ArrowUpRight, Shield, Globe, Compass, Send, CheckCircle2 } from 'lucide-react';

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
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      // Backend connection to our Node.js server (see backend/server.js)
      // Fallback to Formspree for GitHub Pages static hosting
      const response = await fetch('https://formspree.io/f/placeholder', {
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
      console.error(err);
      setFormStatus('error');
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
            <span className="font-display font-semibold tracking-[0.2em] text-sm uppercase">HOMESETUP</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Servicios', 'Portfolio 3D', 'Contacto'].map((item, i) => (
              <motion.a 
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
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
              Empezar
              <ArrowUpRight size={14} />
            </a>
          </motion.div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-[#050505] p-6 flex flex-col"
          >
            <div className="flex justify-end">
              <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2">
                <X size={28} />
              </button>
            </div>
            <div className="flex flex-col gap-8 mt-20 px-6">
              {['Servicios', 'Portfolio 3D', 'Contacto'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)} className="text-4xl font-display font-light text-white/80 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="hero-bg.png" 
            alt="Premium Architecture" 
            className="w-full h-full object-cover opacity-50 scale-105 transform hover:scale-100 transition-transform duration-[20s] ease-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/40 to-[#050505] z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)] z-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-20 w-full">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel mb-8 border-white/10 bg-white/5">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <span className="text-[10px] tracking-[0.3em] font-semibold uppercase text-white/80">Discreet Estate Management</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[80px] leading-[1.05] font-display font-medium tracking-tight mb-8">
              Instala tu hogar en Luxemburgo <br className="hidden md:block"/>
              <span className="text-gradient-gold italic font-light pr-4">sin estrés</span>.
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 font-light max-w-2xl mb-12 leading-relaxed">
              Coordinamos profesionales, te asesoramos y te recomendamos los mejores productos para que no pierdas tiempo. Exclusividad y control total.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5">
              <a href="#contacto" className="bg-white text-black px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:scale-105 transition-all duration-300">
                Solicitar Asesoría
                <ChevronRight size={18} />
              </a>
              <a href="#servicios" className="glass-button px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2">
                Ver cómo funciona
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-32 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: <Shield size={24} />, title: "Asesoría Personalizada", desc: "Consultoría experta para entender tus necesidades en Luxemburgo. Desde la selección hasta la mudanza." },
              { icon: <Globe size={24} />, title: "Coordinación", desc: "Gestión integral de proveedores, artesanos y servicios de alto standing." },
              { icon: <Compass size={24} />, title: "Selección Premium", desc: "Acceso exclusivo a catálogos de mobiliario, domótica y equipamiento premium para tu nueva propiedad." }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeUp} className="glass-panel p-10 rounded-2xl group hover:border-[#D4AF37]/30 transition-colors duration-500">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-medium mb-4">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3D Portfolio Section */}
      <section id="portfolio-3d" className="py-32 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-6">Curation Premium <span className="text-gradient-gold">3D</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto font-light">Mueve el ratón sobre las tarjetas para interactuar con la experiencia 3D impulsada por Framer Motion.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" style={{ perspective: 1000 }}>
            {[
              { title: "Lounge Collection", type: "Mobiliario", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbGeVw-SboWmFk2TrLCPxV7nC57BZi4RrO6ffMT5mtfTOY-2B-Bx7LwKnboC-UQ6Xj_7zulg8YhOh69KX55raPxZ4c2oNnVdNetAQFEAmbwY9gWIgtqlBckHA043Ad9p9sOHzboqqt1GRhIvrvSP6yxYQuiF1c86evsK35uhjKamdhpUnSxV2JYGGwVDrbGOclJO9iJElQUukd7iOOA6dr42RUYpbvMTEdeNyIlWRAksmooQ-T0JQhKH9OgL7-dtYvezoDCzuC6Cc" },
              { title: "Control Ambiental", type: "Domótica", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3iTxLZHgHKI_UwK30MbLhhdnyTAmCvoyXwOLcs-AIbuDa9kxNA5qXmKhPEgZ3wdJXixIf9HbrZQhBZ5OsWy0_duNIiU7aH4XQr69s7AqgjEDZEP2yzJebHIDVBk3thkMVNJxOizohrTIgPk-dDLUi8bsZX-SfCj_gQJs3A4B5cno1RWaSdYpONs0qglELUEUP1gnC5sBmHipqG2Crl38npJSdwEY_abreJcMtpbAQKFeuARhRFe3nep3sFCNblWtGxHH7s7OMdbc" },
              { title: "Cocinas de Autor", type: "Equipamiento", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_55YrPKPZOAKYmV7n71JWG5tbdL7s6FaUf9vpzwN7c5Nc1MLNifCsOOin6Mar1496okToLNRg_vYJcJ5PIDlUO2aRVgY69mUkCgEgMDmC32TKtIPjTC7TEWzDniPbFHKzqpOauAeB5K5NNeXet1DbOuUns9dGwpNRTHQvjwO6VxgPb0GDt33MWPA7GaR8C7LklYk8Rpvbm41BK_noqoWTocqTAFzF9R240kBZ2l8IM2uqGxC9T-vnvIqYj7ImzDxML-x3BIo8t4Y" }
            ].map((item, idx) => (
              <TiltCard key={idx} className="h-[450px] w-full cursor-pointer">
                <div className="glass-panel w-full h-full rounded-2xl overflow-hidden relative group border-white/10 shadow-2xl">
                  <img src={item.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-105" alt={item.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase font-bold mb-2 block">{item.type}</span>
                    <h3 className="text-2xl font-display font-medium text-white">{item.title}</h3>
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
            Inicie su proyecto hoy
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/60 mb-12 max-w-xl mx-auto"
          >
            Atención prioritaria y confidencial para la configuración de su nueva residencia en Luxemburgo. Déjenos su contacto o hablemos por WhatsApp.
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
                <h3 className="text-xl font-display text-white">¡Mensaje enviado!</h3>
                <p className="text-white/60">Nos pondremos en contacto a la brevedad.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4 mb-8">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Su Nombre" 
                  required 
                  className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Su Correo Electrónico" 
                  required 
                  className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={formStatus === 'submitting'}
                  className="bg-white text-black px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {formStatus === 'submitting' ? 'Enviando...' : 'Enviar Consulta'}
                  <Send size={18} />
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-white/40 text-sm">O</span>
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

    </div>
  );
};

export default App;
