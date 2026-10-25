import { Router } from 'express';
import healthRouter from './health.route';
import datasetRouter from './dataset.route';

const router = Router();

router.use('/', healthRouter);
router.use('/', datasetRouter);

export default router;

