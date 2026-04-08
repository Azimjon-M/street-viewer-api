const fs = require('fs');
const path = require('path');
const Scene = require('../models/Scene');
const MiniMap = require('../models/MiniMap');

/**
 * Convert a stored image URL to an absolute file path on disk.
 *
 * Example:
 *   URL:  "http://localhost:5000/uploads/full/abc.jpg"
 *   ROOT: "D:\NodeJS\street-viewer\uploads"
 *   →     "D:\NodeJS\street-viewer\uploads\full\abc.jpg"
 *
 * @param {string} url        - Stored image URL
 * @param {string} uploadsRoot - Absolute path to uploads directory
 * @returns {string|null} Absolute file path or null if URL is invalid
 */
const urlToAbsPath = (url, uploadsRoot) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;

    try {
        // Remove protocol + host → "/uploads/full/abc.jpg"
        const withoutHost = url.replace(/^https?:\/\/[^/]+/, '');

        // Remove leading "/uploads/" → "full/abc.jpg"
        const relative = withoutHost.replace(/^\/uploads\//, '');

        if (!relative) return null;

        // Join with uploads root → "D:\...\uploads\full\abc.jpg"
        return path.normalize(path.join(uploadsRoot, relative));
    } catch {
        return null;
    }
};

/**
 * Collect absolute paths of all files currently referenced in the database.
 * @param {string} uploadsRoot
 * @returns {Set<string>}
 */
const getUsedFilePaths = async (uploadsRoot) => {
    const used = new Set();

    // ─── Scene images (full, mobile, thumb) ──────────────────
    const scenes = await Scene.find({}, 'image');
    for (const scene of scenes) {
        const { full, mobile, thumb } = scene.image || {};
        [full, mobile, thumb].forEach((url) => {
            const p = urlToAbsPath(url, uploadsRoot);
            if (p) used.add(p);
        });
    }

    // ─── MiniMap images (barcha modullar) ─────────────────────
    const miniMaps = await MiniMap.find({}, 'image');
    for (const mm of miniMaps) {
        if (mm.image) {
            const p = urlToAbsPath(mm.image, uploadsRoot);
            if (p) used.add(p);
        }
    }

    return used;
};

/**
 * Recursively list all files under a directory.
 * @param {string} dir
 * @returns {string[]} Array of normalized absolute paths
 */
const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.normalize(path.join(dir, entry.name));
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
};

/**
 * Find and optionally delete orphaned files in the uploads directory.
 *
 * An "orphan" is any file on disk that is NOT referenced by any
 * Scene or MiniMap document in the database.
 *
 * @param {string} uploadsRoot         - Absolute path to uploads directory
 * @param {{ dryRun?: boolean }} opts
 * @returns {Promise<object>}          Cleanup report
 */
const cleanupOrphanedFiles = async (uploadsRoot, { dryRun = false } = {}) => {
    const usedPaths = await getUsedFilePaths(uploadsRoot);
    const diskFiles = walkDir(uploadsRoot);

    const orphans = diskFiles.filter((f) => !usedPaths.has(f));

    const deleted = [];
    const errors = [];

    if (!dryRun) {
        for (const filePath of orphans) {
            try {
                fs.unlinkSync(filePath);
                deleted.push(filePath);
            } catch (err) {
                errors.push({ file: filePath, error: err.message });
            }
        }
    }

    // Return relative paths for cleaner output
    const rel = (f) => path.relative(uploadsRoot, f);

    return {
        totalFilesOnDisk: diskFiles.length,
        usedFilesCount: usedPaths.size,
        orphansFound: orphans.length,
        orphanFiles: orphans.map(rel),
        deleted: deleted.map(rel),
        errors,
        dryRun,
    };
};

module.exports = { cleanupOrphanedFiles };
