const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const sceneRoutes = require('./routes/sceneRoutes');
const miniMapRoutes = require('./routes/miniMapRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Module-scoped route imports
const moduleRoutes = require('./routes/moduleRoutes');
const moduleSceneRoutes = require('./routes/moduleSceneRoutes');
const moduleMiniMapRoutes = require('./routes/moduleMiniMapRoutes');
const moduleUploadRoutes = require('./routes/moduleUploadRoutes');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─── Global Middleware ────────────────────────────────────────

const whitelistStr = process.env.WHITELISTED_DOMAINS || '*';
// Normalize whitelist by removing trailing slashes (but preserve solitary '*')
const whitelist = whitelistStr.split(',').map(d => {
    const trimmed = d.trim();
    if (trimmed === '*') return '*';
    return trimmed.replace(/[\/]+$/, '');
});

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.includes('*')) {
            return callback(null, true);
        }
        
        // Normalize incoming origin
        const normalizedOrigin = origin.replace(/\/+$/, '');
        if (whitelist.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.error(`CORS Blocked: ${origin}`);
            callback(new Error(`Not allowed by CORS Policy: ${origin}`));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ extended: true, limit: '70mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Swagger UI ───────────────────────────────────────────────
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Street Viewer API Docs',
        customCss: `
            .swagger-ui .topbar { background-color: #1a1a2e; }
            .swagger-ui .topbar-wrapper img { content: url(''); width: 0; }
            .swagger-ui .topbar-wrapper::after {
                content: '🌐 Street Viewer API';
                color: #ffffff;
                font-size: 1.4rem;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            .swagger-ui .info .title { color: #0f3460; }
            .swagger-ui .scheme-container { background: #f8f9fa; padding: 16px; border-radius: 8px; }
        `,
        swaggerOptions: {
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
            persistAuthorization: true,
        },
    })
);

// ─── Swagger JSON endpoint ─────────────────────────────────────
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🌐 Street Viewer API is running',
        version: '2.0.0',
        docs: '/api-docs',
        endpoints: {
            modules: '/api/modules',
            auth: '/api/auth',
            scenes: '/api/scenes',
            minimap: '/api/minimap',
            upload: '/api/upload',
        },
    });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server health check
 *     description: Returns the current server status and timestamp. Use this to verify the API is running.
 *     operationId: healthCheck
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Modul routelari (yangi)
app.use('/api/modules', moduleRoutes);
app.use('/api/modules/:moduleSlug/scenes', moduleSceneRoutes);
app.use('/api/modules/:moduleSlug/minimap', moduleMiniMapRoutes);
app.use('/api/modules/:moduleSlug/upload', moduleUploadRoutes);

// Eski routelar (backward compatibility — default modul)
app.use('/api/scenes', sceneRoutes);
app.use('/api/minimap', miniMapRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
