import { Router } from 'express';
import healthRouter from './health.route';
import datasetRouter from './dataset.route';
import facilitiesRouter from './facilities.route';
import indicatorsRouter from './indicators.route';
import visualizationsRouter from './visualizations.route';
import docsRouter from './docs.route';

const router = Router();

router.use('/', healthRouter);
router.use('/', datasetRouter);
router.use('/', facilitiesRouter);
router.use('/', indicatorsRouter);
router.use('/', visualizationsRouter);
router.use('/', docsRouter);

export default router;
