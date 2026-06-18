import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    application_number: "",
    name: "",
    date_of_birth: "",
    community: "",
    email: "",
    mobile: "",
    ug_percentage: "",
  });
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [examActive, setExamActive] = useState(true);

  useEffect(() => {
    // Check if exam is active
    api.get("/api/v1/exams/active")
      .then((res) => {
        if (!res.data.is_active_now) {
          setExamActive(false);
          setError("The entrance examination is not active at this time.");
        }
      })
      .catch((err) => {
        console.error("Error checking exam status:", err);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDegreeChange = (degreeValue) => {
    if (selectedDegrees.includes(degreeValue)) {
      setSelectedDegrees(selectedDegrees.filter((d) => d !== degreeValue));
    } else {
      setSelectedDegrees([...selectedDegrees, degreeValue]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Form validations
    if (!formData.application_number.trim() || !formData.name.trim() || !formData.community.trim()) {
      setError("Please fill in all text fields.");
      setLoading(false);
      return;
    }

    if (selectedDegrees.length === 0) {
      setError("Please select at least one degree program.");
      setLoading(false);
      return;
    }

    if (!formData.date_of_birth) {
      setError("Please select your Date of Birth.");
      setLoading(false);
      return;
    }

    const pct = parseFloat(formData.ug_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Please enter a valid UG percentage (0-100).");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/v1/students/register", {
        ...formData,
        ug_percentage: pct,
        degrees: selectedDegrees,
      });

      const { student, status, attempt_id } = response.data;
      
      // Save student session in localStorage
      localStorage.setItem("student_session", JSON.stringify(student));
      localStorage.setItem("exam_status", status);
      if (attempt_id) {
        localStorage.setItem("attempt_id", attempt_id);
      } else {
        localStorage.removeItem("attempt_id");
      }

      // Route accordingly
      if (status === "resume") {
        navigate("/exam");
      } else {
        navigate("/instructions");
      }
    } catch (err) {
      let errMsg = "Registration failed. Please try again.";
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((e) => {
          const field = e.loc ? e.loc[e.loc.length - 1] : "";
          return `${field ? field.toUpperCase() + ": " : ""}${e.msg}`;
        }).join(" | ");
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-container">
      <div className="glass-card register-card animate-slide-up" style={{ maxWidth: "550px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem", color: "var(--primary)", fontWeight: "800", marginBottom: "0.25rem" }}>
            Student Registration
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Periyar University PG Entrance Examination Portal
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {!examActive && (
          <div className="alert alert-info" style={{ marginBottom: "0" }}>
            The exam session is currently closed. If you are an administrator, please log in to configuration settings.
          </div>
        )}

        {examActive && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="application_number">Application Number</label>
              <input
                className="form-control"
                type="text"
                id="application_number"
                name="application_number"
                placeholder="e.g. PU202610234"
                value={formData.application_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Student Name</label>
              <input
                className="form-control"
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="date_of_birth">Date of Birth</label>
              <input
                className="form-control"
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {/* Checkbox Group for degrees */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                Degree(s) Applied (Multi-select)
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0.5rem 0" }}>
                {[
                  { value: "MCA", label: "MCA" },
                  { value: "MSC_CS", label: "M.Sc Computer Science" },
                  { value: "MSC_DS", label: "M.Sc Data Science" },
                ].map((deg) => (
                  <label
                    key={deg.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: "500",
                      color: "var(--text-main)"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDegrees.includes(deg.value)}
                      onChange={() => handleDegreeChange(deg.value)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--primary)",
                        cursor: "pointer"
                      }}
                    />
                    {deg.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="community">Community</label>
              <input
                className="form-control"
                type="text"
                id="community"
                name="community"
                placeholder="e.g. BC / MBC / SC / ST / OC"
                value={formData.community}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                className="form-control"
                type="email"
                id="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="mobile">Mobile Number</label>
                <input
                  className="form-control"
                  type="tel"
                  id="mobile"
                  name="mobile"
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ug_percentage">UG Percentage</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  id="ug_percentage"
                  name="ug_percentage"
                  placeholder="e.g. 78.50"
                  value={formData.ug_percentage}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary animate-pulse"
              type="submit"
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              {loading ? "Registering..." : "Start Exam"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
