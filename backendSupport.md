# SmartMonk Backend Support — Single Source of Truth

> **Purpose:** One file to track everything backend-related for SmartMonk. Keep updated on every API/DB change. Mobile app (`E:\Projects\Mobile Applications\smartmonk`) and API (`smartmonk-api/`) both refer here.

---

## 1. Overview

- **Mobile:** Expo SDK 54, React Native, TypeScript, Expo Router (`app/(app)/`), AsyncStorage offline-first (`services/storage/storage.ts:3`)
- **Backend (Option A - Recommended):** Node.js 20 + Express 4 + TypeScript + Prisma 5 + PostgreSQL 15 + Zod + JWT + Swagger
- **API Base:** `https://smartmonk-api.onrender.com/api/v1` (placeholder — update after deploy)
- **Auth:** Firebase replaced by custom JWT (access 15m, refresh 7d). `password` in `types/auth.ts:9` was plain — now `passwordHash` via `bcrypt`.
- **Sync:** Offline-first. Mobile tries API first; on `!isOnline` or 5xx falls back to AsyncStorage + queue in `STORAGE_KEYS.SYNC_QUEUE` (to be added to `services/storage/storage.ts:3`), flushed when online.

---

## 2. Tech Stack & Versions

| Layer | Choice | Version | Why |
|-------|--------|---------|-----|
| Runtime | Node.js | 20 LTS | LTS, Prisma support |
| Framework | Express | 4.18 | Minimal, you control everything |
| Language | TypeScript | 5.3 | Matches mobile `tsconfig.json:3` strict |
| ORM | Prisma | 5.x | Typed client, migrations, `npx prisma migrate dev` |
| DB | PostgreSQL | 15 | Relational — needed for `Supplier ↔ Trip`, `Vehicle ↔ Driver`, financial aggregates |
| Validation | Zod | 3.x | Mirrors `utils/validation.ts:24-60` regexes |
| Auth | bcrypt + jsonwebtoken | 5.x / 9.x | `password` → `passwordHash`, `jwt.sign({uid})` |
| Docs | swagger-jsdoc + swagger-ui-express | - | Auto `GET /api/docs` |
| Uploads | multer + Cloudflare R2 (S3) | - | `profileImage` was `file://` in `types/profile.ts:19`, now `profileImageUrl` |
| Deploy | Docker + Render/Railway | - | `Dockerfile` + `docker-compose.yml` (api + postgres) |

---

## 3. Database Schema (Prisma)

**Source:** `types/auth.ts:4`, `types/profile.ts:10`, `types/supplier.ts:1`, `types/pump.ts:1`, `types/trip.ts:1`, `types/driver.ts:1`, `services/storage/storage.ts:3`

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql", url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id           String     @id @default(uuid()) // was generateId() in utils/generateId.ts:1
  email        String     @unique // lowercased, from types/auth.ts:8
  passwordHash String
  name         String
  createdAt    DateTime   @default(now())
  profile      Profile?
  suppliers    Supplier[]
  pumps        Pump[]
  trips        Trip[]
  drivers      Driver[]
}

model Profile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName        String
  businessName    String?
  mobile          String
  countryCode     String   @default("+91")
  dob             DateTime?
  businessType    String?  // "Truck Owner" etc. from types/profile.ts:1
  vehicleCount    String?  // "1" | "2-5" | "6-10" | "10+"
  location        String?
  gstNumber       String?
  profileImageUrl String?  // was local file:// in types/profile.ts:19
  completed       Boolean  @default(false)
  vehicles        Vehicle[]
  updatedAt       DateTime @updatedAt
}

model Vehicle {
  id        String  @id @default(uuid())
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  number    String  // from types/profile.ts:13, unique per profile
  @@unique([profileId, number])
}

model Supplier {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  contact   String
  material  String?  // added for Trip material dropdown
  address   String?
  createdAt DateTime @default(now())
  trips     Trip[]   @relation("SupplierTrips")
  @@unique([userId, contact])
  @@unique([userId, name])
}

model Pump {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  contact   String
  location  String
  createdAt DateTime @default(now())
  @@unique([userId, name])
}

model Driver {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName        String
  contact         String
  bloodGroup      String?  // enum A+ etc. from types/driver.ts:1
  aadhar          String?  @unique
  licence         String   @unique
  address         String?
  salary          Decimal?
  assignedVehicle String?  // must exist in Profile.vehicles[].number
  createdAt       DateTime @default(now())
}

