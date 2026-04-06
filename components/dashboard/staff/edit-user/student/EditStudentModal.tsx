"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { UserDataTable } from "./edit-user-student-table/UserDataTable";
import {
  studentColumns,
  StudentTableData,
} from "./edit-user-student-table/StudentColumns";
import { useClassroom } from "@/services/classroom/classroom-hooks";
import { getFullClassLabel, getGradeNumber } from "@/lib/utils/labels";
import { ClassSection, Grade, Major } from "@/lib/constants/class";
import { useStudent } from "@/services/student/student-hooks";
import LoadingForComponent from "@/components/ui/LoadingForComponent";
import DeleteUserModal from "../../delete-user/DeleteUserModal";
import EditStudentFormModal from "./EditStudentFormModal";
import AdvanceClassModal from "./AdvanceClassModal";

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditStudentModal = ({ open, onOpenChange }: EditStudentModalProps) => {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentTableData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAdvanceClassModalOpen, setIsAdvanceClassModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleEdit = (student: StudentTableData) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDelete = (student: StudentTableData) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const columns = React.useMemo(
    () => studentColumns(handleEdit, handleDelete),
    [],
  );

  const { data: classroomData } = useClassroom();

  const sortedClassroomData = classroomData?.sort((a, b) => {
    const transformFirstData = Number(getGradeNumber(a.grade));
    const transformSecondData = Number(getGradeNumber(b.grade));

    return transformFirstData - transformSecondData;
  });

  const [grade, major, section] = selectedValue ? selectedValue.split("-") : [];

  const studentQueryParams = {
    isPaginationActive: false,
    page: 0,
    grade: grade as Grade,
    major: major as Major,
    section: section as ClassSection,
    search: "",
  };

  const { data: studentData, isLoading } = useStudent(studentQueryParams, {
    enabled: !!selectedValue,
    staleTime: 5 * 60 * 1000,
  });

  const transformStudentData = React.useMemo(() => {
    return (
      studentData?.students?.map((student) => ({
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
      })) ?? []
    );
  }, [studentData]);

  // const getStudentIds = (importedData: string[]) => {
  //   setSelectedStudentIds(importedData);
  // };

  return (
    <div className="w-full h-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Update Student Profile
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Select
              value={selectedValue}
              onValueChange={setSelectedValue}
              disabled={classroomData?.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Classes: </SelectLabel>
                  {sortedClassroomData?.map((classroom) => (
                    <SelectItem
                      key={classroom.id}
                      value={`${classroom.grade}-${classroom.major}-${classroom.section}`}
                    >
                      {getFullClassLabel(
                        classroom.grade,
                        classroom.major,
                        classroom.section as ClassSection,
                      )}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              className={`w-full ${!selectedValue ? "cursor-not-allowed" : ""}`}
              disabled={!selectedValue}
              onClick={() => setIsAdvanceClassModalOpen((prev) => !prev)}
            >
              Advance Class
            </Button>
          </div>

          {isLoading ? (
            <LoadingForComponent />
          ) : (
            <UserDataTable
              columns={columns}
              data={transformStudentData}
              onSelectionChange={setSelectedStudentIds}
            />
          )}

          <DeleteUserModal
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            userId={selectedStudent?.id as string}
            username={selectedStudent?.name as string}
            userType="STUDENT"
          />

          <EditStudentFormModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            userId={selectedStudent?.id as string}
            username={selectedStudent?.name as string}
          />

          <AdvanceClassModal
            onOpenChange={setIsAdvanceClassModalOpen}
            open={isAdvanceClassModalOpen}
            classroomData={sortedClassroomData}
            currentClassroom={selectedValue}
            currentQueryParams={studentQueryParams}
            studentIds={selectedStudentIds}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditStudentModal;
