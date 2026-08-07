'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const zlib = require('zlib');
const pinoHttp = require('pino-http');
const { logger, httpLoggerOptions } = require('./utils/logger');
const devConfig = require('./config/development');

// Import centralized API routes
const apiRouter = require('./routes');

const corsAllowedOriginsSet = new Set(devConfig.cors.allowedOrigins);

const app = express();

// Enable ETag for caching validation
app.set('etag', 'strong');

// Safe Response Time Middleware (sets header before writeHead)
app.use((req, res, next) => {
  const start = Date.now();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    return originalWriteHead.apply(this, args);
  };
  next();
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const normalize = (o) => o.trim().replace(/\/$/, '');
    const normalizedOrigin = normalize(origin);
    const allowedOrigins = [...corsAllowedOriginsSet].map(normalize);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', normalizedOrigin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: devConfig.cors.methods,
  allowedHeaders: devConfig.cors.allowedHeaders,
  exposedHeaders: [...devConfig.cors.exposedHeaders, 'X-Response-Time'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet(devConfig.security.helmet));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy
app.set('trust proxy', 1);

// Structured HTTP logging via pino-http
app.use(pinoHttp(httpLoggerOptions));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Redirect root to frontend in development
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.get('/', (_req, res) => {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      `http://localhost:${devConfig.proxy.frontendPort || 5173}/`;
    res.redirect(302, frontendUrl);
  });
}

// Central API Route Mount
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  req.log.warn({ method: req.method, url: req.url }, 'Route not found');
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' },
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (req.log && typeof req.log.error === 'function') {
    req.log.error({ err, statusCode }, err.message);
  } else {
    logger.error({ err, statusCode }, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.name || 'UNKNOWN_ERROR',
      ...(err.details && { details: err.details }),
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
});

module.exports = app;
