import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/results/leaderboard")
      .then((res) => {
        setLeaderboard(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load leaderboard details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="leaderboard-container animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", color: "var(--primary-dark)", fontWeight: "800" }}>
            Entrance Examination Leaderboard
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Live rankings of candidates based on exam performance
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/")}
          style={{ width: "auto", padding: "0.6rem 1.2rem" }}
        >
          Portal Home
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="spinner"></div>
      ) : leaderboard.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            No submissions have been registered yet. Ranks will appear here as soon as exams are submitted.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Rank</th>
                <th>Application No</th>
                <th>Student Name</th>
                <th>Degree</th>
                <th style={{ textAlign: "right" }}>Marks</th>
                <th style={{ textAlign: "right" }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((student) => {
                let rankClass = "rank-badge";
                if (student.rank === 1) rankClass += " rank-1";
                else if (student.rank === 2) rankClass += " rank-2";
                else if (student.rank === 3) rankClass += " rank-3";

                return (
                  <tr key={student.application_number}>
                    <td>
                      <span className={rankClass}>
                        {student.rank === 1 ? "🥇" : student.rank === 2 ? "🥈" : student.rank === 3 ? "🥉" : student.rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>{student.application_number}</td>
                    <td style={{ fontWeight: "500" }}>{student.student_name}</td>
                    <td>
                      <span className="badge badge-gray">{student.degree}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>{student.marks}</td>
                    <td style={{ textAlign: "right", fontWeight: "600", color: "var(--text-muted)" }}>{student.percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
