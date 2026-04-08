const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');

// ─── POST /api/auth/login ──────────────────────────────────────
// Authenticate admin and return JWT token
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Find admin by email (include password field explicitly since it's select:false)
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Compare plaintext password against stored hash
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate JWT token
        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                createdAt: admin.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
};

// ─── POST /api/auth/register ───────────────────────────────────
// Register a new admin (should be disabled or protected in production)
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Check for existing admin
        const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'An admin with this email already exists',
            });
        }

        // Create admin (password is hashed in pre-save hook)
        const admin = await Admin.create({ email, password });

        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                createdAt: admin.createdAt,
            },
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message,
        });
    }
};

// ─── GET /api/auth/me ──────────────────────────────────────────
// Return currently authenticated admin profile (protected)
const getMe = async (req, res) => {
    try {
        // req.admin is attached by the protect middleware
        res.status(200).json({
            success: true,
            admin: {
                id: req.admin._id,
                email: req.admin.email,
                createdAt: req.admin.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message,
        });
    }
};

module.exports = { login, register, getMe };
