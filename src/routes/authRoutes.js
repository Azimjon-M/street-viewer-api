const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ════════════════════════════════════════════════════════════════
//  SWAGGER DOCUMENTATION
// ════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Admin login
 *     description: >
 *       Authenticate with email and password to receive a JWT Bearer token.
 *       The returned token must be included in the `Authorization` header for all protected endpoints:
 *       `Authorization: Bearer <token>`. Token expires in 7 days.
 *     operationId: loginAdmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             email: your@email.com
 *             password: "••••••••"
 *     responses:
 *       200:
 *         description: Login successful — JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               admin:
 *                 id: 64a1b2c3d4e5f6a7b8c9d0e1
 *                 email: admin@example.com
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email and password are required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new admin
 *     description: >
 *       Create a new admin account. Password is automatically hashed with bcrypt (salt rounds: 12).
 *       Returns a JWT token on success. **Disable this endpoint in production or protect it.**
 *     operationId: registerAdmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           example:
 *             email: newadmin@email.com
 *             password: "••••••••"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Admin with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: An admin with this email already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', protect, register);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current admin profile
 *     description: >
 *       Returns the profile of the currently authenticated admin.
 *       Requires a valid Bearer token in the Authorization header.
 *     operationId: getMe
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfileResponse'
 *             example:
 *               success: true
 *               admin:
 *                 id: 64a1b2c3d4e5f6a7b8c9d0e1
 *                 email: admin@example.com
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized — token missing, invalid, or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', protect, getMe);

module.exports = router;
