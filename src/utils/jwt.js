const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for an admin.
 * @param {string} adminId - MongoDB _id of the admin document
 * @returns {string} Signed JWT string
 */
const generateToken = (adminId) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token - Raw JWT string
 * @returns {{ id: string, iat: number, exp: number }} Decoded payload
 * @throws Will throw if token is invalid or expired
 */
const verifyToken = (token) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
