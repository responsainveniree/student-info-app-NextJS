"use client";

import React, { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen } from "lucide-react";
import axios from "axios";
import { Role } from "@/lib/constants/roles";
import TeacherSummarySkeleton from "./TeacherSummarySkeleton";

interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    homeroomTeacherId: string | null;
    isHomeroomClassTeacher: boolean;
  };
}

interface TeacherSummaryProps {
  session: Session;
}

interface SummaryData {
  teachingClassesCount: number;
  teachingAssignmentsCount: number;
}

const TeacherSummary = ({ session }: TeacherSummaryProps) => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        try {
          const response = await axios.get(
            `/api/teacher`,
            {
              params: {
                teacherId: session.user.id,
              },
            }
          );

          if (response.status === 200) {
            const result = response.data.data;
            setData({
              teachingClassesCount: result.teachingClasses?.length || 0,
              teachingAssignmentsCount: result.teachingAssignments?.length || 0,
            });
          }
        } catch (error) {
          console.error("Failed to fetch summary data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [session?.user?.id]);

  if (loading) {
    return <TeacherSummarySkeleton />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      {/* Card 1: Total Teaching Classes */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {data?.teachingClassesCount || 0}
        </div>
        <div className="text-sm text-gray-500">Total Teaching Classes</div>
      </div>

      {/* Card 2: Total Assignments */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {data?.teachingAssignmentsCount || 0}
        </div>
        <div className="text-sm text-gray-500">Total Assignments</div>
      </div>

      {/* Card 3: Profile (Spans 2 cols on mobile, 1 on desktop) */}
      <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-6 rounded-2xl text-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {session.user.isHomeroomClassTeacher && (
            <span className="bg-emerald-500/20 px-2 py-1 rounded text-xs font-medium border border-emerald-400/30 text-emerald-100">
              Homeroom Teacher
            </span>
          )}
        </div>
        <div className="truncate text-xl font-bold mb-1">
          {session.user.name}
        </div>
        <div className="text-sm text-blue-100">{session.user.role}</div>
      </div>
    </div>
  );
};

export default TeacherSummary;
