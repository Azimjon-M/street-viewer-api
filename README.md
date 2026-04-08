# 🌐 Street Viewer API v2.0.0

Ko'p modulli virtual tur backend — 360° panoramik sahnalar, navigatsiya pinlari va mini-xarita konfiguratsiyasini boshqarish uchun REST API.

> **v2.0.0 (Multi-Module)** — Har bir modul (fakultet, bino, hudud) mustaqil virtual tur sifatida ishlaydi. Bitta API — cheksiz virtual turlar.

---

## 📦 Texnologiyalar

| Stack | Versiya | Vazifasi |
|-------|---------|----------|
| Node.js | v18+ | Runtime |
| Express.js | v4 | Web framework |
| MongoDB + Mongoose | v8 | Ma'lumotlar bazasi |
| JWT | jsonwebtoken | Autentifikatsiya |
| Multer | — | Fayl yuklash |
| Sharp | — | Rasm optimallashtirish |
| node-cron | — | Avtomatik cleanup |
| Swagger UI | — | API dokumentatsiya |

---

## 🚀 Ishga tushirish

```bash
# 1. O'rnatish
npm install

# 2. .env fayl yaratish
cp .env.example .env
# MONGODB_URI va JWT_SECRET ni to'ldiring

# 3. Admin akkaunt yaratish
npm run seed:admin

# 4. Development server
npm run dev

# 5. Swagger docs
# http://localhost:5000/api-docs
```

### .env namuna

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/street-viewer

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Default Admin (seed uchun)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password

# CORS (vergul bilan ajratilgan)
WHITELISTED_DOMAINS=http://localhost:5173,http://192.168.1.100:5173
```

---

## 🏗️ Arxitektura — Multi-Module

```
┌─────────────────────────────────────────────────────┐
│                    Street Viewer API                 │
│                       v2.0.0                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Module 1   │  │   Module 2   │  │   Module N   │ │
│  │  "default"  │  │  "fizmat"   │  │  "texnika"  │ │
│  │             │  │             │  │             │ │
│  │ ○ Scenes    │  │ ○ Scenes    │  │ ○ Scenes    │ │
│  │ ○ MiniMap   │  │ ○ MiniMap   │  │ ○ MiniMap   │ │
│  │ ○ Pins      │  │ ○ Pins      │  │ ○ Pins      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  Har bir modul — mustaqil virtual tur               │
│  O'z sahnalari, minimapi va pinlari bor             │
└─────────────────────────────────────────────────────┘
```

### Modullar nima?

| Tushuncha | Tavsif |
|-----------|--------|
| **Module** | Alohida virtual tur (masalan: "Fizmat fakulteti", "Texnika fakulteti") |
| **slug** | URL-friendly identifikator (`fizmat`, `texnika`, `default`) |
| **Scene** | Modulga tegishli 360° panoramik sahna |
| **MiniMap** | Modulning mini-xaritasi (har bir modul uchun 1 ta) |
| **Pin** | Sahnalar o'rtasida navigatsiya nuqtasi |

> 💡 Server start bo'lganda avtomatik `default` modul va uning MiniMapi yaratiladi.

---

## 🗂️ Loyiha tuzilmasi

```
src/
├── config/
│   ├── db.js                   # MongoDB ulanish
│   ├── scheduler.js            # Avtomatik cleanup (03:00 da)
│   └── swagger.js              # API dokumentatsiya konfiguratsiyasi
├── controllers/
│   ├── authController.js       # Login, register, getMe
│   ├── miniMapController.js    # MiniMap CRUD (modul-scoped)
│   ├── moduleController.js     # Module CRUD + ensureDefaultModule
│   └── sceneController.js      # Scene CRUD (modul-scoped)
├── middleware/
│   ├── authMiddleware.js       # JWT protect
│   ├── errorHandler.js         # Global xato handler
│   └── upload.js               # Multer konfiguratsiyasi
├── models/
│   ├── Admin.js                # Admin modeli
│   ├── MiniMap.js              # MiniMap (moduleSlug bilan)
│   ├── Module.js               # ✨ Module modeli (yangi)
│   └── Scene.js                # Scene (moduleSlug bilan)
├── routes/
│   ├── authRoutes.js           # /api/auth/*
│   ├── miniMapRoutes.js        # /api/minimap (legacy → default modul)
│   ├── moduleMiniMapRoutes.js  # /api/modules/:slug/minimap
│   ├── moduleRoutes.js         # /api/modules
│   ├── moduleSceneRoutes.js    # /api/modules/:slug/scenes
│   ├── moduleUploadRoutes.js   # /api/modules/:slug/upload
│   ├── sceneRoutes.js          # /api/scenes (legacy → default modul)
│   └── uploadRoutes.js         # /api/upload (legacy → default modul)
├── scripts/
│   ├── cleanup.js              # Manuel cleanup script
│   └── migrate-to-modules.js   # ✨ Migration (v1 → v2)
├── utils/
│   ├── cleanupOrphans.js       # Orphan fayllarni topish/o'chirish
│   ├── generateThumb.js        # Mobile rasmdan avtomatik thumb yaratish
│   └── jwt.js                  # Token generatsiya/verifikatsiya
├── app.js                      # Express middleware va routelar
├── seed.js                     # Sample data
├── seed-admin.js               # Admin yaratish
└── server.js                   # Server start, DB connect
uploads/
├── full/       # To'liq o'lchamli panorama rasimlar
├── mobile/     # Mobil optimizatsiya qilingan
├── thumb/      # Kichik preview rasimlar (avtomatik)
└── minimap/    # Mini-xarita fon rasmi
```

---

## 🔑 Autentifikatsiya

Barcha `🔒` endpointlar uchun `Authorization` header kerak:

```
Authorization: Bearer <JWT_TOKEN>
```

### Login (token olish)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Javob:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "email": "admin@example.com" }
}
```

