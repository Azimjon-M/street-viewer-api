const express = require('express');
const router = express.Router();
const {
    getAllModules,
    getModuleBySlug,
    createModule,
    updateModule,
    deleteModule,
} = require('../controllers/moduleController');
const { protect } = require('../middleware/authMiddleware');

// ════════════════════════════════════════════════════════════════
//  SWAGGER DOCUMENTATION
// ════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/modules:
 *   get:
 *     tags:
 *       - Modules
 *     summary: Barcha modullarni olish
 *     description: >
 *       Barcha faol virtual tur modullarini qaytaradi (tartib bo'yicha).
 *       `?all=true` query parametri bilan nofaol modullarni ham ko'rsatadi.
 *       **Public — autentifikatsiya talab etilmaydi.**
 *     operationId: getAllModules
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: "true bo'lsa nofaol modullarni ham ko'rsatadi"
 *     responses:
 *       200:
 *         description: Modullar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModuleListResponse'
 */
router.get('/', getAllModules);

/**
 * @swagger
 * /api/modules/{moduleSlug}:
 *   get:
 *     tags:
 *       - Modules
 *     summary: Bitta modulni olish
 *     description: >
 *       Bitta modulni slug bo'yicha qaytaradi.
 *       **Public — autentifikatsiya talab etilmaydi.**
 *     operationId: getModuleBySlug
 *     parameters:
 *       - in: path
 *         name: moduleSlug
 *         required: true
 *         description: Modul slug (masalan "fizmat")
 *         schema:
 *           type: string
 *           example: fizmat
 *     responses:
 *       200:
 *         description: Modul topildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModuleSingleResponse'
 *       404:
 *         description: Modul topilmadi
 */
router.get('/:moduleSlug', getModuleBySlug);

/**
 * @swagger
 * /api/modules:
 *   post:
 *     tags:
 *       - Modules
 *     summary: Yangi modul yaratish 🔒
 *     description: >
 *       Yangi virtual tur moduli yaratadi. Avtomatik ravishda modul uchun bo'sh MiniMap ham yaratiladi.
 *       **Autentifikatsiya talab etiladi.**
 *     operationId: createModule
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleInput'
 *           example:
 *             slug: fizmat
 *             name:
 *               uz: "Fizika-Matematika fakulteti"
 *               ru: "Физико-Математический факультет"
 *               en: "Physics-Mathematics Faculty"
 *             description:
 *               uz: "Fizmat fakulteti hududining virtual turi"
 *               ru: "Виртуальный тур территории физмат факультета"
 *               en: "Virtual tour of Physics-Mathematics Faculty area"
 *             order: 1
 *     responses:
 *       201:
 *         description: Modul yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModuleSingleResponse'
 *       400:
 *         description: Dublikat slug yoki validation xato
 *       401:
 *         description: Autentifikatsiya talab etiladi
 */
router.post('/', protect, createModule);

/**
 * @swagger
 * /api/modules/{moduleSlug}:
 *   patch:
 *     tags:
 *       - Modules
 *     summary: Modulni yangilash 🔒
 *     description: >
 *       Modulni qisman yangilaydi. Slug o'zgartirib bo'lmaydi.
 *       **Autentifikatsiya talab etiladi.**
 *     operationId: updateModule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleSlug
 *         required: true
 *         schema:
 *           type: string
 *           example: fizmat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       200:
 *         description: Modul yangilandi
 *       400:
 *         description: Slug o'zgartirish urinishi yoki validation xato
 *       404:
 *         description: Modul topilmadi
 *       401:
 *         description: Autentifikatsiya talab etiladi
 */
router.patch('/:moduleSlug', protect, updateModule);

/**
 * @swagger
 * /api/modules/{moduleSlug}:
 *   delete:
 *     tags:
 *       - Modules
 *     summary: Modulni o'chirish 🔒
 *     description: >
 *       Modulni o'chiradi. Faqat bo'sh modul (sahnalari yo'q) o'chirilishi mumkin.
 *       Default modulni o'chirib bo'lmaydi.
 *       **Autentifikatsiya talab etiladi.**
 *     operationId: deleteModule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleSlug
 *         required: true
 *         schema:
 *           type: string
 *           example: texnika
 *     responses:
 *       200:
 *         description: Modul o'chirildi
 *       400:
 *         description: Modul bo'sh emas yoki default modul
 *       404:
 *         description: Modul topilmadi
 *       401:
 *         description: Autentifikatsiya talab etiladi
 */
router.delete('/:moduleSlug', protect, deleteModule);

module.exports = router;
