const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const routeRoutes = require('./routes/routeRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
