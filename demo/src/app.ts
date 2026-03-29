import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billpaymentRoutes from "./routes/billpayment.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import promotionsRoutes from "./routes/promotions.routes.js";
import supportRoutes from "./routes/support.routes.js";
import supportContentRoutes from "./routes/support_content.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import usersRoutes from "./routes/users.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Import logging middleware
import { config, logger } from "./config/bootstrap.js";
import { detailedRequestLogger, errorLogger, requestLogger } from "./middleware/logger.middleware.js";

const app = express();

// CORS Configuration - Production: restrict to configured origin
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
}));

app.use(['/api/payment/webhook', '/api/payment/payrant/webhook'], express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json());

// ============================================
// LOGGING MIDDLEWARE
// ============================================
// Log all incoming requests with details
app.use(detailedRequestLogger);

// Morgan logger for standard HTTP request logging
app.use(requestLogger);

logger.info('🚀 VTU App Backend Starting...', {
  environment: config.nodeEnv,
  nodeVersion: process.version
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/billpayment", billpaymentRoutes);
app.use("/api/support-content", supportContentRoutes);


// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("✅ Connecta Backend (MongoDB) is running matches...");
});

// API Base route to avoid 404
app.get("/api", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Connecta API is active",
    version: "1.0.0",
    health: "/health"
  });
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});



// ============================================
// ERROR HANDLING
// ============================================
// Log errors
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

export default app;
