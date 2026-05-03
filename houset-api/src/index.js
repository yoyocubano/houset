import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'

// Iniciamos la API ultra-ligera de Hono
const app = new Hono()

// CORS estricto para nuestro frontend
app.use('/api/*', cors({
  origin: ['https://yoyocubano.github.io', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}))

// --- 🏥 HEALTH CHECK ---
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', worker: 'Cloudflare Edge', timestamp: new Date().toISOString() })
})

// --- 🛍️ CATALOG ---
app.get('/api/catalog', async (c) => {
  const supabaseUrl = c.env.SUPABASE_URL
  const supabaseKey = c.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return c.json({ error: 'Supabase no está configurado en las variables de entorno' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase.from('products').select('*').eq('in_stock', true).order('created_at', { ascending: false })
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data || [])
})

// --- 💳 STRIPE CHECKOUT ---
app.post('/api/create-checkout-session', async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY
  if (!stripeKey) return c.json({ error: 'Stripe no configurado en Cloudflare' }, 500)

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
  const { items, originUrl } = await c.req.json()
  
  const lineItems = items.map(item => ({
    price_data: { 
      currency: 'eur', 
      product_data: { name: item.name }, 
      unit_amount: Math.round(item.price * 100) 
    },
    quantity: item.quantity || 1,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${originUrl}?success=true`,
    cancel_url: `${originUrl}?canceled=true`,
  })
  
  return c.json({ id: session.id, url: session.url })
})

// --- 📬 CONTACT FORM ---
app.post('/api/contact', async (c) => {
  const { name, email, service } = await c.req.json()
  
  // Guardamos en Supabase
  if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    await supabase.from('contact_leads').insert({ name, email, service, source: 'houset-edge' })
  }

  // Enviamos email con Resend
  if (c.env.RESEND_API_KEY) {
    const resend = new Resend(c.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'houset@weluxevents.com',
      to: 'yucolaguilar@gmail.com',
      subject: `Nuevo lead Houset: ${name}`,
      html: `<p><b>${name}</b> (${email}) quiere: ${service}</p>`
    }).catch(e => console.error(e))
  }
  
  return c.json({ success: true })
})

// --- 🔧 ARTISAN PARTNERS REGISTRATION ---
app.post('/api/partners/register', async (c) => {
  const { companyName, specialty, email, phone } = await c.req.json()
  
  if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase.from('artisan_partners').insert({ company_name: companyName, specialty, email, phone })
    
    if (error && error.code === '23505') {
      return c.json({ error: 'Este email ya está registrado en nuestra red B2B.' }, 409)
    }
  }

  if (c.env.RESEND_API_KEY) {
    const resend = new Resend(c.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'houset@weluxevents.com',
      to: 'yucolaguilar@gmail.com',
      subject: `🔧 Nuevo Artesano B2B: ${companyName}`,
      html: `<h2>Nueva solicitud de artesano/B2B</h2><p><b>Empresa:</b> ${companyName}</p><p><b>Email:</b> ${email}</p><p><b>Tel:</b> ${phone}</p><p><b>Especialidad:</b> ${specialty}</p>`
    }).catch(e => console.error(e))
  }

  return c.json({ success: true, message: 'Perfil registrado.' })
})

export default app
