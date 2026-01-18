"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import AttendanceManager from "../../attendance/AttendanceManager";
import { Session } from "@/lib/types/session";

interface AttendanceManagerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: Session;
}

export default function AttendanceManagerModal({
    open,
    onOpenChange,
    session,
}: AttendanceManagerModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[90vh] overflow-y-auto p-0 md:p-6">
                <DialogHeader className="px-6 py-4 md:px-0 md:py-0">
                    <DialogTitle>Daily Attendance Management</DialogTitle>
                    <DialogDescription>
                        Record and manage student attendance.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-2 h-full">
                    <AttendanceManager session={session} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
