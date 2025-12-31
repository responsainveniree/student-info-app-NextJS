// Shared constants for account creation forms

export const grades = ["TENTH", "ELEVENTH", "TWELFTH"] as const;
export const majors = ["SOFTWARE_ENGINEERING", "ACCOUNTING"] as const;
export const classNumbers = ["none", "1", "2"] as const;
export const studentRoles = ["STUDENT", "CLASS_SECRETARY"] as const;

export const gradeLabels: Record<string, string> = {
    TENTH: "Grade 10",
    ELEVENTH: "Grade 11",
    TWELFTH: "Grade 12",
};

export const majorLabels: Record<string, string> = {
    SOFTWARE_ENGINEERING: "Software Engineering",
    ACCOUNTING: "Accounting",
};

export const roleLabels: Record<string, string> = {
    STUDENT: "Student",
    CLASS_SECRETARY: "Class Secretary",
};

export const subjectLabels: Record<string, string> = {
    fundamentals_of_fluency_swe: "Fundamentals of Fluency SWE",
    fundamentals_of_fluency_accounting: "Fundamentals of Fluency Accounting",
    english: "English",
    civic_education: "Civic Education",
    math: "Mathematics",
    religion: "Religion",
    physical_education: "Physical Education",
    information_technology: "Information Technology",
    indonesian: "Indonesian",
    art: "Art",
    conversation: "Conversation",
    history: "History",
    fundamentals_of_science_and_social: "Fundamentals of Science & Social",
    mandarin: "Mandarin",
    ap: "Accounting Principles",
    creative_entrepreneurial_products_swe: "Creative Entrepreneurial Products SWE",
    creative_entrepreneurial_products_accounting: "Creative Entrepreneurial Products Accounting",
    pal: "PAL",
    computerized_accounting: "Computerized Accounting",
    financial_accounting: "Financial Accounting",
    banking: "Banking",
    microsoft: "Microsoft Office",
    taxation: "Taxation",
    web: "Web Development",
    database: "Database",
    oop: "Object Oriented Programming",
    mobile: "Mobile Development",
};
