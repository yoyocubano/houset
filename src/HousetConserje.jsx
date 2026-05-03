import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// 🏠 EL CONSERJE — HomeSetup Luxembourg AI Assistant
// Architecture: Rebeca-style failover (Gemini → DeepSeek → Mock)
// Languages: FR/LU/EN/ES auto-detect
// ═══════════════════════════════════════════════════════════

const CATALOG_CONTEXT = `
Tu catálogo actual incluye:
- Fauteuil Velvet Lounge: €450 (Artisan Furniture EU, artesano certificado)
- Table Basse Chêne Industriel: €290 (Creameng/BigBuy)
- Set Quincaillerie Premium: €120 (Emuca Online)
- Chaise Sculptée à la Main: €340 (Menuiserie Locale Lux, artesano certificado)

Servicios:
- Achat Matériaux/Mobilier: compra de materiales y mobiliario premium
- Conseil de Projet Complet: asesoría completa de diseño de interiores
- Coordination Artisans: coordinamos artesanos locales certificados
`;

const SYSTEM_PROMPT = `Tu nombre es "Le Conserje" y eres el asistente premium de HomeSetup Luxembourg.

IDENTIDAD:
- Eres elegante, eficiente y cálido. Estilo "Quiet Luxury".
- Hablas en el idioma del cliente (FR, LU, EN, ES). Detéctalos automáticamente.
- Representas una empresa de diseño de interiores y artesanos de lujo en Luxemburgo.

TU MISIÓN:
1. Ayudar al cliente a elegir materiales, muebles y artesanos según su presupuesto y estilo.
2. Si el cliente quiere agendar una consulta, recopilar: nombre, email, fecha preferida.
3. Recomendar productos del catálogo cuando sea relevante.
4. Derivar consultas complejas al equipo humano vía WhatsApp (+352 621 430 283).

CATÁLOGO Y SERVICIOS ACTUALES:
${CATALOG_CONTEXT}

REGLAS:
- Respuestas concisas (máx. 3 párrafos cortos).
- Nunca inventes precios o servicios fuera del catálogo.
- Si no sabes algo, di "Je vais vérifier avec notre équipe" y da el WhatsApp.
- Cuando el cliente quiera agendar: pídele nombre, email, y fecha preferida amablemente.
- Termina siempre con una pregunta o acción clara.`;

// Language detection heuristics
const detectLang = (text) => {
  const t = text.toLowerCase();
  if (/\b(je|vous|bonjour|merci|comment|votre|notre)\b/.test(t)) return 'fr';
  if (/\b(moien|wéi|ech|dir|dat|mer)\b/.test(t)) return 'lu';
  if (/\b(hola|gracias|cómo|necesito|quiero|tengo)\b/.test(t)) return 'es';
  return 'en';
};

const WELCOME_MESSAGES = {
  fr: "Bonjour ! Je suis **Le Conserje** de HomeSetup Luxembourg. 🏠\n\nJe suis là pour vous aider à trouver les meilleurs matériaux, meubles et artisans pour votre projet au Luxembourg.\n\nComment puis-je vous aider aujourd'hui ?",
  en: "Welcome! I'm **Le Conserje** at HomeSetup Luxembourg. 🏠\n\nI'm here to help you find the best materials, furniture, and certified craftsmen for your project in Luxembourg.\n\nHow can I help you today?",
  es: "¡Bienvenido! Soy **Le Conserje** de HomeSetup Luxembourg. 🏠\n\nEstoy aquí para ayudarte a encontrar los mejores materiales, muebles y artesanos certificados para tu proyecto.\n\n¿En qué puedo ayudarte hoy?",
  lu: "Moien! Ech sinn **Le Conserje** vun HomeSetup Luxembourg. 🏠\n\nWéi kann ech Iech hëllefen?",
};

// ── API CALL with Rebeca-style failover ──
const callAI = async (messages, apiKey) => {
  if (!apiKey) throw new Error('No API key');

  // Build Gemini-compatible contents array
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ]
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Je suis momentanément indisponible.';
};

// Simple markdown renderer (bold + newlines)
const renderMarkdown = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
};

// ── MAIN COMPONENT ──
const HousetConserje = ({ geminiApiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState('fr'); // default Luxembourg French
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{
        role: 'assistant',
        content: WELCOME_MESSAGES[lang],
        timestamp: new Date()
      }]);
    }
  }, [isOpen, hasGreeted, lang]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Detect language from user input
    const detectedLang = detectLang(text);
    if (detectedLang !== lang) setLang(detectedLang);

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for API (last 8 messages for context)
      const historyForApi = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newMessages.slice(-8)
      ];

      const reply = await callAI(historyForApi, geminiApiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      // Graceful fallback response
      const fallbacks = {
        fr: "Je suis momentanément indisponible. Pour une aide immédiate, contactez-nous sur WhatsApp: **+352 621 430 283** 📱",
        en: "I'm temporarily unavailable. For immediate help, contact us on WhatsApp: **+352 621 430 283** 📱",
        es: "Estoy momentáneamente no disponible. Contáctanos por WhatsApp: **+352 621 430 283** 📱",
        lu: "Kontaktéiert eis op WhatsApp: **+352 621 430 283** 📱",
      };
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbacks[detectedLang] || fallbacks.fr,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_ACTIONS = {
    fr: ['💰 Voir le catalogue', '📅 Prendre rendez-vous', '🔨 Trouver un artisan', '💬 Parler à l\'équipe'],
    en: ['💰 Browse catalog', '📅 Book a consultation', '🔨 Find a craftsman', '💬 Talk to the team'],
    es: ['💰 Ver catálogo', '📅 Reservar consulta', '🔨 Encontrar artesano', '💬 Hablar con el equipo'],
    lu: ['💰 Katalog', '📅 Rendez-vous', '🔨 Handwierker', '💬 Team'],
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(135deg, #D4AF37, #b5952f)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: isOpen ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        aria-label="Ouvrir Le Conserje"
      >
        <span className="text-2xl">🏠</span>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/40 animate-ping" />
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed bottom-6 right-6 z-[91] w-[calc(100vw-24px)] max-w-[400px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-white/10"
              style={{ background: '#0a0a0a' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                style={{ background: 'linear-gradient(135deg, #111 0%, #1a1500 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-lg">
                    🏠
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm tracking-wide">Le Conserje</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white/50 text-[11px]">HomeSetup Luxembourg</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                          🏠
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#D4AF37] text-black rounded-br-sm font-medium'
                            : 'bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-bl-sm'
                        }`}
                      >
                        {renderMarkdown(msg.content)}
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                        🏠
                      </div>
                      <div className="bg-white/[0.07] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1.5 items-center">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60"
                              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions (show only initially) */}
              {messages.length <= 1 && !isLoading && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {(QUICK_ACTIONS[lang] || QUICK_ACTIONS.fr).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(action.replace(/^[^\s]+\s/, ''));
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all duration-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.08]">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'fr' ? 'Écrivez votre message...' : lang === 'es' ? 'Escriba su mensaje...' : 'Write your message...'}
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
                    style={{ background: input.trim() && !isLoading ? 'linear-gradient(135deg, #D4AF37, #b5952f)' : 'rgba(255,255,255,0.08)' }}
                    aria-label="Envoyer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#000' : '#fff'} strokeWidth="2.5">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-white/20 text-[10px] mt-2 tracking-wider">
                  HOMESETUP LUXEMBOURG · QUIET LUXURY
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bounce animation for dots */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default HousetConserje;
