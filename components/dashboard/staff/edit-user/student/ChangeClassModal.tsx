"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ClassroomWithTeacher } from "@/services/classroom/classroom-definitions";
import {
  SelectGroup,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { getFullClassLabel } from "@/lib/utils/labels";
import { ClassSection } from "@/lib/constants/class";
import {
  StudentQuerySchema,
  UpdateStudentsClassSchema,
} from "@/lib/zod/student";
import { useUpdateStudentsClass } from "@/hooks/student-hooks";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/getErrorMessage";

interface ChangeClassModalProps {
  open: boolean;
  onOpenChange: (bool: boolean) => void;
  classroomData: ClassroomWithTeacher[] | undefined;
  currentClassroom: string | undefined;
  currentQueryParams: StudentQuerySchema;
  studentIds: string[];
}

const ChangeClassModal = ({
  open,
  onOpenChange,
  classroomData,
  currentClassroom,
  currentQueryParams,
  studentIds,
}: ChangeClassModalProps) => {
  const [selectedClassroom, setSelectedClassroom] = useState<string>(
    currentClassroom ?? "",
  );

  const updateClass = useUpdateStudentsClass(currentQueryParams);

  const onSubmit = () => {
    try {
      // Notes: .find method return the element itself
      const matchedClassroom = classroomData?.find(
        (item) =>
          `${item.grade}-${item.major}-${item.section}` === selectedClassroom,
      );

      const classroomId = matchedClassroom?.id;

      if (!classroomId) {
        throw new Error("Something went wrong. Try again later");
      }

      if (selectedClassroom === currentClassroom) {
        throw new Error(
          "You're still in the same class. Please change it into something different",
        );
      }

      const data: UpdateStudentsClassSchema = {
        studentIds: studentIds,
        updatedClassId: classroomId,
      };

      updateClass.mutate(data);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || "test");
    }
  };

  useEffect(() => {
    if (open && currentClassroom) {
      setSelectedClassroom(currentClassroom);
    }
  }, [open, currentClassroom]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <form>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Advance Class</DialogTitle>
              <DialogDescription>
                After student(s) get class advancement, all of the student
                assessments data will be deleted
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="select-classroom">Select Classroom</Label>
                <Select
                  value={selectedClassroom}
                  onValueChange={setSelectedClassroom}
                  disabled={classroomData?.length === 0}
                  name="select-classroom"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Classes: </SelectLabel>
                      {classroomData?.map((classroom) => (
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
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" onClick={onSubmit}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
};

export default ChangeClassModal;
