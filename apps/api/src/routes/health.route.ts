import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseConnection();

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

export default router;
