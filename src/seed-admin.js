/**
 * Admin Seed Script
 * Creates the default admin account if it doesn't already exist.
 *
 * Usage:
 *   node src/seed-admin.js
 *   or: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'password';

        // Check if admin already exists
        const existing = await Admin.findOne({ email });
        if (existing) {
            console.log(`ℹ️  Admin already exists: ${email}`);
            process.exit(0);
        }

        // Create admin (password hashed via pre-save hook)
        const admin = await Admin.create({ email, password });
        console.log('');
        console.log('🎉 Admin created successfully!');
        console.log('─────────────────────────────');
        console.log(`   Email   : ${admin.email}`);
        console.log(`   Password: ${password}`);
        console.log(`   ID      : ${admin._id}`);
        console.log('─────────────────────────────');
        console.log('');
        console.log('👉 Use POST /api/auth/login to get your JWT token.');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();
