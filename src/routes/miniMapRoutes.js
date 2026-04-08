const express = require('express');
const router = express.Router();
const { getMiniMap, setMiniMap, patchMiniMap } = require('../controllers/miniMapController');
const { protect } = require('../middleware/authMiddleware');

// ════════════════════════════════════════════════════════════════
//  SWAGGER DOCUMENTATION
// ════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/minimap:
 *   get:
 *     tags:
 *       - MiniMap
 *     summary: Fetch mini-map configuration
 *     description: >
 *       Yagona MiniMap documentni qaytaradi: fon rasim URL, o'lchamlar va scene node'lar.
 *       **Public — autentifikatsiya talab etilmaydi.**
 *     operationId: getMiniMap
 *     responses:
 *       200:
 *         description: MiniMap muvaffaqiyatli qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniMapResponse'
 *             example:
 *               success: true
 *               data:
 *                 image: http://localhost:5000/uploads/minimap/map.jpg
 *                 width: 1200
 *                 height: 800
 *                 scenes:
 *                   - id: scene-001
 *                     xPercent: 32.7
 *                     yPercent: 58.1
 *                     icon: circle
 *       404:
 *         description: MiniMap topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get('/', getMiniMap);

/**
 * @swagger
 * /api/minimap:
 *   post:
 *     tags:
 *       - MiniMap
 *     summary: Set mini-map base data 🔒
 *     description: >
 *       MiniMap asosiy datasini o'rnatadi: fon rasm URL, eni va bo'yi.
 *       Mavjud bo'lsa yangilaydi (upsert), mavjud bo'lmasa yaratadi.
 *       Scenes bu endpoint orqali o'zgartirilmaydi — buning uchun PATCH dan foydalaning.
 *       **Autentifikatsiya talab etiladi.**
 *     operationId: setMiniMap
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - width
 *               - height
 *             properties:
 *               image:
 *                 type: string
 *                 example: http://localhost:5000/uploads/minimap/map.jpg
 *               width:
 *                 type: number
 *                 example: 1200
 *               height:
 *                 type: number
 *                 example: 800
 *     responses:
 *       200:
 *         description: MiniMap asosiy data saqlandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MiniMapResponse'
 *       400:
 *         description: Majburiy fieldlar yetishmayapti
 *       401:
 *         description: Autentifikatsiya talab etiladi
 *       500:
 *         description: Server xatosi
 */
router.post('/', protect, setMiniMap);

/**
 * @swagger
 * /api/minimap:
 *   patch:
 *     tags:
 *       - MiniMap
 *     summary: Update mini-map scenes (partial update) 🔒
 *     description: >
 *       Faqat yuborilgan fieldlarni yangilaydi.
 *       Scenlar qo'shilganda yoki o'chirilganda faqat `scenes` arrayini yuborish kifoya.
 *       `image`, `width`, `height` ham ixtiyoriy ravishda yangilanishi mumkin.
 *       **Autentifikatsiya talab etiladi.**
 *     operationId: patchMiniMap
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 example: http://localhost:5000/uploads/minimap/map.jpg
 *               width:
 *                 type: number
 *                 example: 1200
 *               height:
 *                 type: number
 *                 example: 800
 *               scenes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MapScene'
 *                 example:
 *                   - id: scene-001
 *                     xPercent: 32.7
 *                     yPercent: 58.1
 *                     icon: circle
 *                   - id: scene-002
 *                     xPercent: 65.3
 *                     yPercent: 42.9
 *                     icon: pin
 *     responses:
 *       200:
 *         description: MiniMap yangilandi
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: MiniMap yangilandi
 *               updatedFields: [scenes]
 *               data:
 *                 image: http://localhost:5000/uploads/minimap/map.jpg
 *                 width: 1200
 *                 height: 800
 *                 scenes:
 *                   - id: scene-001
 *                     xPercent: 32.7
 *                     yPercent: 58.1
 *                     icon: circle
 *       400:
 *         description: Hech qanday yangilanadigan field yuborilmagan
 *       401:
 *         description: Autentifikatsiya talab etiladi
 *       500:
 *         description: Server xatosi
 */
router.patch('/', protect, patchMiniMap);

module.exports = router;