> Token **7 kun** amal qiladi. Muddati o'tgach qayta login kerak.

---

## 📡 API Endpointlar

### 📦 Modules (Modullar)

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/modules` | ❌ | Barcha faol modullar (`?all=true` → nofaollarni ham) |
| GET | `/api/modules/:slug` | ❌ | Bitta modul |
| POST | `/api/modules` | 🔒 | Yangi modul yaratish |
| PATCH | `/api/modules/:slug` | 🔒 | Modulni yangilash (slug o'zgarmaydi) |
| DELETE | `/api/modules/:slug` | 🔒 | Bo'sh modulni o'chirish |

> ⚠️ `default` modulni o'chirib bo'lmaydi. Modulni faqat sahnalari bo'sh bo'lganda o'chirish mumkin.

#### Module obyekti:

```json
{
  "slug": "fizmat",
  "name": {
    "uz": "Fizika-Matematika fakulteti",
    "ru": "Физико-Математический факультет",
    "en": "Physics-Mathematics Faculty"
  },
  "description": { "uz": "...", "ru": "...", "en": "..." },
  "thumbnail": "http://localhost:5000/uploads/minimap/faculty.jpg",
  "order": 1,
  "isActive": true
}
```

#### Modul yaratish:

```http
POST /api/modules
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "fizmat",
  "name": { "uz": "Fizika-Matematika", "ru": "Физмат", "en": "PhysMath" },
  "order": 1
}
```

> Modul yaratilganda avtomatik bo'sh MiniMap ham yaratiladi.

---

### 🏙️ Scenes (Panoramik sahnalar)

**Module-scoped (tavsiya):**

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/modules/:slug/scenes` | ❌ | Modul sahnalari |
| GET | `/api/modules/:slug/scenes/:id` | ❌ | Bitta sahna |
| POST | `/api/modules/:slug/scenes` | 🔒 | Sahna yaratish |
| PATCH | `/api/modules/:slug/scenes/:id` | 🔒 | Sahnani yangilash |
| DELETE | `/api/modules/:slug/scenes/:id` | 🔒 | Sahnani o'chirish |

