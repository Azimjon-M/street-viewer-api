/**
 * Seed script — populate the database with sample scenes and minimap.
 * Run with: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Scene = require('./models/Scene');
const MiniMap = require('./models/MiniMap');
const Module = require('./models/Module');

const sampleScenes = [
    {
        moduleSlug: 'default',
        id: 'scene-01',
        image: {
            full: 'https://example.com/images/scene-01-full.jpg',
            mobile: 'https://example.com/images/scene-01-mobile.jpg',
            thumb: 'https://example.com/images/scene-01-thumb.jpg',
        },
        northOffset: 0,
        initialScene: { x: 0 },
        lat: 41.2995,
        lng: 69.2401,
        pins: [
            {
                id: 'pin-01-to-02',
                xPercent: 62.5,
                yPercent: 48.0,
                target: 'scene-02',
                icon: 'pin',
            },
            {
                id: 'pin-01-to-03',
                xPercent: 30.0,
                yPercent: 51.5,
                target: 'scene-03',
                icon: 'circle',
            },
        ],
        title: {
            uz: 'Bosh kirish',
            ru: 'Главный вход',
            en: 'Main Entrance',
        },
        description: {
            uz: 'Asosiy kirish joyi',
            ru: 'Основной вход в здание',
            en: 'The main entrance of the building',
        },
    },
    {
        moduleSlug: 'default',
        id: 'scene-02',
        image: {
            full: 'https://example.com/images/scene-02-full.jpg',
            mobile: 'https://example.com/images/scene-02-mobile.jpg',
            thumb: 'https://example.com/images/scene-02-thumb.jpg',
        },
        northOffset: 45,
        lat: 41.3001,
        lng: 69.2408,
        pins: [
            {
                id: 'pin-02-to-01',
                xPercent: 20.0,
                yPercent: 52.0,
                target: 'scene-01',
                icon: 'pin',
            },
        ],
        title: {
            uz: 'Lobby',
            ru: 'Лобби',
            en: 'Lobby',
        },
        description: {
            uz: 'Qabul xonasi',
            ru: 'Зона reception',
            en: 'Reception area',
        },
    },
    {
        moduleSlug: 'default',
        id: 'scene-03',
        image: {
            full: 'https://example.com/images/scene-03-full.jpg',
            mobile: 'https://example.com/images/scene-03-mobile.jpg',
            thumb: 'https://example.com/images/scene-03-thumb.jpg',
        },
        northOffset: 180,
        lat: 41.2990,
        lng: 69.2395,
        pins: [
            {
                id: 'pin-03-to-01',
                xPercent: 75.0,
                yPercent: 49.0,
                target: 'scene-01',
                icon: 'circle',
            },
        ],
        title: {
            uz: 'Bog\'cha',
            ru: 'Садик',
            en: 'Garden',
        },
        description: {
            uz: 'Tashqi bog\'cha hududi',
            ru: 'Внешний садовый участок',
            en: 'Outdoor garden area',
        },
    },
];

const sampleMiniMap = {
    moduleSlug: 'default',
    image: 'https://example.com/images/minimap.jpg',
    width: 1200,
    height: 800,
    scenes: [
        { id: 'scene-01', xPercent: 50.0, yPercent: 50.0, icon: 'circle' },
        { id: 'scene-02', xPercent: 65.0, yPercent: 40.0, icon: 'circle' },
        { id: 'scene-03', xPercent: 35.0, yPercent: 62.0, icon: 'circle' },
    ],
};

const seed = async () => {
    await connectDB();

    console.log('\n🌱 Seeding database...\n');

    // Clear existing data
    await Scene.deleteMany({});
    await MiniMap.deleteMany({});
    await Module.deleteMany({});
    console.log('🗑️  Cleared existing scenes, minimap and modules');

    // Create default module
    await Module.create({
        slug: 'default',
        name: { uz: 'Asosiy', ru: 'Основной', en: 'Default' },
        description: { uz: 'Asosiy modul', ru: 'Основной модуль', en: 'Default module' },
        order: 0,
        isActive: true,
    });
    console.log('✅  Created default module');

    // Insert scenes
    const inserted = await Scene.insertMany(sampleScenes);
    console.log(`✅  Inserted ${inserted.length} scenes`);

    // Insert minimap
    await MiniMap.create(sampleMiniMap);
    console.log('✅  Inserted minimap');

    console.log('\n🎉 Seed completed successfully!\n');
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
