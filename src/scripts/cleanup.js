/**
 * Orphaned Files Cleanup Script
 *
 * Finds and deletes uploaded files that are no longer referenced
 * by any Scene or MiniMap document in the database.
 *
 * Usage:
 *   npm run cleanup          ← actually delete orphans
 *   npm run cleanup:dry      ← only show what would be deleted (safe)
 */
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const { cleanupOrphanedFiles } = require('../utils/cleanupOrphans');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const isDryRun = process.argv.includes('--dry-run');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');

        if (isDryRun) {
            console.log('🔍 DRY RUN mode — no files will be deleted\n');
        } else {
            console.log('🗑️  CLEANUP mode — orphaned files will be deleted\n');
        }

        const report = await cleanupOrphanedFiles(UPLOADS_DIR, { dryRun: isDryRun });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  📁 Diskdagi fayllar jami : ${report.totalFilesOnDisk}`);
        console.log(`  ✅ DB da ishlatiladigan  : ${report.usedFilesCount}`);
        console.log(`  🚨 Orphan (keraksiz)     : ${report.orphansFound}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (report.orphansFound === 0) {
            console.log('\n🎉 Hech qanday orphan fayl topilmadi. Hamma narsa tartibda!');
        } else {
            console.log('\n📄 Orphan fayllar ro\'yxati:');
            report.orphanFiles.forEach((f) => console.log(`   ❌ ${f}`));

            if (!isDryRun) {
                console.log(`\n✅ ${report.deleted.length} ta fayl o'chirildi.`);
                if (report.errors.length > 0) {
                    console.log(`\n⚠️  ${report.errors.length} ta xato:`);
                    report.errors.forEach((e) => console.log(`   ${e.file}: ${e.error}`));
                }
            } else {
                console.log('\n💡 O\'chirish uchun: npm run cleanup');
            }
        }

        console.log('');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xato:', err.message);
        process.exit(1);
    }
};

run();
