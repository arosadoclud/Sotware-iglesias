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
  // Permitir cualquier subdominio de vercel.app para previews
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir cualquier subdominio de vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Permitir onrender.com (para testing)
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Archivos estáticos (universal, siempre desde el root del proyecto)
const projectRoot = fs.realpathSync(process.cwd());
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));
app.use('/public', express.static(path.join(projectRoot, 'backend', 'public')));

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

import healthRoutes   from './routes/health.routes';
import authRoutes     from './modules/auth/auth.routes';
import churchRoutes   from './modules/churches/church.routes';
import logoRoutes     from './modules/churches/logo.routes';
import roleRoutes     from './modules/roles/role.routes';
import personsModule  from './modules/persons';
import personStatusRoutes from './modules/person-statuses/personStatus.routes';
import activityRoutes from './modules/activities/activity.routes';
import programRoutes  from './modules/programs/program.routes';
import pdfRoutes      from './modules/pdf/pdf.routes';       // PASO 5: PDF
// PASO 7: Letras (ya existían, se mantienen)
import letterRoutes   from './modules/letters/letter.routes';
import adminRoutes    from './modules/admin/admin.routes';   // Admin & Auditoría
import financesRoutes from './modules/finances/finances.routes'; // Módulo de Finanzas
import bibleRoutes    from './modules/bible/bible.routes';    // Bible API proxy
import newMemberRoutes from './modules/new-members/newMember.routes'; // Nuevos miembros

app.use(`${API}/health`,    healthRoutes);  // Health check
app.use(`${API}/auth`,      authRoutes);
app.use(`${API}/churches`,  churchRoutes);
app.use(`${API}/churches`,  logoRoutes);
app.use(`${API}/roles`,     roleRoutes);
app.use(`${API}/persons`,   personsModule);
app.use(`${API}/person-statuses`, personStatusRoutes);
app.use(`${API}/activities`,activityRoutes);
app.use(`${API}/programs`,  programRoutes);
app.use(`${API}/programs`,  pdfRoutes);     // PDF: GET /programs/:id/pdf
app.use(`${API}/letters`,   letterRoutes);
app.use(`${API}/admin`,     adminRoutes);   // Admin: usuarios y auditoría
app.use(`${API}/finances`,  financesRoutes); // Finanzas
app.use(`${API}/new-members`, newMemberRoutes); // Nuevos miembros
app.use(`${API}/bible`,     bibleRoutes);    // Bible API proxy

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
      `${API}/person-statuses`,
      `${API}/activities`,
      `${API}/programs`,
      `${API}/letters`,
      `${API}/finances`,
      `${API}/bible`,
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
