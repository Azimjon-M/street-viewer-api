const express = require('express');
const router = express.Router({ mergeParams: true }); // moduleSlug ni olish uchun
const {
    getAllScenes,
    getSceneById,
    createScene,
    updateScene,
    deleteScene,
} = require('../controllers/sceneController');
const { protect } = require('../middleware/authMiddleware');

// ─── Public ───────────────────────────────────────────────────
// GET /api/modules/:moduleSlug/scenes
router.get('/', getAllScenes);
// GET /api/modules/:moduleSlug/scenes/:id
router.get('/:id', getSceneById);

// ─── Protected ────────────────────────────────────────────────
// POST /api/modules/:moduleSlug/scenes
router.post('/', protect, createScene);
// PATCH /api/modules/:moduleSlug/scenes/:id
router.patch('/:id', protect, updateScene);
// DELETE /api/modules/:moduleSlug/scenes/:id
router.delete('/:id', protect, deleteScene);

module.exports = router;
