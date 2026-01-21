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
const allowedOrigins = [
    'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
    'https://dtv2405.id.vn', 'https://www.dtv2405.id.vn', 'https://backend-api.onrender.com', 'https://api.dtv2405.id.vn',
    process.env.FRONTEND_URL, process.env.RENDER_EXTERNAL_URL,
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
        callback(new Error('CORS: Origin not allowed'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.disable('x-powered-by');
app.use(helmet({ frameguard: { action: 'deny' }, contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(responseTimeMiddleware);
if (isDevelopment && process.env.MORGAN_ENABLED === 'true') {
    app.use(morgan('dev'));
}

const sessionSecret = process.env.SESSION_SECRET;
app.use(session({
    secret: sessionSecret || 'your-session-secret-change-in-production',
    resave: false, saveUninitialized: false,
    cookie: { secure: !isDevelopment, httpOnly: true, sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

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
    maxAge: '1y', etag: true, lastModified: true,
    setHeaders: (res) => {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Swagger documentation - Mount TRƯỚC authMiddleware để không cần token
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Enable Swagger trong development hoặc khi ENABLE_SWAGGER=true, hoặc khi NODE_ENV không được set (default development)
const shouldEnableSwagger = isDevelopment || process.env.ENABLE_SWAGGER === 'true' || !process.env.NODE_ENV;

if (shouldEnableSwagger) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'API Documentation'
    }));
    console.log(`[SWAGGER] Documentation available at http://localhost:${port}/api/docs`);
}

app.use(authMiddleware);

const router = require('./routes/index');
router(app);

app.use((req, res) => res.status(404).json({ success: false, message: 'API endpoint not found', path: req.path }));

app.use((err, req, res) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error('[ERROR]', err.message);
    res.status(status).json({
        success: false, message: err.message || 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack, path: req.path })
    });
});

async function startServer() {
    try {
        try {
            await mongooseDB.connectDB();
        } catch (dbError) {
            if (!isDevelopment) {
                console.error('[ERROR] Database connection required in production');
                process.exit(1);
            }
        }
        
        const io = new Server(server, {
            cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
            pingTimeout: 60000, pingInterval: 25000
        });
        initializeSocket(io);
        
        server.listen(port, () => {
            console.log(`[SERVER] Running on port ${port}`);
        }).on('error', (err) => {
            console.error(`[ERROR] ${err.code === 'EADDRINUSE' ? `Port ${port} already in use` : err.message}`);
            process.exit(1);
        });
    } catch (error) {
        console.error('[ERROR]', error.message);
        process.exit(1);
    }
}

const gracefulShutdown = (signal) => {
    server.close(() => process.exit(0));
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app;

