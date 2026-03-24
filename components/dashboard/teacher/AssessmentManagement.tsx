"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Save, Info, BookOpen } from "lucide-react";
import axios from "axios";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";

import { ExcelImport } from "../../../components/dashboard/teacher/ExcelImport";
import {
  ASSESSMENT_TYPES,
  AssessmentType,
} from "../../../lib/constants/assessments";
import { getFullClassLabel } from "../../../lib/utils/labels";
import { Grade, Major, ClassSection } from "../../../lib/constants/class";
import {
  useAssessments,
  useCreateAssessment,
  useDeleteAssessment,
  useUpdateAssessment,
  useUpdateAssessmentScores,
} from "../../../hooks/useAssessment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Session } from "@/lib/types/session";
import { UpdateStudentAssessmentSchema } from "@/lib/zod/assessment";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssessmentScore {
  student: {
    user: {
      id: string;
      name: string;
    };
  };
  id: number;
  score: number;
}

interface Assessment {
  id: number;
  teachingAssignmentId: number;
  title: string;
  givenAt: string;
  dueAt: string;
  type: string;
  scores: AssessmentScore[];
}

/** Flattened per-student row for table rendering & dirty tracking */
interface StudentRow {
  studentId: string;
  studentName: string;
  marks: {
    assessmentId: number;
    assessmentScoreId: number;
    assessmentNumber: number;
    teachingAssignmentId: number;
    score: number | null;
    type: string;
    title: string;
    givenAt: string;
    dueAt: string;
  }[];
}

interface TeachingAssignment {
  class: {
    id: number;
    grade: string;
    major: string;
    section: string;
    homeroomTeacherId: string;
  };
  subject: {
    id: number;
    name: string;
  };
}

interface DeleteModalData {
  title: string;
  type: string;
  assessmentNumber: number;
  assessmentId: number;
  teachingAssignmentId: number;
}

