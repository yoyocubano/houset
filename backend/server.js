import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🗄️ DATABASE & EMAIL CLIENTS ---
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

if (!supabase) console.warn('[⚠️  HOUSET] Supabase not configured — running in mock mode. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
if (!resend)   console.warn('[⚠️  HOUSET] Resend not configured — emails disabled. Add RESEND_API_KEY to .env');
if (!stripe)   console.warn('[⚠️  HOUSET] Stripe not configured — payments disabled. Add STRIPE_SECRET_KEY to .env');

// --- 🛡️ SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const allowedOrigins = [
  'https://yoyocubano.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS - Origen no autorizado'));
    }
  },
  credentials: true
}));

// Rate limiting global
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.' }
});
app.use('/api/', apiLimiter);

// --- 🏥 HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabase: !!supabase,
    resend: !!resend,
    timestamp: new Date().toISOString()
  });
});

// --- 🛍️ CATALOG — From Supabase (fallback to mock) ---
app.get('/api/catalog', async (req, res) => {
  const mockProducts = [
    { id: 1, name: "Fauteuil Velvet Lounge", price: 450, provider: "Artisan Furniture EU", is_certified_artisan: true, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop" },
    { id: 2, name: "Table Basse Chêne Industriel", price: 290, provider: "Creameng / BigBuy", is_certified_artisan: false, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop" },
    { id: 3, name: "Set Quincaillerie Premium", price: 120, provider: "Emuca Online", is_certified_artisan: false, image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop" },
    { id: 4, name: "Chaise Sculptée à la Main", price: 340, provider: "Menuiserie Locale Lux", is_certified_artisan: true, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" }
  ];

  if (!supabase) return res.json(mockProducts);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    console.log('[CATALOG] Supabase empty or error — using mock data');
    return res.json(mockProducts);
  }

  res.json(data);
});

// --- 📬 CONTACT FORM — Save to Supabase + Email notification ---
app.post('/api/contact', async (req, res) => {
  const { name, email, service } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // 1. Persist to Supabase
  if (supabase) {
    const { error } = await supabase
      .from('contact_leads')
      .insert({ name, email, service, source: 'houset-web' });
    if (error) console.error('[CONTACT] Supabase insert error:', error.message);
  }

  // 2. Email notification to Comandante
  if (resend) {
    await resend.emails.send({
      from: 'houset@weluxevents.com',
      to: 'yucolaguilar@gmail.com',
      subject: `🏠 Nuevo Lead Houset: ${name}`,
      html: `
        <h2>Nuevo lead en HomeSetup Luxembourg</h2>
        <p><b>Nombre:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Servicio:</b> ${service || 'No especificado'}</p>
        <p><i>Recibido: ${new Date().toLocaleString('fr-LU', { timeZone: 'Europe/Luxembourg' })}</i></p>
      `
    }).catch(err => console.error('[CONTACT] Resend error:', err.message));
  }

  console.log(`[CONTACT] ${name} <${email}> → ${service}`);
  res.status(200).json({ success: true, message: 'Solicitud recibida. Nos pondremos en contacto pronto.' });
});

// --- 🔧 ARTISAN B2B — Save to Supabase with pending status ---
const partnerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Límite de solicitudes de socio alcanzado.' }
});

app.post('/api/partners/register', partnerLimiter, async (req, res) => {
  const { companyName, specialty, email, phone } = req.body;

  if (!companyName || !email) {
    return res.status(400).json({ error: 'Company Name and Email are required.' });
  }

  // 1. Persist to Supabase
  if (supabase) {
    const { error } = await supabase
      .from('artisan_partners')
      .insert({
        company_name: companyName,
        specialty,
        email,
        phone,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') { // unique violation
        return res.status(409).json({ error: 'Este email ya está registrado en nuestra red B2B.' });
      }
      console.error('[PARTNER] Supabase insert error:', error.message);
    }
  }

  // 2. Email notification to Comandante
  if (resend) {
    await resend.emails.send({
      from: 'houset@weluxevents.com',
      to: 'yucolaguilar@gmail.com',
      subject: `🔧 Nuevo Artesano B2B: ${companyName}`,
      html: `
        <h2>Nueva solicitud de artesano/B2B</h2>
        <p><b>Empresa:</b> ${companyName}</p>
        <p><b>Especialidad:</b> ${specialty}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Tel:</b> ${phone}</p>
        <p><b>Status:</b> PENDIENTE DE REVISIÓN</p>
      `
    }).catch(err => console.error('[PARTNER] Resend error:', err.message));
  }

  console.log(`[B2B PARTNER] ${companyName} (${specialty}) registered. Email: ${email}`);
  res.status(200).json({ success: true, message: 'Perfil registrado. Nuestro equipo validará su solicitud en 24h.' });
});

// --- 🔒 ARTISAN WEBHOOK (Artisan Furniture EU sync) ---
app.post('/api/webhooks/artisan', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ARTISAN_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const productData = req.body;
  console.log(`[ARTISAN WEBHOOK] Product update:`, productData?.sku || 'Unknown');

  // Upsert product in Supabase
  if (supabase && productData) {
    await supabase.from('products').upsert(productData, { onConflict: 'id' });
  }

  res.status(200).json({ received: true });
});

// --- 💳 STRIPE CHECKOUT ---
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe no está configurado en el servidor.' });
  }

  try {
    const { items, originUrl } = req.body; // items: [{ name, price, quantity }]
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe usa centavos
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${originUrl}?success=true`,
      cancel_url: `${originUrl}?canceled=true`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[STRIPE ERROR]', error);
    res.status(500).json({ error: error.message });
  }
});

// --- 🌐 START ---
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🏠 HomeSetup Luxembourg — Backend API      ║
  ║   Running on http://localhost:${PORT}           ║
  ║   🛡️  Helmet + Rate Limit + CORS             ║
  ║   🗄️  Supabase: ${supabase ? '✅ Connected' : '⚠️  Mock mode'}              ║
  ║   📬 Resend:    ${resend   ? '✅ Connected' : '⚠️  Disabled  '}              ║
  ║   💳 Stripe:    ${stripe   ? '✅ Connected' : '⚠️  Disabled  '}              ║
  ╚══════════════════════════════════════════════╝
  `);
});
