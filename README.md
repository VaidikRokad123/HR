# 🏢 Saeculum HR Management System

**A comprehensive MERN stack HR portal with employee lifecycle management, automated notifications, and document generation**

---

## 📋 Quick Links

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Routes](#-api-routes)
- [Default Credentials](#-default-credentials)

---

## ✨ Features

### 👤 Employee Features
- **Multi-step Registration** - step wizard with Skip for now support that keeps filled fields and only leaves the current missing fields pending
- **Profile Management** - Complete bank details and LinkedIn after HR approval
- **Dashboard** - View all profile modules (Personal, Family, Professional, Payroll, Bank)
- **Self-Service Editing** - Edit Personal, Family, Address, Emergency modules inline from the employee detail tabs
- **Profile Completion** - Shows missing sections and quick entry into the relevant tab
- **Notifications** - Real-time in-app notifications

### 👔 HR Features
- **Approval Workflow** - Review and approve employee registrations
- **Auto Employee Codes** - Auto-generate unique codes (EMP0001, EMP0002...)
- **Employee Management** - Search, filter, view all employees
- **Bulk Upload** - Import employees via Excel
- **Export to Excel** - Download complete employee data
- **Payroll Setup** - Manage CTC, salary structure, deductions
- **Event Tracking** - Birthdays, anniversaries, probation endings
- **Document Generation** - Generate offer letters with PDF templates
  - Upload progress indicator while employee documents are sent
  - Missing-field summary while preparing documents
  - Visual drag-and-drop editor
  - Variable substitution (${name}, ${role}, etc.)
  - Auto-pagination with smart content fitting
  - Custom templates (logo, signature, watermark)

### 🔒 Security
- JWT authentication with 24h expiration
- Role-based access (Employee, HR, Senior HR)
- Permission-based authorization (8 granular permissions)
- Password hashing (bcrypt)
- OTP-based password reset via email

### 🔔 Automated Notifications
- **Email & In-App** via RabbitMQ
- **Daily Reminders** (9:00 AM IST cron):
  - Birthdays (7-day window)
  - Work anniversaries (7-day window)
  - Probation endings (7-day window)
  - Pending payroll setup
  - Incomplete profiles (30+ days)

---

## 🛠 Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, RabbitMQ, Nodemailer, wkhtmltopdf  
**Frontend:** React 18, React Router v6, Axios, Context API  
**Tools:** express-validator, node-cron, XLSX, Google OAuth2

---

## 📦 Installation

### Prerequisites
```bash
Node.js v14+
MongoDB (local or Atlas)
wkhtmltopdf (for PDF generation)
RabbitMQ (optional, for notifications)
```

### Quick Start

**1. Clone and Install**
```bash
git clone <repo-url>
cd HR-MAIN

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**2. Configure Environment**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hr_portal
MONGODB_DB_NAME=HR
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=24h
CLIENT_URL=http://localhost:3000

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
node scripts/seedHR.js
```

**4. Setup Document Templates** (Optional)
```bash
# Place in backend/company/template/
temp.jpg or temp.png    # Letterhead (A4: 2480×3508px @ 300 DPI)
sign2.png or sign.png   # Signature image
transparent.png         # Watermark (optional)
```

**5. Start Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**6. Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## ⚙️ Configuration

### Google OAuth2 Setup (for emails)

1. Create project at https://console.cloud.google.com/
2. Enable Gmail API
3. Create OAuth2 credentials (Web application)
4. Add redirect URI: `https://developers.google.com/oauthplayground`
5. Get refresh token from OAuth Playground
6. Update `.env` with client ID, secret, and refresh token

### wkhtmltopdf Setup

**Windows:**
```bash
# Download from https://wkhtmltopdf.org/downloads.html
# Set path in .env
WKHTMLTOPDF_PATH=C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe
```

**Linux/Mac:**
```bash
# Install
sudo apt-get install wkhtmltopdf  # or brew install wkhtmltopdf

# Set path in .env
WKHTMLTOPDF_PATH=/usr/local/bin/wkhtmltopdf
```

---

## 📚 API Routes

### Authentication (`/api/auth`)
```
POST   /register          - Employee registration
POST   /login             - User login
POST   /forgot-password   - Request OTP
POST   /reset-password    - Reset password with OTP
GET    /me                - Get current user
POST   /logout            - Logout
GET    /rbac              - Get RBAC config
```

### Employee (`/api/employee`)
```
GET    /waiting-status       - Check approval status
GET    /my-details           - Get own profile
PUT    /complete-profile     - Add bank + LinkedIn
PUT    /edit                 - Edit own modules
```

### Admin / Employee Management (`/api/admin` and `/api/employees`)
```
GET    /admin/employees/:id       - Prefill data for the add/edit wizard
PUT    /admin/employees/:id       - Save step-based employee changes
GET    /employees/:id             - Employee detail page payload
PUT    /employees/:id/edit        - Inline edit for a specific employee module
GET    /employees/all             - All employees with completion progress
POST   /employees/bulk-upload     - Bulk import Excel
GET    /employees/pending-payrolls - Employees without payroll
POST   /employees/payroll/:id     - Add payroll details
GET    /employees/upcoming-events - Events dashboard
POST   /employees/trigger-reminders - Manual reminder trigger
POST   /employees/:id/sensitive-otp    - Request OTP for bank/payroll details
POST   /employees/:id/sensitive-verify - Verify OTP and unlock sensitive details
```

### Documents (`/api/documents`)
```
GET    /types                          - Available document types
GET    /offer-letter/:userId/inspect   - Inspect employee data
POST   /offer-letter/:userId/prepare   - Prepare letter
GET    /draft                          - Get draft
POST   /compile                        - Generate PDF
POST   /upload/:emp_code               - Upload employee documents
```

### Notifications (`/api/notifications`)
```
GET    /                - Get notifications
GET    /unread-count    - Unread count
PUT    /:id/read        - Mark as read
```

---

## 📊 Database Models

1. **UserModel** - login/user shell with email, emp_code, status, pending sections
2. **EmployeeModel** - single employee profile document, split internally into personal, contact, education, professional, bank and payroll schema components
3. **EmployeeDraftModel** - add/edit employee draft data
4. **EmployeeDocumentModel** - uploaded employee documents
5. **NotificationModel** - in-app notifications
6. **NotificationLogModel** - sent notification tracking
7. **CounterModel** - employee code sequence

---

## 🔑 Default Credentials

**HR Account:**
- Email: `hr@company.com`
- Password: `hr123456`

**Create Senior HR:**
```bash
node scripts/seedSrHR.js
```

---

## 🏗 Project Structure

```
HR-MAIN/
├── backend/
│   ├── config/           # DB, RBAC config
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth, RBAC
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Document generation
│   │   └── offerLetter/  # PDF builder, pagination
│   ├── queues/           # RabbitMQ setup
│   ├── notifications/    # Reminder checkers
│   ├── jobs/             # Cron jobs
│   ├── scripts/          # Seed scripts
│   ├── utils/            # Helpers
│   ├── company/template/ # PDF templates
│   ├── GeneratedDocuments/ # Output PDFs
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/   # Navbar, PrivateRoute, Modals
        ├── pages/        # All page components
        ├── context/      # AuthContext
        ├── utils/        # Helper functions
        └── App.js
```

---

## 🔧 Scripts & Commands

```bash
# Backend
npm start              # Production
npm run dev            # Development (nodemon)
node scripts/seedHR.js         # Create HR user
node scripts/seedSrHR.js       # Create Senior HR
node scripts/testPdfPadding.mjs # Test PDF generation

# Frontend
npm start              # Development server
npm build              # Production build
```

---

## 🐛 Troubleshooting

**MongoDB not running:**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**JWT errors:**
- Clear browser localStorage
- Check `JWT_SECRET` in `.env`
- Verify token expiration

**PDF generation fails:**
- Verify `WKHTMLTOPDF_PATH` in `.env`
- Test: `wkhtmltopdf --version`
- Check template files exist in `company/template/`

**RabbitMQ not connecting:**
- Start RabbitMQ service
- Or disable by leaving `RABBITMQ_URL` empty in `.env`

**Email not sending:**
- Verify Google OAuth2 credentials
- Check refresh token hasn't expired
- Enable "Less secure app access" in Gmail (if needed)

---

## 📄 License

ISC License

---

**Built with ❤️ using MERN Stack**