**Legacy (default modul):**

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/scenes` | ❌ | Default modul sahnalari |
| GET | `/api/scenes/:id` | ❌ | Bitta sahna |
| POST | `/api/scenes` | 🔒 | Sahna yaratish |
| PATCH | `/api/scenes/:id` | 🔒 | Sahnani yangilash |
| DELETE | `/api/scenes/:id` | 🔒 | Sahnani o'chirish |

> **Legacy endpointlar** avtomatik `default` modulga yo'naltiriladi. Mavjud frontend buzilmaydi.

#### Scene obyekti:

```json
{
  "moduleSlug": "fizmat",
  "id": "bosh-kirish",
  "image": {
    "full":   "http://localhost:5000/uploads/full/image-xxx.jpg",
    "mobile": "http://localhost:5000/uploads/mobile/mobile-xxx.jpg",
    "thumb":  "http://localhost:5000/uploads/thumb/thumb-xxx.jpg"
  },
  "initialScene": { "x": 123 },
  "northOffset": 45,
  "lat": 41.2995,
  "lng": 69.2401,
  "pins": [
    {
      "id": "67bc3a1f...",
      "xPercent": 45.5,
      "yPercent": 38.2,
      "target": "ikkinchi-xona",
      "icon": "pin"
    }
  ],
  "title": { "uz": "Bosh kirish", "ru": "Главный вход", "en": "Main Entrance" },
  "description": { "uz": "...", "ru": "...", "en": "..." }
}
```

#### Sahna yaratish:

```http
POST /api/modules/fizmat/scenes
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "bosh-kirish",
  "image": {
    "full":   "http://localhost:5000/uploads/full/image-xxx.jpg",
    "mobile": "http://localhost:5000/uploads/mobile/mobile-xxx.jpg",
    "thumb":  "http://localhost:5000/uploads/thumb/thumb-xxx.jpg"
  },
  "initialScene": { "x": 123 },
  "northOffset": 0,
  "title": { "uz": "Bosh kirish", "ru": "Главный вход", "en": "Main Entrance" }
}
```

> `moduleSlug` avtomatik URL dan olinadi — bodyda yuborish shart emas.

#### Pinlarni yangilash:

```http
PATCH /api/modules/fizmat/scenes/bosh-kirish
Authorization: Bearer <token>
Content-Type: application/json

{
  "pins": [
    {
      "xPercent": 45.5,
      "yPercent": 38.2,
      "target": "ikkinchi-xona",
      "icon": "pin"
    }
  ]
}
```

> ⚠️ `pin.id` yubormangling — server avtomatik generatsiya qiladi.
> `pins` to'liq array yuboriladi (barchasi birdan replace qilinadi).

---

### 🗺️ MiniMap (Mini-xarita)

**Module-scoped (tavsiya):**

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/modules/:slug/minimap` | ❌ | Modul minimapini olish |
| POST | `/api/modules/:slug/minimap` | 🔒 | Asosiy data: `image`, `width`, `height` |
| PATCH | `/api/modules/:slug/minimap` | 🔒 | Qisman yangilash (`scenes` pozitsiyalari) |

**Legacy (default modul):**

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| GET | `/api/minimap` | ❌ | Default modul minimapi |
| POST | `/api/minimap` | 🔒 | Asosiy data |
| PATCH | `/api/minimap` | 🔒 | Qisman yangilash |

> Har bir modul uchun faqat **1 ta** MiniMap bo'ladi. Server start da avtomatik yaratiladi.

#### MiniMap obyekti:

