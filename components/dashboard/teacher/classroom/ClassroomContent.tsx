"use client";

import React, { useState } from "react";
import { ClipboardList, BarChart3, Users } from "lucide-react";
import AttendanceManagerModal from "./AttendanceManagerModal";
import StudentAttendanceSummaryModal from "./StudentAttendanceSummaryModal";
import { Session } from "@/lib/types/session";

interface ClassroomContentProps {
  session: Session;
}

const ClassroomContent = ({ session }: ClassroomContentProps) => {
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden mt-20 md:mt-0">
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4">
              <Users className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Classroom Management</h1>
            <p className="text-blue-100">
              Manage student attendance and view class summaries
            </p>
          </div>

          {/* Action Cards */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Attendance Card */}
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <ClipboardList className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Daily Attendance
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Record and modify student attendance for any date. Track
                    present, sick, permission, alpha, and late statuses.
                  </p>
                </div>
              </button>

              {/* Summary Card */}
              <button
                onClick={() => setIsSummaryModalOpen(true)}
                className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Attendance Summary
                  </h2>
                  <p className="text-gray-600 text-sm">
                    View comprehensive attendance statistics for all students.
                    Filter by month to analyze trends and patterns.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendanceManagerModal
        open={isAttendanceModalOpen}
        onOpenChange={setIsAttendanceModalOpen}
        session={session}
      />
      <StudentAttendanceSummaryModal
        isOpen={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
        session={session}
      />
    </div>
  );
};

export default ClassroomContent;
