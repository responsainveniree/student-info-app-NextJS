"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Role } from "@/lib/constants/roles";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

interface Attendance {
  date: string;
  type: string;
  description: string;
}

interface Student {
  id: string;
  name: string;
  attendances: Attendance[];
}

interface ClassroomData {
  students: Student[];
  totalStudents: number;
  stats: {
    sick: number;
    permission: number;
    alpha: number;
  };
}

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

interface ClassroomProps {
  session: Session;
}

type SortOption = "name-asc" | "name-desc" | "status";

const Classroom = ({ session }: ClassroomProps) => {
  const [data, setData] = useState<ClassroomData | null>(null);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate total pages based on API response
  const totalPages = data ? Math.ceil(data.totalStudents / ITEMS_PER_PAGE) : 0;

  // Stats from API response
  const stats = useMemo(() => {
    if (!data) return { total: 0, present: 0, sick: 0, permission: 0, alpha: 0 };

    const { totalStudents, stats: apiStats } = data;
    return {
      total: totalStudents,
      sick: apiStats.sick,
      permission: apiStats.permission,
      alpha: apiStats.alpha,
      present: totalStudents - (apiStats.sick + apiStats.permission + apiStats.alpha),
    };
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id && date) {
        setLoading(true);
        try {
          const response = await axios.get(`/api/teacher`, {
            params: {
              teacherId: session.user.id,
              date: date,
              page: currentPage,
            },
          });

          if (response.status === 200) {
            setData(response.data.data);
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Something went wrong.");
          console.error("Failed to fetch classroom data:", error);
          setData(null);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [session?.user?.id, date, currentPage]);

  // Each student only has one attendance per day
  const getAttendanceStatus = (attendances: Attendance[]) => {
    if (!attendances || attendances.length === 0) {
      return {
        label: "Present",
        type: "PRESENT",
        icon: CheckCircle,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    const attendance = attendances[0];
    switch (attendance.type) {
      case "PERMISSION":
        return {
          label: "Permission",
          type: "PERMISSION",
          icon: AlertCircle,
          color: "text-blue-700 bg-blue-50 border-blue-200",
        };
      case "SICK":
        return {
          label: "Sick",
          type: "SICK",
          icon: AlertCircle,
          color: "text-amber-700 bg-amber-50 border-amber-200",
        };
      case "ALPHA":
        return {
          label: "Alpha",
          type: "ALPHA",
          icon: XCircle,
          color: "text-red-700 bg-red-50 border-red-200",
        };
      default:
        return {
          label: "Present",
          type: "PRESENT",
          icon: CheckCircle,
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        };
    }
  };

  const sortedAndFilteredStudents = useMemo(() => {
    if (!data?.students) return [];

    let result = [...data.students];

    // Filter
    if (searchQuery) {
      result = result.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "status":
          const statusA = getAttendanceStatus(a.attendances).label;
          const statusB = getAttendanceStatus(b.attendances).label;
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    return result;
  }, [data?.students, sortBy, searchQuery]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (selectedDate <= new Date()) {
      setDate(e.target.value);
    }
  };

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
                Homeroom Class
              </h1>
              <p className="text-blue-100 text-sm">
                Manage student attendance and details
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
          {/* Card Header & Controls */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search students..."
                    className="pl-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <div className="w-full sm:w-auto flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={handleDateChange}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-[#111827] w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : sortedAndFilteredStudents.length > 0 ? (
              <>
                {/* Desktop Table View */}
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
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {sortedAndFilteredStudents.map((student) => {
                        console.log(student);
                        const status = getAttendanceStatus(student.attendances);
                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-blue-50/30 transition-colors duration-150"
                          >
                            <td className="px-6 lg:px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#1E40AF] flex items-center justify-center font-bold text-sm border border-[#BFDBFE]">
                                  {student.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-[#111827]">
                                  {student.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-8 py-5">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.color}`}
                              >
                                <status.icon className="w-4 h-4" />
                                <span className="font-medium text-sm">
                                  {status.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 lg:px-8 py-5">
                              <span className="text-gray-600 text-sm">
                                {student.attendances[0]?.description || (
                                  <span className="text-gray-400 italic">
                                    No description
                                  </span>
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-[#E5E7EB]">
                  {sortedAndFilteredStudents.map((student) => {
                    const status = getAttendanceStatus(student.attendances);
                    return (
                      <div
                        key={student.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#1E40AF] flex items-center justify-center font-bold text-sm border border-[#BFDBFE]">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {student.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                ID: {student.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div
                            className={`p-2 rounded-lg border ${status.color}`}
                          >
                            <status.icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm pl-[52px]">
                          <span
                            className={`font-medium px-2 py-0.5 rounded ${status.color.split(" ")[1]} ${status.color.split(" ")[0]} bg-opacity-20`}
                          >
                            {status.label}
                          </span>
                          <span className="text-gray-500 truncate max-w-[150px]">
                            {student.attendances[0]?.description || "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No students found</p>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Showing {currentPage * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min((currentPage + 1) * ITEMS_PER_PAGE, data?.totalStudents || 0)} of{" "}
                  {data?.totalStudents || 0} students
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0 || loading}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-gray-700 px-3">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default Classroom;
