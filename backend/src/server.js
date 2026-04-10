import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI;

console.log("🚀 Server starting...");

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), "uploads");
await fs.mkdir(uploadsDir, { recursive: true });
console.log("📁 Uploads directory ensured at:", uploadsDir);

// ✅ CORS Configuration with heavy logging
const allowedOrigins = [
  "http://localhost:5173",
  "https://synonymous-cespitose-bethanie.ngrok-free.dev",
  "https://codeshare12.netlify.app",
];

console.log("📋 Allowed Origins:", allowedOrigins);

app.use((req, res, next) => {
  console.log(`\n🔍 [REQUEST] ${req.method} ${req.url}`);
  console.log(`   Origin: ${req.headers.origin || "No origin (like Postman)"}`);
  console.log(`   Referer: ${req.headers.referer || "None"}`);
  console.log(`   User-Agent: ${req.headers["user-agent"]?.substring(0, 100)}...`);
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(`\n🔎 CORS Middleware triggered for origin: ${origin || "undefined (no origin)"}`);

      if (!origin) {
        console.log("✅ No origin → Allowed (Postman, curl, etc.)");
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log(`✅ Origin ALLOWED: ${origin}`);
        return callback(null, true);
      }

      console.log(`❌ Origin BLOCKED: ${origin}`);
      console.log(`   Allowed origins were:`, allowedOrigins);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Log after CORS is applied
app.use((req, res, next) => {
  console.log("✅ CORS middleware passed successfully");
  next();
});

/**
 * ✅ Body parsers
 */
app.use(express.json({ limit: "2mb" }));
console.log("📦 Body parser (JSON) enabled");

app.use(express.urlencoded({ extended: true }));
console.log("📦 Body parser (URL-encoded) enabled");

/**
 * ✅ Health check
 */
app.get("/api/health", (req, res) => {
  console.log("✅ Health check endpoint hit");
  res.json({ ok: true, service: "client-review-panel-api" });
});

/**
 * ✅ Routes
 */
app.use("/api/admin", adminRoutes);
console.log("🛠️ Admin routes mounted at /api/admin");

app.use("/api/client", clientRoutes);
console.log("🛠️ Client routes mounted at /api/client");

/**
 * ✅ Global Error Handler
 */
app.use((error, req, res, next) => {
  console.error("\n❌ ERROR HANDLER TRIGGERED:");
  console.error(`   Message: ${error.message}`);
  console.error(`   Stack: ${error.stack?.substring(0, 300)}...`);

  const status = Number(error.statusCode ?? 500);
  res.status(status).json({
    message: error.message || "Unexpected server error.",
  });
});

/**
 * ✅ 404 Handler
 */
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// Start server AFTER DB connection
console.log("🔌 Connecting to MongoDB...");
await connectDatabase(mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

app.listen(port, () => {
  console.log(`\n🎉 Server is running on http://localhost:${port}`);
  console.log(`📡 Ngrok URL (if running): https://synonymous-cespitose-bethanie.ngrok-free.dev`);
});