model Trip {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  truckNumber   String   // from profile.vehicles, single vs dropdown in app/(app)/trips.tsx
  date          DateTime
  material      String   // from Supplier.material
  materialPrice Decimal?
  supplierId    String?
  supplier      Supplier? @relation("SupplierTrips", fields: [supplierId], references: [id])
  supplierName  String   // denormalized for list
  clientName    String
  tripsCount    Int      @default(1)
  location      String
  totalValue    Decimal  @default(0)
  profit        Decimal  @default(0)
  totalExpense  Decimal  @default(0)
  paymentStatus String   @default("Pending") // Pending/Paid/Partial
  createdAt     DateTime @default(now())
  @@index([userId, date])
  @@index([userId, supplierId])
}
```

**Migration for existing offline data:** `profile.vehicles: Vehicle[]` inline array (`profileStorage.ts:10`) → `Vehicle` table via `POST /profile/vehicles/bulk`. `password` plain → cannot migrate, force `POST /auth/signup` with same email.

---

## 4. API Contract (Base: `/api/v1`)

### Auth (Public)
| Method | Path | Req Body | Res 200 | Errors |
|--------|------|----------|---------|--------|
| POST | `/auth/signup` | `{name, email, password}` | `{user:{id,name,email}, accessToken, refreshToken}` | 409 email exists, 400 validation |
| POST | `/auth/login` | `{email, password}` | same | 401 invalid |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` | 401 |
| POST | `/auth/logout` | `{refreshToken}` | `{message}` | - |

### Profile (Auth: Bearer)
| Method | Path | Req | Res |
|--------|------|-----|-----|
| GET | `/profile` | - | `Profile + vehicles[]` |
| PUT | `/profile` | `{fullName, businessName, mobile, countryCode, dob, businessType, vehicleCount, location, gstNumber, profileImageUrl, completed}` | `Profile` |
| POST | `/profile/vehicles` | `{number}` | `Vehicle` |
| DELETE | `/profile/vehicles/:id` | - | 204 |
| POST | `/profile/vehicles/bulk` | `{vehicles: [{number}]}` | `Vehicle[]` |
| POST | `/uploads/profile-image` | `multipart file` | `{url}` |

### Suppliers
| Method | Path | Req | Res |
|--------|------|-----|-----|
| GET | `/suppliers?search=&page=1&limit=20` | - | `{data: Supplier[], total, page}` |
| POST | `/suppliers` | `{name, contact, material, address}` | `Supplier` 201 |
| PUT | `/suppliers/:id` | same | `Supplier` |
| DELETE | `/suppliers/:id` | - | 204 |

### Pumps
| Method | Path | Req | Res |
|--------|------|-----|-----|
| GET | `/pumps` | - | `Pump[]` |
| POST | `/pumps` | `{name, contact, location}` | `Pump` |
| PUT | `/pumps/:id` | same | `Pump` |
| DELETE | `/pumps/:id` | - | 204 |

### Drivers
| Method | Path | Req | Res |
|--------|------|-----|-----|
| GET | `/drivers?assignedVehicle=MH12` | - | `Driver[]` |
| POST | `/drivers` | `{fullName, contact, bloodGroup, aadhar (12d), licence (8-20 alphanum), address, salary, assignedVehicle}` | `Driver` |
| PUT | `/drivers/:id` | same | `Driver` |
| DELETE | `/drivers/:id` | - | 204 |

### Trips
| Method | Path | Req | Res |
|--------|------|-----|-----|
| GET | `/trips?from=2024-01-01&to=2024-12-31&supplierId=&paymentStatus=&page=1` | - | `{data: Trip[], total}` |
| POST | `/trips` | `{truckNumber, date, material, materialPrice, supplierId, supplierName, clientName, tripsCount, location, totalValue, profit, totalExpense, paymentStatus}` | `Trip` |
| PUT | `/trips/:id` | same | `Trip` |
| DELETE | `/trips/:id` | - | 204 |

**Paginated:** `GET` returns `{data, total, page, limit}`. **Errors:** `{error, field}` 400, 401, 409 duplicate, 404.

**Curl Examples:**
```bash
curl -X POST https://api.example.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Vishwajeet","email":"v@test.com","password":"123456"}'

curl https://api.example.com/api/v1/suppliers \
  -H "Authorization: Bearer <accessToken>"

curl -X POST https://api.example.com/api/v1/trips \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"truckNumber":"MH12 AB 1234","date":"2026-08-25","material":"Cement","materialPrice":50000,"supplierName":"ABC Suppliers","clientName":"XYZ Client","tripsCount":2,"location":"Pune","totalValue":100000,"profit":20000,"totalExpense":80000,"paymentStatus":"Pending"}'
```

