"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Calendar, Save, Search, Users } from "lucide-react";

interface EditAttendanceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

// Mock data for UI demonstration
const mockStudents = [
    { id: "1", name: "John Doe", type: "PRESENT", description: "" },
    { id: "2", name: "Jane Smith", type: "SICK", description: "Flu" },
    { id: "3", name: "Bob Johnson", type: "PRESENT", description: "" },
    { id: "4", name: "Alice Brown", type: "PERMISSION", description: "Family event" },
    { id: "5", name: "Charlie Wilson", type: "LATE", description: "" },
];

const getStatusColor = (type: string) => {
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

const EditAttendanceModal = ({
    isOpen,
    onOpenChange,
}: EditAttendanceModalProps) => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState(mockStudents);

    const handleTypeChange = (studentId: string, newType: string) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, type: newType } : s))
        );
    };

    const handleDescriptionChange = (studentId: string, description: string) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, description } : s))
        );
    };

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Users className="w-5 h-5 text-blue-600" />
                        Edit Attendance
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search students..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold w-12">#</TableHead>
                                    <TableHead className="font-semibold">Student Name</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student, index) => (
                                    <TableRow key={student.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-xs">
                                                {index + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={student.type}
                                                onValueChange={(value) =>
                                                    handleTypeChange(student.id, value)
                                                }
                                            >
                                                <SelectTrigger
                                                    className={`w-36 h-9 font-semibold ${getStatusColor(student.type)}`}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PRESENT">
                                                        <span className="font-semibold text-emerald-700">
                                                            PRESENT
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="SICK">
                                                        <span className="font-semibold text-amber-700">
                                                            SICK
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="PERMISSION">
                                                        <span className="font-semibold text-blue-700">
                                                            PERMISSION
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="ALPHA">
                                                        <span className="font-semibold text-red-700">
                                                            ALPHA
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="LATE">
                                                        <span className="font-semibold text-orange-700">
                                                            LATE
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {student.type !== "PRESENT" &&
                                                student.type !== "ALPHA" &&
                                                student.type !== "LATE" ? (
                                                <Input
                                                    placeholder="Add note..."
                                                    value={student.description}
                                                    onChange={(e) =>
                                                        handleDescriptionChange(student.id, e.target.value)
                                                    }
                                                    className="h-9 max-w-xs"
                                                />
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">No students found</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Save className="w-4 h-4" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditAttendanceModal;