```json
{
  "moduleSlug": "fizmat",
  "image": "http://localhost:5000/uploads/minimap/map.png",
  "width": 1920,
  "height": 1080,
  "scenes": [
    {
      "id": "bosh-kirish",
      "xPercent": 32.7,
      "yPercent": 58.1,
      "icon": "circle"
    }
  ]
}
```

#### MiniMap asosiy data saqlash:

```http
POST /api/modules/fizmat/minimap
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "http://localhost:5000/uploads/minimap/map.png",
  "width": 1920,
  "height": 1080
}
```

#### MiniMap scenes yangilash:

```http
PATCH /api/modules/fizmat/minimap
Authorization: Bearer <token>
Content-Type: application/json

{
  "scenes": [
    { "id": "bosh-kirish", "xPercent": 32.7, "yPercent": 58.1, "icon": "circle" },
    { "id": "ikkinchi-xona", "xPercent": 65.3, "yPercent": 42.9, "icon": "pin" }
  ]
}
```

---

### 📁 Upload (Fayl yuklash)

Barcha upload endpointlari `🔒` token talab qiladi.

**Module-scoped (tavsiya):**

| Method | Endpoint | Field | Tavsif |
|--------|----------|-------|--------|
| POST | `/api/modules/:slug/upload/scene-images` | `image` | Panorama rasm (avtomatik: full, mobile, thumb) |
| POST | `/api/modules/:slug/upload/minimap-image` | `mapImage` | Mini-xarita fon rasmi |
| POST | `/api/modules/:slug/upload/module-thumbnail` | `thumbnail` | Modul asosiy rasmi (thumbnail) |

**Legacy (default modul):**

| Method | Endpoint | Field | Tavsif |
|--------|----------|-------|--------|
| POST | `/api/upload/scene-images` | `image` | Panorama rasm |
| POST | `/api/upload/minimap-image` | `mapImage` | Mini-xarita fon rasmi |

#### Scene rasmini yuklash:

```http
POST /api/modules/fizmat/upload/scene-images
Authorization: Bearer <token>
Content-Type: multipart/form-data

image=<file>     # Bitta panorama rasm yuboriladi
```

> ⚡ **Avtomatik generatsiya:** Server bitta rasmdan 3 ta versiya yaratadi:
> - **full** — max 4000px, JPEG 85%
> - **mobile** — max 2048px, JPEG 75%
> - **thumb** — 480×360 (4:3), JPEG 80%, markazdan qirqiladi

**Javob:**
```json
{
  "success": true,
  "message": "Bitta rasmdan muvaffaqiyatli saqlandi va barcha qisqartmalar avtorejimda yaratildi",
  "data": {
    "full":   "http://localhost:5000/uploads/full/image-1234567890.jpg",
    "mobile": "http://localhost:5000/uploads/mobile/mobile-1234567890.jpg",
    "thumb":  "http://localhost:5000/uploads/thumb/thumb-1234567890.jpg"
  }
}
```

#### Mini-xarita rasmi yuklash:

```http
POST /api/modules/fizmat/upload/minimap-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

mapImage=<file>
```

#### Modul asosiy rasmi (thumbnail) yuklash:

```http
POST /api/modules/fizmat/upload/module-thumbnail
Authorization: Bearer <token>
Content-Type: multipart/form-data

thumbnail=<file>
```

---

### 🔓 Auth

| Method | Endpoint | Auth | Tavsif |
|--------|----------|------|--------|
| POST | `/api/auth/login` | ❌ | Login, token olish |
| POST | `/api/auth/register` | ❌ | Yangi admin yaratish |
| GET | `/api/auth/me` | 🔒 | Joriy admin ma'lumotlari |

---

## 🔄 Virtual tur yaratish oqimi

### 1. Yangi modul yaratish

```
1. POST /api/auth/login                               → token
2. POST /api/modules                                  → { slug: "fizmat", name: {...} }
```

### 2. Modulga sahnalar qo'shish

