import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  createVirtualAccount, 
  getVirtualAccount, 
  paymentWebhook,
  syncVirtualAccounts
} from '../controllers/paymentPoint.controller.js';

const router = express.Router();

// Stricter rate limit for creating virtual accounts: max 5 attempts per hour per IP
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many account creation attempts. Please try again in an hour.' }
});

// Protected routes (require authentication)
router.post(
  '/create-virtual-account',
  authMiddleware,
  createAccountLimiter,
  createVirtualAccount
);

router.get(
  '/virtual-account',
  authMiddleware,
  getVirtualAccount
);

// Public webhook endpoint (no auth required)
router.post(
  '/webhook',
  paymentWebhook
);

// Sync missing bank accounts for existing virtual account holders
router.post(
  '/sync-virtual-accounts',
  authMiddleware,
  syncVirtualAccounts
);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'PaymentPoint routes are working',
    endpoints: {
      createVirtualAccount: 'POST /api/payment-point/create-virtual-account',
      getVirtualAccount: 'GET /api/payment-point/virtual-account',
      syncVirtualAccounts: 'POST /api/payment-point/sync-virtual-accounts',
      webhook: 'POST /api/payment-point/webhook'
    }
  });
});

export default router;
