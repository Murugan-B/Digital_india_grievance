import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import officialRoutes from './routes/officialRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

dotenv.config();

// 1. Startup Environment Validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key] || !process.env[key].trim());

if (missingVars.length > 0) {
  console.error(`[Server Fatal Error]: Missing required environment variable(s): ${missingVars.join(', ')}.`);
  console.error('[Server Fatal Error]: Please verify your backend/.env configuration before starting the server.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// 2. HTTP Security Headers
app.use(helmet());

// 3. CORS Hardening
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or Postman)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by Security Policy.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 4. Request Body Size Limits (Supports up to 3 x 5MB image attachments in base64)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 5. Global API Rate Limiter
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Reasonable threshold for active client browsing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to the Grievance Portal API. Please slow down and try again.',
  },
});

app.use('/api', generalApiLimiter);

// 6. API Routes
app.use('/health', healthRoutes);
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/official/grievances', officialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// 7. Standard 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// 8. Centralized Error Handling
app.use(errorMiddleware);

// 9. Start Server
const server = app.listen(PORT, () => {
  console.log(`[Public Grievance API] Server running on http://localhost:${PORT}`);
  console.log(`[Public Grievance API] Health endpoint at http://localhost:${PORT}/api/health`);
  console.log(`[Public Grievance API] Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
});

// 10. Graceful Shutdown Handlers
const shutdown = (signal) => {
  console.log(`[Public Grievance API] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[Public Grievance API] HTTP server closed cleanly.');
    process.exit(0);
  });

  // Force exit after timeout if sockets don't close
  setTimeout(() => {
    console.error('[Public Grievance API] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
