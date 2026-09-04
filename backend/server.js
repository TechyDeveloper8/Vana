const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS fallback
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io instance to Express app for route handlers to access
app.set('io', io);

// Socket.IO Connection & Room Management
io.on('connection', (socket) => {
  const handleJoin = ({ eventId, showtimeDate }) => {
    if (eventId) {
      const roomName = `${eventId}_${showtimeDate || 'Default'}`;
      socket.join(roomName);
    }
  };

  const handleLeave = ({ eventId, showtimeDate }) => {
    if (eventId) {
      const roomName = `${eventId}_${showtimeDate || 'Default'}`;
      socket.leave(roomName);
    }
  };

  socket.on('joinShowtime', handleJoin);
  socket.on('joinShowtimeRoom', handleJoin);
  socket.on('leaveShowtime', handleLeave);
  socket.on('leaveShowtimeRoom', handleLeave);
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ultra-lightweight keep-alive endpoints for free uptime monitors (cron-job.org / UptimeRobot)
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/ping', (req, res) => res.json({ status: 'active', time: Date.now() }));

// Serve static images from frontend public directory and parent images directory
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/seating', require('./routes/seatingRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/admin/staff', require('./routes/adminStaffRoutes'));

// Root test endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Running',
    message: 'Vana Entertainments MERN Backend API is active',
    version: '1.0.0'
  });
});

// 404 Fallback JSON Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Vana Backend API Server & Socket.IO running on port ${PORT}`);
});

