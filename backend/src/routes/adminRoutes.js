import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

// Apply Authentication & Admin Authorization to all /api/admin/* routes
router.use(requireAuth, requireAdmin);

// 1. Live System Statistics
router.get('/stats', AdminController.getStats);

// 2. User Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/verification', AdminController.verifyOfficial);

// 3. Department Management
router.get('/departments', AdminController.getDepartments);
router.post('/departments', AdminController.createDepartment);
router.patch('/departments/:id', AdminController.updateDepartment);

// 4. Grievance Oversight & Manual Assignment
router.get('/grievances', AdminController.getGrievances);
router.get('/grievances/:id', AdminController.getGrievanceById);
router.patch('/grievances/:id/department', AdminController.manualAssignDepartment);

// 5. AI Semantic Routing Oversight
router.get('/ai-routings', AdminController.getAIRoutings);
router.get('/ai-routings/flagged', AdminController.getFlaggedAIRoutings);

export default router;
