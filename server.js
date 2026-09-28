// server.js - Sudarshan Platform Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./server/middleware/errorHandler');
const aiProvider = require('./server/services/aiProvider');

const schemesRoute = require('./server/routes/schemes');
const statesRoute = require('./server/routes/states');
const categoriesRoute = require('./server/routes/categories');
const searchRoute = require('./server/routes/search');
const eligibilityRoute = require('./server/routes/eligibility');
const authRoute = require('./server/routes/auth');

const app = express();
let PORT = parseInt(process.env.PORT || '3000', 10);

// Security & Parsing Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Security Response Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// API Routes
app.use('/api/schemes', schemesRoute);
app.use('/api/states', statesRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/search', searchRoute);
app.use('/api/eligibility', eligibilityRoute);
app.use('/api/auth', authRoute);

// System Health Route
app.get('/api/health', (req, res) => {
  try {
    const schemesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/schemes.json'), 'utf8'));
    res.json({
      status: 'UP',
      product: 'SUDARSHAN',
      version: '2.0.0',
      tagline: 'AI-Powered Government Scheme Discovery & Citizen Assistance Platform',
      schemesCount: schemesData.length,
      aiProviderStatus: aiProvider.getProviderStatus(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'DEGRADED', error: err.message });
  }
});

// Fallback to SPA index.html for client-side navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: { status: 404, message: `API endpoint '${req.path}' not found.` }
    });
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log('========================================================');
    console.log(`  SUDARSHAN - Citizen Assistance Platform`);
    console.log(`  Server running at: http://localhost:${portToTry}`);
    console.log(`  Health Check:     http://localhost:${portToTry}/api/health`);
    console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
