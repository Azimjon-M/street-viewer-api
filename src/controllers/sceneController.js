const mongoose = require('mongoose');
const Scene = require('../models/Scene');
const MiniMap = require('../models/MiniMap');
const Module = require('../models/Module');

// ─── Helper: moduleSlug dan moduleId ni olish ─────────────────
const resolveModule = async (req) => {
    const slug = req.params.moduleSlug || 'default';
    const mod = await Module.findOne({ slug });
    return mod;
};

// ─── Helper: pin id larni avtomatik to'ldirish ────────────────
const normalizePins = (pins = []) =>
    pins.map((pin) => ({
        ...pin,
        id: pin.id && pin.id.trim() ? pin.id.trim() : new mongoose.Types.ObjectId().toHexString(),
        // 'circle' → 'info' migratsiya (backward compat)
        icon: pin.icon === 'circle' ? 'info' : (pin.icon || 'pin'),
    }));

// ─── GET /scenes ──────────────────────────────────────────────
// Modul bo'yicha barcha sahnalarni olish
const getAllScenes = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" slug li modul topilmadi`,
            });
        }

        const scenes = await Scene.find({ moduleId: mod._id }).sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            count: scenes.length,
            data: scenes,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scenes',
            error: error.message,
        });
    }
};

// ─── GET /scenes/:id ─────────────────────────────────────────
// Modul ichidan bitta sahnani olish
const getSceneById = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" slug li modul topilmadi`,
            });
        }

        const scene = await Scene.findOne({ moduleId: mod._id, id: req.params.id });
        if (!scene) {
            return res.status(404).json({
                success: false,
                message: `Scene with id "${req.params.id}" not found in module "${mod.slug}"`,
            });
        }
        res.status(200).json({
            success: true,
            data: scene,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scene',
            error: error.message,
        });
    }
};

// ─── POST /scenes ────────────────────────────────────────────
// Modul ichida yangi sahna yaratish
const createScene = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" slug li modul topilmadi`,
            });
        }

        // Auto-generate ID if not provided
        if (!req.body.id || typeof req.body.id !== 'string' || req.body.id.trim() === '') {
            const existingScenes = await Scene.find({ moduleId: mod._id }, { id: 1 }).lean();
            let maxNum = 0;
            existingScenes.forEach(s => {
                const match = s.id.match(/^scene-(\d+)$/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            req.body.id = `scene-${maxNum + 1}`;
        } else {
            req.body.id = req.body.id.trim();
        }

        // Modul ichida dublikat tekshirish
        const existing = await Scene.findOne({ moduleId: mod._id, id: req.body.id });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Scene bilan bunday ID "${req.body.id}" bu modulda allaqachon mavjud`,
            });
        }

        const data = { ...req.body, moduleId: mod._id, moduleSlug: mod.slug };
        if (data.pins) data.pins = normalizePins(data.pins);

        // Agar bu sahna initialScene bo'lsa, shu modul ichida boshqalarini false qilish
        if (data.initialScene) {
            await Scene.updateMany(
                { moduleId: mod._id },
                { $set: { initialScene: false } }
            );
        }

        const scene = await Scene.create(data);
        res.status(201).json({
            success: true,
            message: 'Scene created successfully',
            data: scene,
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
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `Scene bilan bunday ID "${req.body.id}" bu modulda allaqachon mavjud`,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create scene',
            error: error.message,
        });
    }
};

// ─── PATCH /scenes/:id ──────────────────────────────────────
// Modul ichida sahnani qisman yangilash
const updateScene = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" slug li modul topilmadi`,
            });
        }

        // Trim ID
        if (req.body.id && typeof req.body.id === 'string') {
            req.body.id = req.body.id.trim();
        }

        // ID o'zgartirishga ruxsat bermaydi
        if (req.body.id && req.body.id !== req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Changing scene id is not allowed',
            });
        }

        // moduleSlug va moduleId o'zgartirishga ruxsat bermaydi
        if (req.body.moduleSlug && req.body.moduleSlug !== mod.slug) {
            return res.status(400).json({
                success: false,
                message: 'Changing module slug is not allowed via PATCH',
            });
        }

        const updates = { ...req.body };
        delete updates.moduleSlug; // modul o'zgartirishni bloklash
        delete updates.moduleId;   // modul ID o'zgartirishni bloklash
        if (updates.pins) updates.pins = normalizePins(updates.pins);

        // Agar bu sahna initialScene bo'lyapti bo'lsa, modul ichida boshqalarini false qilish
        if (updates.initialScene) {
            await Scene.updateMany(
                { moduleId: mod._id, id: { $ne: req.params.id } },
                { $set: { initialScene: false } }
            );
        }

        const scene = await Scene.findOneAndUpdate(
            { moduleId: mod._id, id: req.params.id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!scene) {
            return res.status(404).json({
                success: false,
                message: `Scene with id "${req.params.id}" not found in module "${mod.slug}"`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Scene updated successfully',
            data: scene,
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
            message: 'Failed to update scene',
            error: error.message,
        });
    }
};

// ─── DELETE /scenes/:id ──────────────────────────────────────
// Modul ichida sahnani o'chirish
const deleteScene = async (req, res) => {
    try {
        const mod = await resolveModule(req);
        if (!mod) {
            return res.status(404).json({
                success: false,
                message: `"${req.params.moduleSlug || 'default'}" slug li modul topilmadi`,
            });
        }

        const targetId = req.params.id;

        // 1. Shu modul ichida boshqa sahna pinlarda bog'langanmi tekshirish
        const linkedScene = await Scene.findOne({
            moduleId: mod._id,
            id: { $ne: targetId },
            'pins.target': targetId,
        });
        if (linkedScene) {
            const sceneName = linkedScene.title && linkedScene.title.uz ? linkedScene.title.uz : linkedScene.id;
            return res.status(400).json({
                success: false,
                message: `Ushbu scene boshqa scene (${sceneName}) bilan bog'langanligi sababli o'chirish mumkin emas. Avval bog'lanmani olib tashlang.`,
            });
        }

        // 2. Shu modul minimapiga biriktirilganmi tekshirish
        const linkedMiniMap = await MiniMap.findOne({
            moduleId: mod._id,
            $or: [
                { 'scenes.id': targetId },
                { 'floors.scenes.id': targetId },
            ],
        });
        if (linkedMiniMap) {
            return res.status(400).json({
                success: false,
                message: `Ushbu scene MiniMap ga biriktirilganligi sababli o'chirish mumkin emas. Avval xaritadan olib tashlang.`,
            });
        }

        const scene = await Scene.findOneAndDelete({ moduleId: mod._id, id: targetId });
        if (!scene) {
            return res.status(404).json({
                success: false,
                message: `Scene with id "${req.params.id}" not found in module "${mod.slug}"`,
            });
        }
        res.status(200).json({
            success: true,
            message: `Scene "${req.params.id}" deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete scene',
            error: error.message,
        });
    }
};

module.exports = {
    getAllScenes,
    getSceneById,
    createScene,
    updateScene,
    deleteScene,
};
