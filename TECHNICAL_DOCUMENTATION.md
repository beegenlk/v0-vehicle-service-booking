# Vehicle Service Booking System - Technical Documentation

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Data Storage & In-Memory Store](#data-storage--in-memory-store)
4. [Backend API Routes](#backend-api-routes)
5. [Frontend Pages](#frontend-pages)
6. [Admin Dashboard](#admin-dashboard)
7. [Authentication & Security](#authentication--security)
8. [Business Rules & Constraints](#business-rules--constraints)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS v4 with semantic design tokens
- **Component Library**: shadcn/ui
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Toast Notifications**: Sonner
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)

### Backend
- **Runtime**: Next.js API Routes (Node.js serverless functions)
- **Data Storage**: In-Memory JavaScript Objects (session-based)
- **Authentication**: Custom password-based (HTTP header validation)

### Development & Deployment
- **Package Manager**: npm/pnpm
- **Build Tool**: Turbopack (Next.js 16 default)
- **Hosting**: Vercel (compatible with any Node.js host)

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────┐
│   Users (3)     │
│  ├─ Home Page   │
│  ├─ Book Page   │
│  └─ Queue Page  │
└────────┬────────┘
         │ fetch()
         ▼
┌─────────────────────────────┐
│   Next.js API Routes        │
│  ├─ /api/bookings           │
│  ├─ /api/queue              │
│  └─ /api/admin              │
└────────┬────────────────────┘
         │ read/write
         ▼
┌──────────────────────────────┐
│  In-Memory Data Store        │
│  (lib/store.ts)              │
│  ├─ bookings[]               │
│  ├─ serviceSlots[]           │
│  └─ bookingCounter           │
└──────────────────────────────┘
```

### Component Structure

```
app/
├── page.tsx                      # Home page (landing)
├── book/
│   └── page.tsx                  # Booking form page
├── queue/
│   └── page.tsx                  # Live queue view
├── admin/
│   └── page.tsx                  # Admin page wrapper
├── api/
│   ├── bookings/route.ts         # Create & fetch bookings
│   ├── queue/route.ts            # Get live queue status
│   └── admin/route.ts            # Admin operations

components/
├── app-header.tsx                # Navigation header
├── admin-dashboard.tsx           # Admin UI component
├── admin-login.tsx               # Login form component
└── ui/                           # shadcn components

lib/
├── store.ts                      # Data store & business logic
├── dates.ts                      # Date utilities
└── utils.ts                      # CN function & helpers
```

---

## Data Storage & In-Memory Store

### Data Structures

#### Booking
```typescript
interface Booking {
  id: string                    // Format: BK001, BK002, etc.
  date: string                  // YYYY-MM-DD format
  timeSlot: string              // e.g., "9:00 AM", "10:00 AM"
  customerName: string          // User's full name
  phone: string                 // Contact number
  vehicleNo: string             // Vehicle registration number
  status: BookingStatus         // Waiting | Arrived | InService | Completed | Cancelled
  createdAt: string             // ISO timestamp
}
```

#### ServiceSlot
```typescript
interface ServiceSlot {
  id: string                    // Unique slot identifier
  date: string                  // YYYY-MM-DD format
  slotTime: string              // e.g., "9:00 AM"
  maxCapacity: number           // Default: 1, configurable by admin
  bookedCount: number           // Current bookings in slot
}
```

### Storage Implementation

**File**: `lib/store.ts`

The store uses JavaScript objects to maintain state in memory:
- **Bookings Array**: Stores all bookings (including cancelled ones)
- **Service Slots Array**: Stores available time slots for each date
- **Booking Counter**: Auto-incrementing ID generator (starts at 1, formats as BK001, BK002, etc.)

**Key Functions**:
- `getSlotsForDate(date)` - Get or auto-create slots for a date
- `getBookingsForDate(date)` - Filter bookings by date
- `createBooking(data)` - Create new booking with validation
- `updateBookingStatus(bookingId, status)` - Update booking state
- `addCustomSlot(date, slotTime, maxCapacity)` - Add extra time slot
- `removeSlot(date, slotTime)` - Remove empty slot
- `updateSlotCapacity(date, slotTime, maxCapacity)` - Change slot vehicle limit

### Data Persistence Notes

⚠️ **Important**: Data is stored in memory and **resets on server restart**. This design is suitable for:
- Development/Testing
- Short-term sessions
- Demonstration purposes

**For Production**: Replace with a persistent database (PostgreSQL, MongoDB, etc.)

---

## Backend API Routes

### 1. `/api/bookings` - Booking Management

**GET** - Fetch slots and bookings for a date
```javascript
Request: GET /api/bookings?date=2025-03-05
Response: {
  slots: ServiceSlot[],
  bookings: Booking[]
}
```

**POST** - Create a new booking
```javascript
Request: POST /api/bookings
Body: {
  date: "2025-03-05",
  timeSlot: "9:00 AM",
  customerName: "John Doe",
  phone: "9876543210",
  vehicleNo: "KA-01-AB-1234"
}
Response: { booking: Booking } or { error: string }
```

**Validation**:
- All fields required
- Daily limit: 20 bookings per day
- Slot availability: Checks if slot has space (maxCapacity)

---

### 2. `/api/queue` - Live Queue Status

**GET** - Fetch queue summary for a date
```javascript
Request: GET /api/queue?date=2025-03-05
Response: {
  date: string,
  totalBookings: number,
  nowServing: Booking | null,
  nextUpCount: number,
  bookingsByStatus: {
    Waiting: Booking[],
    Arrived: Booking[],
    InService: Booking[],
    Completed: Booking[],
    Cancelled: Booking[]
  }
}
```

**Real-Time Updates**: SWR refreshes data every 30 seconds

---

### 3. `/api/admin` - Admin Operations

**Authentication**: `x-admin-password` header (value: "admin123")

**GET** - Fetch admin dashboard data
```javascript
Request: GET /api/admin?date=2025-03-05
Headers: { "x-admin-password": "admin123" }
Response: {
  bookings: Booking[],
  slots: ServiceSlot[],
  stats: {
    total, waiting, arrived, inService, completed, cancelled
  }
}
```

**PUT** - Update booking status
```javascript
Request: PUT /api/admin
Body: {
  bookingId: "BK001",
  status: "Arrived"
}
Response: { success: true }
```

**POST** - Admin actions
```javascript
// Add custom time slot
Request: POST /api/admin
Body: {
  action: "addSlot",
  date: "2025-03-05",
  slotTime: "6:00 PM",
  maxCapacity: 2
}

// Remove empty slot
Request: POST /api/admin
Body: {
  action: "removeSlot",
  date: "2025-03-05",
  slotTime: "6:00 PM"
}

// Update slot vehicle capacity
Request: POST /api/admin
Body: {
  action: "updateCapacity",
  date: "2025-03-05",
  slotTime: "9:00 AM",
  maxCapacity: 3
}

Response: { success: true } or { error: string }
```

---

## Frontend Pages

### 1. `/` - Home Page
- Landing page with ServiceQ branding
- Header with navigation and subtle admin login button
- Cards for "Book a Service" and "View Live Queue"
- Call-to-action "Book Now" button

**Components**: `page.tsx`, `AppHeader`

### 2. `/book` - Service Booking Page

**Flow**:
1. Select date (next 7 days)
2. Select time slot (shows availability)
3. Fill customer details (name, phone, vehicle number)
4. Click "Book Now" → **Confirmation Dialog** (NEW)
5. Confirm details and submit
6. Success screen with booking ID

**Key Features**:
- SWR data fetching with 15-second refresh
- Real-time slot availability
- Input validation
- Confirmation dialog before submission
- Success confirmation with booking details

**File**: `app/book/page.tsx`

### 3. `/queue` - Live Queue Page

**Displays**:
- Date selection
- Stats bar (total waiting, arrived, in-service, completed)
- "Now Serving" highlight (first InService booking)
- "Next Up" section (upcoming bookings)
- Full queue grouped by time slot with status badges

**Features**:
- Auto-refresh every 30 seconds (SWR)
- Color-coded status badges
- Touch-friendly for mobile viewing
- QR code accessible (no special QR implementation needed)

**File**: `app/queue/page.tsx`

---

## Admin Dashboard

### Access
- URL: `/admin`
- Password: `admin123` (hardcoded in `app/api/admin/route.ts`)
- Subtle login button in main navigation (icon only, low visibility)

### Features

#### 1. Status Management
- **Flow**: Waiting → Arrived → In Service → Completed
- **Quick Actions**: 
  - "Mark Arrived" button
  - "Start Service" button
  - "Complete" button
  - "Cancel" button (any status)
- **One-Click Updates**: Single button to progress booking

#### 2. Slot Management
- **View**: All slots for selected date with booking counts
- **Add Slot**: Custom time slot dialog
- **Remove Slot**: Delete empty slots (disabled if bookings exist)
- **Edit Capacity**: Click on `(booked/max)` to change vehicle limit per slot
  - Min capacity: 1
  - Cannot reduce below current bookings

#### 3. Dashboard Stats
- Total bookings
- Waiting count
- Arrived count
- In Service count
- Completed count
- Cancelled count

#### 4. Date Navigation
- 7-day selector
- Date and day labels
- Real-time data refresh (10 seconds)

**File**: `components/admin-dashboard.tsx`
**Login Component**: `components/admin-login.tsx`

---

## Authentication & Security

### User Roles
1. **Regular User** (No auth required)
   - Can book appointments
   - Can view live queue

2. **Admin User** (Password protected)
   - Access to `/admin` page
   - Requires `x-admin-password: admin123` header for API calls
   - Can manage bookings and slots

### Security Considerations

⚠️ **Current Implementation** (Development):
- Hardcoded password in code
- HTTP header-based auth (not secure without HTTPS)
- No user sessions or JWT tokens

### For Production

Implement:
- Move password to environment variables
- Use HTTPS only
- Add JWT or session tokens
- Rate limiting on API endpoints
- Input sanitization
- CORS configuration
- Database-level access control

---

## Business Rules & Constraints

### Booking Rules
1. **Advance Booking**: Up to 7 days in advance
2. **Daily Limit**: Maximum 20 bookings per day
3. **Slot Capacity**: Default 1 vehicle per slot (admin configurable)
4. **Duplicate Vehicles**: No constraint (same vehicle can book multiple slots)

### Status Flow
```
Waiting
   ↓
Arrived
   ↓
InService
   ↓
Completed

(Any status can be cancelled)
```

### Slot Management
- **Default Slots**: 9 time slots per day (9 AM - 5 PM, hourly)
- **Custom Slots**: Admin can add slots with custom times
- **Slot Deletion**: Only when no active bookings exist
- **Capacity Changes**: Can increase/decrease (respects booked count)

### Data Validation
- All booking fields required
- Phone: Required (no format validation)
- Vehicle No: Auto-converted to uppercase
- Time Slot: Must exist for selected date

---

## Development Workflow

### Running Locally
```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`

### File Organization
- **API Routes**: `app/api/**`
- **Pages**: `app/**/page.tsx`
- **Components**: `components/`
- **Utilities**: `lib/`
- **Styles**: `app/globals.css`

### Adding Features
1. **New Endpoint**: Create in `app/api/`
2. **New Page**: Create `folder/page.tsx`
3. **New Component**: Create in `components/`
4. **Data Changes**: Update `lib/store.ts` first, then API routes

---

## Deployment

### Vercel (Recommended)
```bash
git push origin main
# Auto-deploys from connected GitHub repo
```

### Other Platforms
- Works with any Node.js host (Heroku, AWS, Railway, etc.)
- Ensure environment variables are set
- Note: In-memory data resets on server restart

---

## Testing Scenarios

### Booking Flow
1. Navigate to `/book`
2. Select tomorrow's date
3. Click a time slot
4. Fill customer details
5. Click "Book Now"
6. Confirm in dialog
7. See success screen

### Queue View
1. Navigate to `/queue`
2. View current day bookings
3. See "Now Serving" if any InService
4. Refresh to see live updates

### Admin Dashboard
1. Navigate to `/admin`
2. Enter password: `admin123`
3. Select a date
4. Update booking status (click progress button)
5. View stat changes
6. Edit slot capacity (click on count)
7. Add/remove slots

---

## Troubleshooting

### Issue: No bookings showing
- **Cause**: Data resets on server restart
- **Solution**: Recreate bookings after restart

### Issue: Capacity change fails
- **Cause**: New capacity < current bookings
- **Solution**: Cancel some bookings first or increase capacity

### Issue: Admin login fails
- **Cause**: Wrong password or case-sensitive
- **Solution**: Password is exactly `admin123`

---

## Future Enhancements

1. **Database Integration**: Replace in-memory store with PostgreSQL/MongoDB
2. **User Authentication**: Customer login/signup
3. **Email Notifications**: Confirmation and status updates
4. **SMS Integration**: Customer notifications
5. **Payment Processing**: Online booking deposits
6. **Calendar UI**: Visual calendar instead of button grid
7. **Analytics Dashboard**: Admin reports and insights
8. **Multi-location Support**: Multiple service centers
9. **Staff Management**: Assign staff to time slots
10. **Customer Portal**: View/modify own bookings

---

## Support & Maintenance

- **Code Repository**: GitHub (connected to Vercel)
- **Issues**: Check browser console for errors
- **API Debugging**: Use browser DevTools Network tab
- **Performance**: SWR automatically handles caching and revalidation

---

**Last Updated**: March 2025
**Version**: 1.0.0
**Status**: Development Ready
