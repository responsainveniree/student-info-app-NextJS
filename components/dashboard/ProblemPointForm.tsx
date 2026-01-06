"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { GRADES, MAJORS, CLASSNUMBERS } from "@/lib/constants/class";
import { GRADE_DISPLAY_MAP, MAJOR_DISPLAY_MAP } from "@/lib/utils/labels";

import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

const CATEGORIES = [
  "LATE",
  "INCOMPLETE_ATTRIBUTES",
  "DISCIPLINE",
  "ACADEMIC",
  "SOCIAL",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  LATE: "Late",
  INCOMPLETE_ATTRIBUTES: "Incomplete Attributes",
  DISCIPLINE: "Discipline",
  ACADEMIC: "Academic",
  SOCIAL: "Social",
  OTHER: "Other",
};

export default function ProblemPointForm({ session }: { session: any }) {
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Class Selection State
  const [selectedClass, setSelectedClass] = useState({
    grade: "",
    major: "",
    classNumber: "",
  });

  // Form State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: "",
    point: "",
    description: "",
    date: new Date().toISOString().split("T")[0], // Default to today
  });

  const isClassSelected =
    selectedClass.grade && selectedClass.major && selectedClass.classNumber;

  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);

  // Fetch students when class selection or page changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isClassSelected) return;

      setFetchingStudents(true);
      // Only reset students on class change, not page change
      if (currentPage === 0) {
        setStudents([]);
        setSelectedStudentIds([]);
      }

      try {
        const { grade, major, classNumber } = selectedClass;
        const res = await axios.get(`/api/student`, {
          params: {
            grade,
            major,
            classNumber,
            page: currentPage,
          },
        });
        if (res.data) {
          setStudents(res.data.students || []);
          setTotalStudents(res.data.totalStudents || 0);
        }
      } catch (error) {
        console.error("Error fetching students", error);
        toast.error("Failed to fetch students");
        setStudents([]);
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, [
    selectedClass.grade,
    selectedClass.major,
    selectedClass.classNumber,
    isClassSelected,
    currentPage,
  ]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        teacherId: session.user.id,
        studentsId: selectedStudentIds,
        problemPointCategory: formData.category,
        point: Number(formData.point),
        description: formData.description,
        date: formData.date,
      };

      const res = await axios.post("/api/problem-point", payload);

      if (res.status === 201) {
        toast.success("Problem points recorded successfully");
        // Reset form but keep class selection? Or reset all?
        // Usually better to keep class selection for rapid entry.
        // But let's clear details.
        setFormData({
          category: "",
          point: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        setSelectedStudentIds([]);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Class Selection Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          1. Select Class
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={selectedClass.grade}
            onValueChange={(val) =>
              setSelectedClass({ ...selectedClass, grade: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Grade" />
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
            value={selectedClass.major}
            onValueChange={(val) =>
              setSelectedClass({ ...selectedClass, major: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Major" />
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
            value={selectedClass.classNumber}
            onValueChange={(val) =>
              setSelectedClass({ ...selectedClass, classNumber: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Class Number" />
            </SelectTrigger>
            <SelectContent>
              {CLASSNUMBERS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "none" ? "None" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Section - Locked until class selected */}
      <div
        className={`transition-opacity duration-300 ${!isClassSelected ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Student Selection */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              2. Select Students
            </h2>
            {fetchingStudents ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedStudentIds.length === students.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                  {students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-colors ${isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "hover:bg-gray-50 border-gray-200"
                          }`}
                      >
                        <span className="font-medium truncate mr-2">
                          {student.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <p className="text-sm text-gray-500">
                    {selectedStudentIds.length} students selected (showing {students.length} of {totalStudents})
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentPage === 0 || fetchingStudents}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-sm font-medium text-gray-700 px-2">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage >= totalPages - 1 || fetchingStudents}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                {isClassSelected
                  ? "No students found in this class."
                  : "Select a class to see students."}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              3. Problem Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData({ ...formData, category: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Points to deducted
                </label>
                <Input
                  type="number"
                  min={5}
                  placeholder="Min. 5"
                  value={formData.point}
                  onChange={(e) =>
                    setFormData({ ...formData, point: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Why are points being given?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={300}
                />
                <div className="flex justify-end text-xs text-gray-400">
                  {formData.description.length}/300
                </div>
              </div>

              <div className="space-y-2 w-[150px]">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || selectedStudentIds.length === 0}
              className="w-full md:w-auto min-w-[200px] h-11 text-lg"
            >
              {loading ? <Spinner className="mr-2" /> : null}
              Submit Problem Points
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
