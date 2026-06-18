import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Register from "./pages/Register";
import Instructions from "./pages/Instructions";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import Leaderboard from "./pages/Leaderboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import UniversityHeader from "./components/UniversityHeader";

function AppContent() {
  const location = useLocation();

  const headerRoutes = ["/", "/instructions", "/result", "/leaderboard"];
  const showUniversityHeader = headerRoutes.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isExamRoute = location.pathname === "/exam";

  // Apply a class wrapper to adjust heights in CSS when UniversityHeader is shown
  const wrapperClass = showUniversityHeader ? "app-container has-univ-header" : "app-container";

  return (
    <div className={wrapperClass}>
      {/* Headers conditional rendering */}
      {showUniversityHeader && <UniversityHeader />}
      
      {isAdminRoute && !isExamRoute && (
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
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/result" element={<Result />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
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
      {!isExamRoute && (
        <footer style={{ backgroundColor: "var(--primary-dark)", color: "#64748b", textAlign: "center", padding: "1.5rem", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          &copy; {new Date().getFullYear()} Periyar University Entrance Examination Portal. All Rights Reserved.
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
