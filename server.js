// server.js - Backend server for MannieTech AI
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MannieTech AI Backend is running' });
});

// Chat endpoint - proxies requests to OpenRouter
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model, max_tokens, temperature } = req.body;

        // Validate request
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: 'Invalid request: messages array is required' 
            });
        }

        // Check if API key is configured
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ 
                error: 'Server configuration error: API key not set' 
            });
        }

        // Make request to OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'MannieTech AI Chat'
            },
            body: JSON.stringify({
                model: model || 'mistralai/mistral-7b-instruct',
                messages: messages,
                max_tokens: max_tokens || 1000,
                temperature: temperature || 0.7,
                stream: false
            })
        });

        // Handle OpenRouter response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', response.status, errorData);
            
            return res.status(response.status).json({
                error: `OpenRouter API error: ${response.status}`,
                details: errorData
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MannieTech AI Backend running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`🔑 API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes ✓' : 'No ✗'}`);
});
