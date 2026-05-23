# 📮 Complete API Testing Manual (Postman)

## Multi-Tenant Resource Booking System

---

## 🟢 BEFORE STARTING

### Server Running?
```bash
npm run dev
```

### Test Health
- **Method:** `GET`
- **URL:** `http://localhost:3000/health`
- Expected: `{ "status": "healthy" }`

---

## 📋 TEST 1: Create Organization

**Method:** `POST`
**URL:** `http://localhost:3000/api/organizations`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body → raw → JSON:**
```json
{
    "name": "Creative Studio Ltd",
    "timezone": "Asia/Dhaka",
    "workingHours": [
        {"dayOfWeek": 0, "startTime": "09:00", "endTime": "17:00", "isWorkingDay": false},
        {"dayOfWeek": 1, "startTime": "10:00", "endTime": "19:00", "isWorkingDay": true},
        {"dayOfWeek": 2, "startTime": "10:00", "endTime": "19:00", "isWorkingDay": true},
        {"dayOfWeek": 3, "startTime": "10:00", "endTime": "19:00", "isWorkingDay": true},
        {"dayOfWeek": 4, "startTime": "10:00", "endTime": "19:00", "isWorkingDay": true},
        {"dayOfWeek": 5, "startTime": "10:00", "endTime": "14:00", "isWorkingDay": true},
        {"dayOfWeek": 6, "startTime": "09:00", "endTime": "17:00", "isWorkingDay": false}
    ],
    "bookingPolicy": {
        "minDurationMinutes": 15,
        "maxDurationMinutes": 180,
        "maxAdvanceBookingDays": 14,
        "minAdvanceBookingHours": 2,
        "bufferTimeMinutes": 10
    }
}
```

**Click SEND**

**Response (201):**
```json
{
    "success": true,
    "data": {
        "_id": "6a11abc123def456",
        "name": "Creative Studio Ltd",
        "timezone": "Asia/Dhaka"
    }
}
```

> 📌 **COPY `_id` → Save as `org_id`**

---

## 📋 TEST 2: Create Admin User

**Method:** `POST`
**URL:** `http://localhost:3000/api/setup/register`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body → raw → JSON:**
```json
{
    "email": "sakib@creativestudio.com",
    "password": "Sakib@1234",
    "firstName": "Sakib",
    "lastName": "Ahmed",
    "role": "ORG_ADMIN",
    "organizationId": "6a11abc123def456"
}
```

**Click SEND**

**Response (201):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "6a11user789",
            "email": "sakib@creativestudio.com",
            "firstName": "Sakib",
            "lastName": "Ahmed",
            "role": "ORG_ADMIN"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

> 📌 **COPY `token` → Save as `token`**

---

## 📋 TEST 3: Login

**Method:** `POST`
**URL:** `http://localhost:3000/api/auth/login`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body → raw → JSON:**
```json
{
    "email": "sakib@creativestudio.com",
    "password": "Sakib@1234",
    "organizationId": "6a11abc123def456"
}
```

**Click SEND**

**Response (200):**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

## 📋 TEST 4: Get Profile

**Method:** `GET`
**URL:** `http://localhost:3000/api/auth/profile`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

**Response (200):**
```json
{
    "success": true,
    "data": {
        "_id": "6a11user789",
        "email": "sakib@creativestudio.com",
        "firstName": "Sakib",
        "lastName": "Ahmed",
        "role": "ORG_ADMIN"
    }
}
```

---

## 📋 TEST 5: Create Employee

**Method:** `POST`
**URL:** `http://localhost:3000/api/auth/register`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "email": "nabila@creativestudio.com",
    "password": "Nabila@1234",
    "firstName": "Nabila",
    "lastName": "Islam",
    "role": "EMPLOYEE"
}
```

**Click SEND**

**Response (201):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "6a11emp456",
            "email": "nabila@creativestudio.com",
            "role": "EMPLOYEE"
        }
    }
}
```

---

## 📋 TEST 6: Create Resource - Meeting Room

**Method:** `POST`
**URL:** `http://localhost:3000/api/resources`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "name": "Design Meeting Pod",
    "type": "MEETING_ROOM",
    "description": "Small meeting room for design reviews",
    "capacity": 6,
    "bufferTimeMinutes": 10
}
```

**Click SEND**

**Response (201):**
```json
{
    "success": true,
    "data": {
        "_id": "6a11res789",
        "name": "Design Meeting Pod",
        "type": "MEETING_ROOM"
    }
}
```

> 📌 **COPY `_id` → Save as `resource_id`**

---

## 📋 TEST 7: Create Resource - Desk

**Method:** `POST`
**URL:** `http://localhost:3000/api/resources`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "name": "Standing Desk Pro",
    "type": "DESK",
    "description": "Ergonomic standing desk near window",
    "capacity": 1,
    "bufferTimeMinutes": 5
}
```

**Click SEND**

---

## 📋 TEST 8: Create Resource - Device

**Method:** `POST`
**URL:** `http://localhost:3000/api/resources`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "name": "Wacom Drawing Tablet",
    "type": "DEVICE",
    "description": "For digital artists and designers",
    "bufferTimeMinutes": 20
}
```

**Click SEND**

---

## 📋 TEST 9: Get All Resources

**Method:** `GET`
**URL:** `http://localhost:3000/api/resources`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

