import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import User from '../../models/User.model';
import Church from '../../models/Church.model';
import { login, register, refreshToken } from '../auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';

describe('Auth Module', () => {
  let app: express.Application;
  let testChurchId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Rutas de prueba
    app.post('/auth/register', register);
    app.post('/auth/login', login);
    app.post('/auth/refresh', refreshToken);
    
    // Crear iglesia de prueba
    const testChurch = await Church.create({
      name: 'Test Church',
      address: { city: 'Test City', country: 'Test Country' },
      settings: { timezone: 'America/New_York' }
    });
    testChurchId = testChurch._id.toString();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('debe registrar un nuevo usuario con credenciales válidas', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Test1234!',
          name: 'Test User',
          churchId: testChurchId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'test@test.com');
      expect(response.body.data.user).toHaveProperty('role', 'VIEWER');
    });

    it('debe rechazar registro con email inválido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234!',
          name: 'Test User',
          churchId: testChurchId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar contraseña débil', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User',
          churchId: testChurchId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('contraseña');
    });

    it('debe evitar registro duplicado de email', async () => {
      // Primer registro
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Test1234!',
          name: 'Test User',
          churchId: testChurchId
        });

      // Verificar usuario en DB
      const user = await User.findOne({ email: 'test@test.com' });
      if (user) {
        user.isEmailVerified = true;
        await user.save();
      }

      // Intento de registro duplicado
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Test1234!',
          name: 'Test User 2',
          churchId: testChurchId
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ya existe');
    });

    it('debe asignar SUPER_ADMIN a admin@iglesia.com', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'admin@iglesia.com',
          password: 'SuperAdmin1234!',
          name: 'Super Admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('SUPER_ADMIN');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba verificado
      const user = await User.create({
        email: 'testlogin@test.com',
        password: 'Test1234!',
        name: 'Login Test',
        role: 'VIEWER',
        churchId: testChurchId,
        isEmailVerified: true,
        isActive: true
      });
      await user.save();
    });

    it('debe hacer login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testlogin@test.com',
          password: 'Test1234!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'testlogin@test.com');
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testlogin@test.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválidas');
    });

    it('debe rechazar login de usuario inexistente', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'Test1234!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debe bloquear cuenta después de 5 intentos fallidos', async () => {
      // 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            email: 'testlogin@test.com',
            password: 'WrongPassword!'
          });
      }

      // 6to intento debe estar bloqueado
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testlogin@test.com',
          password: 'Test1234!'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('bloqueada');
    });

    it('debe normalizar email (case-insensitive)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'TESTLOGIN@TEST.COM',
          password: 'Test1234!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('JWT Token Validation', () => {
    it('debe validar token JWT válido', async () => {
      // Crear usuario
      const user = await User.create({
        email: 'jwttest@test.com',
        password: 'Test1234!',
        name: 'JWT Test',
        role: 'VIEWER',
        churchId: testChurchId,
        isEmailVerified: true,
        isActive: true
      });

      // Hacer login para obtener token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'jwttest@test.com',
          password: 'Test1234!'
        });

      const token = loginResponse.body.data.accessToken;

      // Crear ruta protegida para prueba
      app.get('/test/protected', authenticate, (req, res) => {
        res.json({ success: true, user: req.user });
      });

      // Hacer request con token
      const response = await request(app)
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe rechazar request sin token', async () => {
      app.get('/test/protected2', authenticate, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/protected2');

      expect(response.status).toBe(401);
    });

    it('debe rechazar token inválido', async () => {
      app.get('/test/protected3', authenticate, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/protected3')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(response.status).toBe(401);
    });
  });
});
