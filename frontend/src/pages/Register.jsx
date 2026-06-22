import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("login"); // "login" or "verify"
  const [credentials, setCredentials] = useState({
    application_mca: "",
    application_cs: "",
    application_ds: "",
  });
  const [studentData, setStudentData] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [examStatus, setExamStatus] = useState("");
  const [attemptId, setAttemptId] = useState(null);
  
  const [isVerified, setIsVerified] = useState(false);
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

  const handleCredChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const mca = credentials.application_mca.trim();
    const cs = credentials.application_cs.trim();
    const ds = credentials.application_ds.trim();

    if (!mca && !cs && !ds) {
      setError("Please enter at least one Application Number.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/v1/students/login", {
        application_mca: mca || null,
        application_cs: cs || null,
        application_ds: ds || null,
      });

      const { student, students, status, attempt_id } = response.data;
      
      if (status === "submitted") {
        setError("You have already completed and submitted your examination. Duplicate attempts are not allowed.");
        setLoading(false);
        return;
      }

      setStudentData(student);
      setStudentsList(students || [student]);
      setExamStatus(status);
      setAttemptId(attempt_id);
      setStep("verify");
    } catch (err) {
      let errMsg = "Login failed. Please verify your application number(s).";
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        errMsg = detail;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndProceed = () => {
    if (!isVerified) {
      setError("Please confirm that your details are correct before proceeding.");
      return;
    }

    // Save primary student session in localStorage
    localStorage.setItem("student_session", JSON.stringify(studentData));
    localStorage.setItem("student_session_list", JSON.stringify(studentsList));
    localStorage.setItem("exam_status", examStatus);
    if (attemptId) {
      localStorage.setItem("attempt_id", attemptId);
    } else {
      localStorage.removeItem("attempt_id");
    }

    // Route accordingly
    if (examStatus === "resume") {
      navigate("/exam");
    } else {
      navigate("/instructions");
    }
  };

  return (
    <div className="centered-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div className="glass-card register-card animate-slide-up" style={{ maxWidth: "650px", width: "100%", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", color: "var(--primary)", fontWeight: "800", marginBottom: "0.25rem" }}>
            Candidate Portal
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Periyar University PG Entrance Examination Portal
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>{error}</div>}

        {!examActive && (
          <div className="alert alert-info" style={{ marginBottom: "0" }}>
            The exam session is currently closed. If you are an administrator, please log in to configuration settings.
          </div>
        )}

        {examActive && step === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "center" }}>
                Please enter your Application Number(s) below. If you applied for multiple courses, enter the respective application numbers to verify all profile details.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label className="form-label" htmlFor="application_mca">Application Number for MCA</label>
              <input
                className="form-control"
                type="text"
                id="application_mca"
                name="application_mca"
                placeholder="Enter Application Number for MCA (e.g. PU20260001)"
                value={credentials.application_mca}
                onChange={handleCredChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label className="form-label" htmlFor="application_cs">Application Number for M.Sc Computer Science</label>
              <input
                className="form-control"
                type="text"
                id="application_cs"
                name="application_cs"
                placeholder="Enter Application Number for M.Sc CS"
                value={credentials.application_cs}
                onChange={handleCredChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="form-label" htmlFor="application_ds">Application Number for M.Sc Data Science</label>
              <input
                className="form-control"
                type="text"
                id="application_ds"
                name="application_ds"
                placeholder="Enter Application Number for M.Sc Data Science"
                value={credentials.application_ds}
                onChange={handleCredChange}
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>
        )}

        {examActive && step === "verify" && studentData && (
          <div>
            <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
              Credentials verified successfully! Please confirm your profile details below.
            </div>

            {/* Candidate General Details */}
            <div style={{
              textAlign: "left",
              marginBottom: "1.5rem",
              padding: "1.2rem",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <h3 style={{ fontSize: "1.05rem", color: "var(--primary)", fontWeight: "700", marginBottom: "0.8rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.3rem" }}>
                Candidate Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem 1.2rem", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Name</span>
                  <strong style={{ color: "var(--text-main)" }}>{studentData.name}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Community</span>
                  <strong style={{ color: "var(--text-main)" }}>{studentData.community}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>E-mail Address</span>
                  <strong style={{ color: "var(--text-main)", wordBreak: "break-all" }}>{studentData.email}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Mobile No.</span>
                  <strong style={{ color: "var(--text-main)" }}>{studentData.mobile}</strong>
                </div>
              </div>
            </div>

            {/* Program applications details */}
            <h3 style={{ fontSize: "1.05rem", color: "var(--primary)", fontWeight: "700", margin: "1.5rem 0 0.8rem 0" }}>
              Applied Courses & Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {studentsList.map((std, idx) => (
                <div key={std.application_number} style={{
                  padding: "1.2rem",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontSize: "0.9rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.5rem", marginBottom: "0.8rem" }}>
                    <span style={{ fontWeight: "700", color: "var(--accent)" }}>Application #{idx + 1}</span>
                    <span className="badge badge-blue" style={{ fontSize: "0.75rem" }}>
                      {std.degrees?.join(", ") || "N/A"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem 1rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Application No</span>
                      <strong style={{ color: "var(--text-main)" }}>{std.application_number}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Course / Department</span>
                      <strong style={{ color: "var(--text-main)" }}>{std.course || "N/A"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Quota</span>
                      <strong style={{ color: "var(--text-main)" }}>{std.quota || "N/A"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>UG Percentage (%)</span>
                      <strong style={{ color: "var(--text-main)" }}>{std.ug_percentage}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                fontSize: "0.95rem",
                color: "var(--text-main)"
              }}>
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--primary)",
                    cursor: "pointer"
                  }}
                />
                My details are correct and present.
              </label>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  className="btn"
                  onClick={() => {
                    setStep("login");
                    setIsVerified(false);
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "var(--text-main)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  Back
                </button>
                <button
                  className="btn btn-primary animate-pulse"
                  onClick={handleConfirmAndProceed}
                  disabled={!isVerified}
                  style={{ flex: 2 }}
                >
                  {examStatus === "resume" ? "Resume Exam" : "Confirm & Proceed"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
