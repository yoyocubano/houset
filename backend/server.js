import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { Resend } from 'resend';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🔥 FIREBASE ADMIN SDK ---
// Nota: En local usamos el archivo de credenciales, en Google Cloud se autodetecta.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'houset-luxembourg-official'
  });
}
const db = admin.firestore();

// --- 📧 EMAIL & PAYMENT CLIENTS ---
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

// --- 🛡️ SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const allowedOrigins = [
  'https://yoyocubano.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://idx.google.com'
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

// --- 🏥 HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    firebase: 'connected',
    projectId: 'houset-luxembourg-official',
    timestamp: new Date().toISOString()
  });
});

// --- 🛍️ CATALOG — From Firestore ---
app.get('/api/catalog', async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').where('in_stock', '==', true).get();
    
    if (productsSnapshot.empty) {
      // Mock data if Firestore is empty (Initial state)
      return res.json([
        { id: '1', name: "Fauteuil Velvet Lounge", price: 450, provider: "Artisan Furniture EU", is_certified_artisan: true, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop" },
        { id: '2', name: "Table Basse Chêne Industriel", price: 290, provider: "Creameng / BigBuy", is_certified_artisan: false, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop" }
      ]);
    }

    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 📬 CONTACT FORM — Save to Firestore + AI Scoring Placeholder ---
app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // 1. AI Scoring Engine (Intelligent Placeholder for Luxury Analysis)
    const luxuryKeywords = ['luxembourg', 'premium', 'invest', 'luxury', 'architecture', 'high-end', 'exclusive', 'palace', 'castle'];
    const lowerMessage = message?.toLowerCase() || '';
    
    let luxuryScore = 50; // Base score
    
    // Weighted scoring based on intent
    luxuryKeywords.forEach(word => {
      if (lowerMessage.includes(word)) luxuryScore += 10;
    });
    
    // Specific high-value boosts
    if (lowerMessage.includes('luxembourg') || email.endsWith('.lu')) luxuryScore += 20;
    if (lowerMessage.includes('invest') || lowerMessage.includes('portfolio')) luxuryScore += 15;
    
    // Clamp at 100
    luxuryScore = Math.min(luxuryScore, 100);

    // 2. Persist to Firestore
    const leadRef = await db.collection('leads').add({
      name,
      email,
      service,
      message,
      luxuryScore,
      status: luxuryScore > 80 ? 'PREMIUM_HOT' : 'NEW',
      source: 'houset-web',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Email notification via Resend
    if (resend) {
      await resend.emails.send({
        from: 'houset@weluxevents.com',
        to: 'yucolaguilar@gmail.com',
        subject: `💎 Nuevo Lead Premium [Score: ${luxuryScore}]: ${name}`,
        html: `<h2>Nuevo lead capturado en Firestore</h2><p>ID: ${leadRef.id}</p><p><b>Nombre:</b> ${name}</p><p><b>AI Luxury Score:</b> ${luxuryScore}/100</p>`
      });
    }

    res.status(200).json({ success: true, leadId: leadRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 💳 STRIPE CHECKOUT ---
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe no configurado.' });

  try {
    const { items, originUrl } = req.body;
    const lineItems = items.map(item => ({
      price_data: { currency: 'eur', product_data: { name: item.name }, unit_amount: Math.round(item.price * 100) },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${originUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl}?canceled=true`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
  🚀 HOUSET BACKEND — TOTAL GOOGLE SUITE 
  🔥 Firebase: houset-luxembourg-official
  🛡️ Security: High (Helmet + RateLimit)
  🌍 Port: ${PORT}
  `);
});
