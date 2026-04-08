const express = require('express');
const router = express.Router({ mergeParams: true }); // moduleSlug ni olish uchun
const { getMiniMap, setMiniMap, patchMiniMap } = require('../controllers/miniMapController');
const { protect } = require('../middleware/authMiddleware');

// ─── Public ───────────────────────────────────────────────────
// GET /api/modules/:moduleSlug/minimap
router.get('/', getMiniMap);

// ─── Protected ────────────────────────────────────────────────
// POST /api/modules/:moduleSlug/minimap
router.post('/', protect, setMiniMap);
// PATCH /api/modules/:moduleSlug/minimap
router.patch('/', protect, patchMiniMap);

module.exports = router;
