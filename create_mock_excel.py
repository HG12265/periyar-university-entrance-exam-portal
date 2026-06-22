import pandas as pd

data = [
    {
        "Degree": "MCA",
        "Course": "Master of Computer Applications",
        "Application No.": "PU2026MCA1001",
        "Student Name": "Ramesh Kumar",
        "Community": "BC",
        "Quota": "General",
        "E-mail": "ramesh@gmail.com",
        "Mobile No.": "9876543210",
        "Percentage(%)": "85.5"
    },
    {
        "Degree": "Data Science",
        "Course": "M.Sc Data Science",
        "Application No.": "PU2026DS2001",
        "Student Name": "Ramesh Kumar",
        "Community": "BC",
        "Quota": "General",
        "E-mail": "ramesh@gmail.com",
        "Mobile No.": "9876543210",
        "Percentage(%)": "85.5"
    },
    {
        "Degree": "Computer Science",
        "Course": "M.Sc Computer Science",
        "Application No.": "PU2026CS3001",
        "Student Name": "Karthik Raja",
        "Community": "MBC",
        "Quota": "General",
        "E-mail": "karthik@gmail.com",
        "Mobile No.": "9443322110",
        "Percentage(%)": "78.2"
    }
]

df = pd.DataFrame(data)
df.to_excel("students_mock.xlsx", index=False)
print("students_mock.xlsx generated successfully!")
