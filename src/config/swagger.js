const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🌐 Street Viewer API',
            version: '2.0.0',
            description:
                'Virtual Tour Street Viewer backend API. ' +
                'Manage multiple virtual tour modules, 360° panoramic scenes, navigation pins, and mini-map configuration. ' +
                'Supports multilingual titles and descriptions (uz, ru, en).\n\n' +
                '## Multi-Module Architecture\n' +
                'API supports multiple independent virtual tours (modules). ' +
                'Each module has its own scenes, minimap, and pins.\n\n' +
                '**Module-scoped endpoints:** `/api/modules/:moduleSlug/scenes`, etc.\n' +
                '**Legacy endpoints:** `/api/scenes` (defaults to `default` module)\n\n' +
                '## Authentication\n' +
                'Some endpoints require a valid **JWT Bearer token**.\n\n' +
                '**How to get a token:**\n' +
                '1. Call `POST /api/auth/login` with your credentials.\n' +
                '2. Copy the `token` from the response.\n' +
                '3. Click the **Authorize 🔓** button at the top of this page.\n' +
                '4. Enter: `Bearer <your_token>` and click **Authorize**.\n\n' +
                '## Thumb Auto-Generation\n' +
                'When uploading scene images, the server automatically generates ' +
                'full (4000px), mobile (2048px), and thumb (480×360 4:3) versions.',
            contact: {
                name: 'Street Viewer Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
        ],
        // ─── Global Security Scheme ───────────────────────────────
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'JWT Authorization header. Example: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`',
                },
            },
            schemas: {
                // ─── Auth Schemas ───────────────────────────────────
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    description: 'Admin login credentials',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@example.com',
                            description: 'Admin email address',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: '••••••••',
                            description: 'Admin password (minimum 6 characters)',
                        },
                    },
                },
                RegisterInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    description: 'New admin registration data',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'newadmin@example.com',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'securepassword123',
                            minLength: 6,
                        },
                    },
                },
                AdminProfile: {
                    type: 'object',
                    description: 'Admin profile data (password never returned)',
                    properties: {
                        id: {
                            type: 'string',
                            example: '64a1b2c3d4e5f6a7b8c9d0e1',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@example.com',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z',
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Login successful' },
                        token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YTFiMmMzZDRlNWY2YTdiOGM5ZDBlMSIsImlhdCI6MTcwNTMyMDYwMCwiZXhwIjoxNzA1OTI1NDAwfQ.signature',
                            description: 'JWT token valid for 7 days',
                        },
                        admin: { $ref: '#/components/schemas/AdminProfile' },
                    },
                },
                AdminProfileResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        admin: { $ref: '#/components/schemas/AdminProfile' },
                    },
                },
                UnauthorizedResponse: {
                    type: 'object',
                    description: '401 Unauthorized — returned when token is missing, invalid, or expired',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: {
                            type: 'string',
                            example: 'Access denied. No token provided. Use: Authorization: Bearer <token>',
                        },
                    },
                },

                // ─── MultiLang ─────────────────────────────────────
                MultiLang: {
                    type: 'object',
                    description: 'Multilingual text object supporting Uzbek, Russian, and English',
                    properties: {
                        uz: {
                            type: 'string',
                            example: "Ko'cha ko'rinishi",
                            description: 'Uzbek text',
                        },
                        ru: {
                            type: 'string',
                            example: 'Вид улицы',
                            description: 'Russian text',
                        },
                        en: {
                            type: 'string',
                            example: 'Street View',
                            description: 'English text',
                        },
                    },
                },

                // ─── ImageVariants ─────────────────────────────────
                ImageVariants: {
                    type: 'object',
                    description: 'Image URLs for different device resolutions',
                    properties: {
                        full: {
                            type: 'string',
                            example: 'http://localhost:5000/uploads/scenes/scene1-full.jpg',
                            description: 'Full-resolution panorama image URL (desktop)',
                        },
                        mobile: {
                            type: 'string',
                            example: 'http://localhost:5000/uploads/scenes/scene1-mobile.jpg',
                            description: 'Mobile-optimized panorama image URL',
                        },
                        thumb: {
                            type: 'string',
                            nullable: true,
                            example: 'http://localhost:5000/uploads/thumb/thumb-1705320600000-scene1.jpg',
                            description:
                                '⚙️ Auto-generated from `mobile` image if not explicitly uploaded. ' +
                                '4:3 aspect ratio, 480×360 px, cropped from centre using sharp. ' +
                                'Used in scene lists and navigation pin previews.',
                        },
                    },
                },

                // ─── Pin ───────────────────────────────────────────
                Pin: {
                    type: 'object',
                    required: ['xPercent', 'yPercent', 'target'],
                    description:
                        'A navigation pin displayed on the panorama image. ' +
                        'Position is stored as relative percentage (0–100). ' +
                        '`id` is auto-generated by the server — do not send it.',
                    properties: {
                        id: {
                            type: 'string',
                            example: '67bc3a1f4e2d1a0b8c9f1234',
                            description: '⚙️ Auto-generated by server (ObjectId). Do not include in requests.',
                            readOnly: true,
                        },
                        xPercent: {
                            type: 'number',
                            format: 'float',
                            minimum: 0,
                            maximum: 100,
                            example: 45.5,
                            description: 'Horizontal position as % of image width (0–100)',
                        },
                        yPercent: {
                            type: 'number',
                            format: 'float',
                            minimum: 0,
                            maximum: 100,
                            example: 38.2,
                            description: 'Vertical position as % of image height (0–100)',
                        },
                        target: {
                            type: 'string',
                            example: 'scene-002',
                            description: 'ID of the scene this pin navigates to',
                        },
                        icon: {
                            type: 'string',
                            enum: ['pin', 'circle'],
                            default: 'pin',
                            example: 'pin',
                            description: 'Visual style of the pin icon',
                        },
                    },
                },

                // ─── Scene ─────────────────────────────────────────
                Scene: {
                    type: 'object',
                    required: ['id', 'image'],
                    description: 'A panoramic scene representing one viewpoint in the virtual tour',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'scene-001',
                            description: 'Unique string identifier for the scene',
                        },
                        image: { $ref: '#/components/schemas/ImageVariants' },
                        initialScene: {
                            oneOf: [
                                { type: 'object' },
                                { type: 'boolean' }
                            ],
                            example: { x: 123 },
                            default: false,
                            description: 'If truthy (object with initial position), marks this scene as the starting point. All other scenes will be set to false.',
                        },
                        northOffset: {
                            type: 'number',
                            example: 45,
                            default: 0,
                            description: 'Compass rotation offset in degrees',
                        },
                        lat: {
                            type: 'number',
                            example: 41.2995,
                            nullable: true,
                            description: 'GPS latitude',
                        },
                        lng: {
                            type: 'number',
                            example: 69.2401,
                            nullable: true,
                            description: 'GPS longitude',
                        },
                        pins: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Pin' },
                            default: [],
                        },
                        title: { $ref: '#/components/schemas/MultiLang' },
                        description: { $ref: '#/components/schemas/MultiLang' },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            readOnly: true,
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            readOnly: true,
                        },
                    },
                },

                SceneInput: {
                    type: 'object',
                    required: ['id', 'image'],
                    description: 'Request body for creating or fully updating a scene',
                    properties: {
                        id: { type: 'string', example: 'scene-001' },
                        image: { $ref: '#/components/schemas/ImageVariants' },
                        initialScene: {
                            oneOf: [
                                { type: 'object' },
                                { type: 'boolean' }
                            ],
                            example: { x: 123 },
                            default: false,
                        },
                        northOffset: { type: 'number', example: 45, default: 0 },
                        lat: { type: 'number', example: 41.2995, nullable: true },
                        lng: { type: 'number', example: 69.2401, nullable: true },
                        pins: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Pin' },
                            default: [],
                        },
                        title: { $ref: '#/components/schemas/MultiLang' },
                        description: { $ref: '#/components/schemas/MultiLang' },
                    },
                },

                // ─── MapSceneNode ───────────────────────────────────
                MapSceneNode: {
                    type: 'object',
                    required: ['id', 'xPercent', 'yPercent'],
                    description: 'A scene marker positioned on the mini-map image',
                    properties: {
                        id: { type: 'string', example: 'scene-001' },
                        xPercent: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            example: 32.7,
                        },
                        yPercent: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            example: 58.1,
                        },
                        icon: {
                            type: 'string',
                            enum: ['pin', 'circle'],
                            default: 'circle',
                            example: 'circle',
                        },
                    },
                },

                // ─── MiniMap ───────────────────────────────────────
                MiniMap: {
                    type: 'object',
                    required: ['image', 'width', 'height'],
                    description: 'Mini-map configuration (singleton)',
                    properties: {
                        image: {
                            type: 'string',
                            example: 'http://localhost:5000/uploads/minimap/map.jpg',
                        },
                        width: { type: 'number', example: 1200 },
                        height: { type: 'number', example: 800 },
                        scenes: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MapSceneNode' },
                            default: [],
                        },
                        createdAt: { type: 'string', format: 'date-time', readOnly: true },
                        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },

                MiniMapInput: {
                    type: 'object',
                    required: ['image', 'width', 'height'],
                    properties: {
                        image: {
                            type: 'string',
                            example: 'http://localhost:5000/uploads/minimap/map.jpg',
                        },
                        width: { type: 'number', example: 1200 },
                        height: { type: 'number', example: 800 },
                        scenes: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MapSceneNode' },
                            default: [],
                        },
                    },
                },

                // ─── Upload Response ────────────────────────────────
                UploadSceneImagesResponse: {
                    type: 'object',
                    description:
                        '⚙️ Response after uploading scene images. ' +
                        'If `thumb` was not uploaded but `mobile` was provided, ' +
                        'the server **auto-generates** the thumbnail (4:3, 480×360 px, cropped from centre) ' +
                        'and returns its URL in `data.thumb`.',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: {
                            type: 'string',
                            example: 'Images uploaded successfully (thumb auto-generated from mobile)',
                            description:
                                'Includes "(thumb auto-generated from mobile)" suffix when thumb was auto-created.',
                        },
                        data: { $ref: '#/components/schemas/ImageVariants' },
                    },
                    example: {
                        success: true,
                        message: 'Images uploaded successfully (thumb auto-generated from mobile)',
                        data: {
                            full: 'http://localhost:5000/uploads/full/full-1705320600000-scene1.jpg',
                            mobile: 'http://localhost:5000/uploads/mobile/mobile-1705320600000-scene1.jpg',
                            thumb: 'http://localhost:5000/uploads/thumb/thumb-1705320600000-scene1.jpg',
                        },
                    },
                },

                // ─── Generic Responses ──────────────────────────────
                SceneListResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        count: { type: 'integer', example: 5 },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Scene' },
                        },
                    },
                },
                SceneSingleResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { $ref: '#/components/schemas/Scene' },
                    },
                },
                MiniMapResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { $ref: '#/components/schemas/MiniMap' },
                    },
                },
                SuccessMessage: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation completed successfully' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error description' },
                    },
                },
                ValidationErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Validation error' },
                        errors: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['xPercent is required', 'target is required'],
                        },
                    },
                },

                // ─── Module ───────────────────────────────────────
                Module: {
                    type: 'object',
                    required: ['slug', 'name'],
                    description: 'Virtual tur moduli (masalan: fakultet, bino, hudud)',
                    properties: {
                        slug: {
                            type: 'string',
                            example: 'fizmat',
                            description: 'URL-friendly unikal identifikator',
                        },
                        name: { $ref: '#/components/schemas/MultiLang' },
                        description: { $ref: '#/components/schemas/MultiLang' },
                        thumbnail: {
                            type: 'string',
                            example: 'http://localhost:5000/uploads/minimap/faculty.jpg',
                        },
                        order: { type: 'number', example: 0 },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time', readOnly: true },
                        updatedAt: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },
                ModuleInput: {
                    type: 'object',
                    required: ['slug', 'name'],
                    properties: {
                        slug: { type: 'string', example: 'fizmat' },
                        name: { $ref: '#/components/schemas/MultiLang' },
                        description: { $ref: '#/components/schemas/MultiLang' },
                        thumbnail: { type: 'string' },
                        order: { type: 'number', example: 0 },
                        isActive: { type: 'boolean', example: true },
                    },
                },
                ModuleListResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        count: { type: 'integer', example: 3 },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Module' },
                        },
                    },
                },
                ModuleSingleResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { $ref: '#/components/schemas/Module' },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Modules',
                description:
                    'Virtual tur modullari (masalan: fakultetlar, binolar, hududlar). ' +
                    '**GET routes are public. POST, PATCH, DELETE require auth.**',
            },
            {
                name: 'Auth',
                description: 'Admin authentication — login, register, and profile',
            },
            {
                name: 'Scenes',
                description:
                    'CRUD operations for panoramic scenes (module-scoped). ' +
                    '**GET routes are public. POST, PATCH, DELETE require auth.**',
            },
            {
                name: 'MiniMap',
                description:
                    'Mini-map configuration (one per module). **GET is public. POST, PATCH require auth.**',
            },
            {
                name: 'Upload',
                description:
                    'File upload endpoints for scene images and map images. ' +
                    'All endpoints require auth.',
            },
            {
                name: 'Health',
                description: 'Server health check',
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
