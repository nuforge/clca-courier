import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Canva OAuth token exchange proxy
app.post('/api/canva/oauth/token', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;
    const clientId = process.env.VITE_CANVA_CLIENT_ID;
    const clientSecret = process.env.VITE_CANVA_CLIENT_SECRET;

    console.log('Canva OAuth proxy called with:', {
      hasCode: !!code,
      hasCodeVerifier: !!code_verifier,
      redirect_uri,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });

    if (!code || !code_verifier || !redirect_uri) {
      console.error('Missing required parameters:', { code: !!code, code_verifier: !!code_verifier, redirect_uri });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!clientId) {
      console.error('Missing VITE_CANVA_CLIENT_ID environment variable');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!clientSecret) {
      console.error('Missing VITE_CANVA_CLIENT_SECRET environment variable');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // CORRECT ENDPOINT: https://api.canva.com/rest/v1/oauth/token
    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        code,
        code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Canva token exchange failed:', tokenResponse.status, errorText);
      return res.status(tokenResponse.status).json({
        error: 'Token exchange failed',
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    res.json(tokenData);

  } catch (error) {
    console.error('Error in Canva OAuth proxy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Canva OAuth Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/canva/oauth/token`);
});
