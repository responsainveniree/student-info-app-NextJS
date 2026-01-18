"use client";
import { GraduationCap, BookOpen, Calendar } from "lucide-react";
import { AttendanceChart } from "../attendance/AttendanceChart";
import { ProblemPointChart } from "../problemPoint/ProblemPointChart";
import { ProblemPointList } from "../problemPoint/ProblemPointList";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ValidProblemPointType } from "@/lib/constants/problemPoint";
import { Skeleton } from "@/components/ui/skeleton";
import { Session } from "@/lib/types/session";

interface DashboardProps {
  session: Session;
}

type AttendanceStats = {
  type: "ALPHA" | "SICK" | "PERMISSION" | "LATE";
  date: number | Date;
};

type ProblemPointData = {
  category: ValidProblemPointType;
  description: string;
  point: number;
  date: string | Date;
};

const CATEGORY_COLORS_HEX: Record<string, string> = {
  LATE: "#F97316",
  INCOMPLETE_ATTRIBUTES: "#6B7280",
  DISCIPLINE: "#EF4444",
  ACADEMIC: "#3B82F6",
  SOCIAL: "#22C55E",
  OTHER: "#A855F7",
};

export default function ParentDashboard({ session }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [attendanceStats, setAttendanceStats] = useState({
    sick: [],
    permission: [],
    alpha: [],
    late: [],
  });
  const [problemPointRecords, setProblemPointRecords] = useState<
    ProblemPointData[]
  >([]);
  const [totalproblemPoint, setTotalProblemPoint] = useState(0);
  const [problemPointChartData, setProblemPointChartData] = useState<
    { name: string; value: number; color: string }[]
  >([]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/parent`, {
        params: {
          parentId: session.id,
        },
      });

      if (res.status === 200) {
        const {
          studentName,
          studentSubjects,
          attendanceStats,
          problemPointRecords,
        } = res.data.data;

        setStudentName(studentName);
        setSubjects(studentSubjects || []);

        // Group attendance data
        const grouped = attendanceStats.reduce(
          (acc: any, stat: AttendanceStats) => {
            const type = stat.type as keyof typeof acc;
            if (!acc[type.toString().toLowerCase()])
              acc[type.toString().toLowerCase()] = [];
            acc[type.toString().toLowerCase()].push(stat);
            return acc;
          },
          { sick: [], permission: [], alpha: [], late: [] }
        );

        setAttendanceStats(grouped);

        // Process Problem Points
        if (problemPointRecords) {
          const records = problemPointRecords;
          const totalPoint = records.reduce(
            (acc: any, record: ProblemPointData) => {
              return acc + record.point;
            },
            0
          );

          const ppChartDataMap: Record<string, number> = {};
          records.forEach((record: ProblemPointData) => {
            ppChartDataMap[record.category] =
              (ppChartDataMap[record.category] || 0) + record.point;
          });

          const ppChartData = Object.entries(ppChartDataMap).map(
            ([category, value]) => ({
              name: category.replace(/_/g, " "),
              value,
              color: CATEGORY_COLORS_HEX[category] || "#9CA3AF",
            })
          );

          setTotalProblemPoint(totalPoint);
          setProblemPointRecords(records);
          setProblemPointChartData(ppChartData);
        }
      }
    } catch (error) {
      console.error(`Error fetching parent dashboard data: ${error}`);
      toast.error("Something went wrong. Can't retrieve dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session.id]);

  if (loading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1: Total Subjects */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {subjects.length}
          </div>
          <div className="text-sm text-gray-500">Total Subjects</div>
        </div>

        {/* Card 2: Student Profile */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-6 rounded-2xl text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="truncate text-xl font-bold mb-1">
            {`${studentName} Peformance` || "Loading..."}
          </div>
          <div className="text-sm text-blue-100">Student</div>
        </div>
      </div>

      {/* Attendance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Attendance Statistics (Donut Chart) */}
        <div className="bg-white rounded-2xl border max-h-[500px] border-[#E5E7EB] shadow-sm p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-6">
            Attendance Statistics (Absences)
          </h3>
          <div className="flex items-center justify-center">
            <AttendanceChart data={chartData} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">
              Total Absences:{" "}
              <span className="font-bold text-gray-900">{totalAbsence}</span>
            </p>
          </div>
        </div>

        {/* Attendance Information List */}
        <div className="bg-white rounded-lg shadow p-6 max-h-[500px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Attendance Information</h2>
          {totalAbsence === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No absence records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Sick */}
              {attendanceStats.sick.length > 0 && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-semibold text-yellow-800">
                      Sick ({attendanceStats.sick.length})
                    </h3>
                  </div>
                  <div className="space-y-1 ml-4">
                    {attendanceStats.sick.map((stat: { date: Date }, index) => (
                      <div key={index} className="text-sm text-yellow-700">
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
              )}

              {/* Permission */}
              {attendanceStats.permission.length > 0 && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-blue-800">
                      Permission ({attendanceStats.permission.length})
                    </h3>
                  </div>
                  <div className="space-y-1 ml-4">
                    {attendanceStats.permission.map(
                      (stat: { date: Date }, index) => (
                        <div key={index} className="text-sm text-blue-700">
                          {new Date(stat.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Alpha */}
              {attendanceStats.alpha.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-red-800">
                      Alpha/Unexcused ({attendanceStats.alpha.length})
                    </h3>
                  </div>
                  <div className="space-y-1 ml-4">
                    {attendanceStats.alpha.map(
                      (stat: { date: Date }, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {new Date(stat.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Late */}
              {attendanceStats.late.length > 0 && (
                <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="font-semibold text-orange-800">
                      Late ({attendanceStats.late.length})
                    </h3>
                  </div>
                  <div className="space-y-1 ml-4">
                    {attendanceStats.late.map((stat: { date: Date }, index) => (
                      <div key={index} className="text-sm text-orange-700">
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Problem Points Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Chart */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-6">
            Problem Points Breakdown
          </h3>
          <div className="flex items-center justify-center">
            <ProblemPointChart data={problemPointChartData} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">
              Total Problem Points:{" "}
              <span className="font-bold text-red-600">
                {totalproblemPoint}
              </span>
            </p>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#111827] mb-6">
            Problem Points History
          </h3>
          <ProblemPointList data={problemPointRecords} />
        </div>
      </div>
    </div>
  );
}