interface NewColumnData {
  type: AssessmentType;
  givenAt: string;
  dueAt: string;
  detail: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Transforms the API response (assessment-centric) into a student-centric
 * flat array that the grading table can render.
 */
function buildStudentRows(assessments: Assessment[]): StudentRow[] {
  const studentMap = new Map<string, StudentRow>();

  assessments.forEach((assessment, assessmentIndex) => {
    for (const score of assessment.scores) {
      const studentId = score.student.user.id;
      const studentName = score.student.user.name;

      let row = studentMap.get(studentId);
      if (!row) {
        row = {
          studentId,
          studentName,
          marks: [],
        };
        studentMap.set(studentId, row);
      }

      row.marks.push({
        assessmentId: assessment.id,
        assessmentScoreId: score.id ?? 0,
        assessmentNumber: assessmentIndex + 1,
        score: score.score,
        type: assessment.type,
        title: assessment.title,
        givenAt: assessment.givenAt,
        dueAt: assessment.dueAt,
        teachingAssignmentId: assessment.teachingAssignmentId,
      });
    }
  });

  // Sort marks within each student by assessmentNumber
  for (const row of studentMap.values()) {
    row.marks.sort((a, b) => a.assessmentNumber - b.assessmentNumber);
  }

  const result = Array.from(studentMap.values());

  result.sort((a, b) => a.studentName.localeCompare(b.studentName));

  return result;
}

/** Build a human-readable label for a teaching assignment */
function getAssignmentLabel(assignment: TeachingAssignment): string {
  const classLabel = getFullClassLabel(
    assignment.class.grade as Grade,
    assignment.class.major as Major,
    assignment.class.section as ClassSection,
  );
  return `${classLabel} — ${assignment.subject.name}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AssessmentManagementProps {
  session: Session;
}

const AssessmentManagement = ({ session }: AssessmentManagementProps) => {
  // Modal state
  const [isOpenEditModal, setIsOpenEditModal] = useState<boolean>(false);
  const [editModalData, setEditModalData] =
    useState<UpdateStudentAssessmentSchema>({
      assessmentId: 0,
      assessmentType: "SCHOOLWORK",
      teachingAssignmentId: 0,
      descriptionSchema: {
        givenAt: new Date().toISOString().split("T")[0],
        dueAt: new Date().toISOString().split("T")[0],
        title: "",
      },
    });

  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState<boolean>(false);
  const [deleteModalData, setDeleteModalData] =
    useState<DeleteModalData | null>(null);

  // Teaching assignments from API
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState<
    string | undefined
  >(undefined);

  /*
    NOTES:
    The pagination feature is currently disabled.
    I’m not using it because it may cause a re-render,
    which would reset the edited data.
    I kept the code commented out in case I want to
    re-enable or improve it later.*/
  // const [page, setPage] = useState(0);

  // Table rows derived from assessment data + local edits
  const [students, setStudents] = useState<StudentRow[]>([]);
  const originalStudentsRef = useRef<StudentRow[]>([]);

  // Add column dialog
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnData, setNewColumnData] = useState<NewColumnData>({
    type: "SCHOOLWORK",
    givenAt: new Date().toISOString().split("T")[0],
    dueAt: new Date().toISOString().split("T")[0],
    detail: "",
  });

  // ── Derived State ────────────────────────────────────────────────────────

  const selectedAssignment =
    selectedAssignmentIndex !== undefined
      ? assignments[Number(selectedAssignmentIndex)]
      : undefined;

  const filtersReady = !!selectedAssignment;

  const assessmentFilters = {
    grade: selectedAssignment?.class.grade ?? "",
    major: selectedAssignment?.class.major ?? "",
    section: selectedAssignment?.class.section ?? "",
    subjectId: selectedAssignment?.subject.id ?? 0,
  };

  // ── TanStack Query Hooks ─────────────────────────────────────────────────

  const { data: assessmentData, isLoading: loading } = useAssessments(
    assessmentFilters,
    filtersReady,
  );

  const createAssessmentMutation = useCreateAssessment();
  const updateScoresMutation = useUpdateAssessmentScores();
  const deleteAssessmentMutation = useDeleteAssessment();
  const updateAssessmentMutation = useUpdateAssessment();

  // ── Fetch teacher assignments ────────────────────────────────────────────

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const res = await axios.get("/api/teacher/teaching-assignments");
        if (res.data?.teachingAssignments) {
          setAssignments(
            res.data.teachingAssignments.map((assignment: any) => {
              return {
                class: {
                  id: assignment.classId,
                  grade: assignment.class.grade,
                  major: assignment.class.major,
                  section: assignment.class.section,
                  homeroomTeacherId: session.id,
                },
                subject: {
                  id: assignment.subject.id,
                  name: assignment.subject.name,
                },
              };
            }),
          );
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load teaching assignments");
      }
    };
    fetchTeacherData();
  }, []);

  // Restore saved selection from localStorage after assignments load
  useEffect(() => {
    if (assignments.length === 0) return;

    try {
      const saved = localStorage.getItem("assessment-management-selection");
      if (!saved) return;

      const data = JSON.parse(saved);
      const matchIdx = assignments.findIndex(
        (a) =>
          a.class.grade === data.grade &&
          a.class.major === data.major &&
          a.class.section === data.section &&
          a.subject.id === data.subjectId,
      );

      if (matchIdx !== -1) {
        setSelectedAssignmentIndex(String(matchIdx));
      }
    } catch (error) {
      console.error("Failed to load saved selection:", error);
    }
  }, [assignments]);

  // ── Transform API data → table rows when assessments change ──────────────

  useEffect(() => {
    if (!assessmentData?.assessments) {
      setStudents([]);
      originalStudentsRef.current = [];
      return;
    }

    const rows = buildStudentRows(assessmentData.assessments);
    setStudents(rows);
    originalStudentsRef.current = JSON.parse(JSON.stringify(rows));
  }, [assessmentData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignmentIndex(value);
    // setPage(0);

    // Save selection to localStorage
    const assignment = assignments[Number(value)];
    if (assignment) {
      localStorage.setItem(
        "assessment-management-selection",
        JSON.stringify({
          grade: assignment.class.grade,
          major: assignment.class.major,
          section: assignment.class.section,
          subjectId: assignment.subject.id,
        }),
      );
    }
  };

  const handleScoreChange = (
    studentId: string,
    assessmentId: number,
    value: string,
  ) => {
    if (value && isNaN(Number(value))) return;
    const numVal = value === "" ? null : Number(value);
    if (numVal !== null && (numVal < 0 || numVal > 100)) {
      toast.error("Score must be between 0 and 100");
      return;
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const newMarks = s.marks.map((m) => {
          if (m.assessmentId === assessmentId) {
            return { ...m, score: numVal };
          }
          return m;
        });
        return { ...s, marks: newMarks };
      }),
    );
  };

  const handleImport = (importedData: any[]) => {
    const excelMap = new Map<string, Map<number, number>>();

    for (const row of importedData) {
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

    setStudents((prev) =>
      prev.map((student) => {
        const assessmentMap = excelMap.get(student.studentId);
        if (!assessmentMap) return student;

        const updatedMarks = student.marks.map((mark) => {
          const newScore = assessmentMap.get(mark.assessmentNumber);
          if (newScore === undefined) return mark;
          return { ...mark, score: newScore };
        });

        return { ...student, marks: updatedMarks };
      }),
    );

    toast.success("Excel data loaded into table");
  };

  const handleDeleteAssessment = () => {
    if (
      !deleteModalData?.assessmentId ||
      !deleteModalData.teachingAssignmentId
    ) {
      toast.error("Assessment ID and teaching assignment ID not found");
      return;
    }

    deleteAssessmentMutation.mutate({
      assessmentId: deleteModalData?.assessmentId,
      teachingAssignmentId: deleteModalData?.teachingAssignmentId,
    });
  };

  const handleUpdateAssessment = () => {
    updateAssessmentMutation.mutate(editModalData);
  };

  /** Dirty-field validation: only send modified scores */
  const handleSave = () => {
    if (!selectedAssignment) return;

    const originalStudents = originalStudentsRef.current;

    const changedStudents = students
      .map((student) => {
        const original = originalStudents.find(
          (o) => o.studentId === student.studentId,
        );
        if (!original) return null;

        const changedMarks = student.marks.filter((mark) => {
          const originalMark = original.marks.find(
            (m) => m.assessmentId === mark.assessmentId,
          );
          return originalMark?.score !== mark.score;
        });

        if (changedMarks.length === 0) return null;

        console.log(changedMarks);

        return {
          studentId: student.studentId,
          studentAssessments: changedMarks.map((m) => ({
            assessmentScoreId: m.assessmentScoreId,
            score: m.score ?? 0,
          })),
        };
      })
      .filter(Boolean) as {
      studentId: string;
      studentAssessments: { assessmentScoreId: number; score: number }[];
    }[];

    if (changedStudents.length === 0) {
      toast.info("No changes to save");
      return;
    }

    updateScoresMutation.mutate(
      {
        subjectId: selectedAssignment.subject.id,
        classId: selectedAssignment.class.id,
        students: changedStudents,
      },
      {
        onSuccess: () => {
          originalStudentsRef.current = JSON.parse(JSON.stringify(students));
        },
      },
    );
  };

  const handleAddColumn = () => {
    if (!selectedAssignment) {
      toast.error("Please select a teaching assignment first");
      return;
    }

    createAssessmentMutation.mutate(
      {
        assessmentType: newColumnData.type,
        class: {
          grade: selectedAssignment.class.grade,
          major: selectedAssignment.class.major,
          section: selectedAssignment.class.section,
        },
        subjectId: selectedAssignment.subject.id,
        subjectName: selectedAssignment.subject.name,
        description: {
          title: newColumnData.detail,
          dueAt: newColumnData.dueAt,
          givenAt: newColumnData.givenAt,
        },
      },
      {
        onSuccess: () => {
          setIsAddColumnOpen(false);
          window.location.reload();
        },
      },
    );
  };

  // ── Column headers derived from first student's marks ────────────────────

  const columns =
    students.length > 0 && students[0]?.marks?.length > 0
      ? students[0].marks
          .slice()
          .sort((a, b) => a.assessmentNumber - b.assessmentNumber)
      : [];

  const totalStudents = students.length;

  console.log(columns);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="m-4 space-y-6 pb-8 mt-20 lg:mt-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-800 p-6 text-white shadow-lg rounded-b-xl rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assessment Management</h1>
              <p className="text-blue-100 text-sm">
                Manage student assessments and scores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Selector & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 sm:px-0">
        <Card className="md:col-span-3">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label>Teaching Assignment</Label>
              <Select
                value={selectedAssignmentIndex}
                onValueChange={handleAssignmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class & subject..." />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {getAssignmentLabel(a)}
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
          {/* Add Assessment column */}
          <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!selectedAssignment}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Assessment Column</DialogTitle>
                <DialogDescription>
                  Create a new assessment column for this class and subject.
                </DialogDescription>
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
                      {ASSESSMENT_TYPES.map((t) => (
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
                  <Label>Title</Label>
                  <Input
                    value={newColumnData.detail}
                    onChange={(e) =>
                      setNewColumnData({
                        ...newColumnData,
                        detail: e.target.value,
                      })
                    }
                    placeholder="Assessment title..."
                    maxLength={20}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddColumn}
                  disabled={createAssessmentMutation.isPending}
                >
                  {createAssessmentMutation.isPending
                    ? "Creating..."
                    : "Create Column"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Edit assessment dialog */}
          <Dialog open={isOpenEditModal} onOpenChange={setIsOpenEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Assessment</DialogTitle>
                <DialogDescription>
                  Update the assessment details for this class.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Assessment Type</Label>
                  <Select
                    value={editModalData.assessmentType}
                    onValueChange={(val) =>
                      setEditModalData((prev) => ({
                        ...prev,
                        assessmentType: val as AssessmentType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Given at</Label>
                    <Input
                      type="date"
                      value={editModalData.descriptionSchema.givenAt}
                      onChange={(e) =>
                        setEditModalData((prev) => ({
                          ...prev,
                          descriptionSchema: {
                            ...prev.descriptionSchema,
                            givenAt: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Due at</Label>
                    <Input
                      type="date"
                      value={editModalData.descriptionSchema.dueAt}
                      onChange={(e) =>
                        setEditModalData((prev) => ({
                          ...prev,
                          descriptionSchema: {
                            ...prev.descriptionSchema,
                            dueAt: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={editModalData.descriptionSchema.title}
                    onChange={(e) =>
                      setEditModalData((prev) => ({
                        ...prev,
                        descriptionSchema: {
                          ...prev.descriptionSchema,
                          title: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter assessment title"
                    maxLength={50}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleUpdateAssessment}
                  disabled={updateAssessmentMutation.isPending}
                >
                  {updateAssessmentMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete assessment dialog */}
          <AlertDialog
            open={isOpenDeleteModal}
            onOpenChange={setIsOpenDeleteModal}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteModalData && (
                    <>
                      You are about to delete:
                      <br />
                      <strong>{deleteModalData.title}</strong> <br />
                      Type: {deleteModalData.type} <br />
                      Assessment #{deleteModalData.assessmentNumber}
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteAssessment}
                  disabled={deleteAssessmentMutation.isPending}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ExcelImport onImport={handleImport} />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateScoresMutation.isPending || !selectedAssignment}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[200px] w-fit"
        >
          <Save className="w-4 h-4" />
          {updateScoresMutation.isPending ? "Saving..." : "Save Changes"}
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
                            <p className="text-sm text-gray-500">{col.title}</p>
                            <div className="text-xs text-gray-400 pt-2 border-t">
                              <div>
                                Given:{" "}
                                {new Date(col.givenAt).toLocaleDateString()}
                              </div>
                              <div>
                                Due: {new Date(col.dueAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                onClick={() => {
                                  setEditModalData({
                                    assessmentId: col.assessmentId,
                                    teachingAssignmentId:
                                      col.teachingAssignmentId,
                                    assessmentType: col.type as AssessmentType,
                                    descriptionSchema: {
                                      dueAt: col.dueAt.split("T")[0],
                                      givenAt: col.givenAt.split("T")[0],
                                      title: col.title,
                                    },
                                  });
                                  setIsOpenEditModal(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => {
                                  setDeleteModalData({
                                    title: col.title,
                                    type: col.type,
                                    assessmentNumber: col.assessmentNumber,
                                    assessmentId: col.assessmentId,
                                    teachingAssignmentId:
                                      col.teachingAssignmentId,
                                  });
                                  setIsOpenDeleteModal(true);
                                }}
                                variant={"destructive"}
                              >
                                Delete
                              </Button>
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
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className="h-24 text-center text-gray-500"
                  >
                    {selectedAssignment
                      ? "No assessments found. Create a new column to get started."
                      : "Select a teaching assignment to view scores"}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => (
                  <TableRow
                    key={student.studentId}
                    className="hover:bg-blue-50/20"
                  >
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {student.studentName.split(" ").length > 0
                        ? `${student.studentName.split(" ")[0]} ${student.studentName.split(" ")[1]?.[0] ?? ""}`
                        : student.studentName}
                    </TableCell>
                    {columns.map((col) => {
                      const mark = student.marks?.find(
                        (m) => m.assessmentId === col.assessmentId,
                      );
                      return (
                        <TableCell key={col.assessmentId}>
                          <Input
                            type="number"
                            value={mark?.score ?? ""}
                            onChange={(e) =>
                              handleScoreChange(
                                student.studentId,
                                col.assessmentId,
                                e.target.value,
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

        {/* <div className="p-4 border-t flex justify-end gap-2">
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
        </div> */}
      </Card>
    </div>
  );
};

export default AssessmentManagement;
