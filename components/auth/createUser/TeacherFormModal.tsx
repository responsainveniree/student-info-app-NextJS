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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangeEvent, FormEvent, useState, useRef, useEffect } from "react";
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
import { Spinner } from "../../ui/spinner";
import { Eye, EyeOff, Eraser } from "lucide-react";
import {
  GRADE_DISPLAY_MAP,
  MAJOR_DISPLAY_MAP,
  SUBJECT_DISPLAY_MAP,
} from "@/lib/utils/labels";

import {
  GRADES,
  MAJORS,
  ClassNumber,
  CLASSNUMBERS,
} from "@/lib/constants/class";

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

  const sweKeys = new Set(subjectCategories.SOFTWARE_ENGINEERING);
  const accountingKeys = new Set(subjectCategories.ACCOUNTING);

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

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeacherFormModal = ({ open, onOpenChange }: TeacherFormModalProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    classNumber: "",
  });

  // Teaching Classes - multiple
  const [teachingClasses, setTeachingClasses] = useState<TeachingClass[]>([]);

  // Teaching Assignments - multiple
  const [teachingAssignments, setTeachingAssignments] = useState<
    TeachingAssignment[]
  >([]);

  const [uploadLoading, setUploadLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setData({ username: "", email: "", password: "", confirmPassword: "" });
      setHomeroomClass({ grade: "", major: "", classNumber: "" });
      setTeachingClasses([]);
      setTeachingAssignments([]);
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const clearHomeroomClass = () => {
    setHomeroomClass({ grade: "", major: "", classNumber: "" });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const addTeachingClass = () => {
    setTeachingClasses([
      ...teachingClasses,
      { grade: "", major: "", classNumber: "" },
    ]);
  };

  const removeTeachingClass = (index: number) => {
    setTeachingClasses(teachingClasses.filter((_, i) => i !== index));
  };

  const updateTeachingClass = (
    index: number,
    field: keyof TeachingClass,
    value: string,
  ) => {
    const updated = [...teachingClasses];
    updated[index][field] = value;
    setTeachingClasses(updated);
  };

  const addTeachingAssignment = () => {
    setTeachingAssignments([
      ...teachingAssignments,
      { subjectName: "", grade: "", major: "", classNumber: "" },
    ]);
  };

  const removeTeachingAssignment = (index: number) => {
    setTeachingAssignments(teachingAssignments.filter((_, i) => i !== index));
  };

  const updateTeachingAssignment = (
    index: number,
    field: keyof TeachingAssignment,
    value: string,
  ) => {
    const updated = [...teachingAssignments];
    updated[index][field] = value;
    setTeachingAssignments(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const validTeachingAssignments = teachingAssignments.filter(
      (ta) => ta.subjectName && ta.grade && ta.major,
    );

    const validTeachingClasses = teachingClasses.filter(
      (tc) => tc.grade && tc.major,
    );

    if (validTeachingAssignments.length !== teachingAssignments.length) {
      setError(
        "Please complete all teaching assignments or remove incomplete ones",
      );
      toast.error(
        "Please complete all teaching assignments or remove incomplete ones",
      );
      return;
    }

    if (validTeachingClasses.length !== teachingClasses.length) {
      setError(
        "Please complete all teaching classes or remove incomplete ones",
      );
      toast.error(
        "Please complete all teaching classes or remove incomplete ones",
      );
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        homeroomClass:
          homeroomClass.grade && homeroomClass.major
            ? homeroomClass
            : undefined,
        teachingClasses:
          validTeachingClasses.length > 0 ? validTeachingClasses : undefined,
        teachingAssignment:
          validTeachingAssignments.length > 0
            ? validTeachingAssignments
            : undefined,
      };

      const res = await axios.post(
        "/api/auth/account/single/teacher-account",
        payload,
      );
      if (res.status === 201) {
        toast.success("Teacher account created successfully!");
        setTimeout(() => {
          setData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
          setHomeroomClass({ grade: "", major: "", classNumber: "" });
          setTeachingClasses([]);
          setTeachingAssignments([]);
          setError("");
          setShowPassword(false);
          setShowConfirmPassword(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred, try again");
      toast.error("Something went wrong. Read the message above.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file.name);
    setUploadLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "/api/auth/account/bulk/teacher-accounts",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.status === 200) {
        toast.success(res.data.message);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to upload file";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploadLoading(false);
      if (fileRef.current) fileRef.current.value = "";
      setUploadedFile("");
    }
  };

  const availableSubjects = getAllSubjects();
  const sortedAndGroupedSubjects = groupSubjects(availableSubjects);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {uploadLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="w-8 h-8" />
              Teacher Registration
            </DialogTitle>
          </DialogHeader>

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

          <div className="space-y-6">
            {/* Excel Upload Section */}
            <div className="border rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-3 shadow-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Quick Import
                </h3>
                <p className="text-gray-600 text-sm">
                  Upload Excel file for bulk registration
                </p>
              </div>

              <div className="relative group">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-400 transition-all text-center">
                  <label
                    htmlFor="teacher-excel-file"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-semibold text-gray-800">
                      {uploadedFile || "Click to upload Excel file"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Supported: .xlsx, .xls
                    </span>
                  </label>
                  <input
                    ref={fileRef}
                    id="teacher-excel-file"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm font-semibold text-gray-500 uppercase">
                  Or Register Manually
                </span>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Personal Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="username"
                      placeholder="Enter username"
                      type="text"
                      minLength={3}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      value={data.username}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="email"
                      placeholder="your.email@example.com"
                      type="email"
                      required
                      disabled={loading}
                      onChange={handleChange}
                      value={data.email}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        name="password"
                        placeholder="Minimum 8 characters"
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        required
                        disabled={loading}
                        onChange={handleChange}
                        value={data.password}
                        className="h-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"
                        placeholder="Re-enter password"
                        type={showConfirmPassword ? "text" : "password"}
                        minLength={8}
                        required
                        disabled={loading}
                        onChange={handleChange}
                        value={data.confirmPassword}
                        className="h-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Homeroom Class */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Homeroom Class (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={clearHomeroomClass}
                  >
                    <Eraser className="w-4 h-4 mr-1" /> Clear
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Select
                    onValueChange={(v) =>
                      setHomeroomClass({ ...homeroomClass, grade: v })
                    }
                    value={homeroomClass.grade}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GRADE_DISPLAY_MAP[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(v) =>
                      setHomeroomClass({ ...homeroomClass, major: v })
                    }
                    value={homeroomClass.major}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select major" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJORS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MAJOR_DISPLAY_MAP[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(v) =>
                      setHomeroomClass({ ...homeroomClass, classNumber: v })
                    }
                    value={homeroomClass.classNumber}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSNUMBERS.map((num) => (
                        <SelectItem key={num} value={num}>
                          {num === "none" ? "None" : `Class ${num}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teaching Classes */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Teaching Classes (Optional)
                  </h3>
                  <Button
                    type="button"
                    onClick={addTeachingClass}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Class
                  </Button>
                </div>

                <div className="space-y-3">
                  {teachingClasses.map((tc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg border"
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

                      <div className="grid md:grid-cols-3 gap-3">
                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "grade", v)
                          }
                          value={tc.grade}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map((g) => (
                              <SelectItem key={g} value={g}>
                                {GRADE_DISPLAY_MAP[g]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "major", v)
                          }
                          value={tc.major}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select major" />
                          </SelectTrigger>
                          <SelectContent>
                            {MAJORS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {MAJOR_DISPLAY_MAP[m]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(v) =>
                            updateTeachingClass(index, "classNumber", v)
                          }
                          value={tc.classNumber}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASSNUMBERS.map((num) => (
                              <SelectItem key={num} value={num}>
                                {num === "none" ? "None" : `Class ${num}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  {teachingClasses.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No teaching classes added. Click "Add Class" to add one.
                    </p>
                  )}
                </div>
              </div>

              {/* Teaching Assignments */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Teaching Assignments (Optional)
                  </h3>
                  <Button
                    type="button"
                    onClick={addTeachingAssignment}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Assignment
                  </Button>
                </div>

                <div className="space-y-3">
                  {teachingAssignments.map((ta, index) => (
                    <div
                      key={index}
                      className="bg-purple-50 p-4 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="font-semibold text-gray-700">
                            Assignment #{index + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeachingAssignment(index)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Select
                          onValueChange={(v) =>
                            updateTeachingAssignment(index, "subjectName", v)
                          }
                          value={ta.subjectName}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-11 bg-white">
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
                                        {SUBJECT_DISPLAY_MAP[subjectKey]}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectGroup>
                              ),
                            )}
                          </SelectContent>
                        </Select>

                        <div className="grid md:grid-cols-3 gap-3">
                          <Select
                            onValueChange={(v) =>
                              updateTeachingAssignment(index, "grade", v)
                            }
                            value={ta.grade}
                            disabled={loading}
                          >
                            <SelectTrigger className="h-11 bg-white">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADES.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {GRADE_DISPLAY_MAP[g]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            onValueChange={(v) =>
                              updateTeachingAssignment(index, "major", v)
                            }
                            value={ta.major}
                            disabled={loading}
                          >
                            <SelectTrigger className="h-11 bg-white">
                              <SelectValue placeholder="Select major" />
                            </SelectTrigger>
                            <SelectContent>
                              {MAJORS.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {MAJOR_DISPLAY_MAP[m]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            onValueChange={(v) =>
                              updateTeachingAssignment(index, "classNumber", v)
                            }
                            value={ta.classNumber}
                            disabled={loading}
                          >
                            <SelectTrigger className="h-11 bg-white">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {CLASSNUMBERS.map((num) => (
                                <SelectItem key={num} value={num}>
                                  {num === "none" ? "None" : `Class ${num}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {teachingAssignments.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      No teaching assignments added. Click "Add Assignment" to
                      add one.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg rounded-xl shadow-lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
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
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Teacher Account
                  </span>
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherFormModal;
