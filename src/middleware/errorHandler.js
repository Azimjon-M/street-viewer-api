/**
 * Global error handling middleware.
 * Catches any error passed via next(err) and formats a uniform JSON response.
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack || err.message}`);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource ID format',
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for field: ${field}`,
        });
    }

    // Mongoose validation
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: messages,
        });
    }

    // Multer file type rejection
    if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Multer file size limit
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum allowed size is 50 MB.',
        });
    }

    // Default server error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

module.exports = { errorHandler, notFound };
