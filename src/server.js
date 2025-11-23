/**
 * Backend API Server
 */
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const mongooseDB = require('./config/db/mongoose');
const authMiddleware = require('./app/middlewares/auth.middleware');
const responseTimeMiddleware = require('./app/middlewares/responseTime.middleware');
const { passport } = require('./config/passport');
const { initializeSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://dtv2405.id.vn',
    'https://www.dtv2405.id.vn',
    'https://backend-api.onrender.com',
    'https://api.dtv2405.id.vn',
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : null
].filter(Boolean);

const allowedOriginsSet = new Set(allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOriginsSet.has(origin)) {
            return callback(null, true);
        }
        const isAllowed = allowedOrigins.some(allowed => {
            if (!allowed || origin === allowed) return origin === allowed;
            return origin.endsWith(allowed.replace(/^https?:\/\//, ''));
        });
        if (isAllowed) return callback(null, true);
        if (isDevelopment) console.error('❌ CORS: Origin not allowed:', origin);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
// Security & Middleware
app.disable('x-powered-by');
app.use(helmet({
    frameguard: { action: 'deny' },
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(responseTimeMiddleware);

// Logging (only in development)
if (isDevelopment || process.env.MORGAN_ENABLED === 'true') {
    morgan.token('response-time-color', (req, res) => {
        const timeMs = res.responseTime || (parseFloat(res['response-time']) * 1000) || 0;
        if (timeMs < 100) return `\x1b[32m${Math.round(timeMs)}ms\x1b[0m`;
        if (timeMs < 500) return `\x1b[33m${Math.round(timeMs)}ms\x1b[0m`;
        if (timeMs < 1000) return `\x1b[35m${Math.round(timeMs)}ms\x1b[0m`;
        return `\x1b[31m${Math.round(timeMs)}ms\x1b[0m`;
    });
    app.use(morgan(':method :url :status :response-time-color :res[content-length]'));
}

// Session
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && !isDevelopment) {
    console.warn('⚠️  Warning: SESSION_SECRET not set. Using default (not secure!)');
}
app.use(session({
    secret: sessionSecret || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !isDevelopment,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Static Files
app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || allowedOriginsSet.has(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
}, express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

app.use(authMiddleware);

// Routes
const router = require('./routes/index');
router(app);

// Error Handling
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    
    if (status >= 500) {
        console.error('❌ Server Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
    } else if (isDevelopment) {
        console.warn('⚠️  Client Error:', { message: err.message, status, path: req.path });
    }
    
    if (err.message?.includes('CORS') && isDevelopment) {
        console.error('❌ CORS Error:', { origin: req.headers.origin, method: req.method, path: req.path });
    }
    
    res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack, path: req.path })
    });
});

// Server Initialization
async function startServer() {
    try {
        console.log('🔄 Starting Backend API Server...');
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // MongoDB Connection
        try {
            await mongooseDB.connectDB();
            console.log('✅ Database connection established');
        } catch (dbError) {
            console.error('❌ MongoDB connection failed:', dbError.message);
            if (!isDevelopment) {
                console.error('❌ Exiting: Database connection required in production');
                process.exit(1);
            }
            console.warn('⚠️  Server will continue but database operations will fail');
        }
        
        // Socket.IO
        const io = new Server(server, {
            cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        initializeSocket(io);
        console.log('✅ Socket.IO initialized');

        // Start Server
        server.listen(port, () => {
            console.log(`✅ Backend API Server running on http://localhost:${port}`);
            console.log(`✅ Socket.IO server running on ws://localhost:${port}`);
            if (isDevelopment) {
                console.log(`📍 Allowed origins: ${allowedOrigins.join(', ')}`);
            }
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use`);
                console.error(`💡 Solution: Run "npm run kill:port" or kill the process manually`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful Shutdown
const gracefulShutdown = (signal) => {
    console.log(`🛑 ${signal} received, shutting down gracefully...`);
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app;

