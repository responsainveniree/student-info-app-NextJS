"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTeachers } from "@/features/teacher/hooks/useTeachers";

interface EditTeacherModalProps {
  open: boolean;
  onOpenChange: (bool: boolean) => void;
}

const EditTeacherModal = ({ open, onOpenChange }: EditTeacherModalProps) => {
  const { data: teacherData, isLoading } = useTeachers("all");

  // TODO: Work on Teacher Table

  return (
    <div className="w-full h-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[70vw]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Update Teacher Profile
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditTeacherModal;
