import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import envConfig from '../config/env';

let realtime: Server | undefined;
const userRoom = (churchId: string, userId: string) => `session:${churchId}:${userId}`;

export function initSessionRealtime(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowed = !origin || origin === envConfig.frontendUrl ||
          /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
        callback(null, allowed);
      },
      methods: ['GET', 'POST'],
    },
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error('Missing token');
      const decoded = jwt.verify(token, envConfig.jwtSecret) as { id: string; exp?: number };
      const user = await User.findById(decoded.id);
      if (!user?.isActive || !user.churchId) throw new Error('Inactive session');
      socket.data.userId = user._id.toString();
      socket.data.churchId = user.churchId.toString();
      socket.data.expiresAt = decoded.exp ? decoded.exp * 1000 : undefined;
      next();
    } catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', socket => {
    socket.join(userRoom(socket.data.churchId, socket.data.userId));
    socket.join(`church:${socket.data.churchId}`);
    if (socket.data.expiresAt) {
      const timer = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
      timer.unref();
      socket.on('disconnect', () => clearTimeout(timer));
    }
  });
  realtime = io;
  return io;
}

/** Invalidate only: clients fetch their current, authorized profile over HTTP. */
export function notifyUserAccessChanged(churchId: string, userId: string): void {
  realtime?.to(userRoom(churchId, userId)).emit('session:changed');
  realtime?.to(`church:${churchId}`).emit('users:changed');
}
