import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import envConfig from './config/env';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { initQueues } from './infrastructure/queue/QueueManager';
// Inicializar email service (registra el handler en la queue)
import './infrastructure/email/EmailService';
// Inicializar notification service (registra WhatsApp handler)
import './modules/notifications/notification.service';

const app: Express = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  envConfig.frontendUrl,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Archivos estáticos (universal, siempre desde el root del proyecto)
const projectRoot = fs.realpathSync(process.cwd());
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

// ── SEGURIDAD ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limit: 200 req/min en producción, ilimitado en dev
const limiter = rateLimit({
  windowMs: envConfig.rateLimitWindowMs,
  max: envConfig.nodeEnv === 'development' ? 10000 : envConfig.rateLimitMaxRequests,
  message: { success: false, message: 'Demasiadas solicitudes, intenta en un momento' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── PARSEO Y COMPRESIÓN ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── LOGGING ────────────────────────────────────────────────────────────────────
if (envConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  }));
}

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Church Program Manager API — OK',
    version: envConfig.apiVersion,
    env: envConfig.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── RUTAS API ─────────────────────────────────────────────────────────────────
const API = `/api/${envConfig.apiVersion}`;

import authRoutes     from './modules/auth/auth.routes';
import churchRoutes   from './modules/churches/church.routes';
import logoRoutes     from './modules/churches/logo.routes';
import roleRoutes     from './modules/roles/role.routes';
import personsModule  from './modules/persons';
import activityRoutes from './modules/activities/activity.routes';
import programRoutes  from './modules/programs/program.routes';
import pdfRoutes      from './modules/pdf/pdf.routes';       // PASO 5: PDF
// PASO 7: Letras (ya existían, se mantienen)
import letterRoutes   from './modules/letters/letter.routes';

app.use(`${API}/auth`,      authRoutes);
app.use(`${API}/churches`,  churchRoutes);
app.use(`${API}/churches`,  logoRoutes);
app.use(`${API}/roles`,     roleRoutes);
app.use(`${API}/persons`,   personsModule);
app.use(`${API}/activities`,activityRoutes);
app.use(`${API}/programs`,  programRoutes);
app.use(`${API}/programs`,  pdfRoutes);     // PDF: GET /programs/:id/pdf
app.use(`${API}/letters`,   letterRoutes);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Church Program Manager API',
    version: envConfig.apiVersion,
    endpoints: [
      `${API}/auth`,
      `${API}/churches`,
      `${API}/roles`,
      `${API}/persons`,
      `${API}/activities`,
      `${API}/programs`,
      `${API}/letters`,
    ],
  });
});

// ── QUEUE INITIALIZATION ─────────────────────────────────────────────────────
// Se llama aquí para que Redis se conecte después de que el server esté listo
export function setupQueues() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    initQueues(redisUrl);
  }
}

// ── ERROR HANDLERS ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
