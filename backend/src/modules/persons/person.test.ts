import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Person from '../../models/Person.model';
import Church from '../../models/Church.model';
import User from '../../models/User.model';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { getPersons, getPerson, createPerson, updatePerson, deletePerson } from './person.controller';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/env';

describe('Persons Module - Multi-Tenancy', () => {
  let app: express.Application;
  let church1Id: string;
  let church2Id: string;
  let user1Token: string;
  let user2Token: string;
  let person1Id: string;
  let person2Id: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Rutas de prueba
    app.get('/persons', authenticate, tenantGuard, getPersons);
    app.get('/persons/:id', authenticate, tenantGuard, getPerson);
    app.post('/persons', authenticate, tenantGuard, createPerson);
    app.put('/persons/:id', authenticate, tenantGuard, updatePerson);
    app.delete('/persons/:id', authenticate, tenantGuard, deletePerson);

    // Crear 2 iglesias diferentes
    const church1 = await Church.create({
      name: 'Church 1',
      address: { city: 'City 1', country: 'Country 1' },
      settings: { timezone: 'America/New_York' }
    });
    church1Id = church1._id.toString();

    const church2 = await Church.create({
      name: 'Church 2',
      address: { city: 'City 2', country: 'Country 2' },
      settings: { timezone: 'America/Los_Angeles' }
    });
    church2Id = church2._id.toString();

    // Crear usuarios de cada iglesia
    const user1 = await User.create({
      email: 'user1@church1.com',
      password: 'Test1234!',
      name: 'User 1',
      role: 'ADMIN',
      churchId: church1Id,
      isEmailVerified: true,
      isActive: true
    });

    const user2 = await User.create({
      email: 'user2@church2.com',
      password: 'Test1234!',
      name: 'User 2',
      role: 'ADMIN',
      churchId: church2Id,
      isEmailVerified: true,
      isActive: true
    });

    // Generar tokens
    user1Token = jwt.sign({ id: user1._id, role: user1.role }, envConfig.jwtSecret);
    user2Token = jwt.sign({ id: user2._id, role: user2.role }, envConfig.jwtSecret);

    // Crear personas en cada iglesia
    const person1 = await Person.create({
      fullName: 'Person 1 Church 1',
      phone: '1234567890',
      ministry: 'Worship',
      churchId: church1Id
    });
    person1Id = person1._id.toString();

    const person2 = await Person.create({
      fullName: 'Person 2 Church 2',
      phone: '0987654321',
      ministry: 'Youth',
      churchId: church2Id
    });
    person2Id = person2._id.toString();
  });

  afterAll(async () => {
    await Person.deleteMany({});
    await User.deleteMany({});
    await Church.deleteMany({});
  });

  describe('Multi-Tenant Isolation', () => {
    it('usuario de Church 1 solo debe ver personas de Church 1', async () => {
      const response = await request(app)
        .get('/persons')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].fullName).toBe('Person 1 Church 1');
    });

    it('usuario de Church 2 solo debe ver personas de Church 2', async () => {
      const response = await request(app)
        .get('/persons')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].fullName).toBe('Person 2 Church 2');
    });

    it('usuario de Church 1 NO debe poder ver persona de Church 2', async () => {
      const response = await request(app)
        .get(`/persons/${person2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
    });

    it('usuario de Church 1 NO debe poder editar persona de Church 2', async () => {
      const response = await request(app)
        .put(`/persons/${person2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ fullName: 'Hacked Name' });

      expect(response.status).toBe(404);
    });

    it('usuario de Church 1 NO debe poder eliminar persona de Church 2', async () => {
      const response = await request(app)
        .delete(`/persons/${person2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('CRUD Operations', () => {
    it('debe crear persona con churchId automático', async () => {
      const response = await request(app)
        .post('/persons')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'New Person',
          phone: '1112223333',
          ministry: 'Tech'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.churchId.toString()).toBe(church1Id);
    });

    it('debe actualizar persona de misma iglesia', async () => {
      const response = await request(app)
        .put(`/persons/${person1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ ministry: 'Media' });

      expect(response.status).toBe(200);
      expect(response.body.data.ministry).toBe('Media');
    });

    it('debe eliminar persona de misma iglesia', async () => {
      // Crear persona temporal
      const tempPerson = await Person.create({
        fullName: 'Temp Person',
        churchId: church1Id
      });

      const response = await request(app)
        .delete(`/persons/${tempPerson._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      
      // Verificar eliminación
      const deletedPerson = await Person.findById(tempPerson._id);
      expect(deletedPerson).toBeNull();
    });
  });

  describe('Pagination & Filtering', () => {
    beforeAll(async () => {
      // Crear más personas para Church 1
      await Person.create([
        { fullName: 'John Worship', ministry: 'Worship', churchId: church1Id },
        { fullName: 'Jane Worship', ministry: 'Worship', churchId: church1Id },
        { fullName: 'Bob Youth', ministry: 'Youth', churchId: church1Id }
      ]);
    });

    it('debe filtrar por ministry', async () => {
      const response = await request(app)
        .get('/persons?ministry=Worship')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.ministry === 'Worship')).toBe(true);
    });

    it('debe buscar por nombre', async () => {
      const response = await request(app)
        .get('/persons?search=John')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((p: any) => p.fullName.includes('John'))).toBe(true);
    });

    it('debe paginar resultados', async () => {
      const response = await request(app)
        .get('/persons?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('Security', () => {
    it('debe rechazar acceso sin token', async () => {
      const response = await request(app)
        .get('/persons');

      expect(response.status).toBe(401);
    });

    it('debe rechazar token inválido', async () => {
      const response = await request(app)
        .get('/persons')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('debe rechazar intentos de inyección de SQL/NoSQL', async () => {
      const response = await request(app)
        .post('/persons')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'Test',
          churchId: { $ne: church1Id } // Intento de inyección NoSQL
        });

      // Debe crear con churchId correcto del token, ignorando el malicioso
      expect(response.status).toBe(201);
      expect(response.body.data.churchId.toString()).toBe(church1Id);
    });
  });
});
