const express = require('express');
const router = express.Router();
const {
    getAllScenes,
    getSceneById,
    createScene,
    updateScene,
    deleteScene,
} = require('../controllers/sceneController');
const { protect } = require('../middleware/authMiddleware');

// ════════════════════════════════════════════════════════════════
//  SWAGGER DOCUMENTATION
// ════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/scenes:
 *   get:
 *     tags:
 *       - Scenes
 *     summary: Fetch all scenes
 *     description: >
 *       Returns a list of all panoramic scenes sorted by creation date (ascending).
 *       Each scene includes its images (full/mobile/thumb), northOffset, GPS coordinates,
 *       navigation pins, and multilingual title/description. **Public — no auth required.**
 *     operationId: getAllScenes
 *     responses:
 *       200:
 *         description: Successfully retrieved all scenes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SceneListResponse'
 *             example:
 *               success: true
 *               count: 2
 *               data:
 *                 - id: scene-001
 *                   image:
 *                     full: http://localhost:5000/uploads/scenes/s1-full.jpg
 *                     mobile: http://localhost:5000/uploads/scenes/s1-mobile.jpg
 *                     thumb: http://localhost:5000/uploads/scenes/s1-thumb.jpg
 *                   initialScene:
 *                     x: 123
 *                   northOffset: 45
 *                   lat: 41.2995
 *                   lng: 69.2401
 *                   pins:
 *                     - xPercent: 45.5
 *                       yPercent: 38.2
 *                       target: scene-002
 *                       icon: pin
 *                   title:
 *                     uz: "Bosh kirish"
 *                     ru: "Главный вход"
 *                     en: "Main Entrance"
 *                   description:
 *                     uz: "Bino bosh kirishi"
 *                     ru: "Главный вход здания"
 *                     en: "Building main entrance"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllScenes);

/**
 * @swagger
 * /api/scenes/{id}:
 *   get:
 *     tags:
 *       - Scenes
 *     summary: Fetch a single scene by ID
 *     description: >
 *       Returns a single panoramic scene identified by its custom string `id` field.
 *       Includes all scene data: images, pins, coordinates, and multilingual content.
 *       **Public — no auth required.**
 *     operationId: getSceneById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Custom scene ID (e.g. "scene-001")
 *         schema:
 *           type: string
 *           example: scene-001
 *     responses:
 *       200:
 *         description: Scene found and returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SceneSingleResponse'
 *       404:
 *         description: Scene not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Scene with id "scene-999" not found'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getSceneById);

/**
 * @swagger
 * /api/scenes:
 *   post:
 *     tags:
 *       - Scenes
 *     summary: Create a new scene 🔒
 *     description: >
 *       Creates a new panoramic scene. The `id` field must be unique.
 *       **Requires authentication** — include `Authorization: Bearer <token>` header.
 *     operationId: createScene
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SceneInput'
 *           example:
 *             id: scene-001
 *             image:
 *               full: http://localhost:5000/uploads/scenes/s1-full.jpg
 *               mobile: http://localhost:5000/uploads/scenes/s1-mobile.jpg
 *               thumb: http://localhost:5000/uploads/scenes/s1-thumb.jpg
 *             initialScene:
 *               x: 123
 *             northOffset: 45
 *             lat: 41.2995
 *             lng: 69.2401
 *             pins:
 *               - xPercent: 45.5
 *                 yPercent: 38.2
 *                 target: scene-002
 *                 icon: pin
 *             title:
 *               uz: "Bosh kirish"
 *               ru: "Главный вход"
 *               en: "Main Entrance"
 *             description:
 *               uz: "Bino bosh kirishi"
 *               ru: "Главный вход здания"
 *               en: "Building main entrance"
 *     responses:
 *       201:
 *         description: Scene created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SceneSingleResponse'
 *       400:
 *         description: Duplicate ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized — token missing or invalid
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
router.post('/', protect, createScene);

/**
 * @swagger
 * /api/scenes/{id}:
 *   patch:
 *     tags:
 *       - Scenes
 *     summary: Partially update a scene 🔒
 *     description: >
 *       Partially updates a scene by its custom `id`. Send only the fields you want to change —
 *       all other fields remain unchanged. The scene `id` itself cannot be changed after creation.
 *       **Requires authentication** — include `Authorization: Bearer <token>` header.
 *     operationId: updateScene
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Custom scene ID to update
 *         schema:
 *           type: string
 *           example: scene-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SceneInput'
 *           example:
 *             initialScene:
 *               x: 456
 *             northOffset: 90
 *             title:
 *               uz: "Yangilangan sarlavha"
 *               ru: "Обновленный заголовок"
 *               en: "Updated Title"
 *             pins:
 *               - xPercent: 60.0
 *                 yPercent: 40.0
 *                 target: scene-003
 *                 icon: circle
 *     responses:
 *       200:
 *         description: Scene updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SceneSingleResponse'
 *       400:
 *         description: Attempt to change scene ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized — token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Scene not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', protect, updateScene);

/**
 * @swagger
 * /api/scenes/{id}:
 *   delete:
 *     tags:
 *       - Scenes
 *     summary: Delete a scene 🔒
 *     description: >
 *       Permanently deletes a scene by its custom string `id`.
 *       **Requires authentication** — include `Authorization: Bearer <token>` header.
 *     operationId: deleteScene
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Custom scene ID to delete
 *         schema:
 *           type: string
 *           example: scene-001
 *     responses:
 *       200:
 *         description: Scene deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               success: true
 *               message: 'Scene "scene-001" deleted successfully'
 *       401:
 *         description: Unauthorized — token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Scene not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', protect, deleteScene);

module.exports = router;
