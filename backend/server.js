import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { initializeCounter } from './utils/empCodeUtils.js';
import { setupRabbitMQ } from './queues/setup.js';
import { startEmailConsumer } from './queues/consumers/emailConsumer.js';
import { startNotificationConsumer } from './queues/consumers/notificationConsumer.js';
import './jobs/reminderJob.js';  // registers cron on import

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'MONGODB_DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const app = express();


// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/GeneratedDocuments', express.static('GeneratedDocuments'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Initialize employee code counter
  initializeCounter();

  // Start RabbitMQ — setup exchange/queues, then start consumers
  try {
    await setupRabbitMQ();
    await startEmailConsumer();
    await startNotificationConsumer();
    console.log('🐇 Notification system (RabbitMQ) ready');
  } catch (err) {
    console.error('⚠️  RabbitMQ not available — running without notification system:', err.message);
    console.error('   Set RABBITMQ_URL in .env to enable automated HR reminders.');
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  });
}

startServer();
