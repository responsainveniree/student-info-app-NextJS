"use client";

import { GraduationCap, BookOpen, Calendar } from "lucide-react";
import { AttendanceChart } from "../attendance/AttendanceChart";
import { DemeritPointChart } from "../demerit-point/DemeritPointChart";
import { DemeritPointList } from "../demerit-point/DemeritPointList";
import React from "react";
import axios from "axios";
import { getRoleDisplayName } from "../../../lib/constants/roles";
import { ValidInfractionType } from "../../../lib/constants/discplinary";
import { Skeleton } from "../../ui/skeleton";
import { Session } from "../../../lib/types/session";
import { useQuery } from "@tanstack/react-query";
import { STUDENT_KEY } from "../../../lib/constants/tanStackQueryKeys";

interface DashboardProps {
  session: Session;
}

type AttendanceStats = {
  type: "ALPHA" | "SICK" | "PERMISSION" | "LATE";
  date: string;
};

type DemeritPointData = {
  category: ValidInfractionType;
  description: string;
  points: number; // match backend
  date: string;
};

interface StudentDashboardResponse {
  message: string;
  data: {
    attendanceRecords: AttendanceStats[];
    demeritPointRecords: DemeritPointData[];
    totalSubject: number;
  };
}

const CATEGORY_COLORS_HEX: Record<string, string> = {
  LATE: "#F97316",
  UNIFORM: "#6B7280",
  DISCIPLINE: "#EF4444",
  ACADEMIC: "#3B82F6",
  SOCIAL: "#22C55E",
  OTHER: "#A855F7",
};

const StudentDashboard = ({ session }: DashboardProps) => {
  const role = getRoleDisplayName(session.role);

  const { data, isLoading } = useQuery<StudentDashboardResponse>({
    queryKey: STUDENT_KEY.all,
    queryFn: async () => {
      const res = await axios.get<StudentDashboardResponse>(
        "/api/student/profile",
      );
      return res.data;
    },
    enabled: !!session?.id,
  });

  const attendanceRecords = data?.data.attendanceRecords ?? [];
  const problemPointRecords = data?.data.demeritPointRecords ?? [];
  const totalSubject = data?.data.totalSubject ?? 0;

  const attendanceStats = attendanceRecords.reduce(
    (acc, stat) => {
      const key = stat.type.toLowerCase() as keyof typeof acc;
      acc[key].push(stat);
      return acc;
    },
    {
      sick: [] as AttendanceStats[],
      permission: [] as AttendanceStats[],
      alpha: [] as AttendanceStats[],
      late: [] as AttendanceStats[],
    },
  );

  const chartData = [
    { name: "Sick", value: attendanceStats.sick.length, color: "#FBBF24" },
    {
      name: "Permission",
      value: attendanceStats.permission.length,
      color: "#3B82F6",
    },
    { name: "Alpha", value: attendanceStats.alpha.length, color: "#DC2626" },
    { name: "Late", value: attendanceStats.late.length, color: "#F97316" },
  ];

  const totalAbsence =
    attendanceStats.sick.length +
    attendanceStats.permission.length +
    attendanceStats.alpha.length +
    attendanceStats.late.length;

  const totalDemeritPoint = problemPointRecords.reduce(
    (acc, record) => acc + record.points,
    0,
  );

  const demeritMap: Record<string, number> = {};
  problemPointRecords.forEach((record) => {
    demeritMap[record.category] =
      (demeritMap[record.category] || 0) + record.points;
  });

  const demeritPointChartData = Object.entries(demeritMap).map(
    ([category, value]) => ({
      name: category.replace(/_/g, " "),
      value,
      color: CATEGORY_COLORS_HEX[category] || "#9CA3AF",
    }),
  );

  const getStatusStyle = (status: any) => {
    switch (status) {
      case "SICK":
        return "bg-yellow-100 text-yellow-800";
      case "ALPHA":
        return "bg-red-100 text-red-800";
      case "PERMISSION":
        return "bg-blue-100 text-blue-800";
      case "LATE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {totalSubject}
          </div>
          <div className="text-sm text-gray-500">Total Subjects</div>
        </div>

        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-6 rounded-2xl text-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="truncate text-xl font-bold mb-1">{session.name}</div>
          <div className="text-sm text-blue-100">{role}</div>
        </div>
      </div>

      {/* Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-6">Attendance Statistics</h3>
          <AttendanceChart data={chartData} />
          <div className="mt-4 text-center text-sm text-gray-500">
            Total Absences:{" "}
            <span className="font-bold text-gray-900">{totalAbsence}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 max-h-[500px] overflow-y-auto">
          <h3 className="text-xl font-bold mb-6">Attendance Information</h3>

          {totalAbsence === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No absence records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(attendanceStats).map(
                ([key, records]) =>
                  records.length > 0 && (
                    <div
                      key={key}
                      className={`${getStatusStyle(records[0].type)} px-4 py-3 rounded-lg`}
                    >
                      <h4 className="font-semibold capitalize text-sm mb-2">
                        {key.charAt(0).toUpperCase() + key.slice(1)} (
                        {records.length})
                      </h4>
                      <div className="space-y-1">
                        {records.map((stat, index) => (
                          <div key={index} className="text-sm opacity-80">
                            {new Date(stat.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Demerit Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-6">Demerit Points Breakdown</h3>
          <DemeritPointChart data={demeritPointChartData} />
          <div className="mt-4 text-center text-sm text-gray-500">
            Total Points:{" "}
            <span className="font-bold text-red-600">{totalDemeritPoint}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-6">Demerit Points History</h3>
          <DemeritPointList data={problemPointRecords} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
