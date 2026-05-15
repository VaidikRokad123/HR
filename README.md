# Saeculum EMP Management Portal - MERN Stack

A comprehensive Saeculum Employee Management System with multi-step registration, HR approval workflow, and complete employee lifecycle management.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [User Workflows](#user-workflows)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Default Credentials](#default-credentials)

## ✨ Features

### Employee Features
- **Multi-step Registration**: 4-step wizard for comprehensive employee onboarding
  - Personal Information (email, password, name, DOB, gender, blood group, mobile)
  - Family Information (parents, marital status, spouse details)
  - Address & Emergency Contacts (current/permanent address, emergency contacts)
  - Review & Submit
- **Profile Completion**: Mandatory bank details and LinkedIn URL after HR approval
- **Dashboard**: View complete personal, family, address, emergency, professional, and bank details
- **Status Tracking**: Real-time approval status monitoring
- **Self-Service Editing**: Employees can edit their own Personal, Family, Address, and Emergency contact details.

### HR Features
- **Pending Approvals**: View and manage employee registration requests
- **Employee Approval Workflow**: 
  - Review complete employee details
  - Approve with professional details (department, job title, work email, etc.)
  - Auto-generate unique employee codes (EMP0001, EMP0002, etc.)
  - Reject and delete incomplete/invalid registrations
- **Employee Management**:
  - View all approved employees
  - Search and filter employees
  - View detailed employee profiles
- **Bulk Employee Upload**: Create or update multiple employees from an Excel file.
- **Payroll Management**:
  - View employees pending payroll setup (within 7 days of joining).
  - Add CTC and salary structure details for new employees.
  - **Probation Tracking**: Automated notifications for HR when an employee's probation period ends.
- **Export to Excel**: Download a comprehensive report of all employee data across multiple sheets.
- **Notification System**: Track employee actions and profile updates.

### Security Features
- JWT-based authentication with token expiration
- Role-based access control (Employee/HR)
- Password hashing with bcrypt
- **Password Recovery**: Secure forgot password flow using OTP sent via email (OAuth2).
- Protected routes and middleware
- Input validation with express-validator

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Email/Notifications**: Nodemailer with Google OAuth2
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment**: dotenv

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Styling**: Custom CSS with responsive design
- **State Management**: Context API (AuthContext)

## 🏗 System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React     │ ◄─────► │  Express    │ ◄─────► │  MongoDB    │
│  Frontend   │  HTTP   │   Backend   │  ODM    │  Database   │
│  (Port 3000)│         │ (Port 5000) │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
  AuthContext            JWT Middleware
  PrivateRoute          Role-based Access
```

### Data Flow
1. **Employee Registration**: Employee → Multi-step Form → Backend → MongoDB → Notification to HR
2. **HR Approval**: HR → Review → Approve → Generate `emp_code` → Update all models → Notification to Employee
3. **Profile Completion**: Employee → Bank + LinkedIn → Backend → MongoDB → Notification to HR
4. **Dashboard Access**: Authenticated User → Protected Route → Fetch Data → Display

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Clone Repository
```bash
git clone <repository-url>
cd HR-MAIN
```

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 🚀 Quick Start

### Option 1: Using Quick Start Script (Windows)
```bash
# From project root
QUICK_START.bat
```
This script will:
- Check if MongoDB is running
- Install dependencies for both backend and frontend
- Create .env files from examples
- Seed the HR user
- Provide instructions to start servers

### Option 2: Manual Setup

#### 1. Configure Environment Variables
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Email configuration for OTPs

# Frontend
cd frontend
cp .env.example .env
# Edit .env with your backend API URL
```

#### 2. Seed HR User
```bash
cd backend
node scripts/seedHR.js
```

#### 3. Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### 4. Start Frontend Server
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/hr_portal
MONGODB_DB_NAME=HR
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=24h
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email Configuration (for OTPs)
EMAIL_CLIENT_ID=your_google_oauth_client_id
EMAIL_CLIENT_SECRET=your_google_oauth_client_secret
EMAIL_REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_CLIENT_MAIL=your_authorized_gmail_address
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Authentication Routes (`/api/auth`)

#### Register Employee
```http
POST /api/auth/register
Content-Type: application/json
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### Employee Routes (`/api/employee`)

#### Get Waiting Status
```http
GET /api/employee/waiting-status
Authorization: Bearer <token>
```

#### Get My Details
```http
GET /api/employee/my-details
Authorization: Bearer <token>
```

#### Complete Profile
```http
PUT /api/employee/complete-profile
Authorization: Bearer <token>
```

### HR Routes (`/api/hr`)

#### Get Pending Employees
```http
GET /api/hr/pending-employees
Authorization: Bearer <token>
```

#### Get Employee by ID
```http
GET /api/hr/employee/:id
Authorization: Bearer <token>
```

#### Approve Employee
```http
PUT /api/hr/employee/:id/approve
Authorization: Bearer <token>
```

#### Edit Employee
```http
PUT /api/hr/employee/:id/edit
Authorization: Bearer <token>
```

#### Get All Employees
```http
GET /api/hr/all-employees
Authorization: Bearer <token>
```

#### Bulk Upload Employees
```http
POST /api/hr/bulk-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## 👥 User Workflows

### Employee Journey

1. **Registration**
   - Visit `/signup`
   - Complete 4-step registration form
   - Submit and receive JWT token
   - Redirected to `/waiting` page

2. **Waiting for Approval**
   - Status: `pending_hr`
   - View waiting page with status message
   - Cannot access dashboard until approved

3. **Profile Completion** (After HR Approval)
   - Status: `approved`
   - Must provide Bank details and LinkedIn URL

4. **Dashboard Access**
   - View complete profile information and access to editing basic details.

### HR Journey

1. **Login**
   - Use default credentials or created HR account

2. **Review Pending Registrations**
   - View list of pending employees

3. **Approve Employee**
   - Review all submitted information
   - Fill professional details (Date joined, Department, etc.)
   - System auto-generates unique employee code

4. **Manage Employees**
   - View all approved employees at `/hr/all-employees`
   - Edit any employee information module
   - Bulk upload employees

## 📁 Project Structure

```
HR-MAIN/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── employeeController.js    # Employee operations
│   │   ├── hrController.js          # HR operations
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT & role verification
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   │   ├── empCodeUtils.js          # Employee code generator
│   │   ├── emailUtils.js            # Nodemailer OAuth2 configuration
│   │   └── jwtUtils.js              # JWT helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js                   # Route configuration
│   │   ├── App.css
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── QUICK_START.bat                  # Windows setup script
└── README.md
```

## 🔑 Default Credentials

### HR Account
- **Email**: `hr@company.com`
- **Password**: `hr123456`

## 🚧 Future Enhancements

- [x] Email notifications (Password Reset OTP via Gmail OAuth2)
- [x] Payroll integration (Basic Setup)
- [ ] Multi-language support
- [ ] Dark mode

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
net start MongoDB
```

### Port Already in Use
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### JWT Token Issues
- Clear localStorage in browser
- Check JWT_SECRET in .env

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ using MERN Stack**
