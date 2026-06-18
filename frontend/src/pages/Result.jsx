import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const resStr = localStorage.getItem("submit_result");
    if (!resStr) {
      navigate("/");
      return;
    }
    setResult(JSON.parse(resStr));
  }, [navigate]);

  const handleFinish = () => {
    localStorage.removeItem("student_session");
    localStorage.removeItem("exam_status");
    localStorage.removeItem("attempt_id");
    localStorage.removeItem("submit_result");
    navigate("/");
  };

  if (!result) {
    return (
      <div className="centered-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Helper to map DB codes to display titles
  const mapDegreeCode = (code) => {
    const maps = {
      "MCA": "MCA",
      "MSC_CS": "M.Sc Computer Science",
      "MSC_DS": "M.Sc Data Science"
    };
    return maps[code] || code;
  };

  return (
    <div className="centered-container">
      <div className="glass-card results-container animate-slide-up" style={{ textAlign: "center", maxWidth: "600px" }}>
        <h2 style={{ color: "var(--primary)", fontWeight: "800", marginBottom: "0.5rem" }}>
          Exam Submitted Successfully
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Thank you for taking the Periyar University Entrance Examination.
        </p>

        {/* Student Information Details Block */}
        <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius-md)", textAlign: "left", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "0.5rem", fontSize: "0.95rem" }}>
            <span style={{ fontWeight: "600", color: "var(--text-muted)" }}>Application No:</span>
            <span style={{ fontWeight: "700", color: "var(--primary)" }}>{result.application_number}</span>

            <span style={{ fontWeight: "600", color: "var(--text-muted)" }}>Student Name:</span>
            <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{result.student_name}</span>

            <span style={{ fontWeight: "600", color: "var(--text-muted)" }}>Degree Applied:</span>
            <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
              {result.degrees ? result.degrees.map(mapDegreeCode).join(", ") : ""}
            </span>
          </div>
        </div>

        {result.result_visibility ? (
          <div>
            <div className="score-badge">
              <span className="score-num">{result.score}</span>
              <span className="score-lbl">Marks Obtained</span>
            </div>

            <div className="results-stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
              <div className="result-stat-card" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="result-stat-val" style={{ fontSize: "1.2rem" }}>{result.total_questions}</div>
                <div className="result-stat-lbl" style={{ fontSize: "0.75rem" }}>Total Qns</div>
              </div>
              <div className="result-stat-card" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="result-stat-val" style={{ fontSize: "1.2rem", color: "var(--primary)" }}>{result.attempted_questions}</div>
                <div className="result-stat-lbl" style={{ fontSize: "0.75rem" }}>Attempted</div>
              </div>
              <div className="result-stat-card" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="result-stat-val" style={{ fontSize: "1.2rem", color: "var(--success)" }}>{result.correct_answers}</div>
                <div className="result-stat-lbl" style={{ fontSize: "0.75rem" }}>Correct</div>
              </div>
              <div className="result-stat-card" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="result-stat-val" style={{ fontSize: "1.2rem", color: "var(--danger)" }}>{result.wrong_answers}</div>
                <div className="result-stat-lbl" style={{ fontSize: "0.75rem" }}>Wrong</div>
              </div>
              <div className="result-stat-card" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="result-stat-val" style={{ fontSize: "1.2rem" }}>{result.percentage}%</div>
                <div className="result-stat-lbl" style={{ fontSize: "0.75rem" }}>Percentage</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info" style={{ margin: "2rem 0", textAlign: "left" }}>
            <h4 style={{ fontWeight: "700", marginBottom: "0.5rem" }}>Results Visibility Notice</h4>
            Your answers have been saved and evaluated. The detailed marks, statistics, and scores will be made visible online after the university concludes all examination windows. Please keep checking the official notifications.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "2rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleFinish}
          >
            Return to Portal Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