```
3. POST /api/modules/fizmat/upload/scene-images       → image fayl → { full, mobile, thumb }
4. POST /api/modules/fizmat/scenes                    → { id, image: {URL lar}, title, ... }
5. PATCH /api/modules/fizmat/scenes/:id               → { pins: [...] }  (navigatsiya)
```

### 3. Mini-xaritani sozlash

```
6. POST /api/modules/fizmat/upload/minimap-image      → mapImage fayl → { image URL }
7. POST /api/modules/fizmat/minimap                   → { image, width, height }
8. PATCH /api/modules/fizmat/minimap                  → { scenes: [...pozitsiyalar] }
```

---

## 📐 Rasm o'lchamlari

| Tur | O'lcham | Izoh |
|-----|---------|------|
| Yuklanadigan rasm | Ixtiyoriy (tavsiya: sifatli panorama) | Faqat 1 ta rasm yuklanadi |
| `full` | max 4000px, JPEG 85% | Server avtomatik siqadi |
| `mobile` | max 2048px, JPEG 75% | Server avtomatik yaratadi |
| `thumb` | 480×360 (4:3), JPEG 80% | Server markazdan qirqib yaratadi |

---

## 🗓️ NPM Scripts

```bash
npm run dev          # nodemon bilan development server
npm start            # production server
npm run seed:admin   # default admin yaratish
npm run seed         # sample data bilan to'ldirish
npm run migrate      # v1 → v2 migration (mavjud datalarni modulga biriktirish)
npm run cleanup      # orphan fayllarni o'chirish
npm run cleanup:dry  # orphan fayllarni ko'rsatish (xavfsiz)
```

---

## 🧹 Cleanup

```bash
# Faqat ko'rsatish (xavfsiz — o'chirmaydi)
npm run cleanup:dry

# Orphan fayllarni o'chirish
npm run cleanup
```

> ⏰ Avtomatik cleanup **har kuni 03:00 da** ishlaydi (node-cron).

---

## 📚 Swagger UI

```
http://localhost:5000/api-docs
```

Barcha endpointlarni brauzerdan interaktiv sinab ko'rish mumkin.

**Swagger da token ishlatish:**
1. `POST /api/auth/login` → token olish
2. Sahifadagi **Authorize 🔓** tugmasini bosish
3. `Bearer <token>` kiritish → **Authorize**

---

## 🛡️ Xavfsizlik

- JWT token muddati: **7 kun** (`.env` da sozlanadi)
- Fayl hajmi chegarasi: **50 MB**
- Ruxsat etilgan fayl turlari: `jpg`, `jpeg`, `png`, `gif`, `webp`, `avif`
- Upload endpointlari token talab qiladi
- `default` modulni o'chirib bo'lmaydi
- Bo'sh bo'lmagan modulni o'chirib bo'lmaydi
- Modul `slug` ini yaratgandan keyin o'zgartirib bo'lmaydi

---

## 🔀 Migration (v1 → v2)

Agar v1 dan v2 ga o'tayotgan bo'lsangiz:

```bash
npm run migrate
```

Bu skript:
1. `default` modul yaratadi
2. Barcha mavjud sahnalarga `moduleSlug: 'default'` qo'shadi
3. MiniMap ni modulga biriktiradi
4. Eski indexlarni tozalaydi

> ⚠️ Migration faqat bir marta ishga tushiriladi. Qayta ishga tushirish xavfsiz (idempotent).

---

## ⚙️ Frontend uchun prompt

> AI yordamchi yoki developer uchun loyiha konteksti:

