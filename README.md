# Saeculum HR Management System

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![RabbitMQ](https://img.shields.io/badge/Rabbitmq-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![wkhtmltopdf](https://img.shields.io/badge/wkhtmltopdf-000000?style=for-the-badge)

**A comprehensive MERN stack HR portal with employee lifecycle management, automated notifications, and document generation**

---

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Routes](#-api-routes)
- [Database Models](#-database-models)
- [Default Credentials](#-default-credentials)
- [Project Structure](#-project-structure)
- [Scripts & Commands](#-scripts--commands)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 👥 Employee Features
- **Multi-step Registration** - 7-step wizard with skip-for-now support and draft persistence (auto-expires after 7 days)
- **Profile Management** - Complete profile including bank, payroll, and LinkedIn details
- **Dashboard** - View all profile modules (Personal, Family, Professional, Education, Payroll, Bank)
- **Self-Service Editing** - Inline edit Personal, Family, Address, Emergency, Professional, Bank, and Payroll modules
- **Profile Completion** - Shows missing sections with completion percentage tracking

### 💼 HR Features
- **Multi-step Add Employee** - Comprehensive wizard with draft save and resume
- **Auto Employee Codes** - Auto-generate unique codes (EMP0001, EMP0002...)
- **Employee Management** - Search, filter, view all employees with completion bars
- **Bulk Upload** - Import employees via Excel with preview and field mapping
- **Export to Excel** - Download complete employee data
- **Payroll Setup** - Manage CTC, salary structure, deductions with history tracking
- **Event Tracking Dashboard** - Birthdays, work anniversaries, probation endings
- **Document Generation** - Offer letters with PDF templates:
  - Missing-field summary before preparing documents
  - Visual drag-and-drop advanced editor
  - Variable substitution (`${name}`, `${role}`, etc.)
  - Smart auto-pagination with footer overlap prevention
  - Custom templates (letterhead, signature, watermark)

### 🔔 Automated Notifications
- **Email & In-App** via RabbitMQ message queue with dead-letter handling
- **Daily Reminders** (9:00 AM IST cron via node-cron):
  - Birthdays (7-day window)
  - Work anniversaries (7-day window)
  - Probation endings (7-day window)
  - Pending payroll setup
  - Incomplete profiles (30+ days)
- **Deduplication** - NotificationLog prevents duplicate notifications per employee per event per year

### 🔒 Security
- **Authentication**: JWT authentication with 24h expiration
- **OTP Gating**: OTP-gated access to sensitive details (bank/payroll) — 6-digit OTP to admin email, 10-min TTL, 5-attempt limit
- **Hashing**: Password hashing using bcryptjs
- **Authorization**: Pending full RBAC middleware integration (foundation laid with permission constants)

---

## 🛠 Tech Stack

### Backend
- **Core**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Security**: JWT, bcryptjs
- **Messaging/Queues**: RabbitMQ (amqplib)
- **Emails**: Nodemailer + Google OAuth2
- **PDF Generation**: wkhtmltopdf
- **Utilities**: node-cron, multer, express-validator

### Frontend
- **Core**: React 18
- **Routing**: React Router v6
- **API Requests**: Axios
- **Data Handling**: XLSX, ExcelJS

---

## 🚀 Installation

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- wkhtmltopdf (for PDF generation)
- RabbitMQ (optional, for notifications)

### Quick Start

**1. Clone and Install**
```bash
git clone <repo-url>
cd HR-MAIN

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

**2. Configure Environment**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hr_portal
MONGODB_DB_NAME=HR
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=24h
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Email (Google OAuth2)
EMAIL_CLIENT_ID=your_client_id
EMAIL_CLIENT_SECRET=your_client_secret
EMAIL_REFRESH_TOKEN=your_refresh_token
EMAIL_CLIENT_MAIL=your-email@gmail.com
HR_EMAIL=hr@company.com

# Optional
RABBITMQ_URL=amqp://localhost:5672
WKHTMLTOPDF_PATH=C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**3. Seed Database**
```bash
cd backend
node scripts/seedHR.js                  # HR user
node scripts/seedSrHR.js                # Senior HR user (optional)
node scripts/seedEmployees15.js         # 15 sample employees (optional)
node scripts/seedTestEvents.js          # Test events (optional)
```

**4. Setup Document Templates** (Optional)
Place in `backend/company/template/`:
- `temp.jpg` or `temp.png` — Letterhead (A4: 2480x3508px @ 300 DPI)
- `sign2.png` or `sign.png` — Signature image
- `transparent.png` — Watermark (optional)

**5. Start Servers**
```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm start
```

**6. Access Application**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## ⚙️ Configuration

### Google OAuth2 Setup (for emails)
1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API
3. Create OAuth2 credentials (Web application)
4. Add redirect URI: `https://developers.google.com/oauthplayground`
5. Get refresh token from OAuth Playground
6. Update `.env` with client ID, secret, and refresh token

### wkhtmltopdf Setup

**Windows:**
Download from [wkhtmltopdf.org](https://wkhtmltopdf.org/downloads.html), then:
```env
WKHTMLTOPDF_PATH=C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe
```

**Linux/Mac:**
```bash
sudo apt-get install wkhtmltopdf   # or brew install wkhtmltopdf
```
```env
WKHTMLTOPDF_PATH=/usr/local/bin/wkhtmltopdf
```

---

## 📡 API Routes

All routes are prefixed with `/api` (backend runs on port 5000).

### Admin (`/api/admin`)
- `GET /admin/ref` - Reference data (departments, designations, etc.)
- `GET /admin/next-emp-code` - Next available employee code
- `POST /admin/drafts` - Save add/edit wizard draft
- `GET /admin/drafts/:id` - Get draft by ID
- `DELETE /admin/drafts/:id` - Delete draft
- `POST /admin/employees` - Create new employee
- `GET /admin/employees/:id` - Get employee for edit (prefill)
- `PUT /admin/employees/:id` - Update employee (edit mode)

### Employee Management (`/api/employees`)
- `GET /employees/all` - All employees with completion progress
- `GET /employees/pending-payrolls` - Employees without payroll setup
- `GET /employees/upcoming-events` - Birthdays, anniversaries, probation endings
- `GET /employees/export` - Export all employees to Excel
- `GET /employees/:id` - Single employee detail
- `PUT /employees/:id/edit` - Inline edit specific module
- `POST /employees/bulk-upload` - Bulk import from Excel
- `POST /employees/payroll/:id` - Add payroll for employee
- `POST /employees/trigger-reminders` - Manually trigger reminders
- `POST /employees/:id/sensitive-otp` - Request OTP for sensitive details
- `POST /employees/:id/sensitive-verify` - Verify OTP and unlock sensitive details

### Documents (`/api/documents`)
- `GET /documents/types` - Available document types
- `GET /documents/draft` - Get current offer letter draft
- `GET /documents/offer-letter/:userId/inspect` - Inspect employee data for offer letter
- `POST /documents/offer-letter/:userId/prepare` - Prepare offer letter (validate and build structured data)
- `POST /documents/compile` - Generate PDF from pages + metadata
- `POST /documents/upload/:emp_code` - Upload employee document
- `GET /documents/:emp_code` - Get uploaded documents for an employee

### Notifications (`/api/notifications`)
- `GET /notifications` - Get notifications (latest 50)
- `GET /notifications/unread-count` - Unread notification count
- `PUT /notifications/:id/read` - Mark notification as read

---

## 🗄️ Database Models

1. **UserModel** (`User`) — Login shell: email, emp_code, status, pendingSections
2. **EmployeeModel** (`Employee`) — Single unified profile document composed from sub-schemas: personal, contact, education, family, professional, bank/payroll fields. Pre-save hooks auto-calculate age, copy addresses, compute completion percentage.
3. **EmployeeDraftModel** (`EmployeeDraft`) — Add/edit wizard draft with TTL index (7-day expiry)
4. **EmployeeDocumentModel** (`EmployeeDocument`) — Uploaded employee documents by category
5. **NotificationModel** (`Notification`) — In-app notifications with role targeting
6. **NotificationLogModel** (`NotificationLog`) — Deduplication log (unique compound index on emp_code + type + year)
7. **CounterModel** (`Counter`) — Auto-increment counter for employee codes

---

## 🔑 Default Credentials

**HR Account:**
- **Email:** `vaidik@saeculum.com`
- **Password:** `vaidik123`

**Create Senior HR:**
```bash
node scripts/seedSrHR.js
```

---

## 📁 Project Structure

```text
HR-MAIN/
├── backend/
│   ├── config/               # DB connection, constants (departments, designations, etc.)
│   ├── controllers/          # Business logic (admin, management, document, notification)
│   ├── jobs/                 # Cron jobs (reminderJob.js — daily 9AM IST)
│   ├── models/               # Mongoose schemas
│   │   └── employee/         # Sub-schemas (personal, contact, education, family, professional, bank/payroll)
│   ├── notifications/        # Daily reminder checkers (birthday, anniversary, probation, payroll, profile)
│   ├── queues/               # RabbitMQ setup and messaging
│   │   └── consumers/        # emailConsumer.js, notificationConsumer.js
│   ├── routes/               # Express route definitions
│   ├── scripts/              # Seed scripts and utilities
│   ├── services/
│   │   └── offerLetter/      # PDF generation pipeline (data builder, template builder, pagination, layout)
│   ├── utils/                # Helpers (email, date formatting, HTML sanitization, employee code generation)
│   ├── company/template/     # PDF letterhead, signature, watermark images
│   ├── uploads/              # Employee document uploads (organized by emp_code)
│   ├── GeneratedDocuments/   # PDF output
│   └── server.js             # Entry point
│
└── frontend/
    ├── public/
    └── src/
        ├── components/       # Navbar, BulkUploadModal
        ├── pages/            # AddEmployee (7-step wizard), AllEmployees, EmployeeDetail, Documents, UpcomingEvents, OfferLetterAdvancedEditor
        ├── styles/           # auth.css, main.css
        ├── utils/            # locationData.js (Indian states/cities), safeHtml.js
        ├── App.js            # Router setup
        └── index.js          # Entry point (sets axios base URL)
```

---

## 📜 Scripts & Commands

```bash
# Backend
npm start                        # Production
npm run dev                      # Development (nodemon)
node scripts/seedHR.js           # Create HR user
node scripts/seedSrHR.js         # Create Senior HR
node scripts/seedEmployees15.js  # Create 15 sample employees
node scripts/seedTestEvents.js   # Create test events
node scripts/fixIndexes.js       # Fix database indexes

# Frontend
npm start                        # Development server
npm run build                    # Production build
```

---

## 🔧 Troubleshooting

**MongoDB not running:**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

**Port already in use (5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**JWT errors:**
- Clear browser `localStorage`.
- Check `JWT_SECRET` in `.env`.
- Verify token expiration.

**PDF generation fails:**
- Verify `WKHTMLTOPDF_PATH` in `.env`.
- Test: `wkhtmltopdf --version` in terminal.
- Check template files exist in `company/template/`.

**RabbitMQ not connecting:**
- Start RabbitMQ service.
- Or disable by leaving `RABBITMQ_URL` empty in `.env` (notifications degrade gracefully).

**Email not sending:**
- Verify Google OAuth2 credentials in `.env`.
- Check refresh token hasn't expired. Use OAuth Playground to generate a new one if necessary.

---

*ISC License*
