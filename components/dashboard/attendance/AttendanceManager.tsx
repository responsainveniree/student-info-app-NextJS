"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import AttendanceManagerSkeleton from "./AttendanceManagerSkeleton";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import {
  Calendar,
  Users,
  Save,
  Lock,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  STUDENT_POSITIONS,
  STAFF_POSITIONS,
} from "../../../lib/constants/roles";
import { Session } from "../../../lib/types/session";
import { abbreviateName } from "../../../lib/utils/nameFormatter";
import { ITEMS_PER_PAGE } from "../../../lib/constants/pagination";
import { ATTENDANCE_KEYS } from "../../../lib/constants/tanStackQueryKeys";
import { useDebounce } from "../../../hooks/useDebounce";

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id?: string;
  studentId: string;
  type: "PRESENT" | "SICK" | "PERMISSION" | "ALPHA" | "LATE";
  description?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  sick: number;
  permission: number;
  alpha: number;
  late: number;
}

interface AttendanceManagerProps {
  session: Session;
}

type SortOption = "name-asc" | "name-desc";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "PRESENT", color: "text-emerald-700" },
  { value: "SICK", label: "SICK", color: "text-amber-700" },
  { value: "PERMISSION", label: "PERMISSION", color: "text-blue-700" },
  { value: "ALPHA", label: "ALPHA", color: "text-red-700" },
  { value: "LATE", label: "LATE", color: "text-orange-700" },
];
/** Returns local date as "YYYY-MM-DD" — timezone safe, avoids UTC shift */
const getLocalDateString = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const AttendanceManager = ({ session }: AttendanceManagerProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString(), // ✅ local timezone, not UTC
  );
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : "";
  const [currentPage, setCurrentPage] = useState(0);
  const [unsavedChanges, setUnsavedChanges] = useState<
    Record<string, AttendanceRecord>
  >({});

  // String comparison works for YYYY-MM-DD — no Date parsing, no timezone shift
  const isFutureDate = selectedDate > getLocalDateString();
  const isValidDate = !isFutureDate;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [effectiveSearchQuery, sortBy, selectedDate]);

  // FIX: Reset unsaved changes when date changes
  useEffect(() => {
    setUnsavedChanges({});
  }, [selectedDate]);

  const apiSortOrder = sortBy === "name-desc" ? "desc" : "asc";

  const fetchAttendance = async () => {
    const { data } = await axios.get(`/api/attendance`, {
      params: {
        homeroomTeacherId: session.homeroomTeacherId,
        date: selectedDate,
        page: currentPage,
        sortOrder: apiSortOrder,
        searchQuery: effectiveSearchQuery,
      },
    });
    return data.data;
  };

  const {
    data: attendanceData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ATTENDANCE_KEYS.list({
      homeroomTeacherId: session.homeroomTeacherId,
      date: selectedDate,
      page: currentPage,
      sortOrder: apiSortOrder,
      searchQuery: effectiveSearchQuery,
    }),
    queryFn: fetchAttendance,
    staleTime: 0, // always consider data stale → refetch on queryKey change
    enabled:
      session?.role === STUDENT_POSITIONS.CLASS_SECRETARY ||
      (session.role === STAFF_POSITIONS.TEACHER &&
        !!session.isHomeroomClassTeacher),
  });

  const studentList: Student[] =
    attendanceData?.studentAttendanceRecords.map((record: any) => ({
      id: record.id,
      name: record.name,
    })) || [];

  const totalStudents = attendanceData?.totalStudents || 0;
  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);

  const apiStats = attendanceData?.stats || {
    sick: 0,
    permission: 0,
    alpha: 0,
    late: 0,
  };

  const stats: AttendanceStats = {
    total: totalStudents,
    sick: apiStats.sick,
    permission: apiStats.permission,
    alpha: apiStats.alpha,
    late: apiStats.late,
    present:
      totalStudents -
      (apiStats.sick + apiStats.permission + apiStats.alpha + apiStats.late),
  };

  // While fetching, use empty map so stale data from previous date doesn't bleed into rows
  const serverAttendanceMap: Record<string, AttendanceRecord> = {};
  if (!isFetching) {
    attendanceData?.studentAttendanceRecords.forEach((record: any) => {
      const attendance = record.studentProfile?.attendance;
      if (attendance && attendance.length > 0) {
        const att = attendance[0];
        serverAttendanceMap[record.id] = {
          studentId: record.id,
          type: att.type,
          description: att.note || "",
        };
      }
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (records: any[]) => {
      await axios.post("/api/attendance", { date: selectedDate, records });
    },
    onSuccess: () => {
      toast.success("Attendance saved successfully");
      setUnsavedChanges({});
      refetch(); // directly refetch the current active query
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const NO_DESCRIPTION_TYPES = ["PRESENT", "ALPHA", "LATE"];

  const handleAttendanceChange = (
    studentId: string,
    field: keyof AttendanceRecord,
    value: any,
  ) => {
    setUnsavedChanges((prev) => {
      const serverRecord = serverAttendanceMap[studentId];
      const currentRecord = prev[studentId] ||
        serverRecord || { studentId, type: "PRESENT" };

      const updated = { ...currentRecord, [field]: value };

      // Clear description when switching to a type that doesn't need it
      if (field === "type" && NO_DESCRIPTION_TYPES.includes(value)) {
        updated.description = "";
      }

      return { ...prev, [studentId]: updated };
    });
  };

  const getStatusColor = (type?: string) => {
    switch (type) {
      case "PRESENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SICK":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PERMISSION":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ALPHA":
        return "bg-red-50 text-red-700 border-red-200";
      case "LATE":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const handleSubmit = () => {
    const recordsToSave = Object.values(unsavedChanges).map((record) => ({
      studentId: record.studentId,
      // API's normalizeAttendanceType converts "PRESENT" → null → deletes DB record
      attendanceType: record.type,
      description: NO_DESCRIPTION_TYPES.includes(record.type)
        ? undefined
        : record.description,
    }));
    if (recordsToSave.length === 0) {
      toast.success("No changes to save.");
      return;
    }
    saveMutation.mutate(recordsToSave);
  };

  const unsavedCount = Object.keys(unsavedChanges).length;
  const isSubmitting = saveMutation.isPending;

  if (loading && studentList.length === 0) {
    return <AttendanceManagerSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="m-8 mt-0 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Daily Attendance
              </h1>
              <p className="text-blue-100 text-sm">
                Manage and track student attendance records
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {[
              {
                value: stats.total,
                label: "Total Students",
                bg: "bg-white/10",
                border: "border-white/20",
                text: "text-blue-100",
              },
              {
                value: stats.present,
                label: "Present",
                bg: "bg-emerald-500/20",
                border: "border-emerald-400/30",
                text: "text-emerald-100",
              },
              {
                value: stats.sick,
                label: "Sick",
                bg: "bg-amber-500/20",
                border: "border-amber-400/30",
                text: "text-amber-100",
              },
              {
                value: stats.permission,
                label: "Permission",
                bg: "bg-blue-500/20",
                border: "border-blue-400/30",
                text: "text-blue-100",
              },
              {
                value: stats.alpha,
                label: "Alpha",
                bg: "bg-red-500/20",
                border: "border-red-400/30",
                text: "text-red-100",
              },
              {
                value: stats.late,
                label: "Late",
                bg: "bg-orange-500/20",
                border: "border-orange-400/30",
                text: "text-orange-100",
              },
            ].map(({ value, label, bg, border, text }) => (
              <div
                key={label}
                className={`${bg} backdrop-blur-sm rounded-xl p-3 sm:p-4 border ${border}`}
              >
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                <div className={`text-xs sm:text-sm mt-1 ${text}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
          {/* Controls */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Search */}
              <div className="relative w-full md:w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter at least 3 characters
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOption)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <ArrowUpDown className="w-4 h-4 mr-2 hidden sm:block" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date + Save */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-[#111827] w-full"
                    />
                  </div>

                  {isValidDate ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting
                        ? "Saving..."
                        : `Save Changes${unsavedCount > 0 ? ` (${unsavedCount})` : ""}`}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg border border-amber-200 whitespace-nowrap">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium text-sm">
                        Future dates locked
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Unified List (replaces separate desktop table + mobile cards) ── */}

          {/* Column headers — visible on sm+ */}
          <div className="hidden sm:grid sm:grid-cols-[2fr_1.5fr_2fr] gap-4 px-6 lg:px-8 py-3 bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Student Name
            </span>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Status
            </span>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Notes
            </span>
          </div>

          <div
            className={`divide-y divide-[#E5E7EB] relative transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            {studentList.length === 0 && !loading ? (
              <div className="px-8 py-16 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">
                  No students found in this class
                </p>
                <p className="text-gray-400 text-sm">
                  Please check your homeroom assignment
                </p>
              </div>
            ) : (
              studentList.map((student, index) => {
                const unsaved = unsavedChanges[student.id];
                const server = serverAttendanceMap[student.id];
                const record = unsaved ||
                  server || {
                    studentId: student.id,
                    type: "PRESENT" as const,
                    description: "",
                  };

                const showNoteInput =
                  isValidDate &&
                  record.type !== "ALPHA" &&
                  record.type !== "PRESENT" &&
                  record.type !== "LATE";

                return (
                  <div
                    key={student.id}
                    className="
                      px-4 sm:px-6 lg:px-8 py-4
                      hover:bg-blue-50/30 transition-colors duration-150
                      grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_2fr]
                      gap-3 sm:gap-4 sm:items-center
                    "
                  >
                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                        {currentPage * ITEMS_PER_PAGE + index + 1}
                      </div>
                      <span className="font-semibold text-[#111827] text-sm sm:text-base truncate">
                        {abbreviateName(student.name)}
                      </span>
                      {unsaved && (
                        <span className="shrink-0 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Edited
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      {isValidDate ? (
                        <Select
                          value={record.type || "PRESENT"}
                          onValueChange={(value) =>
                            handleAttendanceChange(student.id, "type", value)
                          }
                        >
                          <SelectTrigger
                            className={`w-full sm:w-36 h-9 font-semibold text-sm ${getStatusColor(record.type || "PRESENT")}`}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className={`font-semibold ${opt.color}`}>
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${getStatusColor(record.type)}`}
                        >
                          {record.type}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      {showNoteInput ? (
                        <Input
                          placeholder="Add optional description..."
                          value={record.description || ""}
                          onChange={(e) =>
                            handleAttendanceChange(
                              student.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="h-9 text-sm border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                        />
                      ) : !isValidDate && record.description ? (
                        <span className="text-gray-600 text-sm italic">
                          {record.description}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm hidden sm:inline">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing {currentPage * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalStudents)} of{" "}
                {totalStudents} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0 || loading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm font-medium text-gray-700 px-3">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1 || loading}
                  className="flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
