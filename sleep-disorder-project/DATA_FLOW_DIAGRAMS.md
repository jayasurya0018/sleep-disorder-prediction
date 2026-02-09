# 📊 Data Flow Diagrams - Before & After Fixes

## Issue #1: Profile Icon Not Showing After Login

### BEFORE FIX ❌
```
User Login
    ↓
Context Updated (user stored)
    ↓
User Refreshes Page
    ↓
Context resets (loses user data)
    ↓
Navbar checks context
    ↓
❌ user = null → Shows Login/Register buttons instead of profile icon
```

### AFTER FIX ✅
```
User Login
    ↓
Context Updated (user stored)
    ↓
localStorage.setItem('user', userData)  ← NEW!
    ↓
User Refreshes Page
    ↓
Context resets temporarily
    ↓
Navbar checks context FIRST, then localStorage  ← NEW!
    ↓
displayUser = user || JSON.parse(localStorage.getItem('user'))
    ↓
✅ Profile icon shows immediately!
```

---

## Issue #2: Export Fails - "No Data Available"

### BEFORE FIX ❌
```
User Input Data Form
    ↓
Submit Data (HRV, SpO2, etc.)
    ↓
saveData() called
    ↓
Data saved to MongoDB ✅
    ↓
Streaming Buffer EMPTY ❌
    ↓
User clicks Export
    ↓
Export route queries buffer:
  const data = streamingService.getUserData(userId)
    ↓
Buffer returns [] (empty)
    ↓
❌ "No data available for export" ERROR
```

### AFTER FIX ✅
```
User Input Data Form
    ↓
Submit Data (HRV, SpO2, etc.)
    ↓
saveData() called
    ↓
Data saved to MongoDB ✅
    ↓
ALSO add to Streaming Buffer ✅  ← NEW!
  const buffer = streamingService.getUserBuffer(userId)
  buffer.push(streamData)
    ↓
Streaming Buffer Populated ✅
    ↓
User clicks Export
    ↓
Export route queries buffer:
  const data = streamingService.getUserData(userId)
    ↓
Buffer returns [data1, data2, data3, ...]  ✅
    ↓
✅ Export succeeds! Downloads CSV/PDF/DOCX
```

---

## Complete Login to Export Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE USER JOURNEY                       │
└─────────────────────────────────────────────────────────────────┘

1. USER LOGIN
   ┌──────────────────────────────────────┐
   │ Login Page                           │
   │ - Email input                        │
   │ - Password input                     │
   │ - Submit                             │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Backend: POST /auth/login            │
   │ - Validate credentials               │
   │ - Generate JWT token                 │
   │ - Return user object                 │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Frontend: Login Success              │
   │ - Save JWT to localStorage           │
   │ - Save user object to localStorage   │
   │ - Set user in context ✅             │
   │ - Redirect to /profile               │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Navbar Component                     │
   │ - Check context user                 │
   │ - Check localStorage fallback ✅     │
   │ - Display profile icon with name     │
   │ - Show user dropdown menu ✅         │
   └──────────────────────────────────────┘

2. DATA INPUT
   ┌──────────────────────────────────────┐
   │ Data Input Page                      │
   │ - Sleep Stage selector               │
   │ - HRV input (e.g., 60)              │
   │ - SpO2 input (e.g., 95)             │
   │ - Movement input (e.g., 3)          │
   │ - Breathing Rate input (e.g., 14)   │
   │ - Submit                             │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Backend: POST /api/data/save         │
   │ with JWT token                       │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ dataController.saveData()            │
   │ - Validate input                     │
   │ - Save to MongoDB ✅                 │
   │ - Create streamData object           │
   │ - Add to streaming buffer ✅ NEW!   │
   │ - Return success                     │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Data now in TWO places:              │
   │ 1. MongoDB (persistent)              │
   │ 2. Streaming Buffer (for export)     │
   └──────────────────────────────────────┘

3. DATA EXPORT
   ┌──────────────────────────────────────┐
   │ Export Page                          │
   │ - Select start date                  │
   │ - Select end date                    │
   │ - Choose format (CSV/PDF/DOCX)       │
   │ - Click Export                       │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Backend: POST /api/export/{format}   │
   │ with JWT token                       │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Export Route                         │
   │ - Get userId from JWT                │
   │ - Query streaming buffer ✅          │
   │ const data = streamingService       │
   │   .getUserData(userId)               │
   │ - Filter by date range               │
   │ - Generate file (CSV/PDF/DOCX)       │
   │ - Send to client                     │
   └──────────────────────────────────────┘
            ↓
   ┌──────────────────────────────────────┐
   │ Frontend: Download File              │
   │ - Create blob                        │
   │ - Trigger download                   │
   │ - File saved to Downloads folder     │
   │ ✅ SUCCESS!                          │
   └──────────────────────────────────────┘
