import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Instructions from "./pages/Instructions";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="nav-brand">
            <div className="nav-logo-text">
              <h1>PERIYAR UNIVERSITY</h1>
              <p>Entrance Examination Management System</p>
            </div>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Portal Home</Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/instructions" element={<Instructions />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/result" element={<Result />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: "var(--primary-dark)", color: "#64748b", textAlign: "center", padding: "1.5rem", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          &copy; {new Date().getFullYear()} Periyar University Entrance Examination Portal. All Rights Reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