**Response (200):**
```json
{
    "success": true,
    "resources": [
        {"name": "Design Meeting Pod", "type": "MEETING_ROOM"},
        {"name": "Standing Desk Pro", "type": "DESK"},
        {"name": "Wacom Drawing Tablet", "type": "DEVICE"}
    ]
}
```

---

## 📋 TEST 10: Check Availability

**Method:** `GET`
**URL:** `http://localhost:3000/api/availability?resourceId=6a11res789&durationMinutes=60`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "date": "2026-05-24",
            "timezone": "Asia/Dhaka",
            "workingHours": {"start": "10:00", "end": "19:00"},
            "totalSlots": 28,
            "availableSlots": [
                {
                    "startTime": "2026-05-24T04:00:00.000Z",
                    "endTime": "2026-05-24T05:00:00.000Z",
                    "durationMinutes": 60
                }
            ]
        }
    ]
}
```

---

## 📋 TEST 11: Create Booking

**Method:** `POST`
**URL:** `http://localhost:3000/api/bookings`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "resourceId": "6a11res789",
    "startTime": "2026-05-24T04:00:00.000Z",
    "endTime": "2026-05-24T05:00:00.000Z",
    "title": "Logo Design Review",
    "description": "Reviewing new logo concepts for client"
}
```

**Click SEND**

**Response (201):**
```json
{
    "success": true,
    "data": {
        "_id": "6a11book123",
        "resourceId": "6a11res789",
        "startTime": "2026-05-24T04:00:00.000Z",
        "endTime": "2026-05-24T05:00:00.000Z",
        "title": "Logo Design Review",
        "status": "CONFIRMED"
    }
}
```

> 📌 **COPY `_id` → Save as `booking_id`**

---

## 📋 TEST 12: Conflict - Same Time (FAIL)

**Method:** `POST`
**URL:** `http://localhost:3000/api/bookings`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "resourceId": "6a11res789",
    "startTime": "2026-05-24T04:00:00.000Z",
    "endTime": "2026-05-24T05:00:00.000Z",
    "title": "Should FAIL - Same Time"
}
```

**Click SEND**

**Response (409):**
```json
{
    "success": false,
    "message": "Booking conflicts with existing bookings"
}
```

---

## 📋 TEST 13: Conflict - Overlapping (FAIL)

**Method:** `POST`
**URL:** `http://localhost:3000/api/bookings`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "resourceId": "6a11res789",
    "startTime": "2026-05-24T04:30:00.000Z",
    "endTime": "2026-05-24T05:30:00.000Z",
    "title": "Should FAIL - Overlapping"
}
```

**Click SEND**

**Response (409):**
```json
{
    "success": false,
    "message": "Booking conflicts with existing bookings"
}
```

---

## 📋 TEST 14: Conflict - Buffer Violation (FAIL)

**Method:** `POST`
**URL:** `http://localhost:3000/api/bookings`
**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body → raw → JSON:**
```json
{
    "resourceId": "6a11res789",
    "startTime": "2026-05-24T05:00:00.000Z",
    "endTime": "2026-05-24T06:00:00.000Z",
    "title": "Should FAIL - Buffer"
}
```

**Click SEND**

**Response (409):**
```json
{
    "success": false,
    "message": "Booking violates buffer time requirements"
}
```

---

## 📋 TEST 15: Get All Bookings

**Method:** `GET`
**URL:** `http://localhost:3000/api/bookings`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

---

## 📋 TEST 16: Cancel Booking

**Method:** `DELETE`
**URL:** `http://localhost:3000/api/bookings/6a11book123`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

**Response (200):**
```json
{
    "success": true,
    "data": {
        "_id": "6a11book123",
        "status": "CANCELLED"
    }
}
```

---

## 📋 TEST 17: Get My Organization

**Method:** `GET`
**URL:** `http://localhost:3000/api/organizations/my-organization`
**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJIUzI1NiIs... |

**Body:** None

**Click SEND**

---

## ✅ TEST SUMMARY

| Test | API | Expected |
|------|-----|----------|
| 1 | Create Organization | 201 |
| 2 | Setup Admin | 201 + Token |
| 3 | Login | 200 + Token |
| 4 | Get Profile | 200 |
| 5 | Create Employee | 201 |
| 6 | Create Meeting Room | 201 |
| 7 | Create Desk | 201 |
| 8 | Create Device | 201 |
| 9 | Get Resources | 200 |
| 10 | Check Availability | 200 |
| 11 | Create Booking | 201 |
| 12 | Same Time Conflict | 409 |
| 13 | Overlap Conflict | 409 |
| 14 | Buffer Conflict | 409 |
| 15 | Get Bookings | 200 |
| 16 | Cancel Booking | 200 |
| 17 | My Organization | 200 |

---

## ⏰ Time Conversion

```
BDT 10 AM = UTC 4 AM → 2026-05-24T04:00:00.000Z
BDT 11 AM = UTC 5 AM → 2026-05-24T05:00:00.000Z
BDT 12 PM = UTC 6 AM → 2026-05-24T06:00:00.000Z
```

---

## 🔑 Your IDs

```
Organization: 6a11abc123def456
Admin: sakib@creativestudio.com / Sakib@1234
Employee: nabila@creativestudio.com / Nabila@1234
Token: eyJhbGciOiJIUzI1NiIs...
Resource: 6a11res789
Booking: 6a11book123
```