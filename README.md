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
- **Export to Excel**: Download a comprehensive report of all employee data across multiple sheets.
- **Notification System**: Track employee actions and profile updates

### Security Features
- JWT-based authentication with token expiration
- Role-based access control (Employee/HR)
- Password hashing with bcrypt
- Protected routes and middleware
- Input validation with express-validator

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
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
# Edit .env with your MongoDB URI and JWT secret

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
# Or use MongoDB Atlas connection string
MONGODB_DB_NAME=HR
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=24h
NODE_ENV=development
CLIENT_URL=http://localhost:3000
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

{
  "email": "employee@example.com",
  "password": "password123",
  "personal": {
    "fullName": "John Doe",
    "gender": "Male",
    "dob": "1990-01-01",
    "mobile": "1234567890"
  },
  "family": {
    "fatherName": "Father Name",
    "motherName": "Mother Name",
    "maritalStatus": "Single",
    "spouseName": "",
    "marriageDate": ""
  },
  "address": {
    "currentAddress": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "pincode": "123456",
      "country": "India"
    },
    "permanentAddress": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "pincode": "123456",
      "country": "India"
    },
    "permanentAddress": { /* same structure */ }
  },
  "emergency": {
    "emergencyContact1": {
      "name": "Emergency Contact",
      "relationship": "Father",
      "mobile": "9876543210"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "employee",
    "emp_code": "EMP0001",
    "status": "approved"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
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
Content-Type: application/json

{
  "bankName": "Bank Name",
  "branch": "Branch Name",
  "personalAccountNumber": "1234567890",
  "personalIfsc": "BANK0001234",
  "linkedinUrl": "https://linkedin.com/in/profile",
  "nameAsPerAadhaar": "Name As Per Aadhaar"
}
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
Content-Type: application/json

{
  "dateJoined": "2024-01-01",
  "department": "Engineering",
  "jobTitle": "Software Engineer",
  "reportingManager": "Manager Name",
  "workEmail": "employee@company.com",
  "attendanceBiometricId": "BIO123",
  "inProbation": true
}
```

#### Reject Employee
```http
PUT /api/hr/employee/:id/reject
Authorization: Bearer <token>
```

#### Edit Employee
```http
PUT /api/hr/employee/:id/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "module": "personal|family|address|emergency|professional|bank",
  "data": { /* module-specific fields */ }
}
```

#### Get All Employees
```http
GET /api/hr/all-employees
Authorization: Bearer <token>
```

### Notification Routes (`/api/notifications`)
```http
GET /api/notifications
Authorization: Bearer <token>
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
   - Redirected to `/employee/complete-profile`
   - Must provide:
     - Bank details (name, branch, account number, IFSC)
     - LinkedIn URL (mandatory)
     - Name as per Aadhaar (optional)
   - Submit to complete onboarding

4. **Dashboard Access**
   - View complete profile information
   - See employee code (EMP0001, etc.)
   - Access all personal, family, professional, and bank details

### HR Journey

1. **Login**
   - Use default credentials or created HR account
   - Redirected to `/hr/pending` page

2. **Review Pending Registrations**
   - View list of pending employees
   - Click on employee to see full details

3. **Approve Employee**
   - Review all submitted information
   - Fill professional details:
     - Date joined
     - Department
     - Job title
     - Reporting manager
     - Work email
     - Biometric ID
     - Probation status
   - System auto-generates unique employee code
   - Employee receives notification

4. **Manage Employees**
   - View all approved employees at `/hr/all-employees`
   - Search by name, emp code, department, or job title
   - View detailed employee profiles
   - Edit any employee information module

## 🗄 Database Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  role: "employee" | "hr",
  emp_code: String (unique, sparse),
  status: "pending_hr" | "approved" | "rejected",
  createdAt: Date
}
```

#### EmployeePersonal
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String,
  fullName: String,
  gender: "Male" | "Female" | "Other",
  dob: Date,
  age: Number (auto-calculated),
  mobile: String,
  personalEmail: String,
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
}
```

#### EmployeeFamily
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String,
  fatherName: String,
  motherName: String,
  married: Boolean,
  spouseName: String,
  marriageDate: Date
}
```

#### EmployeeAddress
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String,
  currentAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  permanentAddress: { /* same structure */ }
}
```

