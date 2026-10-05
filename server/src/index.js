import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import roundRoutes from './routes/roundRoutes.js';
import adminTeamRoutes from './routes/adminTeamRoutes.js';
import adminManagementRoutes from './routes/adminManagementRoutes.js';
import round1GameRoutes from './routes/round1GameRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import helpRoutes from './routes/helpRoutes.js';

// Load environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Initialize Database Connection
connectDB();

// Core Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// API Health Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Aarohan Multi-Round Platform Backend Operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/rounds', roundRoutes);
app.use('/api/v1/admin/teams-mgmt', adminTeamRoutes);
app.use('/api/v1/admin/mgmt', adminManagementRoutes);
app.use('/api/v1/game/r1', round1GameRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/help', helpRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

import http from 'http';
import { initSocket } from './services/socketService.js';

// Start Server with Socket.IO Attached
const httpServer = http.createServer(app);
initSocket(httpServer, CLIENT_ORIGIN);

httpServer.listen(PORT, () => {
  console.log(`[Aarohan Server] Listening on http://localhost:${PORT} with Socket.IO Real-Time Engine`);
  console.log(`[Aarohan Server] Client Origin Allowed: ${CLIENT_ORIGIN}`);
});