Swagger: `GET /api/docs`

---

## 5. Environment Variables

```env
# smartmonk-api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartmonk?schema=public"
JWT_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"
PORT=3000
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="smartmonk-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# smartmonk/.env (Expo)
EXPO_PUBLIC_API_URL=https://smartmonk-api.onrender.com/api/v1
```

Add to `.gitignore` (already `.env*.local`): `smartmonk-api/.env`, `smartmonk/.env`

---

## 6. Sync Strategy (Offline-First)

1. Mobile `services/api/client.ts` (axios, baseURL `EXPO_PUBLIC_API_URL`, interceptor adds `Authorization`, on 401 tries `POST /auth/refresh`).
2. `services/sync/queue.ts` — array stored in `AsyncStorage` key `STORAGE_KEYS.SYNC_QUEUE` (`@smartmonk_sync_queue`): `{id, method, url, body, timestamp}`.
3. Every write (`add`/`update`/`remove` in `supplierStorage.ts:10`, `tripStorage.ts:10` etc.) does:
   ```ts
   try { await api.post('/suppliers', data); await storage.set(...); }
   catch (e) { if (!netInfo.isConnected || e.response?.status >=500) { await queue.push({method:'POST', url:'/suppliers', body:data}); await storage.set(...local); } else throw; }
   ```
4. `hooks/useNetwork.ts` (NetInfo) → when `isConnected` true, flush queue FIFO, last-write-wins (for now, no conflict UI).
5. `profileImage`: if `file://`, `uploadBytes` to R2/`/uploads/profile-image` first, get `url`, then save `profileImageUrl`.

---

## 7. Mobile Integration Checklist (After API Ready)

- [ ] `npx expo install expo-secure-store` (for refreshToken, more secure than AsyncStorage)
- [ ] Create `services/api/client.ts`, `services/api/authApi.ts`, `supplierApi.ts`, `pumpApi.ts`, `tripApi.ts`, `driverApi.ts`, `profileApi.ts`
- [ ] Update `hooks/useAuth.ts` → `onAuthStateChanged` replacement: store tokens, `isAuthenticated` from `accessToken`
- [ ] Update `app/(app)/suppliers.tsx:33`, `pumps.tsx`, `trips.tsx`, `drivers.tsx` `load()` to `try { api.getAll } catch { storage.getAll }`
- [ ] Add `services/sync/queue.ts` + `hooks/useNetwork.ts` banner "Offline — saved locally"
- [ ] `app/_layout.tsx` splash wait for `getProfile` from API, not `authStorage.getSession`
- [ ] Test: Airplane mode → add supplier → online → verify in `GET /suppliers` + second device

---

## 8. Local Dev & Deploy Steps

```bash
# 1. DB
docker run --name smartmonk-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smartmonk -d postgres:15
# 2. API
cd smartmonk-api
npm install
npx prisma migrate dev --name init
npx prisma db seed # optional one user
npm run dev # tsx watch src/app.ts -> http://localhost:3000
# Test
curl http://localhost:3000/api/docs
# 3. Deploy
git init && git push to GitHub smartmonk-api
# Render: New Web Service -> Connect repo -> Build: npm install && npx prisma migrate deploy && npm run build, Start: npm start, Env: DATABASE_URL (from Render Postgres), JWT_SECRET
# Railway: railway up (auto)
# 4. Mobile
echo "EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api/v1" > smartmonk/.env
```

---

## 9. Prompt to Generate Backend (Copy-Paste to Cursor/Claude)

See Section 1 of this file's git history or `backendSupport.md` in chat — full prompt with schema + routes included. After generation, update this file's **Changelog** below with deployed URL.

---

## 10. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-08-25 | Initial backendSupport.md created (Option A, schema from offline types) | Agent |
| | API deployed at: `__ADD_URL_HERE__` | You |
| | Mobile integrated: `services/api/*` + queue | Agent |

---

**Next:** Paste the prompt from Chat (Section 9) into your backend generator, or say `scaffold api` and I’ll create `smartmonk-api/` directly. When API is live, give me `EXPO_PUBLIC_API_URL` + `JWT_SECRET` and I’ll wire the Expo app.
