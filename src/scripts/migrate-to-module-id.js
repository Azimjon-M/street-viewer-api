/**
 * Migratsiya skripti: moduleSlug asosidagi eski indexlarni tozalash
 * 
 * Bu skript MongoDB dagi eski unique indexlarni olib tashlab,
 * yangi moduleId asosidagi indexlarni yaratadi.
 * 
 * Ishlatish: node src/scripts/migrate-to-module-id.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Module = require('../models/Module');
const Scene = require('../models/Scene');
const MiniMap = require('../models/MiniMap');

async function migrate() {
    await connectDB();
    console.log('📦 Migratsiya boshlandi...\n');

    // ─── 1. Scene larni migratsiya qilish ────────────────────
    console.log('🔄 Scene larni moduleId ga migratsiya qilish...');
    const scenes = await Scene.find({});
    let sceneUpdated = 0;
    
    for (const scene of scenes) {
        if (!scene.moduleId && scene.moduleSlug) {
            const mod = await Module.findOne({ slug: scene.moduleSlug });
            if (mod) {
                await Scene.updateOne(
                    { _id: scene._id },
                    { $set: { moduleId: mod._id } }
                );
                sceneUpdated++;
            } else {
                console.warn(`  ⚠️ Modul topilmadi: "${scene.moduleSlug}" (Scene: ${scene.id})`);
            }
        }
    }
    console.log(`  ✅ ${sceneUpdated} ta scene yangilandi\n`);

    // ─── 2. MiniMap larni migratsiya qilish ──────────────────
    console.log('🔄 MiniMap larni moduleId ga migratsiya qilish...');
    const maps = await MiniMap.find({});
    let mapUpdated = 0;

    for (const map of maps) {
        if (!map.moduleId && map.moduleSlug) {
            const mod = await Module.findOne({ slug: map.moduleSlug });
            if (mod) {
                await MiniMap.updateOne(
                    { _id: map._id },
                    { $set: { moduleId: mod._id } }
                );
                mapUpdated++;
            } else {
                console.warn(`  ⚠️ Modul topilmadi: "${map.moduleSlug}" (MiniMap ID: ${map._id})`);
            }
        }
    }
    console.log(`  ✅ ${mapUpdated} ta MiniMap yangilandi\n`);

    // ─── 3. Eski indexlarni tozalash ─────────────────────────
    console.log('🔄 Eski indexlarni tozalash...');
    
    try {
        const sceneCollection = mongoose.connection.collection('scenes');
        const sceneIndexes = await sceneCollection.indexes();
        
        for (const idx of sceneIndexes) {
            if (idx.key && idx.key.moduleSlug && idx.unique) {
                console.log(`  Olib tashlanmoqda: scenes.${idx.name}`);
                await sceneCollection.dropIndex(idx.name);
            }
        }
    } catch (e) {
        console.log(`  ℹ️ Scene indexlari allaqachon tozalangan yoki mavjud emas`);
    }

    try {
        const miniMapCollection = mongoose.connection.collection('minimaps');
        const miniMapIndexes = await miniMapCollection.indexes();
        
        for (const idx of miniMapIndexes) {
            if (idx.key && idx.key.moduleSlug && idx.unique) {
                console.log(`  Olib tashlanmoqda: minimaps.${idx.name}`);
                await miniMapCollection.dropIndex(idx.name);
            }
        }
    } catch (e) {
        console.log(`  ℹ️ MiniMap indexlari allaqachon tozalangan yoki mavjud emas`);
    }

    console.log('  ✅ Indexlar tozalandi\n');

    // ─── 4. Yangi indexlarni yaratish ────────────────────────
    console.log('🔄 Yangi indexlarni yaratish...');
    await Scene.syncIndexes();
    await MiniMap.syncIndexes();
    console.log('  ✅ Yangi indexlar yaratildi\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ Migratsiya muvaffaqiyatli yakunlandi!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migratsiya xatosi:', err);
    process.exit(1);
});
