const dotenv = require('dotenv');
dotenv.config();
const required = (name) => { const value=String(process.env[name]||'').trim(); if(!value) throw new Error(`${name} is required. Configure it before starting the API.`); return value; };
const numberValue = (name, fallback) => { const value=Number(process.env[name]||fallback); if(!Number.isFinite(value)||value<=0) throw new Error(`${name} must be a positive number.`); return value; };
const nodeEnv=process.env.NODE_ENV||'development';
const corsOrigins=String(process.env.CORS_ORIGINS||(nodeEnv==='development'?'http://localhost:5173,http://localhost:4173':'')).split(',').map((item)=>item.trim().replace(/\/$/, '')).filter(Boolean);
if(nodeEnv==='production'&&!corsOrigins.length) throw new Error('CORS_ORIGINS is required in production.');
module.exports={
 port:numberValue('PORT',5000),nodeEnv,
 db:{host:process.env.DB_HOST||'localhost',port:numberValue('DB_PORT',3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'ahifambe_db'},
 jwt:{secret:required('JWT_SECRET'),expiresIn:process.env.JWT_EXPIRES_IN||'1d',algorithm:'HS256'},
 bcryptSaltRounds:numberValue('BCRYPT_SALT_ROUNDS',10),corsOrigins,
 authRateLimit:{windowMs:numberValue('AUTH_RATE_LIMIT_WINDOW_MS',900000),max:numberValue('AUTH_RATE_LIMIT_MAX',20)},
};