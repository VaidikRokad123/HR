import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import WaitingPage from './pages/WaitingPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CompleteProfile from './pages/CompleteProfile';
import HRPendingApprovals from './pages/HRPendingApprovals';
import HREmployeeDetail from './pages/HREmployeeDetail';
import HRAllEmployees from './pages/HRAllEmployees';
import HRUpcomingEvents from './pages/HRUpcomingEvents';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function AppShell() {
  const { user } = useAuth();
  return (
    <div className={user ? 'App App--logged-in' : 'App'}>
      {user ? <Navbar /> : null}
      <main className={user ? 'app-main' : 'app-main app-main--full'}>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Employee Routes */}
            <Route 
              path="/waiting" 
              element={
                <PrivateRoute role="employee">
                  <WaitingPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/employee/dashboard" 
              element={
                <PrivateRoute role="employee">
                  <EmployeeDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/employee/complete-profile" 
              element={
                <PrivateRoute role="employee">
                  <CompleteProfile />
                </PrivateRoute>
              } 
            />
            
            {/* HR Routes */}
            <Route 
              path="/hr/pending" 
              element={
                <PrivateRoute role="hr">
                  <HRPendingApprovals />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/hr/employee/:id" 
              element={
                <PrivateRoute role="hr">
                  <HREmployeeDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/hr/all-employees" 
              element={
                <PrivateRoute role="hr">
                  <HRAllEmployees />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/hr/upcoming-events" 
              element={
                <PrivateRoute role="hr">
                  <HRUpcomingEvents />
                </PrivateRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
