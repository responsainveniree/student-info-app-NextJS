"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { ChangeEvent, ErrorInfo, FormEvent, useState } from "react";
import axios from "axios";
import {
  Upload,
  UserPlus,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { subjects, subjectCategories } from "@/lib/utils/subjects";

const grades = ["tenth", "eleventh", "twelfth"];
const majors = ["softwareEngineering", "accounting"];
const classNumbers = ["1", "2"];

// Get all unique subjects from the subjects config
const getAllSubjects = () => {
  const allSubjects = new Set<string>();
  Object.values(subjects).forEach((gradeData) => {
    Object.values(gradeData.major).forEach((subjectList) => {
      subjectList.forEach((subject) => allSubjects.add(subject));
    });
  });
  return Array.from(allSubjects).sort();
};

type GroupedSubjects = Record<string, string[]>;

const groupSubjects = (subjectKeys: string[]): GroupedSubjects => {
  const grouped: GroupedSubjects = {
    general: [],
    accounting: [],
    software_engineering: [],
  };

  const sweKeys = new Set(subjectCategories.software_engineering);
  const accountingKeys = new Set(subjectCategories.accounting);

  subjectKeys.forEach((key) => {
    if (sweKeys.has(key)) {
      grouped.software_engineering.push(key);
    } else if (accountingKeys.has(key)) {
      grouped.accounting.push(key);
    } else {
      grouped.general.push(key);
    }
  });

  return grouped;
};

interface TeachingAssignment {
  subjectName: string;
  grade: string;
  major: string;
  classNumber: string;
}

interface TeachingClass {
  grade: string;
  major: string;
  classNumber: string;
}

const CreateTeacherAccount = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Homeroom Class
  const [homeroomClass, setHomeroomClass] = useState({
    grade: "",
    major: "",
    classNumber: "none",
  });

  // Teaching Classes - multiple
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);

  // Teaching Assignments - multiple
  const [teachingAssignments, setTeachingAssignments] = useState<
    TeachingAssignment[]
  >([{ subjectName: "", grade: "", major: "", classNumber: "" }]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // Add new teaching class
  const addTeachingClass = () => {
    setTeachingClasses([
      ...teachingClasses,
      { grade: "", major: "", classNumber: "" },
    ]);
  };

  // Remove teaching class
  const removeTeachingClass = (index: number) => {
    setTeachingClasses(teachingClasses.filter((_, i) => i !== index));
  };

  // Update teaching class
  const updateTeachingClass = (
    index: number,
    field: keyof TeachingClass,
    value: string
  ) => {
    const updated = [...teachingClasses];
    updated[index][field] = value;
    setTeachingClasses(updated);
  };

  // Add new teaching assignment
  const addTeachingAssignment = () => {
    setTeachingAssignments([
      ...teachingAssignments,
      { subjectName: "", grade: "", major: "", classNumber: "" },
    ]);
  };

  // Remove teaching assignment
  const removeTeachingAssignment = (index: number) => {
    setTeachingAssignments(teachingAssignments.filter((_, i) => i !== index));
  };

  // Update teaching assignment
  const updateTeachingAssignment = (
    index: number,
    field: keyof TeachingAssignment,
    value: string
  ) => {
    const updated = [...teachingAssignments];
    updated[index][field] = value;
    setTeachingAssignments(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Filter out empty teaching assignments
      const validAssignments = teachingAssignments.filter(
        (ta) => ta.subjectName && ta.grade && ta.major
      );

      // Filter out empty teaching classes
      const validClasses = teachingClasses.filter((tc) => tc.grade && tc.major);

      const payload = {
        ...data,
        homeroomClass:
          homeroomClass.grade && homeroomClass.major
            ? homeroomClass
            : undefined,
        teachingClasses: validClasses.length > 0 ? validClasses : undefined,
        teachingAssignment:
          validAssignments.length > 0 ? validAssignments : undefined,
      };

      const res = await axios.post("/api/auth/create-teacher-account", payload);
      if (res.status === 201) {
        toast.success("Teacher account created successfully!");

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred, try again");
      toast.error("Something went wrong. Read the message above.");
    } finally {
      setLoading(false);
    }
  };

  const gradeLabels: Record<string, string> = {
    tenth: "Grade 10",
    eleventh: "Grade 11",
    twelfth: "Grade 12",
  };

  const majorLabels: Record<string, string> = {
    softwareEngineering: "Software Engineering",
    accounting: "Accounting",
  };

  const subjectLabels: Record<string, string> = {
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
    creative_entrepreneurial_products_swe:
      "Creative Entrepreneurial Products SWE",
    creative_entrepreneurial_products_accounting:
      "Creative Entrepreneurial Products Accounting",
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

  const availableSubjects = getAllSubjects();

  const sortedAndGroupedSubjects = groupSubjects(availableSubjects);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <GraduationCap className="w-12 h-12 mr-3" />
              <h1 className="text-3xl font-bold">Teacher Registration</h1>
            </div>
          </div>

          <div className="p-8">
            {/* Excel Upload Section */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-4 shadow-lg">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Quick Import
                </h2>
                <p className="text-gray-600">
                  Upload Excel file for bulk teacher registration
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white hover:border-green-400 transition-all duration-300">
                  <label
                    htmlFor="excel-file"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-800 mb-2">
                      {uploadedFile || "Click to upload Excel file"}
                    </span>
                    <span className="text-sm text-gray-500">
                      Supported formats: .xlsx, .xls (Max 5MB)
                    </span>
                  </label>
                  <input
                    id="excel-file"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file.name);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Or Register Manually
                </span>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white mb-4 shadow-lg">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Personal Information
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Username <span className="ml-2 text-red-500">*</span>
                    </label>
                    <Input
                      name="username"
                      placeholder="Enter your username"
                      type="text"
                      minLength={3}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Email Address
                      <span className="ml-2 text-red-500">*</span>
                    </label>
                    <Input
                      name="email"
                      placeholder="your.email@example.com"
                      type="email"
                      required
                      disabled={loading}
                      onChange={handleChange}
                      className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Password
                      <span className="ml-2 text-red-500">*</span>
                    </label>
                    <Input
                      name="password"
                      placeholder="Minimum 8 characters"
                      type="password"
                      minLength={8}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Confirm Password
                      <span className="ml-2 text-red-500">*</span>
                    </label>
                    <Input
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      type="password"
                      minLength={8}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Homeroom Class */}
              <div className="border-t-2 border-gray-200 pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    Homeroom Class (Optional)
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Select if you are a homeroom teacher
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Grade
                    </label>
                    <Select
                      onValueChange={(v) =>
                        setHomeroomClass({ ...homeroomClass, grade: v })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g}>
                            {gradeLabels[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Major
                    </label>
                    <Select
                      onValueChange={(v) =>
                        setHomeroomClass({ ...homeroomClass, major: v })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="Select major" />
                      </SelectTrigger>
                      <SelectContent>
                        {majors.map((m) => (
                          <SelectItem key={m} value={m}>
                            {majorLabels[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Class Number
                    </label>
                    <Select
                      onValueChange={(v) =>
                        setHomeroomClass({ ...homeroomClass, classNumber: v })
                      }
                      disabled={loading}
                      value={homeroomClass.classNumber}
                    >
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {classNumbers.map((num) => (
                          <SelectItem key={num} value={num}>
                            Class {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Teaching Classes */}
              <div className="border-t-2 border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Teaching Classes (Optional)
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Classes you teach (can add multiple)
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addTeachingClass}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </div>

                <div className="space-y-4">
                  {teachingClasses.map((tc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-700">
                          Class #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeachingClass(index)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "grade", v)
                          }
                          disabled={loading}
                          value={tc.grade}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g} value={g}>
                                {gradeLabels[g]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "major", v)
                          }
                          disabled={loading}
                          value={tc.major}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            {majors.map((m) => (
                              <SelectItem key={m} value={m}>
                                {majorLabels[m]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "classNumber", v)
                          }
                          disabled={loading}
                          value={tc.classNumber}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {classNumbers.map((num) => (
                              <SelectItem key={num} value={num}>
                                Class {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  {teachingClasses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No teaching classes added yet. Click "Add Class" to add
                      one.
                    </div>
                  )}
                </div>
              </div>

              {/* Teaching Assignments */}
              <div className="border-t-2 border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Teaching Assignments (Optional)
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Subject and class combinations you teach
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addTeachingAssignment}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </Button>
                </div>

                <div className="space-y-4">
                  {teachingAssignments.map((ta, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="font-semibold text-gray-700">
                            Assignment #{index + 1}
                          </span>
                        </div>
                        {teachingAssignments.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeTeachingAssignment(index)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Subject
                          </label>
                          <Select
                            onValueChange={(v) =>
                              updateTeachingAssignment(index, "subjectName", v)
                            }
                            disabled={loading}
                            value={ta.subjectName}
                          >
                            <SelectTrigger className="h-12 bg-white">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(sortedAndGroupedSubjects).map(
                                ([categoryName, subjectKeysArray]) => (
                                  <SelectGroup key={categoryName}>
                                    <SelectLabel>
                                      {categoryName === "general"
                                        ? "General Subjects"
                                        : categoryName === "accounting"
                                        ? "Accounting Subjects"
                                        : "Software Engineering Subjects"}
                                    </SelectLabel>
                                    {subjectKeysArray.map(
                                      (subjectKey: string) => (
                                        <SelectItem
                                          key={subjectKey}
                                          value={subjectKey}
                                        >
                                          {subjectLabels[subjectKey]}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectGroup>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <Select
                          onValueChange={(v) =>
                            updateTeachingAssignment(index, "grade", v)
                          }
                          disabled={loading}
                          value={ta.grade}
                        >
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g} value={g}>
                                {gradeLabels[g]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingAssignment(index, "major", v)
                          }
                          disabled={loading}
                          value={ta.major}
                        >
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            {majors.map((m) => (
                              <SelectItem key={m} value={m}>
                                {majorLabels[m]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingAssignment(index, "classNumber", v)
                          }
                          disabled={loading}
                          value={ta.classNumber}
                        >
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {classNumbers.map((num) => (
                              <SelectItem key={num} value={num}>
                                Class {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  className="w-full h-14 bg-gradient-to-r from-[#FBBF24] to-[#ffbc12] hover:from-[#FBBF24] hover:to-[#fdb808] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Teacher Account
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeacherAccount;
