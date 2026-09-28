import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./Configs/database"; 
import authRouter from "./Routers/AuthRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// ================================
// Configuration
// ================================

const PORT = process.env.PORT || 8000;

// ================================
// Security Middleware
// ================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ================================
// CORS
// ================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ================================
// Body Parsers
// ================================

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);
// ================================
// Express JSON parser
// ================================
app.use(express.json());
// ================================
// Cookies
// ================================
app.use(cookieParser());

// ================================
// Logging
// ================================

app.use(morgan("dev"));

// ================================
// ROUTERSS
// ================================




app.use("/api/v1/auth", authRouter);

// ================================
// Health Check
// ================================

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "The Market API is running",
  });
});

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "The Market API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ================================
// 404 Handler
// ================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================================
// Global Error Handler
// ================================

app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

// ================================
// Start Server
// ================================
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`The Market API running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
};

startServer();