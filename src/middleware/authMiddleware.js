const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

/**
 * Protect middleware — verifies Bearer JWT token.
 *
 * Expected header:
 *   Authorization: Bearer <token>
 *
 * On success  → attaches req.admin and calls next()
 * On failure  → returns 401 Unauthorized JSON response
 */
const protect = async (req, res, next) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Use: Authorization: Bearer <token>',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is missing.',
            });
        }

        // 2. Verify token signature and expiration
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please log in again.',
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.',
            });
        }

        // 3. Check admin still exists in DB
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'The admin associated with this token no longer exists.',
            });
        }

        // 4. Attach admin to request object and proceed
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message,
        });
    }
};

module.exports = { protect };
