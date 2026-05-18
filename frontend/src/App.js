import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import EmployeeDetail from "./pages/EmployeeDetail";
import AllEmployees from "./pages/AllEmployees";
import UpcomingEvents from "./pages/UpcomingEvents";
import Documents from "./pages/Documents";
import OfferLetterAdvancedEditor from "./pages/OfferLetterAdvancedEditor";
import AddEmployee from "./pages/AddEmployee";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App App--logged-in">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/employees" element={<AllEmployees />} />
            <Route path="/events" element={<UpcomingEvents />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/editor" element={<OfferLetterAdvancedEditor />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/" element={<Navigate to="/employees" replace />} />
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
