/**
 * Migration Script: Mavjud datalarni ko'p modulli tizimga o'tkazish
 *
 * Bu skript:
 * 1. "default" modul yaratadi (agar mavjud bo'lmasa)
 * 2. Barcha mavjud Scene larga `moduleSlug: 'default'` qo'shadi
 * 3. Mavjud MiniMap ga `moduleSlug: 'default'` qo'shadi va `_singleton` ni olib tashladi
 * 4. Eski unique indexlarni yangilaydi
 *
 * Ishlatish:
 *   node src/scripts/migrate-to-modules.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  📦 Ko\'p modulli tizimga migration');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const db = mongoose.connection.db;

        // ─── 1. Default Module yaratish ───────────────────────
        const modulesCol = db.collection('modules');
        const existingModule = await modulesCol.findOne({ slug: 'default' });
        if (!existingModule) {
            await modulesCol.insertOne({
                slug: 'default',
                name: { uz: 'Asosiy', ru: 'Основной', en: 'Default' },
                description: { uz: 'Asosiy modul', ru: 'Основной модуль', en: 'Default module' },
                thumbnail: '',
                order: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log('✅ Default modul yaratildi');
        } else {
            console.log('ℹ️  Default modul allaqachon mavjud');
        }

        // ─── 2. Barcha Scene larga moduleSlug qo'shish ───────
        const scenesCol = db.collection('scenes');
        const sceneUpdateResult = await scenesCol.updateMany(
            { moduleSlug: { $exists: false } },
            { $set: { moduleSlug: 'default' } }
        );
        console.log(`✅ Scenes: ${sceneUpdateResult.modifiedCount} ta scene ga moduleSlug qo'shildi`);

        // Eski unique index ni o'chirish (agar mavjud bo'lsa)
        try {
            const sceneIndexes = await scenesCol.indexes();
            const hasOldIndex = sceneIndexes.some(idx => idx.name === 'id_1' && idx.unique);
            if (hasOldIndex) {
                await scenesCol.dropIndex('id_1');
                console.log('✅ Scenes: eski unique index (id_1) o\'chirildi');
            }
        } catch (e) {
            // Index mavjud bo'lmasa xato chiqadi — e'tiborsiz qoldiramiz
            console.log('ℹ️  Scenes: eski index o\'zgartirishga hojat yo\'q');
        }

        // ─── 3. MiniMap: avval eski indexlarni tozalash ────────
        const minimapsCol = db.collection('minimaps');

        // Eski _singleton unique index ni o'chirish (avval!)
        try {
            const miniMapIndexes = await minimapsCol.indexes();
            const hasOldIndex = miniMapIndexes.some(idx => idx.name === '_singleton_1');
            if (hasOldIndex) {
                await minimapsCol.dropIndex('_singleton_1');
                console.log('✅ MiniMap: eski unique index (_singleton_1) o\'chirildi');
            }
            // Agar moduleSlug_1 index allaqachon mavjud bo'lsa, uni ham o'chiramiz (qayta yaratish uchun)
            const hasNewIndex = miniMapIndexes.some(idx => idx.name === 'moduleSlug_1');
            if (hasNewIndex) {
                await minimapsCol.dropIndex('moduleSlug_1');
                console.log('ℹ️  MiniMap: mavjud moduleSlug_1 index o\'chirildi (qayta yaratiladi)');
            }
        } catch (e) {
            console.log('ℹ️  MiniMap: index tozalashda xato (e\'tiborsiz):', e.message);
        }

        // _singleton fieldni olib tashlash
        const singletonRemoveResult = await minimapsCol.updateMany(
            { _singleton: { $exists: true } },
            { $unset: { _singleton: '' } }
        );
        if (singletonRemoveResult.modifiedCount > 0) {
            console.log(`✅ MiniMap: _singleton field ${singletonRemoveResult.modifiedCount} ta documentdan olib tashlandi`);
        }

        // moduleSlug qo'shish
        const miniMapUpdateResult = await minimapsCol.updateMany(
            { moduleSlug: { $exists: false } },
            { $set: { moduleSlug: 'default' } }
        );
        console.log(`✅ MiniMap: ${miniMapUpdateResult.modifiedCount} ta document ga moduleSlug qo'shildi`);

        // Yangi unique index yaratish
        await minimapsCol.createIndex({ moduleSlug: 1 }, { unique: true });
        console.log('✅ MiniMap: yangi unique index (moduleSlug_1) yaratildi');

        // ────────────────────────────────────────────────────────
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  🎉 Migration muvaffaqiyatli yakunlandi!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Endi serverni qayta ishga tushiring: npm run dev\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration xato:', err.message);
        process.exit(1);
    }
};

run();
