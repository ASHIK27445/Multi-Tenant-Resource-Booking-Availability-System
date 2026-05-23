# Multi-Tenant Resource Booking & Availability System

A production-grade backend system for managing shared resources and bookings across multiple organizations with complete data isolation.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen)

---

## 🎯 Overview

Multi-tenant booking system where multiple organizations independently manage resources (meeting rooms, desks, devices) and allow employees to create time-based bookings. Each organization operates in complete isolation with its own users, resources, timezone, and booking policies.

---

## ✨ Key Features

- **Multi-Tenant Isolation** - Complete data separation between organizations
- **Timezone-Aware Scheduling** - All times in organization's timezone (Luxon)
- **Smart Availability Engine** - Dynamic slot generation with conflict detection
- **Buffer Time Management** - Configurable gaps between bookings
- **Three-way Conflict Detection** - Prevents overlapping bookings
- **Role-Based Access** - ORG_ADMIN and EMPLOYEE roles
- **Soft Delete** - Safe resource deletion with active booking checks

---

## 🛠 Tech Stack

- **TypeScript** - Type safety
- **Node.js + Express** - Backend framework
- **MongoDB + Mongoose** - Database with ODM
- **Zod** - Request validation
- **Luxon** - Date/time handling
- **JWT + bcrypt** - Authentication & security

---

## 📁 Project Structure

```
src/
├── config/              # Database & environment setup
├── middleware/           # Auth, tenant isolation, validation
├── modules/
│   ├── auth/           # Login, register, JWT
│   ├── organization/   # Company setup
│   ├── resource/       # Rooms, desks, devices
│   ├── booking/        # Booking CRUD, conflict detection
│   └── availability/   # Slot calculation engine ⭐
├── shared/
│   ├── errors/         # Custom error classes
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Date/time helpers
├── app.ts
└── server.ts
```

---

##  Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+
- npm

### Installation

```bash
# Clone & install
git clone <repo-url>
cd multi-tenant-booking-system
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest
# OR
sudo systemctl start mongodb

# Run app
npm run dev
```

### Verify
```bash
curl http://localhost:3000/health
# Response: { "status": "healthy" }
```

---

##  Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb:...
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

---

##  API Endpoints

### Base URL: `http://localhost:3000/api`

### Organization
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/organizations` | No | - |
| GET | `/organizations/my-organization` | Yes | Any |
| PATCH | `/organizations/:id` | Yes | ORG_ADMIN |

### Authentication
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/auth/login` | No | - |
| POST | `/auth/register` | Yes | ORG_ADMIN |
| GET | `/auth/profile` | Yes | Any |

### Resources
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/resources` | Yes | ORG_ADMIN |
| GET | `/resources` | Yes | Any |
| GET | `/resources/:id` | Yes | Any |
| PATCH | `/resources/:id` | Yes | ORG_ADMIN |
| DELETE | `/resources/:id` | Yes | ORG_ADMIN |

### Bookings
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/bookings` | Yes | Any |
| GET | `/bookings` | Yes | Any |
| DELETE | `/bookings/:id` | Yes | Owner/Admin |

### Availability
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/availability` | Yes | Any |

**Query Parameters:** `resourceId` (required), `date`, `startDate`, `endDate`, `durationMinutes`

---

##  Core Architecture

### Multi-Tenant Isolation
Every model includes `organizationId`. All queries filter by it automatically through middleware.

```typescript
// JWT contains organization context
{
  userId: "...",
  organizationId: "6a11733bf89e4c915be2d939",
  role: "ORG_ADMIN"
}

// All queries scoped to tenant
Resource.find({ organizationId: req.user.organizationId })
```

### Timezone Strategy
- **Storage:** Always UTC
- **Display:** Organization's timezone
- **Validation:** Organization's timezone

```typescript
// Convert to UTC for storage
const utc = DateTime.fromISO(input, { zone: org.timezone }).toUTC()

// Convert to local for display
const local = DateTime.fromISO(utcTime).setZone(org.timezone)
```

### Conflict Detection Algorithm
Checks three overlap scenarios:
1. New booking starts during existing
2. New booking ends during existing
3. New booking encompasses existing

### Availability Engine
1. Get organization working hours
2. Fetch existing bookings
3. Apply buffer zones (before & after bookings)
4. Merge overlapping blocked intervals
5. Find available gaps
6. Generate time slots (15-min increments)

---

##  Database Schema

### Organization
```typescript
{
  name: string,           // Unique
  timezone: string,       // IANA timezone
  workingHours: [{        // Per day of week
    dayOfWeek: number,    // 0-6 (Sunday-Saturday)
    startTime: string,    // "HH:mm"
    endTime: string,      // "HH:mm"
    isWorkingDay: boolean
  }],
  bookingPolicy: {
    minDurationMinutes: number,   // 30
    maxDurationMinutes: number,   // 240
    maxAdvanceBookingDays: number, // 30
    minAdvanceBookingHours: number, // 1
    bufferTimeMinutes: number     // 15
  }
}
```

### User
```typescript
{
  organizationId: ObjectId,  // Tenant isolation
  email: string,             // Unique per org
  password: string,          // bcrypt hashed
  role: "ORG_ADMIN" | "EMPLOYEE",
  isActive: boolean,
  failedLoginAttempts: number, // Brute force protection
  lockedUntil: Date
}
```

### Resource
```typescript
{
  organizationId: ObjectId,  // Tenant isolation
  name: string,              // Unique per org
  type: "MEETING_ROOM" | "DESK" | "DEVICE",
  capacity: number,
  bufferTimeMinutes: number, // Override org policy
  isDeleted: boolean,        // Soft delete
  deletedAt: Date
}
```

### Booking
```typescript
{
  organizationId: ObjectId,  // Tenant isolation
  resourceId: ObjectId,      // FK to Resource
  userId: ObjectId,          // FK to User
  startTime: Date,           // UTC
  endTime: Date,             // UTC
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED",
  title: string,
  isDeleted: boolean         // Soft delete
}
```

---

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiration
- Account lock after 5 failed attempts
- Password complexity enforcement
- Helmet security headers
- CORS configuration
- Input validation on all endpoints
- NoSQL injection prevention via Mongoose

---

## ⚡ Performance

- Strategic indexes on frequently queried fields
- Lean queries for read operations
- Selective field projection
- Parallel database operations
- Efficient interval merging algorithm
- 15-minute slot generation increment

---

##  Scripts

```json
{
  "dev": "Start development server with hot reload",
  "build": "Compile TypeScript to JavaScript",
  "start": "Run production build",
  "test": "Run tests"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---
