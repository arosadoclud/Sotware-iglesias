import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { initSessionRealtime, notifyUserAccessChanged } from './sessionRealtime.service';
import { Server } from 'socket.io';

jest.mock('../config/env', () => ({ __esModule: true, default: { jwtSecret: 'qa-session-secret', frontendUrl: 'http://localhost' } }));
jest.mock('../models/User.model', () => ({ __esModule: true, default: { findById: jest.fn() } }));

// The browser client already belongs to the frontend workspace.
const { io: connect } = require(require.resolve('socket.io-client', { paths: [path.resolve(__dirname, '../../../frontend')] }));

describe('Session realtime notifications', () => {
  let http: HttpServer;
  let io: Server;
  let url: string;
  const clients: any[] = [];

  beforeEach(async () => {
    (User.findById as jest.Mock).mockImplementation(async (id: string) => ({
      _id: id, churchId: id === 'other-church' ? 'church2' : 'church1', isActive: id !== 'inactive',
    }));
    http = createServer();
    io = initSessionRealtime(http);
    await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    clients.splice(0).forEach(client => client.disconnect());
    await new Promise<void>(resolve => io.close(() => resolve()));
  });

  const clientFor = async (id: string) => {
    const token = jwt.sign({ id }, 'qa-session-secret', { expiresIn: '5m' });
    const client = connect(url, { auth: { token }, transports: ['websocket'], reconnection: false });
    clients.push(client);
    await new Promise<void>((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); });
    return client;
  };

  it('notifies the affected session and the same church without leaking across churches', async () => {
    const affected = await clientFor('affected');
    const colleague = await clientFor('colleague');
    const otherChurch = await clientFor('other-church');
    const otherSessionEvent = jest.fn();
    const otherChurchEvent = jest.fn();
    colleague.on('session:changed', otherSessionEvent);
    otherChurch.on('users:changed', otherChurchEvent);
    const sessionChanged = new Promise<void>(resolve => affected.once('session:changed', resolve));
    const directoryChanged = new Promise<void>(resolve => colleague.once('users:changed', resolve));
    notifyUserAccessChanged('church1', 'affected');
    await Promise.all([sessionChanged, directoryChanged]);
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(otherSessionEvent).not.toHaveBeenCalled();
    expect(otherChurchEvent).not.toHaveBeenCalled();
  });

  it('rejects inactive users and forged tokens', async () => {
    await expect(clientFor('inactive')).rejects.toThrow('Unauthorized');
    const client = connect(url, { auth: { token: 'forged' }, transports: ['websocket'], reconnection: false });
    clients.push(client);
    const error: any = await new Promise(resolve => client.once('connect_error', resolve));
    expect(error.message).toBe('Unauthorized');
  });
});