```
Loyiha: Street Viewer 360° Virtual Tour (React)
API versiya: v2.0.0 (Multi-Module)

Backend API: http://localhost:5000
Swagger docs: http://localhost:5000/api-docs

=== ARXITEKTURA ===
API ko'p modulli tizim. Har bir modul — alohida virtual tur.
Modullar: /api/modules (CRUD)
Sahna/MiniMap: /api/modules/:slug/scenes va /api/modules/:slug/minimap

=== AUTENTIFIKATSIYA ===
- POST /api/auth/login → { email, password } → { token, admin }
- Token localStorage ga saqlanadi
- Har so'rovda header: Authorization: Bearer <token>
- Token 7 kun amal qiladi

=== MODULLAR ===
Module obyekti:
{
  slug: String (unique, URL-friendly, masalan: "fizmat"),
  name: { uz, ru, en },
  description: { uz, ru, en },
  thumbnail: String (URL),
  order: Number,
  isActive: Boolean
}

Endpointlar:
- GET    /api/modules              → barcha modullar (public)
- GET    /api/modules/:slug        → bitta modul (public)
- POST   /api/modules              → yaratish (token kerak)
- PATCH  /api/modules/:slug        → yangilash (token kerak)
- DELETE /api/modules/:slug        → o'chirish (token kerak)

=== SAHNALAR (SCENES) ===
Scene obyekti:
{
  moduleSlug: String,
  id: String (unique per module, masalan: "bosh-kirish"),
  image: { full, mobile, thumb },
  initialScene: Object | Boolean,
  northOffset: Number (0-360),
  lat: Number | null,
  lng: Number | null,
  pins: [{ xPercent, yPercent, target, icon }],
  title: { uz, ru, en },
  description: { uz, ru, en }
}

Endpointlar:
- GET    /api/modules/:slug/scenes          → modul sahnalari (public)
- GET    /api/modules/:slug/scenes/:id      → bitta sahna (public)
- POST   /api/modules/:slug/scenes          → yaratish (token kerak)
- PATCH  /api/modules/:slug/scenes/:id      → yangilash (token kerak)
- DELETE /api/modules/:slug/scenes/:id      → o'chirish (token kerak)

PIN MUHIM:
- pin.id ni YUBORMANG — server avtomatik generatsiya qiladi
- pins arrayni to'liq yuboring (replace qilinadi)

=== MINI-XARITA ===
MiniMap obyekti:
{
  moduleSlug: String,
  image: String (URL),
  width: Number,
  height: Number,
  scenes: [{ id, xPercent, yPercent, icon }]
}

Endpointlar:
- GET   /api/modules/:slug/minimap   → olish (public)
- POST  /api/modules/:slug/minimap   → image, width, height saqlash (token)
- PATCH /api/modules/:slug/minimap   → scenes pozitsiyalarini yangilash (token)

=== FAYL YUKLASH ===
- POST /api/modules/:slug/upload/scene-images  → form-data: image
  ⚡ FAQAT 1 TA RASM yuboriladi. Server avtomatik full, mobile, thumb yaratadi.
- POST /api/modules/:slug/upload/minimap-image → form-data: mapImage
- POST /api/modules/:slug/upload/module-thumbnail → form-data: thumbnail
Ikkalasi ham token talab qiladi. Max hajm: 50MB.

=== SAHNA YARATISH OQIMI ===
1. POST /api/modules → modul yaratish
2. POST /api/modules/:slug/upload/scene-images → rasm yuklash
3. POST /api/modules/:slug/scenes → sahna yaratish
4. PATCH /api/modules/:slug/scenes/:id → pinlar qo'shish
5. POST /api/modules/:slug/upload/minimap-image → xarita rasmi
6. POST /api/modules/:slug/minimap → xarita sozlash
7. PATCH /api/modules/:slug/minimap → sahnalar pozitsiyasi

=== LEGACY ENDPOINTLAR (default modul) ===
/api/scenes, /api/minimap, /api/upload — ishlayveradi

=== JAVOB FORMATLARI ===
Muvaffaqiyat: { success: true, data: {...} }
Xato: { success: false, message: "...", errors?: [...] }
```

---

*Street Viewer API v2.0.0 — Multi-Module Architecture — 2026*
