import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import managementRoutes from "./routes/managementRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { initializeCounter } from "./utils/empCodeUtils.js";
import { setupRabbitMQ } from "./queues/setup.js";
import { startEmailConsumer } from "./queues/consumers/emailConsumer.js";
import { startNotificationConsumer } from "./queues/consumers/notificationConsumer.js";
import "./jobs/reminderJob.js";

dotenv.config();

const requiredEnvVars = ["MONGODB_URI", "MONGODB_DB_NAME"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error("❌ ERROR: Missing required environment variables:");
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error(
    "\n💡 Please check your .env file and ensure all required variables are set.",
  );
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/GeneratedDocuments", express.static("GeneratedDocuments"));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/employees", managementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  initializeCounter();

  try {
    await setupRabbitMQ();
    await startEmailConsumer();
    await startNotificationConsumer();
    console.log("🐇 Notification system (RabbitMQ) ready");
  } catch (err) {
    console.error(
      "⚠️  RabbitMQ not available — running without notification system:",
      err.message,
    );
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`,
    );
  });
}

startServer();
