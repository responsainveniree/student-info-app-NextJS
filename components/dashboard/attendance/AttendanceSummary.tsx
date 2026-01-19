import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { abbreviateName } from "@/lib/utils/nameFormatter";
import { Session } from "@/lib/types/session";
import axios from "axios";
import { AttendanceType } from "@/prisma/prisma/src/generated/prisma/enums";
import { ITEMS_PER_PAGE } from "@/lib/constants/pagination";
import { SortOrder } from "@/lib/constants/sortingAndFilltering";

type StudentClient = {
  name: string;
  attendanceSummary: {
    alpha: number;
    permission: number;
    sick: number;
    late: number;
  };
};

type StudentServer = {
  name: string;
  attendanceSummary: [
    {
      type: AttendanceType;
      _count: number;
    },
  ];
};

type AttendanceTypeClient = "alpha" | "permission" | "sick" | "late";

interface AttendanceSummaryProps {
  session: Session;
  setHomeroomClass: ({
    grade,
    major,
    classNumber,
  }: {
    grade: string;
    major: string;
    classNumber: string;
  }) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const AttendanceSummary = ({
  session,
  setHomeroomClass,
}: AttendanceSummaryProps) => {
  const [students, setStudents] = useState<StudentClient[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  const [loading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(totalStudents / 10);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get("/api/attendance/summary", {
          params: {
            id: session.id,
            page,
            sortOrder,
            effectiveSearchQuery,
          },
        });

        if (response.status === 200) {
          setHomeroomClass({
            grade: response.data.class.grade,
            major: response.data.class.major,
            classNumber: response.data.class.classNumber,
          });

          setTotalStudents(response.data.totalStudents);

          const studentListServer = response.data.students;

          const studentListClient: StudentClient[] = [];

          studentListServer.forEach((student: StudentServer) => {
            const attendanceSummary = {
              alpha: 0,
              permission: 0,
              sick: 0,
              late: 0,
            };

            student.attendanceSummary.forEach((attendance) => {
              const normalizeAttendanceStatus =
                attendance.type.toLocaleLowerCase() as AttendanceTypeClient;

              attendanceSummary[normalizeAttendanceStatus] = attendance._count;
            });

            studentListClient.push({ name: student.name, attendanceSummary });
          });

          setStudents(studentListClient);
        }
      } catch (error) {
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session.id, effectiveSearchQuery, sortOrder, page]);

  useEffect(() => {
    setPage(0);
  }, [effectiveSearchQuery, sortOrder]);

  return (
    <div className="space-y-6 overflow-x-auto p-2">
      {/* Card Header & Controls */}
      <div className="border-b pb-6 border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full lg:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search students..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter at least 3 characters to search
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
            >
              <SelectTrigger className="w-full lg:w-[250px] bg-white">
                <ArrowUpDown className="w-4 h-4 mr-2 hidden lg:block" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Name (A-Z)</SelectItem>
                <SelectItem value="desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Class Information */}

      {/* Student Table */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="text-center font-semibold text-amber-700">
                Sick
              </TableHead>
              <TableHead className="text-center font-semibold text-blue-700">
                Permission
              </TableHead>
              <TableHead className="text-center font-semibold text-red-700">
                Alpha
              </TableHead>
              <TableHead className="text-center font-semibold text-orange-700">
                Late
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {abbreviateName(student.name)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                    {student.attendanceSummary.sick}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {student.attendanceSummary.permission}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                    {student.attendanceSummary.alpha}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                    {student.attendanceSummary.late}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {page * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min((page + 1) * ITEMS_PER_PAGE, totalStudents)} of{" "}
            {totalStudents} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm font-medium text-gray-700 px-3">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
              disabled={page >= totalPages - 1 || loading}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary;
