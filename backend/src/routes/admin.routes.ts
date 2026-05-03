import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import AdminFundingController from '../controllers/admin_funding.controller.js';
import AdminPricingController from '../controllers/admin_pricing.controller.js';
import AdminProviderController from '../controllers/admin_provider.controller.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes
router.post('/login', AdminController.login);
router.get('/dashboard', authMiddleware, authorize(['admin']), AdminController.getDashboardStats);
// Admin profile
router.put('/profile', authMiddleware, authorize(['admin', 'super_admin']), AdminController.updateAdminProfile);
router.put('/profile/password', authMiddleware, authorize(['admin', 'super_admin']), AdminController.changeAdminPassword);

// Admin user management
router.post('/admins', authMiddleware, authorize(['super_admin']), AdminController.createAdminUser);
router.get('/admins', authMiddleware, authorize(['super_admin']), AdminController.getAllAdmins); // Keeping this as it's not explicitly removed
router.get('/roles', authMiddleware, authorize(['super_admin', 'admin']), AdminController.getRoles);

// User management
router.get('/users', authMiddleware, authorize(['admin', 'super_admin']), AdminController.getAllUsers);
router.get('/users/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminController.getUserById);
router.put('/users/:id/status', authMiddleware, authorize(['admin', 'super_admin']), AdminController.updateUserStatus);
router.put('/users/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminController.updateUser);
router.delete('/users/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminController.deleteUser);
router.post('/users/:id/api-key', authMiddleware, authorize(['admin', 'super_admin']), AdminController.generateApiKey);
router.delete('/users/:id/api-key', authMiddleware, authorize(['admin', 'super_admin']), AdminController.revokeApiKey);

// Pricing Management for Developers
router.get('/plans', authMiddleware, authorize(['admin', 'super_admin']), AdminController.getPlans);
router.put('/plans/:id/developer-price', authMiddleware, authorize(['admin', 'super_admin']), AdminController.updatePlanDeveloperPrice);

// Wallet management
router.post('/wallet/credit', authMiddleware, authorize(['super_admin']), AdminController.creditUserWallet);

// Audit logs
router.get('/audit-logs', authMiddleware, authorize(['super_admin']), AdminController.getAuditLogs);
router.delete('/audit-logs/:id', authMiddleware, authorize(['super_admin']), AdminController.deleteAuditLog);

// Pricing management
router.get('/pricing', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.getAllPlans);
router.get('/pricing/provider/:providerId', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.getPlansByProvider);
router.get('/pricing/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.getPlanById);
router.post('/pricing', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.createPlan);
router.put('/pricing/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.updatePlan);
router.delete('/pricing/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.deletePlan);
router.post('/pricing/bulk-import', authMiddleware, authorize(['admin', 'super_admin']), AdminPricingController.bulkImportPlans);

// Provider balances (place BEFORE parameterized provider routes)
router.get('/providers/balances', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.getProviderBalances);

// Provider testing routes (place BEFORE parameterized provider routes)
router.post('/providers/test/:code', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.testConnection);
router.get('/providers/data/:code', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.getProviderData);

// Provider management
router.get('/providers', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.list);
router.get('/providers/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.getById);
router.post('/providers', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.create);
router.put('/providers/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.update);
router.delete('/providers/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminProviderController.remove);
router.get('/providers/:id/env', authMiddleware, authorize(['super_admin']), AdminProviderController.getEnv);
router.put('/providers/:id/env', authMiddleware, authorize(['super_admin']), AdminProviderController.updateEnv);

// Funding info
router.get('/funding/info', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.getFundingInfo);
router.get('/funding/accounts', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.listAccounts);
router.post('/funding/accounts', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.createAccount);
router.put('/funding/accounts/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.updateAccount);
router.delete('/funding/accounts/:id', authMiddleware, authorize(['admin', 'super_admin']), AdminFundingController.deleteAccount);

// Support content management
router.get('/support-content', authMiddleware, authorize(['admin', 'super_admin']), async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.getContent(req, res);
});
router.put('/support-content', authMiddleware, authorize(['admin', 'super_admin']), async (req, res, next) => {
    const { SupportContentController } = await import('../controllers/support_content.controller.js');
    return SupportContentController.updateContent(req, res);
});

// Broadcast Notifications
router.post('/notifications/broadcast', authMiddleware, authorize(['admin', 'super_admin']), async (req, res) => {
    const { NotificationController } = await import('../controllers/notification.controller.js');
    return NotificationController.sendBroadcastNotification(req, res);
});
router.delete('/notifications/broadcast/:id', authMiddleware, authorize(['admin', 'super_admin']), async (req, res) => {
    const { NotificationController } = await import('../controllers/notification.controller.js');
    return NotificationController.deleteBroadcast(req, res);
});
router.get('/notifications/broadcast', authMiddleware, authorize(['admin', 'super_admin']), async (req, res) => {
    const { NotificationController } = await import('../controllers/notification.controller.js');
    return NotificationController.getBroadcasts(req, res);
});
router.put('/notifications/broadcast/:id', authMiddleware, authorize(['admin', 'super_admin']), async (req, res) => {
    const { NotificationController } = await import('../controllers/notification.controller.js');
    return NotificationController.updateBroadcast(req, res);
});

export default router;
