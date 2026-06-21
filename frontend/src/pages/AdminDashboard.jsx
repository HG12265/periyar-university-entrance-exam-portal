import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  FileSpreadsheet, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Search, 
  FileDown, 
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Trophy
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  
  // Student list states
  const [students, setStudents] = useState([]);
  
  // Question states
  const [questions, setQuestions] = useState([]);
  const [questionModal, setQuestionModal] = useState({ show: false, editId: null });
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    marks: 1.0,
    image_url: "",
    option_a_image_url: "",
    option_b_image_url: "",
    option_c_image_url: "",
    option_d_image_url: ""
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  
  // Settings states
  const [examSettings, setExamSettings] = useState({
    name: "",
    total_questions: 30,
    duration_minutes: 30,
    start_date: "",
    end_date: "",
    result_visibility: true
  });
  
  // Results states (Outcome list)
  const [results, setResults] = useState([]);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsDegree, setResultsDegree] = useState("All");
  const [resultsCommunity, setResultsCommunity] = useState("All");

  // Leaderboard states (Rank list)
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [leaderboardDegree, setLeaderboardDegree] = useState("All");
  const [leaderboardCommunity, setLeaderboardCommunity] = useState("All");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/auth/dashboard-stats");
      setStats(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      navigate("/admin/login");
    } else {
      setMessage({
        text: err.response?.data?.detail || "An unexpected error occurred.",
        type: "danger"
      });
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // Helper to map DB codes to display titles
  const mapDegreeCode = (code) => {
    const maps = {
      "MCA": "MCA",
      "MSC_CS": "M.Sc Computer Science",
      "MSC_DS": "M.Sc Data Science"
    };
    return maps[code] || code;
  };

  // ---------------- STUDENTS MODULE ----------------
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/students");
      setStudents(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- QUESTIONS MODULE ----------------
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/questions");
      setQuestions(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setQuestionForm({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      marks: 1.0,
      image_url: "",
      option_a_image_url: "",
      option_b_image_url: "",
      option_c_image_url: "",
      option_d_image_url: ""
    });
    setQuestionModal({ show: true, editId: null });
  };

  const handleOpenEditQuestion = (q) => {
    setQuestionForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      marks: q.marks,
      image_url: q.image_url || "",
      option_a_image_url: q.option_a_image_url || "",
      option_b_image_url: q.option_b_image_url || "",
      option_c_image_url: q.option_c_image_url || "",
      option_d_image_url: q.option_d_image_url || ""
    });
    setQuestionModal({ show: true, editId: q.id });
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setActionLoading(true);
    try {
      const res = await api.post("/api/v1/questions/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setQuestionForm(prev => ({
        ...prev,
        [field]: res.data.url
      }));
    } catch (err) {
      alert("Failed to upload image: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (questionModal.editId) {
        await api.put(`/api/v1/questions/${questionModal.editId}`, questionForm);
        showMessage("Question updated successfully.");
      } else {
        await api.post("/api/v1/questions", questionForm);
        showMessage("Question created successfully.");
      }
      setQuestionModal({ show: false, editId: null });
      loadQuestions();
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/api/v1/questions/${id}`);
      showMessage("Question deleted successfully.");
      loadQuestions();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setActionLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await api.post("/api/v1/questions/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadResult(res.data);
      if (res.data.status === "success") {
        showMessage(`Successfully uploaded ${res.data.added_count} questions.`);
        loadQuestions();
      } else {
        showMessage(`Uploaded ${res.data.added_count} questions, but with some row errors.`, "warning");
        loadQuestions();
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- EXAM SETTINGS MODULE ----------------
  const loadExamSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/exams/active");
      setExamSettings({
        name: res.data.name,
        total_questions: res.data.total_questions,
        duration_minutes: res.data.duration_minutes,
        start_date: res.data.start_date.substring(0, 16),
        end_date: res.data.end_date.substring(0, 16),
        result_visibility: res.data.result_visibility
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put("/api/v1/exams/settings", examSettings);
      showMessage("Exam settings updated successfully.");
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- RESULTS MODULE ----------------
  const loadResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (resultsSearch.trim()) params.search = resultsSearch;
      if (resultsDegree !== "All") params.degree = resultsDegree;
      if (resultsCommunity !== "All") params.community = resultsCommunity;

      const res = await api.get("/api/v1/results", { params });
      setResults(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LEADERBOARD MODULE ----------------
  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (leaderboardSearch.trim()) params.search = leaderboardSearch;
      if (leaderboardDegree !== "All") params.degree = leaderboardDegree;
      if (leaderboardCommunity !== "All") params.community = leaderboardCommunity;

      const res = await api.get("/api/v1/results/leaderboard", { params });
      setLeaderboard(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLeaderboard = async () => {
    try {
      const params = {};
      if (leaderboardSearch.trim()) params.search = leaderboardSearch;
      if (leaderboardDegree !== "All") params.degree = leaderboardDegree;
      if (leaderboardCommunity !== "All") params.community = leaderboardCommunity;

      const response = await api.get("/api/v1/results/export", {
        params,
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Leaderboard_Export_${leaderboardDegree}_${leaderboardCommunity}.xlsx`;
      link.click();
      showMessage("Leaderboard report downloaded successfully.");
    } catch (err) {
      handleApiError(err);
    }
  };

  // Trigger loading when tabs change
  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    else if (activeTab === "students") loadStudents();
    else if (activeTab === "questions") loadQuestions();
    else if (activeTab === "settings") loadExamSettings();
    else if (activeTab === "results") loadResults();
    else if (activeTab === "leaderboard") loadLeaderboard();
  }, [activeTab]);

  // Handle results search and filtering trigger
  useEffect(() => {
    if (activeTab === "results") {
      const delayDebounce = setTimeout(() => {
        loadResults();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [resultsSearch, resultsDegree, resultsCommunity]);

  // Handle leaderboard search and filtering trigger
  useEffect(() => {
    if (activeTab === "leaderboard") {
      const delayDebounce = setTimeout(() => {
        loadLeaderboard();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [leaderboardSearch, leaderboardDegree, leaderboardCommunity]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout animate-fade-in">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#f8fafc" }}>Periyar Entrance</h2>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Admin Panel</p>
        </div>
        
        <div className="admin-sidebar-menu">
          <div 
            className={`admin-menu-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={18} />
            Overview
          </div>
          <div 
            className={`admin-menu-item ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <Users size={18} />
            Students List
          </div>
          <div 
            className={`admin-menu-item ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            <BookOpen size={18} />
            Question Bank
          </div>
          <div 
            className={`admin-menu-item ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
          >
            <FileSpreadsheet size={18} />
            Results Management
          </div>
          <div 
            className={`admin-menu-item ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            <Trophy size={18} />
            Leaderboard Management
          </div>
          <div 
            className={`admin-menu-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} />
            Exam Settings
          </div>
        </div>

        <button 
          className="nav-btn-secondary" 
          onClick={handleLogout}
          style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="admin-main">
        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: "1.5rem" }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="spinner" style={{ marginTop: "5rem" }}></div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && stats && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Dashboard Overview</h1>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-val">{stats.totals.students}</span>
                      <span className="stat-lbl">Registered Students</span>
                    </div>
                    <div className="stat-icon-container icon-blue">
                      <Users size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-val">{stats.totals.submissions}</span>
                      <span className="stat-lbl">Submitted Exams</span>
                    </div>
                    <div className="stat-icon-container icon-green">
                      <CheckCircle size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-val">{stats.totals.active_attempts}</span>
                      <span className="stat-lbl">Active Attempts</span>
                    </div>
                    <div className="stat-icon-container icon-gold">
                      <Clock size={24} />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <span className="stat-val">{stats.totals.average_score}</span>
                      <span className="stat-lbl">Average Score</span>
                    </div>
                    <div className="stat-icon-container icon-red">
                      <Award size={24} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  <div className="dashboard-card">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.25rem", color: "var(--primary-dark)" }}>
                      Registrations by Degree
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {Object.entries(stats.by_degree).map(([degree, count]) => (
                        <div key={degree} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontWeight: "500" }}>{degree}</span>
                          <span className="badge badge-blue">{count} students</span>
                        </div>
                      ))}
                      {Object.keys(stats.by_degree).length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No registrations recorded.</p>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.25rem", color: "var(--primary-dark)" }}>
                      Registrations by Community
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {Object.entries(stats.by_community).map(([comm, count]) => (
                        <div key={comm} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontWeight: "500" }}>{comm}</span>
                          <span className="badge badge-gold">{count} students</span>
                        </div>
                      ))}
                      {Object.keys(stats.by_community).length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No registrations recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS LIST TAB */}
            {activeTab === "students" && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Student Management</h1>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Application No</th>
                        <th>Student Name</th>
                        <th>Degrees Applied</th>
                        <th>Community</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th style={{ textAlign: "right" }}>UG %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.application_number}>
                          <td style={{ fontWeight: "600", color: "var(--primary)" }}>{student.application_number}</td>
                          <td style={{ fontWeight: "500" }}>{student.name}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              {student.degrees ? student.degrees.map((d) => (
                                <span key={d} className="badge badge-blue" style={{ fontSize: "0.75rem" }}>
                                  {mapDegreeCode(d)}
                                </span>
                              )) : ""}
                            </div>
                          </td>
                          <td>{student.community}</td>
                          <td>{student.email}</td>
                          <td>{student.mobile}</td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>{student.ug_percentage}%</td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                            No student records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QUESTION BANK TAB */}
            {activeTab === "questions" && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Question Management ({questions.length})</h1>
                  <button className="btn btn-primary" onClick={handleOpenAddQuestion} style={{ width: "auto" }}>
                    <Plus size={18} /> Add Question
                  </button>
                </div>

                <div className="dashboard-card" style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1rem", color: "var(--primary-dark)" }}>
                    Bulk Upload Questions (Excel / CSV)
                  </h3>
                  <form onSubmit={handleExcelUpload} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="form-control"
                      style={{ flexGrow: "1" }}
                      required
                    />
                    <button type="submit" className="btn btn-secondary" disabled={actionLoading} style={{ width: "180px", display: "flex", gap: "0.5rem" }}>
                      <Upload size={16} /> Upload Questions
                    </button>
                  </form>
                  {uploadResult && (
                    <div style={{ marginTop: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                      <p style={{ fontWeight: "600", color: uploadResult.status === "success" ? "var(--success)" : "var(--accent)" }}>
                        Upload Complete: Added {uploadResult.added_count} questions.
                      </p>
                      {uploadResult.errors.length > 0 && (
                        <div style={{ marginTop: "0.5rem", maxHeight: "150px", overflowY: "auto" }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--danger)" }}>Row Errors:</p>
                          <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--danger)" }}>
                            {uploadResult.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th style={{ width: "40%" }}>Question</th>
                        <th>Options (A, B, C, D)</th>
                        <th>Correct</th>
                        <th style={{ textAlign: "right" }}>Marks</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id}>
                          <td>{q.id}</td>
                          <td style={{ fontWeight: "500", verticalAlign: "top" }}>
                            <div>{q.question_text}</div>
                            {q.image_url && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <img 
                                  src={q.image_url} 
                                  alt="Question diagram" 
                                  style={{ maxWidth: "150px", maxHeight: "80px", borderRadius: "4px", border: "1px solid var(--border)" }} 
                                />
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", verticalAlign: "top" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {[
                                { label: "A", val: q.option_a, img: q.option_a_image_url },
                                { label: "B", val: q.option_b, img: q.option_b_image_url },
                                { label: "C", val: q.option_c, img: q.option_c_image_url },
                                { label: "D", val: q.option_d, img: q.option_d_image_url },
                              ].map((opt) => (
                                <div key={opt.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <span style={{ fontWeight: "600" }}>{opt.label}:</span>
                                  {opt.val && <span>{opt.val}</span>}
                                  {opt.img && (
                                    <img 
                                      src={opt.img} 
                                      alt={`Opt ${opt.label}`} 
                                      style={{ height: "28px", objectFit: "contain", borderRadius: "2px", border: "1px solid var(--border)" }} 
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td><span className="badge badge-blue">{q.correct_option}</span></td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>{q.marks}</td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                              <button className="action-btn edit" onClick={() => handleOpenEditQuestion(q)}>
                                <Edit size={16} />
                              </button>
                              <button className="action-btn delete" onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {questions.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                            No questions uploaded yet. Start adding manually or upload Excel sheet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RESULTS MANAGEMENT TAB */}
            {activeTab === "results" && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Student Results Outcomes</h1>
                </div>

                {/* Filter and Search Bar */}
                <div className="filters-bar" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem" }}>
                  <div className="search-input-container">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search by Name or Application Number..."
                      value={resultsSearch}
                      onChange={(e) => setResultsSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-control filter-select"
                    value={resultsDegree}
                    onChange={(e) => setResultsDegree(e.target.value)}
                  >
                    <option value="All">All Degrees</option>
                    <option value="MCA">MCA</option>
                    <option value="MSC_CS">M.Sc Computer Science</option>
                    <option value="MSC_DS">M.Sc Data Science</option>
                  </select>

                  <select
                    className="form-control filter-select"
                    value={resultsCommunity}
                    onChange={(e) => setResultsCommunity(e.target.value)}
                  >
                    <option value="All">All Communities</option>
                    <option value="BC">BC</option>
                    <option value="MBC">MBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Application No</th>
                        <th>Student Name</th>
                        <th>Degrees Applied</th>
                        <th style={{ textAlign: "right" }}>Correct</th>
                        <th style={{ textAlign: "right" }}>Wrong</th>
                        <th style={{ textAlign: "right" }}>Score</th>
                        <th style={{ textAlign: "right" }}>UG %</th>
                        <th style={{ textAlign: "right" }}>Exam %</th>
                        <th style={{ textAlign: "right" }}>Final %</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.application_number}>
                          <td style={{ fontWeight: "600", color: "var(--primary)" }}>{r.application_number}</td>
                          <td style={{ fontWeight: "500" }}>{r.student_name}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              {r.degrees ? r.degrees.map((d) => (
                                <span key={d} className="badge badge-gray" style={{ fontSize: "0.75rem" }}>
                                  {mapDegreeCode(d)}
                                </span>
                              )) : ""}
                            </div>
                          </td>
                          <td style={{ textAlign: "right", color: "var(--success)" }}>{r.correct_answers}</td>
                          <td style={{ textAlign: "right", color: "var(--danger)" }}>{r.wrong_answers}</td>
                          <td style={{ textAlign: "right", fontWeight: "700" }}>{r.score}</td>
                          <td style={{ textAlign: "right" }}>{r.ug_percentage}%</td>
                          <td style={{ textAlign: "right" }}>{r.entrance_percentage}%</td>
                          <td style={{ textAlign: "right", fontWeight: "700", color: "var(--primary)" }}>{r.final_percentage}%</td>
                          <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ""}
                          </td>
                        </tr>
                      ))}
                      {results.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                            No results found matching search filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LEADERBOARD MANAGEMENT TAB (NEW) */}
            {activeTab === "leaderboard" && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Academic Leaderboard & Rankings</h1>
                  <button className="btn btn-primary" onClick={handleExportLeaderboard} style={{ width: "auto", display: "flex", gap: "0.5rem" }}>
                    <FileDown size={18} /> Export Leaderboard to Excel
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="filters-bar" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem" }}>
                  <div className="search-input-container">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search by Name or Application Number..."
                      value={leaderboardSearch}
                      onChange={(e) => setLeaderboardSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-control filter-select"
                    value={leaderboardDegree}
                    onChange={(e) => setLeaderboardDegree(e.target.value)}
                  >
                    <option value="All">All Degrees</option>
                    <option value="MCA">MCA</option>
                    <option value="MSC_CS">M.Sc Computer Science</option>
                    <option value="MSC_DS">M.Sc Data Science</option>
                  </select>

                  <select
                    className="form-control filter-select"
                    value={leaderboardCommunity}
                    onChange={(e) => setLeaderboardCommunity(e.target.value)}
                  >
                    <option value="All">All Communities</option>
                    <option value="BC">BC</option>
                    <option value="MBC">MBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }}>Rank</th>
                        <th>Application No</th>
                        <th>Student Name</th>
                        <th>Degrees Applied</th>
                        <th>Community</th>
                        <th style={{ textAlign: "right" }}>UG %</th>
                        <th style={{ textAlign: "right" }}>Exam %</th>
                        <th style={{ textAlign: "right" }}>Final %</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((r) => {
                        let rankBadgeClass = "rank-badge";
                        if (r.rank === 1) rankBadgeClass += " rank-1";
                        else if (r.rank === 2) rankBadgeClass += " rank-2";
                        else if (r.rank === 3) rankBadgeClass += " rank-3";

                        return (
                          <tr key={r.application_number}>
                            <td>
                              <span className={rankBadgeClass}>
                                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
                              </span>
                            </td>
                            <td style={{ fontWeight: "600", color: "var(--primary)" }}>{r.application_number}</td>
                            <td style={{ fontWeight: "500" }}>{r.student_name}</td>
                            <td>
                              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {r.degrees ? r.degrees.map((d) => (
                                  <span key={d} className="badge badge-blue" style={{ fontSize: "0.75rem" }}>
                                    {mapDegreeCode(d)}
                                  </span>
                                )) : ""}
                              </div>
                            </td>
                            <td><span className="badge badge-gray">{r.community}</span></td>
                            <td style={{ textAlign: "right" }}>{r.ug_percentage}%</td>
                            <td style={{ textAlign: "right" }}>{r.entrance_percentage}%</td>
                            <td style={{ textAlign: "right", fontWeight: "700", color: "var(--primary)" }}>{r.final_percentage}%</td>
                            <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ""}
                            </td>
                          </tr>
                        );
                      })}
                      {leaderboard.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                            No entries found matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EXAM CONFIGURATION SETTINGS TAB */}
            {activeTab === "settings" && (
              <div>
                <div className="admin-header">
                  <h1 className="admin-title">Exam Parameters</h1>
                </div>

                <div className="glass-card" style={{ maxWidth: "700px" }}>
                  <form onSubmit={handleSaveSettings}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="exam_name">Exam Name</label>
                      <input
                        className="form-control"
                        type="text"
                        id="exam_name"
                        value={examSettings.name}
                        onChange={(e) => setExamSettings({ ...examSettings, name: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="total_q">Total Questions</label>
                        <input
                          className="form-control"
                          type="number"
                          id="total_q"
                          value={examSettings.total_questions}
                          onChange={(e) => setExamSettings({ ...examSettings, total_questions: parseInt(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="duration">Duration (Minutes)</label>
                        <input
                          className="form-control"
                          type="number"
                          id="duration"
                          value={examSettings.duration_minutes}
                          onChange={(e) => setExamSettings({ ...examSettings, duration_minutes: parseInt(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="start_date">Start Date & Time</label>
                        <input
                          className="form-control"
                          type="datetime-local"
                          id="start_date"
                          value={examSettings.start_date}
                          onChange={(e) => setExamSettings({ ...examSettings, start_date: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="end_date">End Date & Time</label>
                        <input
                          className="form-control"
                          type="datetime-local"
                          id="end_date"
                          value={examSettings.end_date}
                          onChange={(e) => setExamSettings({ ...examSettings, end_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <input
                        type="checkbox"
                        id="visibility"
                        checked={examSettings.result_visibility}
                        onChange={(e) => setExamSettings({ ...examSettings, result_visibility: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <label htmlFor="visibility" style={{ fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}>
                        Make scores immediately visible to students upon submission
                      </label>
                    </div>

                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={actionLoading}
                      style={{ marginTop: "1rem", width: "200px" }}
                    >
                      {actionLoading ? "Saving..." : "Save Config Details"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual Question modal */}
      {questionModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{questionModal.editId ? "Edit Question" : "Create New Question"}</h3>
              <button className="modal-close" onClick={() => setQuestionModal({ show: false, editId: null })}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Question Image / Diagram (Optional)</label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], "image_url")}
                      className="form-control"
                      style={{ flexGrow: "1" }}
                    />
                    {questionForm.image_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img
                          src={questionForm.image_url}
                          alt="Preview"
                          style={{ height: "40px", objectFit: "contain", borderRadius: "4px", border: "1px solid var(--border)" }}
                        />
                        <button
                          type="button"
                          onClick={() => setQuestionForm({ ...questionForm, image_url: "" })}
                          className="btn btn-secondary"
                          style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--danger)" }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label className="form-label">Option A</label>
                    <input
                      className="form-control"
                      type="text"
                      value={questionForm.option_a}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                      required
                    />
                    <label style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)", marginTop: "0.25rem" }}>Option A Image (Optional)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], "option_a_image_url")}
                        className="form-control"
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", flexGrow: "1" }}
                      />
                      {questionForm.option_a_image_url && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <img
                            src={questionForm.option_a_image_url}
                            alt="Preview A"
                            style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid var(--border)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionForm({ ...questionForm, option_a_image_url: "" })}
                            className="action-btn delete"
                            style={{ padding: "0.2rem" }}
                            title="Remove Image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label className="form-label">Option B</label>
                    <input
                      className="form-control"
                      type="text"
                      value={questionForm.option_b}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                      required
                    />
                    <label style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)", marginTop: "0.25rem" }}>Option B Image (Optional)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], "option_b_image_url")}
                        className="form-control"
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", flexGrow: "1" }}
                      />
                      {questionForm.option_b_image_url && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <img
                            src={questionForm.option_b_image_url}
                            alt="Preview B"
                            style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid var(--border)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionForm({ ...questionForm, option_b_image_url: "" })}
                            className="action-btn delete"
                            style={{ padding: "0.2rem" }}
                            title="Remove Image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label className="form-label">Option C</label>
                    <input
                      className="form-control"
                      type="text"
                      value={questionForm.option_c}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                      required
                    />
                    <label style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)", marginTop: "0.25rem" }}>Option C Image (Optional)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], "option_c_image_url")}
                        className="form-control"
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", flexGrow: "1" }}
                      />
                      {questionForm.option_c_image_url && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <img
                            src={questionForm.option_c_image_url}
                            alt="Preview C"
                            style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid var(--border)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionForm({ ...questionForm, option_c_image_url: "" })}
                            className="action-btn delete"
                            style={{ padding: "0.2rem" }}
                            title="Remove Image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label className="form-label">Option D</label>
                    <input
                      className="form-control"
                      type="text"
                      value={questionForm.option_d}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                      required
                    />
                    <label style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)", marginTop: "0.25rem" }}>Option D Image (Optional)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], "option_d_image_url")}
                        className="form-control"
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", flexGrow: "1" }}
                      />
                      {questionForm.option_d_image_url && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <img
                            src={questionForm.option_d_image_url}
                            alt="Preview D"
                            style={{ height: "30px", objectFit: "contain", borderRadius: "2px", border: "1px solid var(--border)" }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionForm({ ...questionForm, option_d_image_url: "" })}
                            className="action-btn delete"
                            style={{ padding: "0.2rem" }}
                            title="Remove Image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Correct Answer Option</label>
                    <select
                      className="form-control form-select"
                      value={questionForm.correct_option}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}
                      required
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marks Allocated</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setQuestionModal({ show: false, editId: null })}
                  style={{ width: "100px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ width: "130px" }}
                >
                  {actionLoading ? "Saving..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