```

---

## Data Structures

### User Object (localStorage)
```javascript
{
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    photo: "url/to/avatar.jpg"
}
```

### Stream Data (added to buffer)
```javascript
{
    userId: "user-123",
    timestamp: "2025-12-23T14:30:00.000Z",
    heartRate: 72,           // calculated from HRV
    hrv: 60,                 // user input
    spo2: 97,                // user input
    respiratoryRate: 14,     // user input (breathing)
    sleepStage: "Deep",      // user selected
    movement: 3,             // user input
    temperature: 36.5,       // default
    prediction: {
        disorder: "Normal",
        severity: "None",
        confidence: 100
    }
}
```

---

## Component Interaction Diagram

```
┌──────────────────┐
│  Login Page      │
│  - Email         │
│  - Password      │
└────────┬─────────┘
         │ POST /auth/login
         ↓
┌──────────────────┐
│  Backend Auth    │
│  - Validate      │
│  - JWT token     │
└────────┬─────────┘
         │ token + user
         ↓
┌──────────────────┐         ┌──────────────────┐
│  localStorage    │◄────────│  UserContext     │
│  - token         │  synced │  - user          │
│  - user          │         │  - login()       │
└──────────────────┘         └──────────────────┘
                                     ▲
                                     │
                        ┌────────────┘
                        │
                   ┌────┴─────────┐
                   │   Navbar     │
                   │  displayUser │
                   │ = user ||    │
                   │ localStorage │
                   └──────────────┘

┌──────────────────┐
│  Data Input Page │
│  - Form inputs   │
└────────┬─────────┘
         │ POST /api/data/save
         ↓
┌──────────────────────────┐
│  dataController.saveData │
│  - Validate              │
│  - MongoDB save ✅       │
│  - Buffer push ✅ NEW!   │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │          │
    ↓          ↓
┌────────┐  ┌──────────────┐
│MongoDB │  │Streaming Buf │
│        │  │  - Buffer[0] │
└────────┘  │  - Buffer[1] │
            │  - Buffer[2] │
            └───────┬──────┘
                    │
         ┌──────────┘
         │
    ┌────┴─────────┐
    │ Export Page  │
    │ - Date range │
    │ - Format     │
    └────┬─────────┘
         │ POST /api/export/{format}
         ↓
┌──────────────────────────┐
│ Export Routes            │
│ - Query buffer ✅        │
│ - Generate file          │
│ - Download               │
└──────────────────────────┘
```

---

## State Transitions

### Navbar Component State
```
Initial State
    ├─ After Login: user context set + localStorage
    │      ↓
    │  displayUser = context.user
    │      ↓
    │  ✅ Profile Icon Shown
    │
    ├─ After Refresh (OLD): context lost
    │      ↓
    │  displayUser = undefined
    │      ↓
    │  ❌ Login/Register Buttons (BUG)
    │
    └─ After Refresh (NEW FIX): ✅
         ↓
     displayUser = context.user || localStorage
         ↓
     ✅ Profile Icon Shown (FIXED!)
```

### Data Buffer State
```
Initial State: Buffer Empty []

After User Saves Data (OLD):
    ├─ MongoDB: Saved ✅
    ├─ Buffer: Empty ❌
    └─ Export: FAILS (BUG)

After User Saves Data (NEW FIX):
    ├─ MongoDB: Saved ✅
    ├─ Buffer: Data added ✅
    └─ Export: Works! ✅
```

---

## Summary of Changes

| Component | Before | After | Impact |
|-----------|--------|-------|--------|
| Navbar | Checks context only | Checks context + localStorage | Profile icon persists on refresh |
| dataController | Only saves to MongoDB | Saves to MongoDB + Buffer | Export data available |
| Streaming Service | No changes needed | No changes needed | Works as designed now |
| Export Routes | Queries empty buffer | Queries populated buffer | Export actually works |

**Result: 2 Critical Bugs FIXED! 🎉**
