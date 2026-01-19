"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import AttendanceSummary from "../../attendance/AttendanceSummary";
import { Session } from "@/lib/types/session";
import {
  formatClassNumber,
  GRADE_DISPLAY_MAP,
  MAJOR_DISPLAY_MAP,
} from "@/lib/utils/labels";
import { ClassNumber } from "@/lib/constants/class";

interface StudentAttendanceSummaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
}

// Mock data for UI demonstration

const StudentAttendanceSummaryModal = ({
  isOpen,
  onOpenChange,
  session,
}: StudentAttendanceSummaryModalProps) => {
  const [homeroomClass, setHomeroomClass] = useState({
    grade: "",
    major: "",
    classNumber: "",
  });

  const formattedClass = `${GRADE_DISPLAY_MAP[homeroomClass.grade]} ${MAJOR_DISPLAY_MAP[homeroomClass.major]} ${formatClassNumber(homeroomClass.classNumber as ClassNumber) === "none" ? "" : formatClassNumber(homeroomClass.classNumber as ClassNumber)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Student Attendance Summary | {formattedClass}
          </DialogTitle>
        </DialogHeader>

        {/* Main */}
        <AttendanceSummary
          session={session}
          setHomeroomClass={setHomeroomClass}
        />

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentAttendanceSummaryModal;
