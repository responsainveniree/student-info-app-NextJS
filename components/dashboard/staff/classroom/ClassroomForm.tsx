"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../ui/form";
import { Spinner } from "../../../ui/spinner";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CLASS_SECTION, GRADES, MAJORS } from "../../../../lib/constants/class";
import {
  GRADE_DISPLAY_MAP,
  MAJOR_DISPLAY_MAP,
  SECTION_DISPLAY_MAP,
} from "../../../../lib/utils/labels";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { CLASSROOM_KEYS } from "../../../../lib/constants/tanStackQueryKeys";

// Single classroom schema. NOTES: What's the difference between classScheam in the zod file is that classroomSchema(In this file) has homeroomTeacherId
const classroomSchema = z.object({
  grade: z.enum(GRADES),
  major: z.enum(MAJORS),
  section: z.enum(CLASS_SECTION),
  homeroomTeacherId: z.string().optional(),
});

// Form schema supporting array of classrooms
const formSchema = z.object({
  classrooms: z
    .array(classroomSchema)
    .min(1, "At least one classroom is required"),
});

type ClassroomFormValues = z.infer<typeof formSchema>;

interface ClassroomFormProps {
  mode: "create" | "edit";
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ClassroomForm = ({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: ClassroomFormProps) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classrooms: [
        {
          grade: "TENTH",
          major: "ACCOUNTING",
          section: "none",
          homeroomTeacherId: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "classrooms",
  });

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.reset({
        classrooms: [
          {
            grade: initialData.grade,
            major: initialData.major,
            section: initialData.section,
            homeroomTeacherId: initialData.homeroomTeacherId || undefined,
          },
        ],
      });
    }
  }, [mode, initialData, form]);

  // Fetch teachers
  const { data: teacherData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: CLASSROOM_KEYS.nonHomeroom(),
    queryFn: async () => {
      const response = await axios.get("/api/teacher?get=nonHomeroom");
      return response.data.data;
    },
  });

  const availableTeachers = React.useMemo(() => {
    let teachers = teacherData || [];
    // If editing and we have a current teacher, make sure they are in the list
    if (mode === "edit" && initialData?.homeroomTeacher?.user) {
      const currentTeacherIncluded = teachers.some(
        (t: any) => t.user.id === initialData.homeroomTeacherId,
      );
      if (!currentTeacherIncluded) {
        teachers = [
          ...teachers,
          {
            user: {
              id: initialData.homeroomTeacherId,
              name:
                initialData.homeroomTeacher?.user?.name || "Current Teacher",
            },
          },
        ];
      }
    }
    return teachers;
  }, [teacherData, mode, initialData]);

  const createMutation = useMutation({
    mutationFn: async (values: ClassroomFormValues) => {
      // API expects array
      const payload = values.classrooms.map((c) => ({
        ...c,
        // Ensure explicit undefined or null handling if needed by API validation
      }));

      const response = await axios.post("/api/staff/classroom", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Classrooms created successfully");
      form.reset();
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: CLASSROOM_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLASSROOM_KEYS.nonHomeroom() });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to create classrooms";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  function compareClassroomData(intialData: any, editedData: any) {
    const isGradeChanged = intialData.grade !== editedData.grade;

    const isMajorChanged = intialData.major !== editedData.major;

    const isClassSectionChanged = intialData.section !== editedData.section;

    const isTeacherIdChanged =
      intialData.homeroomTeacherId !==
      (editedData.homeroomTeacherId == undefined
        ? null
        : editedData.homeroomTeacherId);

    return (
      isGradeChanged ||
      isMajorChanged ||
      isClassSectionChanged ||
      isTeacherIdChanged
    );
  }

  const updateMutation = useMutation({
    mutationFn: async (values: ClassroomFormValues) => {
      if (!initialData?.id) throw new Error("No ID for update");

      // Edit mode only has one item in array
      const item = values.classrooms[0];

      const hasChanged = compareClassroomData(initialData, item);

      if (!hasChanged) {
        return { skip: true, message: "No changes detected" };
      }

      const payload = {
        id: initialData.id,
        classSchema: {
          grade: item.grade,
          major: item.major,
          section: item.section,
        },
        homeroomTeacherId:
          item.homeroomTeacherId === "unassigned"
            ? undefined
            : item.homeroomTeacherId,
      };

      const response = await axios.patch("/api/staff/classroom", payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res?.skip) {
        toast.info(res.message);
        if (onSuccess) onSuccess();
        return;
      }
      toast.success(res.message);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: CLASSROOM_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLASSROOM_KEYS.nonHomeroom() });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update classroom";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values: ClassroomFormValues) => {
    if (mode === "create") {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
      {isLoading &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
            <Spinner />
          </div>,
          document.body,
        )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-white p-6 rounded-xl border shadow-sm space-y-4 relative"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">
                    {mode === "create"
                      ? `Classroom #${index + 1}`
                      : "Edit Classroom"}
                  </h3>
                  {mode === "create" && fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grade */}
                  <FormField
                    control={form.control}
                    name={`classrooms.${index}.grade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {GRADE_DISPLAY_MAP[grade]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Major */}
                  <FormField
                    control={form.control}
                    name={`classrooms.${index}.major`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Major</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select major" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MAJORS.map((major) => (
                              <SelectItem key={major} value={major}>
                                {MAJOR_DISPLAY_MAP[major]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Section */}
                  <FormField
                    control={form.control}
                    name={`classrooms.${index}.section`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CLASS_SECTION.map((section) => (
                              <SelectItem key={section} value={section}>
                                {SECTION_DISPLAY_MAP[section] || section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Homeroom Teacher */}
                  <FormField
                    control={form.control}
                    name={`classrooms.${index}.homeroomTeacherId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Homeroom Teacher (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingTeachers}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoadingTeachers
                                    ? "Loading..."
                                    : "Select teacher"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              No Homeroom Teacher
                            </SelectItem>
                            {availableTeachers.map((teacher: any) => (
                              <SelectItem
                                key={teacher.user.id}
                                value={teacher.user.id}
                              >
                                {teacher.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {mode === "create" && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  grade: "TENTH",
                  major: "SOFTWARE_ENGINEERING",
                  section: "1",
                  homeroomTeacherId: undefined,
                })
              }
              className="w-full border-dashed border-2 py-6 text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Classroom
            </Button>
          )}

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t mt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {mode === "create" ? "Create Classrooms" : "Update Classroom"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ClassroomForm;
