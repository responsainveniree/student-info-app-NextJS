"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingForComponent from "@/components/ui/LoadingForComponent";
import { useTeachers } from "@/features/teacher/hooks/useTeachers";
import { useMemo, useState } from "react";
import { UserDataTable } from "./tanstack-table/DataTable";
import { UserTableData } from "../types/user";
import { tableColumns } from "./tanstack-table/columns";

interface EditTeacherModalProps {
  open: boolean;
  onOpenChange: (bool: boolean) => void;
}

const EditTeacherModal = ({ open, onOpenChange }: EditTeacherModalProps) => {
  const { data: teacherData, isLoading } = useTeachers("all", {
    staleTime: 5 * 60 * 1000,
  });
  const [selectedStudent, setSelectedStudent] = useState<UserTableData | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const handleEdit = (teacher: UserTableData) => {
    setSelectedStudent(teacher);
    setIsEditModalOpen(true);
  };

  const handleDelete = (teacher: UserTableData) => {
    setSelectedStudent(teacher);
    setIsDeleteModalOpen(true);
  };

  const columns = useMemo(() => tableColumns(handleEdit, handleDelete), []);

  const transformTeacherData = useMemo(() => {
    return (
      teacherData?.map((teacher) => {
        return {
          id: teacher.user.id,
          name: teacher.user.name,
          email: teacher.user.email,
        };
      }) ?? []
    );
  }, [teacherData]);

  return (
    <div className="w-full h-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Update Teacher Profile
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <LoadingForComponent />
          ) : (
            <UserDataTable
              columns={columns}
              data={transformTeacherData}
              onSelectionChange={setSelectedTeacherIds}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditTeacherModal;
