"use client";
import { GraduationCap, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { AttendanceChart } from "../attendance/AttendanceChart";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getRoleDisplayName } from "@/lib/constants/roles";

type Session = {
  name: string;
  id: string;
  homeroomTeacherId: string | null;
  role: string;
};

interface DashboardProps {
  session: Session;
}

type AttendanceStats = { type: "ALPHA" | "SICK" | "PERMISSION"; date: number | Date };

const StudentDashboard = ({ session }: DashboardProps) => {
  const role = getRoleDisplayName(session.role)
  const [attendanceStats, setAttendanceStats] = useState({
    sick: [],
    permission: [],
    alpha: [],
  });

  const chartData = [
    { name: "Sick", value: attendanceStats.sick.length, color: "#FBBF24" },
    {
      name: "Permission",
      value: attendanceStats.permission.length,
      color: "#3B82F6",
    },
    { name: "Alpha", value: attendanceStats.alpha.length, color: "#DC2626" },
  ];

  const totalAbsence =
    attendanceStats.sick.length +
    attendanceStats.permission.length +
    attendanceStats.alpha.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `api/student-attendance/student-attendance-data?studentId=${session.id}`
        );

        console.log(res)
        if (res.status === 200) {
          // Group data by type in one operation
          const grouped = res.data.data.reduce(
            (acc: any, stat: AttendanceStats) => {
              const type = stat.type as keyof typeof acc;
              console.log(type)
              if (!acc[type.toString().toLowerCase()]) acc[type.toString().toLowerCase()] = [];
              acc[type.toString().toLowerCase()].push(stat);
              return acc;
            },
            { sick: [], permission: [], alpha: [] }
          );

          // Single setState call
          setAttendanceStats(grouped);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong. Can't retrieve attendance data");
      }
    };

    fetchData();
  }, [session.id]);


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">
            Welcome back, {session.name}!
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Here's what's happening with your studies today
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E3A8A]/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E3A8A]" />
            </div>
            <span className="text-xl sm:text-2xl">📚</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-1">
            -
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">Total Subjects</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#FBBF24]" />
            </div>
            <span className="text-xl sm:text-2xl">📈</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#111827] mb-1">
            -
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">Average Score</p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-4 sm:p-6 rounded-2xl text-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl">🎓</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1">Student</h3>
          <p className="text-xs sm:text-sm text-blue-100">
            {role}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Attendance Statistics (Donut Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border max-h-[500px] border-[#E5E7EB] shadow-sm p-4 sm:p-6">
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

        {/* Attendance Information */}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
