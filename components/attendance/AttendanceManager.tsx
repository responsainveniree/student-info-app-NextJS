"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import AttendanceManagerSkeleton from "@/components/attendance/AttendanceManagerSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Save, Lock } from "lucide-react";
import { ROLES, getRoleDashboard } from "@/lib/constants/roles";

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id?: string;
  studentId: string;
  type: "PRESENT" | "SICK" | "PERMISSION" | "ALPHA";
  description?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  sick: number;
  permission: number;
  alpha: number;
}

type Session = {
  id: string;
  name: string;
  role: string;
  homeroomTeacherId: string | null;
};

interface AttendanceManagerProps {
  session: Session;
}

import React from "react";

const AttendanceManager = ({ session }: AttendanceManagerProps) => {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed properties
  const isFutureDate =
    new Date(selectedDate) > new Date(new Date().toISOString().split("T")[0]);
  const isValidDate = !isFutureDate;

  // Calculate statistics
  const stats = useMemo<AttendanceStats>(() => {
    const records = Object.values(attendanceMap);

    let sick = 0;
    let permission = 0;
    let alpha = 0;

    for (const r of records) {
      if (r.type === "SICK") sick++;
      else if (r.type === "PERMISSION") permission++;
      else if (r.type === "ALPHA") alpha++;
    }

    return {
      total: students.length,
      sick,
      permission,
      alpha,
      present: students.length - (sick + permission + alpha),
    };
  }, [students, attendanceMap]);

  useEffect(() => {
    if (session?.role !== ROLES.CLASS_SECRETARY) {
      router.push(getRoleDashboard(session.role));
      return;
    }
    initializeData();
  }, [session, selectedDate]);

  const initializeData = async () => {
    setLoading(true);
    try {
      if (!session?.homeroomTeacherId) {
        toast.error("Homeroom teacher not found for this account.");
        setLoading(false);
        return;
      }

      // Fetch students using axios
      const studentRes = await axios.get(`/api/student/list-students`, {
        params: { homeroomTeacherId: session.homeroomTeacherId },
      });
      const studentList = studentRes.data.data || [];
      setStudents(studentList);

      // Fetch attendance using axios
      try {
        const attendanceRes = await axios.get(
          `/api/student-attendance/students-attendance-data`,
          {
            params: {
              date: selectedDate,
              homeroomTeacherId: session.homeroomTeacherId,
              studentId: session.id, // Added for validation check
            },
          }
        );
        const map: Record<string, AttendanceRecord> = {};
        attendanceRes.data.data.forEach((r: any) => {
          map[r.studentId] = r;
        });
        setAttendanceMap(map);
      } catch (e) {
        setAttendanceMap({});
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (
    studentId: string,
    field: keyof AttendanceRecord,
    value: any
  ) => {
    setAttendanceMap((prev) => {
      const record = prev[studentId] || { studentId, type: "present" };
      return {
        ...prev,
        [studentId]: { ...record, [field]: value },
      };
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
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Saving attendance...");

    try {
      // Prepare bulk payload with all records
      const records = Object.values(attendanceMap).map((record) => ({
        studentId: record.studentId,
        attendanceType: record.type,
        description: record.description,
      }));

      // Single atomic bulk request
      const response = await axios.post("/api/student-attendance/insert-data", {
        secretaryId: session?.id,
        date: selectedDate,
        records,
      });

      toast.success(response.data.message || "Attendance saved successfully", {
        id: toastId,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <AttendanceManagerSkeleton />;
  }
  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-4 sm:p-6 lg:p-8 text-white shadow-lg">
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
              <div className="text-xs sm:text-sm text-blue-100 mt-1">
                Total Students
              </div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-400/30">
              <div className="text-xl sm:text-2xl font-bold">
                {stats.present}
              </div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-1">
                Present
              </div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-400/30">
              <div className="text-xl sm:text-2xl font-bold">{stats.sick}</div>
              <div className="text-xs sm:text-sm text-amber-100 mt-1">Sick</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-400/30">
              <div className="text-xl sm:text-2xl font-bold">
                {stats.permission}
              </div>
              <div className="text-xs sm:text-sm text-blue-100 mt-1">
                Permission
              </div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-red-400/30 col-span-2 sm:col-span-1">
              <div className="text-xl sm:text-2xl font-bold">{stats.alpha}</div>
              <div className="text-xs sm:text-sm text-red-100 mt-1">Alpha</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
          {/* Card Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-bold text-lg sm:text-xl text-[#111827]">
                  Class Attendance List
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {isValidDate
                    ? "Select status for each student and add optional notes"
                    : "Viewing archived attendance record"}
                </p>
              </div>

              {/* Date Picker and Save Button grouped */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="w-40 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-[#111827]"
                  />
                </div>

                {isValidDate ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white w-40 font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg border border-amber-200">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      Future dates are locked
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
                <tr>
                  <th className="px-6 lg:px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Attendance Status
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {students.map((student, index) => {
                  const record = attendanceMap[student.id] || {
                    type: "PRESENT",
                  };

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/30 transition-colors duration-150"
                    >
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-semibold text-[#111827]">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        {isValidDate ? (
                          <div className="flex gap-2 flex-wrap">
                            {(
                              [
                                "PRESENT",
                                "SICK",
                                "PERMISSION",
                                "ALPHA",
                              ] as const
                            ).map((t) => (
                              <button
                                key={t}
                                onClick={() =>
                                  handleAttendanceChange(student.id, "type", t)
                                }
                                className={`px-3 lg:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 border ${record.type === t
                                  ? getStatusColor(t) +
                                  " shadow-md transform scale-105"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-[#3B82F6] hover:text-[#3B82F6] hover:shadow-sm"
                                  }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border ${getStatusColor(record.type)}`}
                          >
                            {record.type}
                          </span>
                        )}
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        {isValidDate &&
                          record.type !== "ALPHA" &&
                          record.type !== "PRESENT" ? (
                          <Input
                            placeholder="Add optional description..."
                            value={record.description || ""}
                            onChange={(e) =>
                              handleAttendanceChange(
                                student.id,
                                "description",
                                e.target.value
                              )
                            }
                            className="h-10 max-w-md text-sm border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                          />
                        ) : !isValidDate && record.description ? (
                          <span className="text-gray-600 text-sm italic">
                            {record.description}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-16">
                      <div className="text-center space-y-3">
                        <Users className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="text-gray-400 font-medium">
                          No students found in this class
                        </p>
                        <p className="text-gray-400 text-sm">
                          Please check your homeroom assignment
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-[#E5E7EB]">
            {students.map((student, index) => {
              const record = attendanceMap[student.id] || { type: "present" };

              return (
                <div
                  key={student.id}
                  className="p-4 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-semibold text-xs">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-[#111827] text-sm truncate">
                        {student.name}
                      </span>
                    </div>

                    {isValidDate && (
                      <div className="grid grid-cols-2 gap-2 grid-rows-2 pt-2">
                        {(
                          ["PRESENT", "SICK", "PERMISSION", "ALPHA"] as const
                        ).map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              handleAttendanceChange(student.id, "type", t)
                            }
                            className={`flex-1 min-w-[60px] px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 border ${record.type === t
                              ? getStatusColor(t) + " shadow-md"
                              : "bg-white text-gray-500 border-gray-200"
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="col-span-2 pt-2">
                      {isValidDate &&
                        record.type !== "ALPHA" &&
                        record.type !== "PRESENT" ? (
                        <Input
                          placeholder="Add note..."
                          value={record.description || ""}
                          onChange={(e) =>
                            handleAttendanceChange(
                              student.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="h-9 w-full text-sm border-gray-200 focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                        />
                      ) : !isValidDate && record.description ? (
                        <p className="text-gray-600 text-sm italic bg-gray-50 p-2 rounded">
                          {record.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {students.length === 0 && (
              <div className="p-8">
                <div className="text-center space-y-3">
                  <Users className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-gray-400 font-medium">No students found</p>
                  <p className="text-gray-400 text-sm">
                    Please check your homeroom assignment
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
