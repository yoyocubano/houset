import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API route to handle contact form submissions
app.post('/api/contact', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Here you would typically integrate with a database or email service (e.g. SendGrid, Nodemailer)
  console.log(`[CONTACT RECEIVED] Name: ${name}, Email: ${email}`);
  
  // Respond to the client
  res.status(200).json({ success: true, message: 'Contact saved successfully. We will reach out soon.' });
});

// --- E-COMMERCE INTEGRATION ---

// 1. Webhook for Artisan Furniture EU (Real-time Sync)
// This endpoint receives HTTP POST requests from Artisan's Flo ERP
app.post('/api/webhooks/artisan', (req, res) => {
  // Verify the payload (Artisan will send product data, stock, prices)
  const productData = req.body;
  
  console.log(`[ARTISAN WEBHOOK] Received update for:`, productData?.sku || 'Unknown Product');
  
  // Here we will save or update the product in our database
  // e.g. db.products.upsert({ sku: productData.sku, price: productData.price, stock: productData.stock })

  // Always return 200 OK so Artisan knows we received it
  res.status(200).send('Webhook received');
});

// 2. Placeholder for BigBuy API sync (Scheduled Task / Cron)
// This would run every night or every hour using something like node-cron
export const syncBigBuyCatalog = async () => {
  // const response = await axios.get('https://api.bigbuy.eu/rest/catalog/products', { headers: { Authorization: `Bearer ${process.env.BIGBUY_API_KEY}`} });
  console.log('[BIGBUY SYNC] Fetching latest tools and furniture catalog...');
};

// 3. Endpoint for our React Frontend to fetch the unified catalog
app.get('/api/catalog', (req, res) => {
  // In production, this queries your database. For now, we mock it.
  const mockProducts = [
    { id: 1, name: "Sillón Velvet Lounge", price: 450, provider: "Artisan", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop" },
    { id: 2, name: "Mesa de Centro Roble Industrial", price: 290, provider: "Creameng", image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop" },
    { id: 3, name: "Set Herrajes Premium", price: 120, provider: "Emuca", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop" },
    { id: 4, name: "Lámpara Colgante Dorada", price: 180, provider: "BigBuy", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" }
  ];
  
  res.status(200).json(mockProducts);
});

// 4. API for Local Artisans & External Businesses to connect to our Network
app.post('/api/partners/register', (req, res) => {
  const { companyName, specialty, email, phone } = req.body;
  
  if (!companyName || !email) {
    return res.status(400).json({ error: 'Company Name and Email are required to join the B2B network.' });
  }

  // Simulate saving to database and triggering notification to admin
  console.log(`[NEW B2B PARTNER] ${companyName} (${specialty}) wants to join the network! Email: ${email}, Phone: ${phone}`);
  
  res.status(200).json({ success: true, message: 'Perfil de artesano/B2B registrado con éxito. Nuestro equipo validará su solicitud.' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
