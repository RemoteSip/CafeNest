const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Added for path operations
const { optionalAuth } = require('./middleware/auth');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for development, enable in production
}));
app.use(compression()); // Compress responses
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Apply optional authentication to API routes
app.use('/api', optionalAuth);

// API Routes
const cafeRoutes = require('./routes/cafeRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/cafes', cafeRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static frontend files - added to serve frontend assets
// Note the correct paths for frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Handle frontend routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next(); // Skip for API routes
  }
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = app; // For testing