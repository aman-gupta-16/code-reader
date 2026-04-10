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

if (!mongoUri) {
  throw new Error("MONGODB_URI must be configured.");
}

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), "uploads");
await fs.mkdir(uploadsDir, { recursive: true });

/**
 * ✅ Proper CORS configuration
 */
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

// ✅ Updated CORS for both local + ngrok
const allowedOrigins = [
  "http://localhost:5173",
  "https://synonymous-cespitose-bethanie.ngrok-free.dev",   // ← Add your current ngrok URL
  "https://codeshare12.netlify.app",                       // production if needed
];

app.use(
  cors({
    // origin: function (origin, callback) {
    //   // Allow requests with no origin (Postman, curl, mobile apps, etc.)
    //   if (!origin) return callback(null, true);

    //   if (allowedOrigins.includes(origin)) {
    //     return callback(null, true);
    //   }

    //   console.warn(`CORS blocked origin: ${origin}`);
    //   return callback(new Error("Not allowed by CORS"));
    // },
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"], // important for ngrok
    credentials: true,   // if you use cookies/auth
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Rest of your code (body parsers, health check, routes, etc.) remains the same...

/**
 * ✅ Body parsers
 */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * ✅ Health check
 */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "client-review-panel-api" });
});

/**
 * ✅ Routes
 */
app.use("/api/admin", adminRoutes);
app.use("/api/client", clientRoutes);

/**
 * ❌ REMOVE your old manual CORS header error handler
 * ✅ Clean error handler
 */
app.use((error, req, res, _next) => {
  const status = Number(error.statusCode ?? 500);

  console.error("❌ Error:", error.message);

  res.status(status).json({
    message: error.message || "Unexpected server error.",
  });
});

/**
 * ✅ Start server AFTER DB connection
 */
await connectDatabase(mongoUri);

app.listen(port, () => {
  console.log(`🚀 API server running on http://localhost:${port}`);
});