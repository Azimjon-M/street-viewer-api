require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startCleanupScheduler } = require('./config/scheduler');
const { ensureDefaultMiniMap } = require('./controllers/miniMapController');
const { ensureAtLeastOneModule, migrateModuleReferences } = require('./controllers/moduleController');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const os = require('os');

function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return HOST;
}

// Connect to MongoDB, then start the server
const startServer = async () => {
    await connectDB();

    // ─── Ensure at least one module exists ─────────────────────────
    await ensureAtLeastOneModule();

    // ─── Ensure MiniMap for first module ────────────────────────────
    const Module = require('./models/Module');
    const firstMod = await Module.findOne().sort({ order: 1, createdAt: 1 });
    if (firstMod) {
        await ensureDefaultMiniMap(firstMod.slug);
    }

    // ─── Migratsiya: moduleSlug → moduleId ─────────────────────
    await migrateModuleReferences();

    app.listen(PORT, HOST, () => {
        const networkIp = getNetworkIp();
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  🌐  Street Viewer API  v2.0.0 (Multi-Module)`);
        console.log(`  🚀  Local:        http://localhost:${PORT}`);
        console.log(`  🚀  Network:      http://${networkIp}:${PORT}`);
        console.log(`  📚  Swagger Docs: http://${networkIp}:${PORT}/api-docs`);
        console.log(`  📦  Environment:  ${process.env.NODE_ENV || 'development'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('  📦 Module endpoints:');
        console.log(`    GET    /api/modules`);
        console.log(`    GET    /api/modules/:slug`);
        console.log(`    POST   /api/modules`);
        console.log(`    PATCH  /api/modules/:slug`);
        console.log(`    DELETE /api/modules/:slug`);
        console.log('');
        console.log('  🔓 Module-scoped public endpoints:');
        console.log(`    GET    /api/modules/:slug/scenes`);
        console.log(`    GET    /api/modules/:slug/scenes/:id`);
        console.log(`    GET    /api/modules/:slug/minimap`);
        console.log('');
        console.log('  🔒 Module-scoped protected endpoints:');
        console.log(`    POST   /api/modules/:slug/scenes`);
        console.log(`    PATCH  /api/modules/:slug/scenes/:id`);
        console.log(`    DELETE /api/modules/:slug/scenes/:id`);
        console.log(`    POST   /api/modules/:slug/minimap`);
        console.log(`    PATCH  /api/modules/:slug/minimap`);
        console.log(`    POST   /api/modules/:slug/upload/scene-images`);
        console.log(`    POST   /api/modules/:slug/upload/minimap-image`);
        console.log('');
        console.log('  📁 Legacy endpoints (default module):');
        console.log(`    GET|POST|PATCH|DELETE  /api/scenes[/:id]`);
        console.log(`    GET|POST|PATCH         /api/minimap`);
        console.log(`    POST                   /api/upload/*`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        // ─── Start automatic cleanup scheduler ────────────────
        startCleanupScheduler();
    });
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (err) => {
    console.error(`💥 Unhandled rejection: ${err.message}`);
    process.exit(1);
});

startServer();
