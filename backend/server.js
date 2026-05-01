import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🛡️ SECURITY MIDDLEWARE ---
app.use(helmet()); // Sets secure HTTP headers
app.use(express.json({ limit: '10kb' })); // Prevent large payloads (DoS)

// Strict CORS: Only allow our GitHub Pages frontend to communicate with this backend
const allowedOrigins = ['https://yoyocubano.github.io', 'http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS - Origen no autorizado'));
    }
  },
  credentials: true
}));

// Rate Limiting: Prevent Brute Force & Spam
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.' }
});
app.use('/api/', apiLimiter);

// --- 🌐 ROUTES ---

app.post('/api/contact', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  console.log(`[CONTACT RECEIVED] Name: ${name}, Email: ${email}`);
  res.status(200).json({ success: true, message: 'Contact saved successfully. We will reach out soon.' });
});

// --- 🛍️ E-COMMERCE INTEGRATION ---

// 1. Webhook for Artisan Furniture EU (Real-time Sync)
// 🔒 SECURED: Requires an API Key in the headers to prevent unauthorized payload injection
app.post('/api/webhooks/artisan', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ARTISAN_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'No autorizado. Se requiere API Key válida.' });
  }

  const productData = req.body;
  console.log(`[ARTISAN WEBHOOK] Received update for:`, productData?.sku || 'Unknown Product');
  
  res.status(200).send('Webhook received successfully');
});

// 2. Placeholder for BigBuy API sync
export const syncBigBuyCatalog = async () => {
  console.log('[BIGBUY SYNC] Fetching latest tools and furniture catalog...');
};

// 3. Endpoint for our React Frontend to fetch the unified catalog
app.get('/api/catalog', (req, res) => {
  const mockProducts = [
    { id: 1, name: "Sillón Velvet Lounge", price: 450, provider: "Artisan Furniture EU", isCertifiedArtisan: true, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop" },
    { id: 2, name: "Mesa de Centro Roble Industrial", price: 290, provider: "Creameng", isCertifiedArtisan: false, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop" },
    { id: 3, name: "Set Herrajes Premium", price: 120, provider: "Emuca Online", isCertifiedArtisan: false, image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop" },
    { id: 4, name: "Silla Tallada a Mano", price: 340, provider: "Carpintería Local Lux", isCertifiedArtisan: true, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" }
  ];
  
  res.status(200).json(mockProducts);
});

// 4. API for Local Artisans to connect
// 🔒 SECURED: Rate limit strictly to prevent form spam
const partnerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Límite de solicitudes de socio alcanzado.' } });
app.post('/api/partners/register', partnerLimiter, (req, res) => {
  const { companyName, specialty, email, phone } = req.body;
  
  if (!companyName || !email) {
    return res.status(400).json({ error: 'Company Name and Email are required to join the B2B network.' });
  }

  // Sanitize simple inputs (Basic HTML escaping would go here if saving to DB)
  console.log(`[NEW B2B PARTNER] ${companyName} (${specialty}) wants to join! Email: ${email}, Phone: ${phone}`);
  
  res.status(200).json({ success: true, message: 'Perfil de artesano/B2B registrado con éxito. Nuestro equipo validará su solicitud.' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT} 🔒 Secured with Helmet & Rate Limiting`);
});
