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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
