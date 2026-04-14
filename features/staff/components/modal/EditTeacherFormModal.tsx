"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { teacherUpdateSchema, TeacherUpdateSchema } from "@/lib/zod/teacher";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Edit2,
  Eraser,
  Eye,
  EyeOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLASS_SECTION,
  ClassSection,
  Grade,
  GRADES,
  Major,
  MAJORS,
} from "@/lib/constants/class";
import { GRADE_DISPLAY_MAP, MAJOR_DISPLAY_MAP } from "@/lib/utils/labels";
import { useSubject } from "@/features/subject/hooks/useSubject";
import {
  useTeacherProfile,
  useUpdateTeacherProfile,
} from "@/features/teacher/hooks/useTeachers";
import { groupSubjects } from "@/lib/utils/groupSubjects";
import LoadingFullScreen from "@/components/ui/LoadingFullScreen";
import { toast } from "sonner";

interface EditTeacherFormModalProps {
  open: boolean;
  onOpenChange: (bool: boolean) => void;
  teacherId: string;
}

const EditTeacherFormModal = ({
  open,
  onOpenChange,
  teacherId,
}: EditTeacherFormModalProps) => {
  const { data: subjectData, isPending: isSubjectsLoading } = useSubject({
    staleTime: 5 * 60 * 1000,
  });
  const { data: serverTeacherProfile, isPending: isTeacherLoading } =
    useTeacherProfile(teacherId, {
      enabled: !!teacherId && open,
      staleTime: 5 * 60 * 1000,
    });

  const sortedAndGroupedSubjects =
    subjectData?.subjects && subjectData?.subjects.length > 0
      ? groupSubjects(subjectData?.subjects)
      : [];

  const {
    register,
    formState: { errors, isDirty },
    control,
    setValue,
    reset,
    handleSubmit,
  } = useForm<TeacherUpdateSchema>({
    resolver: zodResolver(teacherUpdateSchema),
    defaultValues: {
      email: serverTeacherProfile?.teacher?.email ?? "",
      name: serverTeacherProfile?.teacher?.name ?? "",
      homeroomClass: {
        grade: serverTeacherProfile?.teacher?.homeroomClass?.grade,
        major: serverTeacherProfile?.teacher?.homeroomClass?.major,
        section:
          (serverTeacherProfile?.teacher?.homeroomClass
            ?.section as ClassSection) ?? "",
      },
      teachingAssignments: serverTeacherProfile?.teacher?.teachingAssignments,
      passwordSchema: {
        confirmPassword: "",
        password: "",
      },
    },
  });

  const { fields: teachingAssignmentFields, remove: removeTeachingAssignment } =
    useFieldArray({
      control,
      name: "teachingAssignments",
    });

  const updateTeacherMutation = useUpdateTeacherProfile(teacherId);

  const handleUpdateTeacher = (data: TeacherUpdateSchema) => {
    if (!isDirty) {
      toast.info("No data was updated");
      return;
    }

    updateTeacherMutation.mutate(data);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearHomeroomClass = () => {
    setValue("homeroomClass.grade", "" as Grade);
    setValue("homeroomClass.major", "" as Major);
    setValue("homeroomClass.section", "" as ClassSection);
  };

  useEffect(() => {
    if (open && serverTeacherProfile?.teacher) {
      const { teacher } = serverTeacherProfile;
      reset({
        email: teacher.email || "",
        name: teacher.name || "",
        homeroomClass: {
          grade: teacher?.homeroomClass?.grade || ("" as Grade),
          major: teacher.homeroomClass?.major || ("" as Major),
          section: teacher.homeroomClass?.section || ("" as ClassSection),
        },
        teachingAssignments: teacher.teachingAssignments || [],
        passwordSchema: { password: "", confirmPassword: "" },
      });
    }
  }, [open, serverTeacherProfile, reset]);

  return (
    <>
      {(isTeacherLoading || isSubjectsLoading) && !!teacherId
        ? LoadingFullScreen()
        : ""}
      {updateTeacherMutation.isPending ? LoadingFullScreen() : ""}
      <div className="w-full h-full">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[70vw]">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">
                Update Teacher Profile
              </DialogTitle>

              <form onSubmit={handleSubmit(handleUpdateTeacher)}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 col-span-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">
                      Personal Information
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Field data-invalid={!!errors.name}>
                      <FieldLabel>
                        Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...register("name")}
                        className="h-11"
                        placeholder="Minumun 3 characters"
                        required
                        disabled={updateTeacherMutation.isPending}
                      />
                      {errors.name && <FieldError errors={[errors.name]} />}
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <Field data-invalid={!!errors.email}>
                      <FieldLabel>
                        Email <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...register("email")}
                        className="h-11"
                        placeholder="Minumun 3 characters"
                        required
                        disabled={updateTeacherMutation.isPending}
                      />
                      {errors.email && <FieldError errors={[errors.email]} />}
                    </Field>
                  </div>
                  <Field data-invalid={!!errors.passwordSchema?.root}>
                    <FieldLabel>Password</FieldLabel>

                    <div className="relative">
                      <Input
                        {...register("passwordSchema.password")}
                        className="h-11 pr-10"
                        placeholder="Minimum 3 characters"
                        type={showPassword ? "text" : "password"}
                        disabled={updateTeacherMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {errors.passwordSchema?.root && (
                      <FieldError errors={[errors.passwordSchema?.root]} />
                    )}
                  </Field>

                  <Field data-invalid={!!errors.passwordSchema?.root}>
                    <FieldLabel>Confirm Password</FieldLabel>

                    <div className="relative">
                      <Input
                        {...register("passwordSchema.confirmPassword")}
                        className="h-11 pr-10"
                        placeholder="Minimum 3 characters"
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={updateTeacherMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {errors.passwordSchema?.root && (
                      <FieldError errors={[errors.passwordSchema?.root]} />
                    )}
                  </Field>
                  {/* Homeroom Class */}
                  <div className="border-t pt-6 col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Homeroom Class (Optional)
                      </h3>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearHomeroomClass}
                      >
                        <Eraser className="w-4 h-4 mr-1" /> Clear
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <Controller
                        name="homeroomClass.grade"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={updateTeacherMutation.isPending}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {GRADES.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {GRADE_DISPLAY_MAP[g]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />

                      <Controller
                        name="homeroomClass.major"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={updateTeacherMutation.isPending}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select major" />
                              </SelectTrigger>
                              <SelectContent>
                                {MAJORS.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {MAJOR_DISPLAY_MAP[g]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />

                      <Controller
                        name="homeroomClass.section"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={updateTeacherMutation.isPending}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                {CLASS_SECTION.map((num) => (
                                  <SelectItem key={num} value={num}>
                                    {num === "none" ? "None" : `Class ${num}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                  </div>

                  {/* Teaching Assignments */}
                  {subjectData && subjectData.subjects.length !== 0 ? (
                    <div className="border-t pt-6 space-y-3 col-span-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        Teaching Asignments (Optional)
                      </h3>
                      {teachingAssignmentFields.map((ta, index) => (
                        <div
                          key={ta.id}
                          className="bg-purple-50 p-4 rounded-lg border border-purple-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <BookOpen className="w-5 h-5 text-purple-600 mr-2" />
                              <span className="font-semibold text-gray-700">
                                Assignment #{index + 1}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeTeachingAssignment(index)}
                              disabled={updateTeacherMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-3 ">
                            <Controller
                              name={`teachingAssignments.${index}.subjectId`}
                              control={control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={updateTeacherMutation.isPending}
                                  >
                                    <SelectTrigger className="h-11 bg-white">
                                      <SelectValue
                                        placeholder={
                                          isSubjectsLoading
                                            ? "Loading subjects..."
                                            : "Select subject"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(
                                        sortedAndGroupedSubjects,
                                      ).map(
                                        ([categoryName, subjectList]) =>
                                          subjectList.length > 0 && (
                                            <SelectGroup key={categoryName}>
                                              <SelectLabel>
                                                {categoryName === "general"
                                                  ? "General Subjects"
                                                  : categoryName ===
                                                      "accounting"
                                                    ? "Accounting Subjects"
                                                    : "Software Engineering Subjects"}
                                              </SelectLabel>
                                              {subjectList.map(
                                                (subject: any) => (
                                                  <SelectItem
                                                    key={subject.id}
                                                    value={subject.id}
                                                  >
                                                    {subject.name}
                                                  </SelectItem>
                                                ),
                                              )}
                                            </SelectGroup>
                                          ),
                                      )}
                                    </SelectContent>
                                  </Select>

                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <div className="grid md:grid-cols-3 gap-3">
                              <Controller
                                name={`teachingAssignments.${index}.grade`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={updateTeacherMutation.isPending}
                                    >
                                      <SelectTrigger className="h-11 bg-white">
                                        <SelectValue placeholder="Select grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {GRADES.map((g) => (
                                          <SelectItem key={g} value={g}>
                                            {GRADE_DISPLAY_MAP[g]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                )}
                              />

                              <Controller
                                name={`teachingAssignments.${index}.major`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={updateTeacherMutation.isPending}
                                    >
                                      <SelectTrigger className="h-11 bg-white">
                                        <SelectValue
                                          placeholder={"Select major"}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MAJORS.map((g) => (
                                          <SelectItem key={g} value={g}>
                                            {MAJOR_DISPLAY_MAP[g]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                )}
                              />

                              <Controller
                                name={`teachingAssignments.${index}.section`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={updateTeacherMutation.isPending}
                                    >
                                      <SelectTrigger className="h-11 bg-white">
                                        <SelectValue placeholder="Select section" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {CLASS_SECTION.map((num) => (
                                          <SelectItem key={num} value={num}>
                                            {num === "none"
                                              ? "None"
                                              : `Class ${num}`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} />
                                    )}
                                  </Field>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {teachingAssignmentFields.length === 0 && (
                        <p className="text-center py-4 text-gray-500">
                          No teaching assignments.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center w-full h-full border-t-2 pt-2">
                      <p className="text-center text-muted-foreground">
                        No subjects found. Please create a subject first to
                        enable teaching assignments.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  className="w-full h-12 mt-4 bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center transition-all duration-300"
                  type="submit"
                  disabled={updateTeacherMutation.isPending}
                >
                  {updateTeacherMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Editing Profile...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-5 h-5 mr-2" />
                      <span>Edit Teacher Profile</span>
                    </>
                  )}
                </button>
              </form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default EditTeacherFormModal;
