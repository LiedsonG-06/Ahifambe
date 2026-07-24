const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const AppError = require('./utils/AppError');
const securityHeaders = require('./middlewares/securityHeaders');
const { createRateLimiter } = require('./middlewares/rateLimitMiddleware');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const routeRoutes = require('./routes/routeRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const locationRoutes = require('./routes/locationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const userRoutes = require('./routes/userRoutes');
const rideRequestRoutes = require('./routes/rideRequestRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');

const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new AppError('Origin is not allowed by CORS.', 403));
  },
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
const authLimiter = createRateLimiter(env.authRateLimit);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ride-requests', rideRequestRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
