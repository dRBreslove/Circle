const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 failed login attempts per hour
    message: 'Too many failed login attempts, please try again later.'
});

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Input validation middleware
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Security middleware setup
const setupSecurity = (app) => {
    // Basic security headers
    app.use(helmet());

    // CORS
    app.use(cors(corsOptions));

    // CSRF protection
    app.use(csrf({ cookie: true }));

    // Rate limiting
    app.use('/api/', apiLimiter);
    app.use('/api/auth/login', authLimiter);

    // Request validation
    app.use('/api/auth/register', [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 })
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        validateInput
    ]);

    // Error handling
    app.use((err, req, res, next) => {
        if (err.code === 'EBADCSRFTOKEN') {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        next(err);
    });

    // Security headers for all responses
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        next();
    });
};

module.exports = setupSecurity; 