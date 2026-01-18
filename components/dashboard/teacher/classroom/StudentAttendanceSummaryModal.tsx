"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Users, BarChart3 } from "lucide-react";

interface StudentAttendanceSummaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for UI demonstration
const mockStudents = [
  {
    id: "1",
    name: "John Doe",
    present: 18,
    sick: 1,
    permission: 1,
    alpha: 0,
    late: 2,
  },
  {
    id: "2",
    name: "Jane Smith",
    present: 20,
    sick: 0,
    permission: 1,
    alpha: 1,
    late: 0,
  },
  {
    id: "3",
    name: "Bob Johnson",
    present: 19,
    sick: 2,
    permission: 0,
    alpha: 0,
    late: 1,
  },
  {
    id: "4",
    name: "Alice Brown",
    present: 21,
    sick: 0,
    permission: 0,
    alpha: 0,
    late: 1,
  },
  {
    id: "5",
    name: "Charlie Wilson",
    present: 17,
    sick: 1,
    permission: 2,
    alpha: 1,
    late: 1,
  },
];

const StudentAttendanceSummaryModal = ({
  isOpen,
  onOpenChange,
}: StudentAttendanceSummaryModalProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("january");

  const months = [
    { value: "january", label: "January 2026" },
    { value: "february", label: "February 2026" },
    { value: "march", label: "March 2026" },
    { value: "april", label: "April 2026" },
    { value: "may", label: "May 2026" },
    { value: "june", label: "June 2026" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Student Attendance Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Month Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Month:</span>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">95</div>
              <div className="text-xs text-emerald-600 mt-1">Total Present</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">4</div>
              <div className="text-xs text-amber-600 mt-1">Total Sick</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">4</div>
              <div className="text-xs text-blue-600 mt-1">Total Permission</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-700">2</div>
              <div className="text-xs text-red-600 mt-1">Total Alpha</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">5</div>
              <div className="text-xs text-orange-600 mt-1">Total Late</div>
            </div>
          </div>

          {/* Student Table */}
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Student Name</TableHead>
                  <TableHead className="text-center font-semibold text-emerald-700">
                    Present
                  </TableHead>
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
                {mockStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                        {student.present}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                        {student.sick}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {student.permission}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                        {student.alpha}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                        {student.late}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentAttendanceSummaryModal;
