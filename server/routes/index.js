import { Router } from "express";
import simulationRoutes from './simulation.routes.js';
import logsRoutes from './logs.routes.js';

const router = Router();

router.use('/simulation', simulationRoutes);
router.use('/logs', logsRoutes);

export default router;