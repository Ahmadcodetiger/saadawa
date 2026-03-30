import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

// Import routes with .js extension (required for Node16 module resolution)
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billpaymentRoutes from "./routes/billpayment.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import paymentPointRoutes from "./routes/paymentPoint.routes.js";
import promotionsRoutes from "./routes/promotions.routes.js";
import supportRoutes from "./routes/support.routes.js";
import supportContentRoutes from "./routes/support_content.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import usersRoutes from "./routes/users.routes.js";
import virtualAccountRoutes from "./routes/virtualAccount.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

// Import logging middleware with .js extension
import { logger } from "./config/bootstrap.js";
import { detailedRequestLogger, errorLogger, requestLogger } from "./middleware/logger.middleware.js";

dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration - Restrict to trusted origins in production
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:19000', 'http://localhost:19006', 'http://localhost:8081'];
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-Requested-With'],
  credentials: true
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// Stricter Rate Limiting for Auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit each IP to 10 login/register attempts per hour
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again in an hour.' }
});
app.use('/api/auth/', authLimiter);


// Webhook routes need raw body parser
app.use(
  ['/api/payment-point/webhook'],
  express.raw({ type: 'application/json' })
);


// Parse JSON for all other routes
app.use(express.json());

// ============================================
// LOGGING MIDDLEWARE
// ============================================
app.use(detailedRequestLogger);
app.use(requestLogger);

logger.info('🚀 VTU App Backend Starting...', {
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version
});

// ============================================
// ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payment-point", paymentPointRoutes);
app.use("/api/billpayment", billpaymentRoutes);
app.use("/api/support-content", supportContentRoutes);
app.use("/api/virtual-accounts", virtualAccountRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("✅ Connecta Backend (MongoDB) is running...");
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorLogger);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("❌ Unhandled Error:", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  console.error('\n🔴 ERROR DETAILS:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('\n');

  // Check if it's an Axios error from a provider call
  const axiosResponse = (err as any).response;
  if (axiosResponse) {
    const status = axiosResponse.status || 500;
    const providerMsg = axiosResponse.data?.errors?.[0]
      || axiosResponse.data?.message
      || axiosResponse.data?.msg
      || err.message;
    return res.status(status).json({
      success: false,
      message: providerMsg,
      error: `Request failed with status code ${status}`,
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server error. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

export default app;