#### EmployeeEmergency
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String,
  emergencyContact1: {
    name: String,
    relationship: String,
    mobile: String
  },
  emergencyContact2: { /* same structure, optional */ }
}
```

#### EmployeeProfessional
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String (unique),
  nameAsPerAadhaar: String,
  dateJoined: Date,
  tenure: String,
  exitDate: Date,
  department: String,
  jobTitle: String,
  reportingManager: String,
  attendanceBiometricId: String,
  inProbation: Boolean,
  workEmail: String,
  linkedinUrl: String
}
```

#### EmployeeBank
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  emp_code: String,
  bankName: String,
  branch: String,
  personalAccountNumber: String,
  personalIfsc: String,
  salaryAccountNumber: String,
  salaryIfsc: String
}
```

#### Notifications
```javascript
{
  _id: ObjectId,
  toRole: "hr" | "employee",
  toEmpCode: String,
  toUserId: ObjectId (ref: User),
  message: String,
  isRead: Boolean,
  createdAt: Date
}
```

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
│   │   ├── UserModel.js
│   │   ├── EmployeePersonalModel.js
│   │   ├── EmployeeFamilyModel.js
│   │   ├── EmployeeAddressModel.js
│   │   ├── EmployeeEmergencyModel.js
│   │   ├── EmployeeProfessionalModel.js
│   │   ├── EmployeeBankModel.js
│   │   └── NotificationModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── hrRoutes.js
│   │   └── notificationRoutes.js
│   ├── scripts/
│   │   ├── seedHR.js                # Create default HR user
│   │   └── fixIndexes.js            # Database maintenance
│   ├── utils/
│   │   ├── empCodeUtils.js          # Employee code generator
│   │   └── jwtUtils.js              # JWT helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Navbar.css
│   │   │   └── PrivateRoute.js      # Protected route wrapper
│   │   ├── context/
│   │   │   └── AuthContext.js       # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Signup.js            # Multi-step registration
│   │   │   ├── WaitingPage.js       # Pending approval page
│   │   │   ├── CompleteProfile.js   # Bank + LinkedIn form
│   │   │   ├── EmployeeDashboard.js
│   │   │   ├── HRPendingApprovals.js
│   │   │   ├── HREmployeeDetail.js
│   │   │   └── HRAllEmployees.js
│   │   ├── App.js                   # Route configuration
│   │   ├── App.css
│   │   ├── index.js
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

> **Note**: Change the default HR password in production!

### Creating Additional HR Users
Run the seed script or manually create in MongoDB with `role: "hr"` and `status: "approved"`.

## 🔧 Utility Scripts

### Seed HR User
```bash
cd backend
node scripts/seedHR.js
```
Creates the default HR user if it doesn't exist.

### Fix Database Indexes
```bash
cd backend
node scripts/fixIndexes.js
```
Repairs database indexes if needed.

## 🎨 Frontend Features

### Responsive Design
- Mobile-friendly layouts
- Grid-based forms
- Card-based UI components
- Custom CSS styling

### Protected Routes
- Role-based route protection
- Automatic redirects based on user status
- Auth state persistence with localStorage

### Form Validation
- Client-side validation
- Server-side validation with express-validator
- Error message display

## 🔒 Security Best Practices

1. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Minimum 6 characters required
   - Never stored in plain text

2. **JWT Security**
   - Tokens expire after 24 hours (configurable)
   - Stored in localStorage (frontend)
   - Sent via Authorization header
   - Verified on every protected route

3. **Role-Based Access**
   - Middleware checks user role
   - Separate routes for HR and Employee
   - Database queries filtered by user context

4. **Input Validation**
   - express-validator on all inputs
   - Email normalization
   - Required field validation
   - Type checking

5. **CORS Configuration**
   - Configured for specific client URL
   - Credentials enabled for cookies

## 🚧 Future Enhancements

- [ ] Email notifications (SendGrid/Nodemailer)
- [ ] Document upload (Aadhaar, PAN, certificates)
- [ ] Attendance tracking integration
- [ ] Leave management system
- [ ] Payroll integration
- [ ] Performance review module
- [ ] Employee self-service portal
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Dark mode

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Windows:
tasklist | find "mongod"

# Start MongoDB service
net start MongoDB
```

### Port Already in Use
```bash
# Backend (Port 5000)
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (Port 3000)
# React will prompt to use different port
```

### JWT Token Issues
- Clear localStorage in browser
- Check JWT_SECRET in .env
- Verify token expiration time

### CORS Errors
- Verify CLIENT_URL in backend .env
- Check REACT_APP_API_URL in frontend .env
- Ensure both servers are running

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ using MERN Stack**
