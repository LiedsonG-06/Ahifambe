const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

const startServer = async () => {
  try {
    await testConnection();
    console.log(`MySQL connected to database "${env.db.database}"`);

    app.listen(env.port, () => {
      console.log(`Ahifambe API running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start Ahifambe API:', error.message);
    process.exit(1);
  }
};

startServer();
