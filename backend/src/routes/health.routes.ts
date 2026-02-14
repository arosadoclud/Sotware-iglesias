import { Router, Request, Response } from 'express';
import User from '../../models/User.model';
import Church from '../../models/Church.model';

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

export default router;
