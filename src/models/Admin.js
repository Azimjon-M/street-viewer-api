const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Admin Schema ─────────────────────────────────────────────
const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // never returned in query results by default
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ─── Pre-save hook: hash password ─────────────────────────────
adminSchema.pre('save', async function (next) {
    // Only hash when password field is modified (new or changed)
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ─── Instance method: compare passwords ───────────────────────
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
