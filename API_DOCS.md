# API Documentation

## Base URL
http://localhost:3000/api


## Authentication

All protected routes require JWT token in header:
Authorization: Bearer <your_token>


## Endpoints


### 1. Organization APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /organizations | Create organization | No |
| GET | /organizations/my-organization | Get my org | Yes |
| PATCH | /organizations/:id | Update organization | Yes |

**Create Organization:**
POST /api/organizations
Content-Type: application/json

{
    "name": "Tech Corp",
    "timezone": "Asia/Dhaka",
    "workingHours": [
        {
            "dayOfWeek": 1,
            "startTime": "09:00",
            "endTime": "18:00",
            "isWorkingDay": true
        }
    ],
    "bookingPolicy": {
        "minDurationMinutes": 30,
        "maxDurationMinutes": 240,
        "maxAdvanceBookingDays": 30,
        "minAdvanceBookingHours": 1,
        "bufferTimeMinutes": 15
    }
}


### 2. Authentication APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/login | User login | No |
| POST | /auth/register | Register user | Yes |
| GET | /auth/profile | Get profile | Yes |
| POST | /setup/register | First admin setup | No |

**Login:**
POST /api/auth/login
Content-Type: application/json

{
    "email": "admin@techcorp.com",
    "password": "Admin@1234",
    "organizationId": "YOUR_ORG_ID"
}

Response:
{
    "success": true,
    "data": {
        "user": { ... },
        "token": "eyJhbGciOi..."
    }
}


**Register Employee (Admin only):**
POST /api/auth/register
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "email": "employee@techcorp.com",
    "password": "Employee@1234",
    "firstName": "Employee",
    "lastName": "Name",
    "role": "EMPLOYEE"
}


### 3. Resource APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /resources | Create resource | Yes |
| GET | /resources | List resources | Yes |
| GET | /resources/:id | Get resource | Yes |
| PATCH | /resources/:id | Update resource | Yes |
| DELETE | /resources/:id | Soft delete | Yes |

**Create Resource:**
POST /api/resources
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "name": "Conference Room A",
    "type": "MEETING_ROOM",
    "description": "Main meeting room",
    "capacity": 20,
    "bufferTimeMinutes": 15
}


### 4. Booking APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /bookings | Create booking | Yes |
| GET | /bookings | List bookings | Yes |
| DELETE | /bookings/:id | Cancel booking | Yes |

**Create Booking:**
POST /api/bookings
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "resourceId": "YOUR_RESOURCE_ID",
    "startTime": "2026-05-24T04:00:00.000Z",
    "endTime": "2026-05-24T05:00:00.000Z",
    "title": "Team Meeting",
    "description": "Daily standup"
}

Note: Times must be in UTC
Bangladesh (UTC+6): 10 AM BDT = 4 AM UTC


### 5. Availability APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /availability | Get available slots | Yes |

**Check Availability:**
GET /api/availability?resourceId=RESOURCE_ID&durationMinutes=60&date=2026-05-24
Authorization: Bearer {{token}}

Response:
{
    "success": true,
    "data": [
        {
            "date": "2026-05-24",
            "timezone": "Asia/Dhaka",
            "workingHours": { "start": "09:00", "end": "18:00" },
            "totalSlots": 32,
            "availableSlots": [
                {
                    "startTime": "2026-05-24T03:00:00.000Z",
                    "endTime": "2026-05-24T04:00:00.000Z",
                    "durationMinutes": 60,
                    "isWithinWorkingHours": true
                }
            ]
        }
    ]
}


## Time Conversion Reference

Bangladesh (UTC+6):
| BDT | UTC |
|-----|-----|
| 9:00 AM | 3:00 AM |
| 10:00 AM | 4:00 AM |
| 11:00 AM | 5:00 AM |
| 12:00 PM | 6:00 AM |
| 5:00 PM | 11:00 AM |
| 6:00 PM | 12:00 PM |


## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (booking overlap) |
| 500 | Server Error |