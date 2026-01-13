"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Info,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { ExcelImport } from "@/components/dashboard/teacher/ExcelImport";
import { GRADES, MAJORS, CLASSNUMBERS } from "@/lib/constants/class";
import { AssessmentType } from "@/lib/constants/assessments";
import {
  formatClassNumber,
  getMajorDisplayName,
  SUBJECT_DISPLAY_MAP,
  GRADE_DISPLAY_MAP,
} from "@/lib/utils/labels";
import { Session } from "@/lib/types/session";

interface Mark {
  assessmentNumber: number;
  score: number | null;
  type: AssessmentType;
  description: {
    detail: string;
    dueAt: string;
    givenAt: string;
  };
}

interface Student {
  id: string;
  name: string;
  subjectMarks: {
    marks: Mark[];
  }[];
}

interface Props {
  session: Session;
}

const MarkManagement = ({ session }: Props) => {
  // State
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);

  // ✅ Initialize with empty values (same on server and client)
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedClassNumber, setSelectedClassNumber] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [page, setPage] = useState(0);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnData, setNewColumnData] = useState({
    type: AssessmentType.SCHOOLWORK,
    givenAt: new Date().toISOString().split("T")[0],
    dueAt: new Date().toISOString().split("T")[0],
    detail: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mark-management-selection");
      if (!saved) return;

      const data = JSON.parse(saved);
      setSelectedGrade(data.grade || "");
      setSelectedMajor(data.major || "");
      setSelectedClassNumber(data.classNumber || "");
    } catch (error) {
      console.error("Failed to load saved selection:", error);
    }
  }, []);

  // Fetch Teacher Assignments
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!session?.id) return;
      try {
        const res = await axios.get(`/api/teacher?teacherId=${session.id}`);
        if (res.data?.data?.teachingAssignments) {
          setAvailableClasses(res.data.data.teachingAssignments);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load classes");
      }
    };
    fetchTeacherData();
  }, [session]);

  const uniqueSubjects = React.useMemo(() => {
    if (!selectedGrade || !selectedMajor || !selectedClassNumber) return [];
    return availableClasses
      .filter(
        (a) =>
          a.grade === selectedGrade &&
          a.major === selectedMajor &&
          a.classNumber === selectedClassNumber
      )
      .map((a) => a.subject);
  }, [selectedGrade, selectedMajor, selectedClassNumber, availableClasses]);

  // Restore subject from localStorage when uniqueSubjects is populated
  useEffect(() => {
    if (uniqueSubjects.length === 0 || selectedSubject) return;

    try {
      const saved = localStorage.getItem("mark-management-selection");
      if (!saved) return;

      const data = JSON.parse(saved);
      if (!data.subject) return;

      const matchedSubject = uniqueSubjects.find(
        (s: any) => s.subjectName === data.subject
      );

      if (matchedSubject) {
        setSelectedSubject(data.subject);
        setSelectedSubjectId(String(matchedSubject.id));
      }
    } catch (error) {
      console.error("Failed to restore subject:", error);
    }
  }, [uniqueSubjects]);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      // Don't fetch if basic class info is missing
      if (
        !selectedGrade ||
        !selectedMajor ||
        !selectedClassNumber ||
        !selectedSubject
      ) {
        setStudents([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get("/api/student", {
          params: {
            grade: selectedGrade,
            major: selectedMajor,
            classNumber: selectedClassNumber,
            subjectName: selectedSubject,
            page: page,
            role: session.role,
          },
        });
        const studentData = res.data.students || [];
        setStudents(studentData);
        setOriginalStudents(JSON.parse(JSON.stringify(studentData)));
        setTotalStudents(res.data.totalStudents || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [
    selectedGrade,
    selectedMajor,
    selectedClassNumber,
    selectedSubject,
    page,
  ]);

  // Handlers
  const handleScoreChange = (
    studentId: string,
    assessmentNum: number,
    value: string
  ) => {
    if (value && isNaN(Number(value))) return;
    const numVal = value === "" ? null : Number(value);
    if (numVal !== null && (numVal < 0 || numVal > 100)) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newMarks = s.subjectMarks[0].marks.map((m) => {
          if (m.assessmentNumber === assessmentNum) {
            return { ...m, score: numVal };
          }
          return m;
        });
        return {
          ...s,
          subjectMarks: [{ ...s.subjectMarks[0], marks: newMarks }],
        };
      })
    );
  };

  const handleImport = (importedData: any[]) => {
    const excelMap = new Map<string, Map<number, number>>();
    console.log(importedData);

    for (const row of importedData) {
      console.log(row);
      // NOTES:
      // Each Excel row is parsed into an object.
      // Column headers become object keys (e.g. row.id)
      // Column names are flexible, but must be consistent between Excel and code
      if (!row.id || !row.studentAssessments) continue;

      const assessmentMap = new Map<number, number>();

      const pairs = row.studentAssessments.split(",");
      for (const pair of pairs) {
        const [numStr, scoreStr] = pair.split(":");
        const num = Number(numStr);
        const score = Number(scoreStr);

        if (!isNaN(num) && !isNaN(score)) {
          assessmentMap.set(num, score);
        }
      }

      excelMap.set(row.id.trim(), assessmentMap);
    }

    // Update state once
    setStudents((prev) =>
      prev.map((student) => {
        const assessmentMap = excelMap.get(student.id);
        if (!assessmentMap) return student;

        const updatedMarks = student.subjectMarks[0].marks.map((mark) => {
          const newScore = assessmentMap.get(mark.assessmentNumber);
          if (newScore === undefined) return mark;

          return { ...mark, score: newScore };
        });

        return {
          ...student,
          subjectMarks: [
            {
              ...student.subjectMarks[0],
              marks: updatedMarks,
            },
          ],
        };
      })
    );

    toast.success("Excel data loaded into table");
  };

  const handleSave = async () => {
    const changedStudents = students
      .map((student) => {
        const original = originalStudents.find((o) => o.id === student.id);
        if (!original) return null;

        const changedMarks = student.subjectMarks[0].marks.filter((mark) => {
          const originalMark = original.subjectMarks[0].marks.find(
            (m) => m.assessmentNumber === mark.assessmentNumber
          );
          return originalMark?.score !== mark.score;
        });

        if (changedMarks.length === 0) return null;

        return {
          studentId: student.id,
          subjectName: selectedSubject,
          studentAssessments: changedMarks.map((m) => ({
            assessmentNumber: m.assessmentNumber,
            score: m.score,
          })),
        };
      })
      .filter(Boolean);

    if (changedStudents.length === 0) {
      toast.info("No changes to save");
      return;
    }

    const payload = {
      teacherId: session?.id,
      students: changedStudents,
    };

    try {
      await axios.patch("/api/teacher/mark", payload);
      // Update original setelah save berhasil
      setOriginalStudents(JSON.parse(JSON.stringify(students)));
      toast.success(
        `${changedStudents.length} student(s) updated successfully!`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to save marks");
    }
  };

  const handleAddColumn = async () => {
    if (!selectedSubjectId) {
      toast.error("Subject ID missing, please re-select subject");
      return;
    }

    try {
      await axios.post("/api/teacher/mark/column", {
        assessmentType: newColumnData.type,
        class: {
          grade: selectedGrade,
          major: selectedMajor,
          classNumber: selectedClassNumber,
        },
        teacherId: session?.id,
        subjectId: Number(selectedSubjectId),
        subjectName: selectedSubject,
        description: {
          detail: newColumnData.detail,
          dueAt: newColumnData.dueAt,
          givenAt: newColumnData.givenAt,
        },
      });
      toast.success("Column added!");

      const res = await axios.get("/api/student", {
        params: {
          grade: selectedGrade,
          major: selectedMajor,
          classNumber: selectedClassNumber,
          subjectName: selectedSubject,
          page: page,
          role: session.role,
        },
      });

      const newStudentData = res.data.students || [];
      setStudents(newStudentData);
      setOriginalStudents(JSON.parse(JSON.stringify(newStudentData)));
      setIsAddColumnOpen(false);
      localStorage.setItem(
        "mark-management-selection",
        JSON.stringify({
          grade: selectedGrade,
          major: selectedMajor,
          classNumber: selectedClassNumber,
          subject: selectedSubject,
          subjectId: selectedSubjectId,
        })
      );
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create column");
    }
  };

  const columns =
    students.length > 0 &&
    students[0]?.subjectMarks?.length > 0 &&
    students[0].subjectMarks[0]?.marks?.length > 0
      ? students[0].subjectMarks[0].marks.sort(
          (a, b) => a.assessmentNumber - b.assessmentNumber
        )
      : [];

  return (
    <div className="m-4 space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-800 p-6 text-white shadow-lg rounded-b-xl rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mark Management</h1>
              <p className="text-blue-100 text-sm">
                Manage student assessments and scores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 sm:px-0">
        <Card className="md:col-span-3">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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
            </div>
            <div className="space-y-2">
              <Label>Major</Label>
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger>
                  <SelectValue placeholder="Major" />
                </SelectTrigger>
                <SelectContent>
                  {MAJORS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {getMajorDisplayName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={selectedClassNumber}
                onValueChange={setSelectedClassNumber}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSNUMBERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatClassNumber(c) || "None"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={(val) => {
                  setSelectedSubject(val);
                  const subj = uniqueSubjects.find(
                    (s: any) => s.subjectName === val
                  );
                  if (subj) setSelectedSubjectId(String(subj.id));
                }}
                disabled={!uniqueSubjects.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSubjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.subjectName}>
                      {SUBJECT_DISPLAY_MAP[s.subjectName] || s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="text-sm text-blue-600 font-medium">
              Total Students
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {totalStudents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid row-span-2 md:flex md:justify-between md:items-center px-4 md:px-0">
        <div className="flex gap-2 mb-5 md:mb-0">
          <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!selectedSubject}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Assessment Column</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={newColumnData.type}
                    onValueChange={(val) =>
                      setNewColumnData({
                        ...newColumnData,
                        type: val as AssessmentType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AssessmentType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Given At</Label>
                    <Input
                      type="date"
                      value={newColumnData.givenAt}
                      onChange={(e) =>
                        setNewColumnData({
                          ...newColumnData,
                          givenAt: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due At</Label>
                    <Input
                      type="date"
                      value={newColumnData.dueAt}
                      onChange={(e) =>
                        setNewColumnData({
                          ...newColumnData,
                          dueAt: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Detail</Label>
                  <Input
                    value={newColumnData.detail}
                    onChange={(e) =>
                      setNewColumnData({
                        ...newColumnData,
                        detail: e.target.value,
                      })
                    }
                    placeholder="Instructions..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddColumn}>Create Column</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ExcelImport onImport={handleImport} />
        </div>

        <Button
          onClick={handleSave}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[200px] w-fit"
        >
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-t-4 border-t-blue-600 mx-4 sm:mx-0 shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="min-w-[200px]">Student Name</TableHead>
                {columns.map((col, idx) => (
                  <TableHead key={idx} className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span>
                        {col.type} #{col.assessmentNumber}
                      </span>
                      <Popover>
                        <PopoverTrigger>
                          <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Assessment Details</h4>
                            <p className="text-sm text-gray-500">
                              {col.description.detail}
                            </p>
                            <div className="text-xs text-gray-400 pt-2 border-t">
                              <div>
                                Given:{" "}
                                {new Date(
                                  col.description.givenAt
                                ).toLocaleDateString()}
                              </div>
                              <div>
                                Due:{" "}
                                {new Date(
                                  col.description.dueAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className="h-24 text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => (
                  <TableRow key={student.id} className="hover:bg-blue-50/20">
                    <TableCell>{page * 10 + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {student.name.split(" ").length > 0
                        ? `${student.name.split(" ")[0]} ${student.name.split(" ")[1]?.[0] ?? ""}`
                        : student.name}
                    </TableCell>
                    {columns.map((col) => {
                      const marks = student.subjectMarks?.[0]?.marks;
                      const mark = marks?.find(
                        (m) => m.assessmentNumber === col.assessmentNumber
                      );
                      return (
                        <TableCell key={col.assessmentNumber}>
                          <Input
                            type="number"
                            value={mark?.score ?? ""}
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                col.assessmentNumber,
                                e.target.value
                              )
                            }
                            className="w-20 text-center"
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="py-1 px-3 bg-gray-100 rounded text-sm font-medium">
            {page + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={totalStudents <= (page + 1) * 10}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MarkManagement;
