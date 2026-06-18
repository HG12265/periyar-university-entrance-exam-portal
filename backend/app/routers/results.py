import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import ExamAttempt, Student, StudentDegree, Admin
from app.schemas import LeaderboardEntry
from app.auth import get_current_admin

router = APIRouter(prefix="/api/v1/results", tags=["Results & Leaderboard"])

# Mapping from request query to database string representation
DEGREE_MAP = {
    "MCA": "MCA",
    "MSC_CS": "MSC_CS",
    "MSC_DS": "MSC_DS",
    "M.Sc Computer Science": "MSC_CS",
    "M.Sc Data Science": "MSC_DS"
}

def get_globally_ranked_attempts(
    db: Session, 
    degree_filter: Optional[str] = None, 
    community_filter: Optional[str] = None,
    search: Optional[str] = None
):
    # Fetch all submitted attempts, ordered by score descending
    all_attempts = db.query(ExamAttempt, Student).join(
        Student, ExamAttempt.student_id == Student.id
    ).filter(
        ExamAttempt.is_submitted == True
    ).order_by(
        ExamAttempt.score.desc()
    ).all()
    
    # Calculate global ranks (Standard Competition Ranking)
    ranked_list = []
    current_rank = 1
    for idx, (attempt, student) in enumerate(all_attempts):
        if idx > 0 and attempt.score < all_attempts[idx - 1][0].score:
            current_rank = idx + 1
            
        degrees = [d.degree for d in student.degrees]
        
        ranked_list.append({
            "rank": current_rank,
            "id": attempt.id,
            "application_number": student.application_number,
            "student_name": student.name,
            "degrees": degrees,
            "community": student.community,
            "email": student.email,
            "mobile": student.mobile,
            "ug_percentage": student.ug_percentage,
            "score": attempt.score,
            "percentage": attempt.percentage,
            "correct_answers": attempt.correct_answers,
            "wrong_answers": attempt.wrong_answers,
            "total_questions": attempt.total_questions,
            "submitted_at": attempt.submitted_at
        })
        
    # Apply filters in Python memory to keep ranking logic global and clean
    filtered_list = ranked_list
    
    if degree_filter and degree_filter != "All":
        target_deg = DEGREE_MAP.get(degree_filter, degree_filter).upper()
        filtered_list = [item for item in filtered_list if any(target_deg in d.upper() for d in item["degrees"])]
        
    if community_filter and community_filter != "All":
        target_comm = community_filter.lower()
        if target_comm == "oc":
            filtered_list = [
                item for item in filtered_list
                if item["community"].lower() in ["oc", "open category", "open", "general", "unreserved", "ur"]
                or item["community"].lower().startswith("oc")
            ]
        elif target_comm == "bc":
            filtered_list = [
                item for item in filtered_list
                if item["community"].lower().startswith("bc") or item["community"].lower().startswith("obc")
            ]
        elif target_comm == "mbc":
            filtered_list = [
                item for item in filtered_list
                if item["community"].lower().startswith("mbc") or item["community"].lower().startswith("dnc")
            ]
        elif target_comm == "sc":
            filtered_list = [
                item for item in filtered_list
                if item["community"].lower().startswith("sc")
            ]
        elif target_comm == "st":
            filtered_list = [
                item for item in filtered_list
                if item["community"].lower().startswith("st")
            ]
        else:
            filtered_list = [
                item for item in filtered_list
                if target_comm in item["community"].lower()
            ]
        
    if search:
        search = search.lower()
        filtered_list = [
            item for item in filtered_list 
            if search in item["student_name"].lower() or search in item["application_number"].lower()
        ]
        
    return filtered_list

@router.get("", response_model=List[dict])
def get_results(
    search: Optional[str] = Query(None),
    degree: Optional[str] = Query(None),
    community: Optional[str] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return get_globally_ranked_attempts(db, degree_filter=degree, community_filter=community, search=search)

@router.get("/export")
def export_results_excel(
    search: Optional[str] = Query(None),
    degree: Optional[str] = Query(None),
    community: Optional[str] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    results = get_globally_ranked_attempts(db, degree_filter=degree, community_filter=community, search=search)
    
    export_data = []
    for r in results:
        # Format degrees list as a comma separated string for Excel sheet
        deg_str = ", ".join(r["degrees"])
        
        export_data.append({
            "Rank": r["rank"],
            "Application Number": r["application_number"],
            "Student Name": r["student_name"],
            "Degrees Applied": deg_str,
            "Community": r["community"],
            "Email": r["email"],
            "Mobile": r["mobile"],
            "UG %": r["ug_percentage"],
            "Total Questions": r["total_questions"],
            "Correct Answers": r["correct_answers"],
            "Wrong Answers": r["wrong_answers"],
            "Marks Obtained": r["score"],
            "Exam Percentage": r["percentage"],
            "Submitted At": r["submitted_at"].strftime("%Y-%m-%d %H:%M:%S") if r["submitted_at"] else ""
        })
        
    df = pd.DataFrame(export_data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Entrance Exam Results")
    output.seek(0)
    
    filename = "Periyar_Entrance_Exam_Results.xlsx"
    if degree:
        filename = f"Results_{degree.replace(' ', '_')}.xlsx"
        
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        output,
        headers=headers,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    degree: Optional[str] = Query(None),
    community: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Restricted to Admin only as requested
    results = get_globally_ranked_attempts(db, degree_filter=degree, community_filter=community, search=search)
    
    leaderboard = []
    for r in results:
        leaderboard.append({
            "rank": r["rank"],
            "application_number": r["application_number"],
            "student_name": r["student_name"],
            "degrees": r["degrees"],
            "community": r["community"],
            "marks": r["score"],
            "percentage": r["percentage"],
            "submitted_at": r["submitted_at"]
        })
        
    return leaderboard
