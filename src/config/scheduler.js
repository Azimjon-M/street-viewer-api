const cron = require('node-cron');
const path = require('path');
const { cleanupOrphanedFiles } = require('../utils/cleanupOrphans');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Runs cleanup and logs a summary to the console.
 */
const runCleanup = async () => {
    const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
    console.log(`\n🕐 [${now}] Avtomatik cleanup boshlandi...`);

    try {
        const report = await cleanupOrphanedFiles(UPLOADS_DIR, { dryRun: false });

        if (report.orphansFound === 0) {
            console.log(`✅ [Cleanup] Orphan fayl topilmadi. Disk toza.`);
        } else {
            console.log(`🗑️  [Cleanup] ${report.orphansFound} ta orphan topildi.`);
            console.log(`✅ [Cleanup] ${report.deleted.length} ta fayl o'chirildi:`);
            report.deleted.forEach((f) => console.log(`   ❌ ${f}`));
        }

        if (report.errors.length > 0) {
            console.log(`⚠️  [Cleanup] ${report.errors.length} ta xato:`);
            report.errors.forEach((e) => console.log(`   ${e.file}: ${e.error}`));
        }

        console.log(
            `📊 [Cleanup] Jami: ${report.totalFilesOnDisk} fayl | ` +
            `Ishlatilayotgan: ${report.usedFilesCount} | ` +
            `O'chirilgan: ${report.deleted.length}\n`
        );
    } catch (err) {
        console.error(`❌ [Cleanup] Xato yuz berdi: ${err.message}`);
    }
};

/**
 * Start the automatic cleanup scheduler.
 *
 * Schedule: every day at 03:00 AM (Tashkent time)
 * Cron:     0 3 * * *
 *
 * ┌─────── daqiqa  (0)
 * │ ┌───── soat    (3 = 03:00)
 * │ │ ┌─── kun     (* = har kun)
 * │ │ │ ┌─ oy      (* = har oy)
 * │ │ │ │ └ hafta  (* = har kuni)
 * 0 3 * * *
 */
const startCleanupScheduler = () => {
    // Schedule daily at 03:00 AM (Tashkent time)
    cron.schedule('0 3 * * *', runCleanup, {
        timezone: 'Asia/Tashkent',
    });

    console.log('🗓️  Cleanup scheduler ishga tushdi (har kuni 03:00 da avtomatik)');
};

module.exports = { startCleanupScheduler };
