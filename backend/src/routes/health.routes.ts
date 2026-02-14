import { Router, Request, Response } from 'express';
import User from '../models/User.model';
import Church from '../models/Church.model';

const router = Router();

// Health check with database connectivity
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection by counting users
    const userCount = await User.countDocuments();
    const churchCount = await Church.countDocuments();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        users: userCount,
        churches: churchCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      database: {
        connected: false,
      },
    });
  }
});

// Test endpoint to check if admin user exists
router.get('/check-admin', async (req: Request, res: Response) => {
  try {
    const admin = await User.findOne({ email: 'superadmin@iglesia.com' });
    
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin user not found',
      });
    }

    res.json({
      success: true,
      admin: {
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        churchId: admin.churchId,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Check database configuration (without exposing credentials)
router.get('/db-info', async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('email fullName role').limit(10);
    const churches = await Church.find({}).select('name').limit(10);
    
    // Get MongoDB connection info
    const mongoose = require('mongoose');
    const connection = mongoose.connection;
    
    // Extract database name from URI without exposing credentials
    const dbName = connection.db?.databaseName || 'unknown';
    const host = connection.host || 'unknown';
    
    res.json({
      success: true,
      database: {
        name: dbName,
        host: host.includes('mongodb.net') ? host.split('@')[1] : 'local',
        status: connection.readyState === 1 ? 'connected' : 'disconnected',
      },
      users: users.map(u => ({ email: u.email, name: u.fullName, role: u.role })),
      churches: churches.map(c => ({ name: c.name })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
